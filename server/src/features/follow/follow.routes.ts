// src/features/follow/follow.routes.ts

import { Router } from "express";
import { followController } from "./follow.controller.js";
import { authenticate } from "../auth/auth.middleware.js";

const router: Router = Router();

router.use(authenticate());

router.get("/:username/following", followController.getFollowing);
router.get("/:username/followers", followController.getFollowers);

export default router;
