// src/features/follow/follow.controller.ts

import { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { followService } from "./follow.service.js";

class FollowController {
  getFollowing = asyncHandler(async (req: Request, res: Response) => {
    const { username } = req.params;
    const following = await followService.getFollowing(username);
    res.status(200).json({ status: "success", data: { following } });
  });

  getFollowers = asyncHandler(async (req: Request, res: Response) => {
    const { username } = req.params;
    const followers = await followService.getFollowers(username);
    res.status(200).json({ status: "success", data: { followers } });
  });
}

export const followController = new FollowController();
