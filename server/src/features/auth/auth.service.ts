// FILE: src/features/auth/auth.service.ts

import bcrypt from "bcryptjs";
import crypto from "crypto";
import { createHttpError } from "../../utils/error.factory.js";
import { logger } from "../../config/logger.js";
import {
  generateAccessToken,
  generateAndStoreRefreshToken,
  verifyAndValidateRefreshToken,
} from "../../utils/jwt.utils.js";
import {
  SignUpInputDto,
  LoginInputDto,
  RefreshTokenInputDto,
  AuthTokens,
  LogoutInputDto,
  ChangePasswordInputDto,
} from "./auth.types.js";
import { userService, User } from "../user/user.service.js";
import { query } from "../../db/index.js";

const sanitizeUser = (user: User): Omit<User, "hashedPassword"> => {
  const { hashedPassword, ...sanitized } = user;
  return sanitized;
};

export class AuthService {
  public async registerUser(input: SignUpInputDto): Promise<{
    user: Omit<User, "hashedPassword">;
    tokens: AuthTokens;
  }> {
    const { email, username } = input;

    const findUserSql =
      'SELECT "email", "username" FROM "users" WHERE "email" = $1 OR "username" = $2 LIMIT 1';
    const findResult = await query<{ email: string; username: string }>(
      findUserSql,
      [email, username]
    );
    const existingUser = findResult.rows[0];

    if (existingUser) {
      if (existingUser.email === email) {
        throw createHttpError(
          409,
          "An account with this email already exists."
        );
      }
      if (existingUser.username === username) {
        throw createHttpError(409, "This username is already taken.");
      }
    }

    const user = await userService.createUser(input);

    // [REMOVED] - The call to emailService has been deleted.
    // await emailService.sendWelcomeVerificationEmail(user);

    const accessToken = generateAccessToken(user);
    const { token: refreshToken, expiresAt } =
      await generateAndStoreRefreshToken(user.id);

    return {
      user: sanitizeUser(user),
      tokens: { accessToken, refreshToken, refreshTokenExpiresAt: expiresAt },
    };
  }

  public async loginUser(input: LoginInputDto): Promise<{
    user: Omit<User, "hashedPassword">;
    tokens: AuthTokens;
  }> {
    const { email, password } = input;
    const user = await userService.findUserByEmail(email);

    if (!user) {
      throw createHttpError(404, "No account found with this email address.");
    }
    if (!user.hashedPassword) {
      throw createHttpError(
        400,
        "This account uses a social provider. Please log in with your social account."
      );
    }
    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.hashedPassword
    );
    if (!isPasswordCorrect) {
      throw createHttpError(401, "The password you entered is incorrect.");
    }

    logger.info(
      { userId: user.id },
      "User login successful, revoking old sessions."
    );
    await this.revokeAllRefreshTokensForUser(user.id);

    const accessToken = generateAccessToken(user);
    const { token: refreshToken, expiresAt } =
      await generateAndStoreRefreshToken(user.id);

