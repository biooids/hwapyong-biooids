// src/features/admin/admin.middleware.ts

import { Request, Response, NextFunction } from "express";
import { SystemRole } from "../../types/express.d.js";
import { createHttpError } from "../../utils/error.factory.js";

/**
 * Creates a middleware to check if the authenticated user has one of the specified roles.
 * Throws a 403 Forbidden error if the user does not have the required role.
 * @param requiredRoles - An array of permitted SystemRole enums.
 */
export const requireRole = (requiredRoles: SystemRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      // This is a safeguard; the main `authenticate` middleware should handle this.
      return next(createHttpError(401, "Authentication required."));
    }

    const userRole = req.user.systemRole;

    if (requiredRoles.includes(userRole)) {
      // User has the required role, proceed.
      return next();
    } else {
      // User does not have permission.
      return next(
        createHttpError(
          403,
          "Forbidden: You do not have permission to access this resource."
        )
      );
    }
  };
};
