// src/features/admin/admin.routes.ts

import { Router } from "express";
import { adminController } from "./admin.controller.js";
import { requireRole } from "./admin.middleware.js"; // Import from new location
import { authenticate } from "../auth/auth.middleware.js";
import { SystemRole } from "../../types/express.d.js";
import { validate } from "../../middleware/validate.js";
import {
  deleteUserParamsSchema,
  updateUserRoleSchema,
} from "./admin.validation.js";

const router: Router = Router();

// This middleware chain applies to ALL routes in this file.
router.use(
  authenticate({ required: true }),
  requireRole([SystemRole.SUPER_ADMIN, SystemRole.DEVELOPER])
);

router.get("/stats", adminController.getDashboardStats);

router.get("/users", adminController.getAllUsers);

router.patch(
  "/users/:id/role",
  validate(updateUserRoleSchema), // Apply validation
  adminController.updateUserRole
);

router.delete(
  "/users/:id",
  validate(deleteUserParamsSchema), // Apply validation
  adminController.deleteUser
);

export default router;
