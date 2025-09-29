// src/features/auth/auth.controller.ts

import { asyncHandler } from "../../middleware/asyncHandler.js";
import { Request, Response } from "express";
import { authService } from "./auth.service.js";
import { config } from "../../config/index.js";

class AuthController {
  private setRefreshTokenCookie(
    res: Response,
    refreshToken: string,
    expires: Date
  ) {
    res.cookie(config.cookies.refreshTokenName, refreshToken, {
      httpOnly: true,
      secure: config.nodeEnv === "production",
      sameSite: "strict",
      expires: expires,
    });
  }

  signup = asyncHandler(async (req: Request, res: Response) => {
    const { user, tokens } = await authService.registerUser(req.body);

    this.setRefreshTokenCookie(
      res,
      tokens.refreshToken,
      tokens.refreshTokenExpiresAt
    );

    // MODIFIED: Do not send the full tokens object.
    res.status(201).json({
      status: "success",
      message: "User registered successfully.",
      data: { user, accessToken: tokens.accessToken },
    });
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    const { user, tokens } = await authService.loginUser(req.body);

    this.setRefreshTokenCookie(
      res,
      tokens.refreshToken,
      tokens.refreshTokenExpiresAt
    );

    // MODIFIED: Do not send the full tokens object.
    res.status(200).json({
      status: "success",
      message: "Logged in successfully.",
      data: { user, accessToken: tokens.accessToken },
    });
  });

  refreshAccessToken = asyncHandler(async (req: Request, res: Response) => {
    const incomingRefreshToken = req.cookies[config.cookies.refreshTokenName];

    const { newAccessToken, newRefreshToken, newRefreshTokenExpiresAt } =
      await authService.handleRefreshTokenRotation({ incomingRefreshToken });

    this.setRefreshTokenCookie(res, newRefreshToken, newRefreshTokenExpiresAt);

    res.status(200).json({
      status: "success",
      message: "Token refreshed successfully.",
      data: { accessToken: newAccessToken },
    });
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    const incomingRefreshToken = req.cookies[config.cookies.refreshTokenName];
    await authService.handleUserLogout({ incomingRefreshToken });

    res.clearCookie(config.cookies.refreshTokenName);
    res
      .status(200)
      .json({ status: "success", message: "Logged out successfully." });
  });

  handleOAuth = asyncHandler(async (req: Request, res: Response) => {
    const { user, tokens } = await authService.findOrCreateOAuthUser(req.body);

    this.setRefreshTokenCookie(
      res,
      tokens.refreshToken,
      tokens.refreshTokenExpiresAt
    );

    // MODIFIED: Do not send the full tokens object.
    res.status(200).json({
      status: "success",
      data: { user, accessToken: tokens.accessToken },
    });
  });

  changePassword = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    await authService.changeUserPassword(userId, req.body);

    res.clearCookie(config.cookies.refreshTokenName);
    res.status(200).json({
      status: "success",
      message: "Password changed successfully. Please log in again.",
    });
  });

  logoutAll = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    await authService.revokeAllRefreshTokensForUser(userId);

    res.clearCookie(config.cookies.refreshTokenName);
    res.status(200).json({
      status: "success",
      message: "Successfully logged out of all devices.",
    });
  });
}

export const authController = new AuthController();
