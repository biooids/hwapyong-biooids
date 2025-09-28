// FILE: src/features/admin/admin.service.ts

// [MODIFIED] - Import the query function and our manual types.
import { query } from "../../db/index.js";
import { SystemRole } from "../../types/express.d.js";
import { User } from "../user/user.service.js";

// [REMOVED] - All Prisma imports are gone.
// import prisma from "@/db/prisma.js";
// import { User, Prisma, SystemRole } from "@/prisma-client";

// [ADDED] - Manually defined types for this service's inputs and outputs.
export interface AdminDashboardStats {
  totalUsers: number;
}

export interface AdminApiQuery {
  page?: number;
  limit?: number;
  q?: string;
  sortBy?: "joined_at" | "name" | "email";
  order?: "asc" | "desc";
  filterByRole?: SystemRole;
}

class AdminService {
  public async getDashboardStats(): Promise<AdminDashboardStats> {
    // [MODIFIED] - Replaced prisma.user.count() with a direct SQL query.
    const sql = 'SELECT COUNT(*) FROM "users"';
    const result = await query<{ count: string }>(sql);
    const totalUsers = parseInt(result.rows[0].count, 10);
    return { totalUsers };
  }

  public async getAllUsers(
    queryParams: AdminApiQuery
  ): Promise<{ users: User[]; total: number }> {
    // [MODIFIED] - This entire block is new logic to build a dynamic SQL query.
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

    // Safely handle sorting to prevent SQL injection
    const allowedSortBy = ["joined_at", "name", "email"];
    const safeSortBy = allowedSortBy.includes(sortBy) ? sortBy : "joined_at";
    const safeOrder = order === "asc" ? "ASC" : "DESC";
    const orderByString = `ORDER BY "${safeSortBy}" ${safeOrder}`;

    const offset = (page - 1) * limit;

    // Two queries are run in parallel: one for the paginated data, one for the total count.
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
    // [MODIFIED] - Replaced prisma.user.update with a direct SQL UPDATE query.
    const sql =
      'UPDATE "users" SET "system_role" = $1 WHERE "id" = $2 RETURNING *';
    const result = await query<User>(sql, [newRole, userId]);
    return result.rows[0];
  }

  public async deleteUser(userId: string): Promise<void> {
    // [MODIFIED] - Replaced prisma.user.delete with a direct SQL DELETE query.
    await query('DELETE FROM "users" WHERE "id" = $1', [userId]);
  }
}

export const adminService = new AdminService();
