// src/features/follow/follow.types.ts

/**
 * Represents the public-facing data for a user in a follow list.
 */
export interface FollowUserDto {
  id: string;
  name: string;
  username: string;
  profileImageUrl: string | null;
  bio: string | null;
}
