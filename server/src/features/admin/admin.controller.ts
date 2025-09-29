// src/features/admin/admin.controller.ts

import { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { adminService } from "./admin.service.js";
import { createHttpError } from "../../utils/error.factory.js";

class AdminController {
  getDashboardStats = asyncHandler(async (_req: Request, res: Response) => {
    const stats = await adminService.getDashboardStats();
    res.status(200).json({ status: "success", data: stats });
  });

  getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const { users, total } = await adminService.getAllUsers(req.query);

    res.status(200).json({
      status: "success",
      data: {
        users,
        pagination: {
          totalItems: total,
          totalPages: Math.ceil(total / limit),
          currentPage: page,
        },
      },
    });
  });

  updateUserRole = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { role } = req.body;

    // The manual validation check is now removed and handled by the validation middleware.

    const updatedUser = await adminService.updateUserRole(id, role);
    res.status(200).json({ status: "success", data: updatedUser });
  });

  deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (req.user?.id === id) {
      throw createHttpError(
        400,
        "Admins cannot delete their own account via this route."
      );
    }
    await adminService.deleteUser(id);
    res.status(204).send();
  });
}

export const adminController = new AdminController();
