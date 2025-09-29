// FILE: src/middleware/authenticate.ts

import { Request, Response, NextFunction } from "express";
import jwt, { JsonWebTokenError } from "jsonwebtoken";
import { config } from "../config/index.js";
import { asyncHandler } from "./asyncHandler.js";
import { createHttpError } from "../utils/error.factory.js";
// [MODIFIED] - Import the query function and our manually defined types.
import { query } from "../db/index.js";
import { DecodedAccessTokenPayload } from "../features/auth/auth.types.js";
import { SanitizedUser } from "../types/express.d.js";

// [REMOVED] - Prisma is no longer used here.
// import prisma from "../db/prisma.js";

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

    // 1. Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    // 2. Handle missing token
    if (!token) {
      if (required) {
        return next(
          createHttpError(401, "Authentication required. No token provided.")
        );
      }
      req.user = null; // Mark as guest
      return next();
    }

    try {
      // 3. Verify token signature and structure
      const decoded = jwt.verify(
        token,
        config.jwt.accessSecret
      ) as DecodedAccessTokenPayload;

      if (!decoded.id || decoded.type !== "access") {
        throw new JsonWebTokenError("Invalid token payload.");
      }

      // 4. [MODIFIED] - Fetch fresh user data from the database using a direct SQL query.
      const sql =
        'SELECT "id", "name", "username", "email", "profile_image" AS "profileImage", "banner_image" AS "bannerImage", "system_role" AS "systemRole" FROM "users" WHERE "id" = $1';
      const result = await query<SanitizedUser>(sql, [decoded.id]);
      const user = result.rows[0] || null;

      // 5. Handle user not found in DB (token is valid, but user was deleted)
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

      // 6. Attach fresh user object to the request and proceed
      req.user = user;
      next();
    } catch (error) {
      // For any JWT error (expired, invalid signature), treat as unauthorized
      if (required) {
        return next(
          createHttpError(
            401,
            "Your session is invalid or has expired. Please log in again."
          )
        );
      }
      req.user = null; // Mark as guest if token is invalid but not required
      next();
    }
  });
