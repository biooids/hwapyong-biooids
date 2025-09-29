// src/features/admin/admin.service.ts

import { query } from "@/db/index.js";
import { SystemRole } from "@/types/express.d.js";
import { User } from "@/features/user/user.types.js";
import { userService } from "@/features/user/user.service.js";
import { AdminDashboardStats, AdminApiQuery } from "./admin.types.js";
import { deleteFromCloudinary } from "@/config/cloudinary.js";
import { logger } from "@/config/logger.js";

class AdminService {
  public async getDashboardStats(): Promise<AdminDashboardStats> {
    const sql = 'SELECT COUNT(*) FROM "users"';
    const result = await query<{ count: string }>(sql);
    const totalUsers = parseInt(result.rows[0].count, 10);
    return { totalUsers };
  }

  public async getAllUsers(
    queryParams: AdminApiQuery
  ): Promise<{ users: User[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      q,
      sortBy = "joined_at",
      order = "desc",
      filterByRole,
    } = queryParams;

    const whereClauses: string[] = [];
    const params: (string | number)[] = [];
    let paramIndex = 1;

    if (q) {
      whereClauses.push(
        `("name" ILIKE $${paramIndex} OR "username" ILIKE $${paramIndex} OR "email" ILIKE $${paramIndex})`
      );
      params.push(`%${q}%`);
      paramIndex++;
    }

    if (filterByRole) {
      whereClauses.push(`"system_role" = $${paramIndex}`);
      params.push(filterByRole);
      paramIndex++;
    }

    const whereString =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const allowedSortBy = ["joined_at", "name", "email"];
    const safeSortBy = allowedSortBy.includes(sortBy) ? sortBy : "joined_at";
    const safeOrder = order === "asc" ? "ASC" : "DESC";
    const orderByString = `ORDER BY "${safeSortBy}" ${safeOrder}`;

    const offset = (page - 1) * limit;

    const usersSql = `SELECT * FROM "users" ${whereString} ${orderByString} LIMIT $${paramIndex} OFFSET $${
      paramIndex + 1
    }`;
    const countSql = `SELECT COUNT(*) FROM "users" ${whereString}`;

    const [usersResult, countResult] = await Promise.all([
      query<User>(usersSql, [...params, limit, offset]),
      query<{ count: string }>(countSql, params.slice(0, paramIndex - 1)),
    ]);

    const users = usersResult.rows;
    const total = parseInt(countResult.rows[0].count, 10);

    return { users, total };
  }

  public async updateUserRole(
    userId: string,
    newRole: SystemRole
  ): Promise<User> {
    const sql =
      'UPDATE "users" SET "system_role" = $1 WHERE "id" = $2 RETURNING *';
    const result = await query<User>(sql, [newRole, userId]);
    return result.rows[0];
  }

  public async deleteUser(userId: string): Promise<void> {
    const user = await userService.findUserById(userId);
    if (!user) {
      logger.warn({ userId }, "Admin deletion skipped: User not found.");
      return;
    }

    const deletionPromises: Promise<any>[] = [];
    if (user.profile_image_public_id) {
      deletionPromises.push(deleteFromCloudinary(user.profile_image_public_id));
    }
    if (user.banner_image_public_id) {
      deletionPromises.push(deleteFromCloudinary(user.banner_image_public_id));
    }
    if (deletionPromises.length > 0) {
      await Promise.allSettled(deletionPromises);
    }

    await query('DELETE FROM "users" WHERE "id" = $1', [userId]);
    logger.info(
      { userId, adminId: "SYSTEM" },
      "Admin successfully deleted user."
    );
  }
}

export const adminService = new AdminService();