    return {
      user: sanitizeUser(user),
      tokens: { accessToken, refreshToken, refreshTokenExpiresAt: expiresAt },
    };
  }

  public async changeUserPassword(
    userId: string,
    input: ChangePasswordInputDto
  ): Promise<void> {
    const { currentPassword, newPassword } = input;
    const user = await userService.findUserById(userId);

    if (!user || !user.hashedPassword) {
      throw createHttpError(401, "User not found or has no password set.");
    }

    const isPasswordCorrect = await bcrypt.compare(
      currentPassword,
      user.hashedPassword
    );
    if (!isPasswordCorrect) {
      throw createHttpError(
        401,
        "The current password you entered is incorrect."
      );
    }

    const newHashedPassword = await bcrypt.hash(newPassword, 10);
    const updateSql =
      'UPDATE "users" SET "hashed_password" = $1 WHERE "id" = $2';
    await query(updateSql, [newHashedPassword, userId]);

    logger.info(
      { userId },
      "User password changed successfully. Revoking all sessions."
    );
    await this.revokeAllRefreshTokensForUser(userId);

    // [REMOVED] - The call to emailService has been deleted.
    // await emailService.sendPasswordChangeConfirmationEmail(user);
  }

  public async handleRefreshTokenRotation(
    input: RefreshTokenInputDto
  ): Promise<{
    newAccessToken: string;
    newRefreshToken: string;
    newRefreshTokenExpiresAt: Date;
  }> {
    if (!input.incomingRefreshToken) {
      throw createHttpError(401, "Refresh token is required.");
    }
    const decodedOldToken = await verifyAndValidateRefreshToken(
      input.incomingRefreshToken
    );
    const user = await userService.findUserById(decodedOldToken.id);

    if (!user) {
      await this.revokeTokenByJti(decodedOldToken.jti);
      throw createHttpError(403, "Forbidden: User account not found.");
    }

    await this.revokeTokenByJti(decodedOldToken.jti);
    const newAccessToken = generateAccessToken(user);
    const { token: newRefreshToken, expiresAt: newRefreshTokenExpiresAt } =
      await generateAndStoreRefreshToken(user.id);

    return { newAccessToken, newRefreshToken, newRefreshTokenExpiresAt };
  }

  public async handleUserLogout(input: LogoutInputDto): Promise<void> {
    if (!input.incomingRefreshToken) {
      logger.warn("Logout attempt without a refresh token.");
      return;
    }
    try {
      const decoded = await verifyAndValidateRefreshToken(
        input.incomingRefreshToken
      );
      await this.revokeTokenByJti(decoded.jti);
      logger.info(
        { userId: decoded.id, jti: decoded.jti },
        "User logged out, token revoked."
      );
    } catch (error) {
      logger.warn(
        { err: error },
        "Logout failed: could not verify or revoke token."
      );
    }
  }

  public async findOrCreateOAuthUser(profile: {
    email: string;
    name?: string | null;
    image?: string | null;
  }): Promise<{ user: Omit<User, "hashedPassword">; tokens: AuthTokens }> {
    const findUserSql = 'SELECT * FROM "users" WHERE "email" = $1';
    const findResult = await query<User>(findUserSql, [profile.email]);
    let user = findResult.rows[0];

    if (user) {
      logger.info(
        { email: profile.email },
        "Found existing user for OAuth login."
      );
      const updateSql = `UPDATE "users" SET "name" = $1, "profile_image" = $2 WHERE "email" = $3 RETURNING *;`;
      const updateResult = await query<User>(updateSql, [
        user.name ?? profile.name ?? "New User",
        user.profile_image ?? profile.image ?? null,
        profile.email,
      ]);
      user = updateResult.rows[0];
    } else {
      logger.info(
        { email: profile.email },
        "Creating new user from OAuth profile."
      );
      const baseUsername = profile.email
        .split("@")[0]
        .replace(/[^a-zA-Z0-9]/g, "");
      const uniqueSuffix = crypto.randomBytes(4).toString("hex");
      const username = `${baseUsername}_${uniqueSuffix}`;

      const createSql = `
        INSERT INTO "users" (email, name, username, email_verified, profile_image) 
        VALUES ($1, $2, $3, $4, $5) RETURNING *;
      `;
      const createResult = await query<User>(createSql, [
        profile.email,
        profile.name ?? "New User",
        username,
        true,
        profile.image,
      ]);
      user = createResult.rows[0];
    }

    await this.revokeAllRefreshTokensForUser(user.id);
    const accessToken = generateAccessToken(user);
    const { token: refreshToken, expiresAt } =
      await generateAndStoreRefreshToken(user.id);

    return {
      user: sanitizeUser(user),
      tokens: { accessToken, refreshToken, refreshTokenExpiresAt: expiresAt },
    };
  }

  private async revokeTokenByJti(jti: string): Promise<void> {
    const sql = 'UPDATE "refresh_tokens" SET "revoked" = true WHERE "jti" = $1';
    await query(sql, [jti]).catch((err) =>
      logger.warn(
        { err, jti },
        "Failed to revoke single token, it might already be gone."
      )
    );
  }

  public async revokeAllRefreshTokensForUser(userId: string): Promise<void> {
    const sql =
      'UPDATE "refresh_tokens" SET "revoked" = true WHERE "user_id" = $1 AND "revoked" = false';
    const result = await query(sql, [userId]);
    logger.info(
      { count: result.rowCount, userId },
      `Revoked all active sessions.`
    );
  }
}

export const authService = new AuthService();
