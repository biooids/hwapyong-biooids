// src/features/auth/jwt.utils.ts

import jwt, {
  SignOptions,
  TokenExpiredError,
  JsonWebTokenError,
} from "jsonwebtoken";
import crypto from "crypto";
import { Pool, PoolClient } from "pg";
import { config } from "../../config/index.js";
import { logger } from "../../config/logger.js";
import { pool } from "../../db/index.js"; // MODIFIED: Import pool instead of query
import { createHttpError } from "../../utils/error.factory.js";
import { HttpError } from "../../utils/HttpError.js";
import {
  DecodedAccessTokenPayload,
  DecodedRefreshTokenPayload,
  RefreshToken,
  UserForToken,
} from "./auth.types.js";

export const generateAccessToken = (user: UserForToken): string => {
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

export const generateAndStoreRefreshToken = async (
  userId: string,
  db: PoolClient | Pool = pool // MODIFIED: Use pool as the default
): Promise<{ token: string; expiresAt: Date }> => {
  const jti = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + config.jwt.refreshExpiresInDays);

  const payload = { id: userId, type: "refresh" as const };

  try {
    const sql =
      'INSERT INTO "refresh_tokens" ("jti", "user_id", "expires_at") VALUES ($1, $2, $3)';
    await db.query(sql, [jti, userId, expiresAt]);
    logger.info({ jti, userId }, "[JWT] Refresh token JTI stored in DB");
  } catch (dbError) {
    logger.error({ err: dbError }, "[JWT] Failed to store refresh token in DB");
    throw createHttpError(500, "Could not save session information.");
  }

  const token = jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: `${config.jwt.refreshExpiresInDays}d`,
    jwtid: jti,
  });

  return { token, expiresAt };
};

export const verifyAndValidateRefreshToken = async (
  token: string,
  db: PoolClient | Pool = pool // MODIFIED: Use pool as the default
): Promise<DecodedRefreshTokenPayload> => {
  try {
    const decoded = jwt.verify(
      token,
      config.jwt.refreshSecret
    ) as DecodedRefreshTokenPayload;

    if (!decoded.jti || !decoded.id || decoded.type !== "refresh") {
      throw createHttpError(401, "Invalid refresh token payload structure.");
    }

    const sql = 'SELECT * FROM "refresh_tokens" WHERE "jti" = $1';
    const result = await db.query<RefreshToken>(sql, [decoded.jti]);
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
    if (new Date() > storedToken.expires_at) {
      throw createHttpError(403, "Session has expired. Please log in again.");
    }

    if (storedToken.user_id !== decoded.id) {
      await db.query(
        'UPDATE "refresh_tokens" SET "revoked" = true WHERE "jti" = $1',
        [decoded.jti]
      );
      logger.fatal(
        {
          jti: decoded.jti,
          expectedUserId: storedToken.user_id,
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
