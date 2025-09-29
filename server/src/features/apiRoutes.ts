// src/routes/apiRoutes.ts

import { Router } from "express";
import { authenticate } from "@/features/auth/auth.middleware.js";
import authRoutes from "@/features/auth/auth.routes.js";
import userRoutes from "@/features/user/user.routes.js";
import adminRoutes from "@/features/admin/admin.routes.js";

const router: Router = Router();

// This middleware runs on all API routes, making authentication optional.
// It populates `req.user` if a valid token is provided.
router.use(authenticate());

router.get("/health", (_req, res) => {
  res
    .status(200)
    .json({ status: "success", message: "API router is healthy." });
});

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/admin", adminRoutes);

export default router;
