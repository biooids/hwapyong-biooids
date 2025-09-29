// src/features/user/user.types.ts

import { SystemRole } from "../../types/express.d.js";

// --- Internal & Database-Facing Types ---

/**
 * Represents the full User object, matching the database schema exactly.
 * Includes sensitive fields like hashed_password.
 * SHOULD ONLY be used within the service layer.
 */
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
  profile_image_url: string | null;
  profile_image_public_id: string | null;
  banner_image_url: string | null;
  banner_image_public_id: string | null;
  joined_at: Date;
  updated_at: Date;
  system_role: SystemRole;
  deactivated_at: Date | null;
}

/**
 * Represents the data shape for updating a user's profile.
 * Used by the service layer to construct update queries.
 */
export interface UserProfileUpdateData {
  name?: string;
  username?: string;
  bio?: string;
  title?: string;
  location?: string;
  profile_image_url?: string;
  profile_image_public_id?: string;
  banner_image_url?: string;
  banner_image_public_id?: string;
}

/**
 * A composite type used internally by the service to include follow counts.
 */
export type UserWithFollowCounts = User & {
  followersCount: number;
  followingCount: number;
};

// --- API-Facing DTOs (Data Transfer Objects) ---

/**
 * Represents a user object with sensitive data removed.
 * Used for API responses.
 */
export type SanitizedUserDto = {
  id: string;
  name: string;
  username: string;
  email: string;
  emailVerified: boolean;
  bio: string | null;
  title: string | null;
  location: string | null;
  profileImageUrl: string | null;
  bannerImageUrl: string | null;
  joinedAt: Date;
  updatedAt: Date;
  systemRole: SystemRole;
  followersCount: number;
  followingCount: number;
};

/**
 * Represents the data needed for a public user profile page.
 * Includes all sanitized data plus a flag for the current user's follow status.
 */
export type UserProfile = SanitizedUserDto & {
  isFollowing: boolean;
};
