// FILE: src/features/settings/settings.controller.ts

import { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { settingsService } from "./settings.service.js";
import { createHttpError } from "../../utils/error.factory.js";

class SettingsController {
  /**
   * Handles the request to get the current user's settings.
   */
  getSettings = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw createHttpError(401, "Authentication required.");
    }

    const settings = await settingsService.getUserSettings(userId);

    res.status(200).json({
      status: "success",
      data: { settings },
    });
  });

  /**
   * Handles the request to update the current user's settings.
   */
  updateSettings = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw createHttpError(401, "Authentication required.");
    }

    const updatedSettings = await settingsService.updateUserSettings(
      userId,
      req.body
    );

    res.status(200).json({
      status: "success",
      message: "Settings updated successfully.",
      data: { settings: updatedSettings },
    });
  });
}

export const settingsController = new SettingsController();
