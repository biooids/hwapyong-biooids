// FILE: src/features/user/user.service.ts

import bcrypt from "bcryptjs";
import { createHttpError } from "../../utils/error.factory.js";
import { logger } from "../../config/logger.js";
import { deleteFromCloudinary } from "../../config/cloudinary.js";
import { UserProfile } from "./user.types.js";
import { SignUpInputDto } from "../auth/auth.types.js";
import { query } from "../../db/index.js";
import { SystemRole } from "../../types/express.d.js";

// [REMOVED] - The emailService is no longer part of the project.
// import { emailService } from "../email/email.service.js";

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  email_verified: boolean;
  hashed_password: string | null;
  bio: string | null;
  title: string | null;
  location: string | null;
  profile_image: string | null;
  banner_image: string | null;
  joined_at: Date;
  updated_at: Date;
  system_role: SystemRole;
  deactivated_at: Date | null;
}

interface UserProfileUpdateData {
  name?: string;
  username?: string;
  email?: string;
  bio?: string;
  title?: string;
  location?: string;
  profile_image?: string;
  banner_image?: string;
  email_verified?: boolean;
}

type UserWithFollowCounts = User & {
  followersCount: number;
  followingCount: number;
};

export class UserService {
  public async findUserByEmail(email: string): Promise<User | null> {
    const sql = 'SELECT * FROM "users" WHERE "email" = $1';
    const result = await query<User>(sql, [email]);
    return result.rows[0] || null;
  }

  public async findUserByUsername(
    username: string,
    currentUserId?: string
  ): Promise<UserProfile | null> {
    const sql = `
      SELECT
        u.id, u.name, u.username, u.email, u.email_verified AS "emailVerified",
        u.bio, u.title, u.location, u.profile_image AS "profileImage",
        u.banner_image AS "bannerImage", u.joined_at AS "joinedAt",
        u.updated_at AS "updatedAt", u.system_role AS "systemRole",
        u.twitter_url AS "twitterUrl", u.github_url AS "githubUrl",
        u.website_url AS "websiteUrl",
        (SELECT COUNT(*) FROM "follows" WHERE "following_id" = u.id)::int AS "followersCount",
        (SELECT COUNT(*) FROM "follows" WHERE "follower_id" = u.id)::int AS "followingCount",
        EXISTS(SELECT 1 FROM "follows" WHERE "follower_id" = $2 AND "following_id" = u.id) AS "isFollowing"
      FROM "users" u
      WHERE u.username = $1
    `;
    const result = await query<UserProfile>(sql, [username, currentUserId]);
    return result.rows[0] || null;
  }

  public async findUserById(id: string): Promise<UserWithFollowCounts | null> {
    const sql = `
      SELECT *,
        (SELECT COUNT(*) FROM "follows" WHERE "following_id" = "users"."id")::int AS "followersCount",
        (SELECT COUNT(*) FROM "follows" WHERE "follower_id" = "users"."id")::int AS "followingCount"
      FROM "users"
      WHERE "id" = $1
    `;
    const result = await query<UserWithFollowCounts>(sql, [id]);
    return result.rows[0] || null;
  }

  public async createUser(input: SignUpInputDto): Promise<User> {
    const { email, username, password, name } = input;
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = `
      INSERT INTO "users" (email, username, hashed_password, name)
      VALUES ($1, $2, $3, $4) RETURNING *;
    `;
    try {
      const result = await query<User>(sql, [
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
    } catch (e: any) {
      if (e.code === "23505") {
        const field = e.constraint.includes("username") ? "username" : "email";
        logger.warn(
          { field, email, username },
          "Unique constraint violation during user creation."
        );
        throw createHttpError(
          409,
          `An account with this ${field} already exists.`
        );
      }
      logger.error({ err: e }, "Unexpected error during user creation");
      throw createHttpError(500, "Could not create user account.");
    }
  }

  public async deleteUserAccount(userId: string): Promise<void> {
    logger.info({ userId }, "Initiating account deletion process.");
    const user = await this.findUserById(userId);
    if (!user) {
      logger.warn({ userId }, "Account deletion skipped: User not found.");
      return;
    }

    const deletionPromises: Promise<any>[] = [];
    if (user.profile_image) {
      deletionPromises.push(
        deleteFromCloudinary(`user_assets/profile_${userId}`)
      );
    }
    if (user.banner_image) {
      deletionPromises.push(
        deleteFromCloudinary(`user_assets/banner_${userId}`)
      );
    }
    if (deletionPromises.length > 0) {
      await Promise.allSettled(deletionPromises);
    }

    try {
      await query('DELETE FROM "users" WHERE "id" = $1', [userId]);
      logger.info({ userId }, "User record deleted successfully.");
      // [REMOVED] - The call to emailService has been deleted.
      // await emailService.sendAccountDeletionConfirmationEmail(userEmail, userName);
    } catch (error) {
      logger.error(
        { err: error, userId },
        "Error deleting user record from database"
      );
      throw createHttpError(500, "Could not delete user account at this time.");
    }
  }

  public async updateUserProfile(
    userId: string,
    data: UserProfileUpdateData
  ): Promise<User> {
    const existingUser = await this.findUserById(userId);
    if (!existingUser) {
      throw createHttpError(404, "User profile not found.");
    }

    if (data.email && data.email !== existingUser.email) {
      data.email_verified = false;
    }

    const fields = Object.keys(data) as (keyof UserProfileUpdateData)[];
    if (fields.length === 0) {
      // If there is no data to update, just return the existing user.
      return existingUser;
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
      const updatedUser = result.rows[0];

      // [REMOVED] - All calls to emailService have been deleted.
      // if (data.email && data.email !== existingUser.email) { ... }

      logger.info({ userId }, "User profile updated successfully.");
      return updatedUser;
    } catch (e: any) {
      if (e.code === "23505") {
        const field = e.constraint.includes("username") ? "username" : "email";
        logger.warn(
          { userId, field, value: (data as any)[field] },
          "Unique constraint violation during profile update."
        );
        throw createHttpError(409, `This ${field} is already taken.`);
      }
      logger.error({ err: e, userId }, "Error updating user profile");
      throw createHttpError(500, "Could not update user profile.");
    }
  }
}

export const userService = new UserService();
