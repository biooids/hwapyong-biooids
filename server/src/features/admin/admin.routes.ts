// FILE: src/features/admin/admin.routes.ts

import { Router } from "express";
import { adminController } from "./admin.controller.js";
import { requireRole } from "../../middleware/admin.middleware.js"; // [MODIFIED] - Corrected path
import { authenticate } from "../../middleware/authenticate.js"; // [MODIFIED] - Corrected path
// [MODIFIED] - Import the manually defined SystemRole enum from your global types file.
import { SystemRole } from "../../types/express.d.js";

// [REMOVED] - The import from Prisma's generated client is no longer needed.
// import { SystemRole } from "@/prisma-client";

const router: Router = Router();

// This middleware chain applies to ALL routes defined in this file.
// 1. `authenticate`: Ensures the user has a valid access token.
// 2. `requireRole`: Ensures the authenticated user is either a SUPER_ADMIN or DEVELOPER.
router.use(
  authenticate({ required: true }),
  requireRole([SystemRole.SUPER_ADMIN, SystemRole.DEVELOPER])
);

// --- Admin Routes ---

// GET /api/v1/admin/stats
router.get("/stats", adminController.getDashboardStats);

// GET /api/v1/admin/users
router.get("/users", adminController.getAllUsers);

// PATCH /api/v1/admin/users/:id/role
router.patch("/users/:id/role", adminController.updateUserRole);

// DELETE /api/v1/admin/users/:id
router.delete("/users/:id", adminController.deleteUser);

export default router;
