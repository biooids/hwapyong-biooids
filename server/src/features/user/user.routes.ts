// src/features/user/user.routes.ts

import { Router } from "express";
import { userController } from "./user.controller.js";
import { followController } from "../follow/follow.controller.js"; // ADDED
import { authenticate } from "../auth/auth.middleware.js";
import { uploadImage } from "../../middleware/multer.config.js";
import { validate } from "../../middleware/validate.js";
import { updateUserProfileSchema } from "./user.validation.js";

const router: Router = Router();

// --- PUBLIC ROUTES ---
// These routes can be accessed by anyone, but will have `req.user` if a token is provided.
router.get("/profile/:username", userController.getUserByUsername);
router.get("/:username/followers", followController.getFollowers); // ADDED
router.get("/:username/following", followController.getFollowing); // ADDED

// --- PROTECTED ROUTES ---
// These routes require a valid authenticated user.
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

export default router; // FIXED TYPO
