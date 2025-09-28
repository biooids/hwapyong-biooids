// FILE: src/utils/jwt.utils.ts

import jwt, {
  SignOptions,
  TokenExpiredError,
  JsonWebTokenError,
} from "jsonwebtoken";
import crypto from "crypto";
import { config } from "../config/index.js";
import { logger } from "../config/logger.js";
import { query } from "../db/index.js";
import { createHttpError } from "./error.factory.js";
import { HttpError } from "./HttpError.js";
// [MODIFIED] - Import the SystemRole enum for strong type safety.
import { SystemRole } from "../types/express.d.js";

// --- Type Definitions ---

interface UserForToken {
  id: string;
  // [MODIFIED] - Use the imported enum instead of a generic string.
  systemRole: SystemRole;
}

interface DecodedAccessTokenPayload {
  id: string;
  systemRole: SystemRole;
  type: "access";
  iat: number;
  exp: number;
}

interface DecodedRefreshTokenPayload {
  id: string;
  type: "refresh";
  iat: number;
  exp: number;
  jti: string;
}

interface RefreshToken {
  jti: string;
  userId: string;
  expiresAt: Date;
  revoked: boolean;
}

// --- The rest of the file remains the same ---

export const generateAccessToken = (user: UserForToken): string => {
  // Now this function correctly expects a user object with a SystemRole enum
  const payload: Omit<DecodedAccessTokenPayload, "iat" | "exp"> = {
    id: user.id,
    systemRole: user.systemRole,
    type: "access",
  };

  const options: SignOptions = {
    expiresIn: config.jwt.accessExpiresInSeconds,
  };

  const token = jwt.sign(payload, config.jwt.accessSecret, options);
  logger.info({ userId: user.id }, "[JWT] Generated Access Token");
  return token;
};

// ... (generateAndStoreRefreshToken and verifyAndValidateRefreshToken are unchanged)
export const generateAndStoreRefreshToken = async (
  userId: string
): Promise<{ token: string; expiresAt: Date }> => {
  const jti = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + config.jwt.refreshExpiresInDays);

  const payload = { id: userId, type: "refresh" as const };

  try {
    const sql =
      'INSERT INTO "refresh_tokens" ("jti", "userId", "expiresAt") VALUES ($1, $2, $3)';
    await query(sql, [jti, userId, expiresAt]);
    logger.info({ jti, userId }, "[JWT] Refresh token JTI stored in DB");
  } catch (dbError) {
    logger.error({ err: dbError }, "[JWT] Failed to store refresh token in DB");
    throw createHttpError(500, "Could not save session information.");
  }

  const token = jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: `${config.jwt.refreshExpiresInDays}d`,
    jwtid: jti, // Sets the 'jti' claim in the token
  });

  return { token, expiresAt };
};

export const verifyAndValidateRefreshToken = async (
  token: string
): Promise<DecodedRefreshTokenPayload> => {
  try {
    // 1. Verify the JWT signature and expiration
    const decoded = jwt.verify(
      token,
      config.jwt.refreshSecret
    ) as DecodedRefreshTokenPayload;

    // 2. Check for the correct payload structure
    if (!decoded.jti || !decoded.id || decoded.type !== "refresh") {
      throw createHttpError(401, "Invalid refresh token payload structure.");
    }

    // 3. Check the token's status in the database
    const sql = 'SELECT * FROM "refresh_tokens" WHERE "jti" = $1';
    const result = await query<RefreshToken>(sql, [decoded.jti]);
    const storedToken = result.rows[0];

    if (!storedToken) {
      throw createHttpError(403, "Session not found. Please log in again.");
    }
    if (storedToken.revoked) {
      throw createHttpError(
        403,
        "Session has been revoked. Please log in again."
      );
    }
    if (new Date() > storedToken.expiresAt) {
      throw createHttpError(403, "Session has expired. Please log in again.");
    }

    // CRITICAL SECURITY CHECK: Ensure the user ID in the token matches the one in the DB.
    if (storedToken.userId !== decoded.id) {
      // If there's a mismatch, it's a security risk. Revoke the token immediately.
      await query(
        'UPDATE "refresh_tokens" SET "revoked" = true WHERE "jti" = $1',
        [decoded.jti]
      );
      logger.fatal(
        {
          jti: decoded.jti,
          expectedUserId: storedToken.userId,
          actualUserId: decoded.id,
        },
        "CRITICAL: Refresh token user mismatch. Token voided."
      );
      throw createHttpError(403, "Session invalid; token has been voided.");
    }

    logger.info(
      { jti: decoded.jti },
      "[JWT] Refresh token successfully validated."
    );
    return decoded;
  } catch (error) {
    // Handle specific errors and re-throw them as consistent HttpErrors
    if (error instanceof HttpError) {
      throw error;
    }
    if (
      error instanceof TokenExpiredError ||
      error instanceof JsonWebTokenError
    ) {
      logger.warn({ err: error }, "[JWT] Session token is invalid or expired");
      throw createHttpError(
        403,
        "Your session is invalid. Please log in again."
      );
    }
    logger.error(
      { err: error },
      "[JWT] Unexpected error during token verification"
    );
    throw createHttpError(
      500,
      "Could not verify session due to a server issue."
    );
  }
};
