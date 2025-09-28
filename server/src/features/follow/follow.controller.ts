// FILE: src/features/follow/follow.controller.ts

import { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { followService } from "./follow.service.js";
import { createHttpError } from "../../utils/error.factory.js";

class FollowController {
  getFollowing = asyncHandler(async (req: Request, res: Response) => {
    const { username } = req.params;
    const following = await followService.getFollowing(username);

    // [MODIFIED] - The service now returns a simple array directly. No .map() is needed.
    if (!following) {
      throw createHttpError(404, "User not found or has no followings.");
    }
    res.status(200).json({ status: "success", data: { following } });
  });

  getFollowers = asyncHandler(async (req: Request, res: Response) => {
    const { username } = req.params;
    const followers = await followService.getFollowers(username);

    // [MODIFIED] - The service now returns a simple array directly. No .map() is needed.
    if (!followers) {
      throw createHttpError(404, "User not found or has no followers.");
    }
    res.status(200).json({ status: "success", data: { followers } });
  });
}

export const followController = new FollowController();
