// FILE: src/features/user/user.controller.ts

import { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { createHttpError } from "../../utils/error.factory.js";
import { userService, User } from "./user.service.js"; // [MODIFIED] - Import our manual User type
import { uploadToCloudinary } from "../../config/cloudinary.js";
import { logger } from "../../config/logger.js";
import { config } from "../../config/index.js";
import { followService } from "../follow/follow.service.js"; // Assuming this service will be refactored
import { SystemRole } from "../../types/express.d.js"; // [ADDED] - Import our manual SystemRole enum

// [REMOVED] - The import from Prisma's generated client is no longer needed.
// import { SystemRole, User } from "@/prisma-client";

// This helper function now uses our manually defined User type.
const sanitizeUserForResponse = (user: User): Omit<User, "hashed_password"> => {
  const { hashed_password, ...sanitizedUser } = user;
  return sanitizedUser;
};

class UserController {
  getMe = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw createHttpError(401, "Authenticated user not found.");
    }

    const user = await userService.findUserById(userId);
    if (!user) {
      throw createHttpError(404, "User data could not be found.");
    }

    // [MODIFIED] - The complex data reshaping is no longer needed.
    // The new userService.findUserById already returns a flat object with follower counts.
    res.status(200).json({
      status: "success",
      data: { user: sanitizeUserForResponse(user) },
    });
  });

  getUserByUsername = asyncHandler(async (req: Request, res: Response) => {
    const { username } = req.params;
    const currentUserId = req.user?.id;

    const userProfile = await userService.findUserByUsername(
      username,
      currentUserId
    );
    if (!userProfile) {
      throw createHttpError(404, `User profile for @${username} not found.`);
    }

    // [INFO] - No change needed here. The new service returns the exact shape this controller expects.
    res.status(200).json({
      status: "success",
      data: { user: userProfile },
    });
  });

  updateMyProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const updateData = req.body;

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (files?.profileImage?.[0]) {
      logger.info({ userId }, "New profile image received. Uploading...");
      const result = await uploadToCloudinary(
        files.profileImage[0].path,
        "user_assets",
        `profile_${userId}`
      );
      updateData.profile_image = result.secure_url; // Use snake_case for the service layer
    }

    if (files?.bannerImage?.[0]) {
      logger.info({ userId }, "New banner image received. Uploading...");
      const result = await uploadToCloudinary(
        files.bannerImage[0].path,
        "user_assets",
        `banner_${userId}`
      );
      updateData.banner_image = result.secure_url; // Use snake_case for the service layer
    }

    if (Object.keys(updateData).length === 0 && !req.files) {
      throw createHttpError(400, "No update data provided.");
    }

    const updatedUser = await userService.updateUserProfile(userId, updateData);

    res.status(200).json({
      status: "success",
      message: "Profile updated successfully.",
      data: { user: sanitizeUserForResponse(updatedUser) },
    });
  });

  deleteMyAccount = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    await userService.deleteUserAccount(userId);
    res.clearCookie(config.cookies.refreshTokenName);
    res.status(204).send();
  });

  getUserById = asyncHandler(async (req: Request, res: Response) => {
    const { id: targetUserId } = req.params;
    const user = await userService.findUserById(targetUserId);

    if (!user) {
      throw createHttpError(404, `User with ID ${targetUserId} not found.`);
    }

    // [MODIFIED] - Data reshaping removed here as well.
    res.status(200).json({
      status: "success",
      data: { user: sanitizeUserForResponse(user) },
    });
  });

  deleteUserById = asyncHandler(async (req: Request, res: Response) => {
    // [MODIFIED] - This check now uses our manually defined SystemRole enum.
    if (req.user?.systemRole !== SystemRole.SUPER_ADMIN) {
      throw createHttpError(
        403,
        "Forbidden: You do not have permission for this action."
      );
    }

    const { id: targetUserId } = req.params;
    if (req.user.id === targetUserId) {
      throw createHttpError(
        400,
        "Cannot delete your own account via this admin route."
      );
    }

    await userService.deleteUserAccount(targetUserId);
    res.status(204).send();
  });

  // These methods are fine as they delegate to another service we'll refactor later.
  followUser = asyncHandler(async (req: Request, res: Response) => {
    const followerId = req.user!.id;
    const { username: usernameToFollow } = req.params;
    await followService.followUser(followerId, usernameToFollow);
    res.status(204).send();
  });

  unfollowUser = asyncHandler(async (req: Request, res: Response) => {
    const followerId = req.user!.id;
    const { username: usernameToUnfollow } = req.params;
    await followService.unfollowUser(followerId, usernameToUnfollow);
    res.status(204).send();
  });
}

export const userController = new UserController();
