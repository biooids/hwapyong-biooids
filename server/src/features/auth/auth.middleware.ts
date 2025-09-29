// src/features/auth/auth.middleware.ts

import { Request, Response, NextFunction } from "express";
import jwt, { JsonWebTokenError } from "jsonwebtoken";
import { config } from "../../config/index.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { createHttpError } from "../../utils/error.factory.js";
import { query } from "../../db/index.js";
import { DecodedAccessTokenPayload } from "./auth.types.js";
import { SanitizedUser } from "../../types/express.d.js";

interface AuthOptions {
  required?: boolean;
}

/**
 * A flexible authentication middleware.
 * Verifies the access token and attaches a fresh user object to the request.
 */
export const authenticate = (options: AuthOptions = {}) =>
  asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
    const { required = false } = options;
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token) {
      if (required) {
        return next(
          createHttpError(401, "Authentication required. No token provided.")
        );
      }
      req.user = null;
      return next();
    }

    try {
      const decoded = jwt.verify(
        token,
        config.jwt.accessSecret
      ) as DecodedAccessTokenPayload;

      if (!decoded.id || decoded.type !== "access") {
        throw new JsonWebTokenError("Invalid token payload.");
      }

      const sql =
        'SELECT "id", "name", "username", "email", "profile_image_url" AS "profileImage", "banner_image_url" AS "bannerImage", "system_role" AS "systemRole" FROM "users" WHERE "id" = $1';
      const result = await query<SanitizedUser>(sql, [decoded.id]);
      const user = result.rows[0] || null;

      if (!user) {
        if (required) {
          return next(
            createHttpError(
              401,
              "User associated with this token no longer exists."
            )
          );
        }
        req.user = null;
        return next();
      }

      req.user = user;
      next();
    } catch (error) {
      if (required) {
        return next(
          createHttpError(
            401,
            "Your session is invalid or has expired. Please log in again."
          )
        );
      }
      req.user = null;
      next();
    }
  });
