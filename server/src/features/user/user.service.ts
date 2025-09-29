// src/features/user/user.service.ts

import { Pool, PoolClient } from "pg";
import { createHttpError } from "../../utils/error.factory.js";
import { logger } from "../../config/logger.js";
import { deleteFromCloudinary } from "../../config/cloudinary.js";
import { SignUpInputDto } from "../auth/auth.types.js";
import { query } from "../../db/index.js";
import { hashPassword } from "../auth/auth.utils.js";
import {
  User,
  UserProfileUpdateData,
  UserWithFollowCounts,
  UserProfile,
} from "./user.types.js"; // Import all types from the dedicated file

export class UserService {
  public async findUserByEmail(email: string): Promise<User | null> {
    const sql = 'SELECT * FROM "users" WHERE "email" = $1';
    const result = await query<User>(sql, [email]);
    return result.rows[0] || null;
  }

  public async findUserById(
    id: string,
    db: PoolClient | Pool = query
  ): Promise<UserWithFollowCounts | null> {
    const sql = `
      SELECT *,
        (SELECT COUNT(*) FROM "follows" WHERE "following_id" = "users"."id")::int AS "followersCount",
        (SELECT COUNT(*) FROM "follows" WHERE "follower_id" = "users"."id")::int AS "followingCount"
      FROM "users"
      WHERE "id" = $1
    `;
    const result = await db.query<UserWithFollowCounts>(sql, [id]);
    return result.rows[0] || null;
  }

  public async findUserByUsername(
    username: string,
    currentUserId?: string
  ): Promise<UserProfile | null> {
    const sql = `
      SELECT
        u.id, u.name, u.username, u.email, u.email_verified AS "emailVerified",
        u.bio, u.title, u.location, u.profile_image_url AS "profileImageUrl",
        u.banner_image_url AS "bannerImageUrl", u.joined_at AS "joinedAt",
        u.updated_at AS "updatedAt", u.system_role AS "systemRole",
        (SELECT COUNT(*) FROM "follows" WHERE "following_id" = u.id)::int AS "followersCount",
        (SELECT COUNT(*) FROM "follows" WHERE "follower_id" = u.id)::int AS "followingCount",
        EXISTS(SELECT 1 FROM "follows" WHERE "follower_id" = $2 AND "following_id" = u.id) AS "isFollowing"
      FROM "users" u
      WHERE u.username = $1
    `;
    const result = await query<UserProfile>(sql, [username, currentUserId]);
    return result.rows[0] || null;
  }

  public async createUser(
    input: SignUpInputDto,
    db: PoolClient | Pool = query
  ): Promise<User> {
    const { email, username, password, name } = input;
    const hashedPassword = await hashPassword(password);
    const sql = `
      INSERT INTO "users" (email, username, hashed_password, name)
      VALUES ($1, $2, $3, $4) RETURNING *;
    `;
    const result = await db.query<User>(sql, [
      email,
      username,
      hashedPassword,
      name,
    ]);
    const user = result.rows[0];
    logger.info(
      { userId: user.id, email: user.email },
      "New user created successfully."
    );
    return user;
  }

  public async deleteUserAccount(userId: string): Promise<void> {
    const user = await this.findUserById(userId);
    if (!user) {
      logger.warn({ userId }, "Account deletion skipped: User not found.");
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
    logger.info({ userId }, "User record deleted successfully.");
  }

  public async updateUserProfile(
    userId: string,
    data: UserProfileUpdateData
  ): Promise<User> {
    const fields = Object.keys(data) as (keyof UserProfileUpdateData)[];
    if (fields.length === 0) {
      const currentUser = await this.findUserById(userId);
      if (!currentUser) throw createHttpError(404, "User not found.");
      return currentUser;
    }

    const setClauses = fields
      .map((field, i) => `"${field}" = $${i + 1}`)
      .join(", ");
    const values = fields.map((field) => data[field]);
    const sql = `UPDATE "users" SET ${setClauses} WHERE "id" = $${
      fields.length + 1
    } RETURNING *;`;

    try {
      const result = await query<User>(sql, [...values, userId]);
      logger.info({ userId }, "User profile updated successfully.");
      return result.rows[0];
    } catch (e: any) {
      if (e.code === "23505") {
        const field = e.constraint.includes("username") ? "username" : "email";
        throw createHttpError(409, `This ${field} is already taken.`);
      }
      logger.error({ err: e, userId }, "Error updating user profile");
      throw createHttpError(500, "Could not update user profile.");
    }
  }
}

export const userService = new UserService();
