// src/features/follow/follow.service.ts

import { createHttpError } from "../../utils/error.factory.js";
import { userService } from "../user/user.service.js";
import { query } from "../../db/index.js";
import { FollowUserDto } from "./follow.types.js";

class FollowService {
  public async followUser(followerId: string, usernameToFollow: string) {
    const userToFollow = await userService.findUserByUsername(usernameToFollow);
    if (!userToFollow) {
      throw createHttpError(404, "User to follow not found.");
    }
    if (followerId === userToFollow.id) {
      throw createHttpError(400, "You cannot follow yourself.");
    }

    // This logic is already robust and needs no changes.
    const checkSql =
      'SELECT 1 FROM "follows" WHERE "follower_id" = $1 AND "following_id" = $2';
    const checkResult = await query(checkSql, [followerId, userToFollow.id]);
    if (checkResult.rowCount > 0) {
      return;
    }

    const insertSql =
      'INSERT INTO "follows" ("follower_id", "following_id") VALUES ($1, $2)';
    await query(insertSql, [followerId, userToFollow.id]);
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

  public async getFollowing(username: string): Promise<FollowUserDto[]> {
    const targetUser = await userService.findUserByUsername(username);
    if (!targetUser) {
      throw createHttpError(404, `User @${username} not found.`);
    }

    const sql = `
      SELECT u.id, u.name, u.username, u.profile_image_url AS "profileImageUrl", u.bio
      FROM "users" u
      INNER JOIN "follows" f ON u.id = f.following_id
      WHERE f.follower_id = $1;
    `;
    const result = await query<FollowUserDto>(sql, [targetUser.id]);
    return result.rows;
  }

  public async getFollowers(username: string): Promise<FollowUserDto[]> {
    const targetUser = await userService.findUserByUsername(username);
    if (!targetUser) {
      throw createHttpError(404, `User @${username} not found.`);
    }

    const sql = `
      SELECT u.id, u.name, u.username, u.profile_image_url AS "profileImageUrl", u.bio
      FROM "users" u
      INNER JOIN "follows" f ON u.id = f.follower_id
      WHERE f.following_id = $1;
    `;
    const result = await query<FollowUserDto>(sql, [targetUser.id]);
    return result.rows;
  }
}

export const followService = new FollowService();
