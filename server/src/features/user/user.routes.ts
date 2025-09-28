// src/features/user/user.routes.ts

import { Router } from "express";
import { userController } from "./user.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { uploadImage } from "../../middleware/multer.config.js";
import { validate } from "../../middleware/validate.js";
import { updateUserProfileSchema } from "./user.validation.js";

const router: Router = Router();

// --- PUBLIC ROUTE ---
// Fetches a public user profile. The `authenticate()` middleware from apiRoutes
// runs first, so if a token is provided, `req.user` will be available.
router.get("/profile/:username", userController.getUserByUsername);

// --- PROTECTED ROUTES (require a valid, authenticated user) ---
const requireAuth = authenticate({ required: true });

router.get("/me", requireAuth, userController.getMe);
router.patch(
  "/me",
  requireAuth,
  uploadImage.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "bannerImage", maxCount: 1 },
  ]),
  validate(updateUserProfileSchema),
  userController.updateMyProfile
);
router.delete("/me", requireAuth, userController.deleteMyAccount);

router.get("/:id", requireAuth, userController.getUserById);
router.delete("/:id", requireAuth, userController.deleteUserById);
router.post("/:username/follow", requireAuth, userController.followUser);
router.delete("/:username/follow", requireAuth, userController.unfollowUser);

export default router;
