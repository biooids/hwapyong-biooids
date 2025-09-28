// FILE: src/features/follow/follow.service.ts

import { createHttpError } from "../../utils/error.factory.js";
import { userService } from "../user/user.service.js";
import { query } from "../../db/index.js";

interface FollowUser {
  id: string;
  name: string;
  username: string;
  profile_image: string | null;
  bio: string | null;
}

class FollowService {
  public async followUser(followerId: string, usernameToFollow: string) {
    const userToFollow = await userService.findUserByUsername(usernameToFollow);
    if (!userToFollow) {
      throw createHttpError(404, "User to follow not found.");
    }
    if (followerId === userToFollow.id) {
      throw createHttpError(400, "You cannot follow yourself.");
    }

    const checkSql =
      'SELECT 1 FROM "follows" WHERE "follower_id" = $1 AND "following_id" = $2';
    const checkResult = await query(checkSql, [followerId, userToFollow.id]);
    if (checkResult.rowCount > 0) {
      return; // Already following, do nothing.
    }

    const insertSql =
      'INSERT INTO "follows" ("follower_id", "following_id") VALUES ($1, $2)';
    await query(insertSql, [followerId, userToFollow.id]);

    // [REMOVED] - The call to notificationService has been deleted.
    // const follower = await userService.findUserById(followerId);
    // if (follower) { ... }
  }

  public async unfollowUser(followerId: string, usernameToUnfollow: string) {
    const userToUnfollow = await userService.findUserByUsername(
      usernameToUnfollow
    );
    if (!userToUnfollow) {
      throw createHttpError(404, "User to unfollow not found.");
    }

    const deleteSql =
      'DELETE FROM "follows" WHERE "follower_id" = $1 AND "following_id" = $2';
    await query(deleteSql, [followerId, userToUnfollow.id]);
  }

  public async getFollowing(username: string): Promise<FollowUser[] | null> {
    const sql = `
      SELECT u.id, u.name, u.username, u.profile_image, u.bio
      FROM "users" u
      INNER JOIN "follows" f ON u.id = f.following_id
      WHERE f.follower_id = (SELECT id FROM "users" WHERE username = $1);
    `;
    const result = await query<FollowUser>(sql, [username]);
    return result.rows;
  }

  public async getFollowers(username: string): Promise<FollowUser[] | null> {
    const sql = `
      SELECT u.id, u.name, u.username, u.profile_image, u.bio
      FROM "users" u
      INNER JOIN "follows" f ON u.id = f.follower_id
      WHERE f.following_id = (SELECT id FROM "users" WHERE username = $1);
    `;
    const result = await query<FollowUser>(sql, [username]);
    return result.rows;
  }
}

export const followService = new FollowService();
