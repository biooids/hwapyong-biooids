// FILE: src/features/user/user.types.ts

// [MODIFIED] - Import the manually defined SystemRole enum from your global types file.
import { SystemRole } from "../../types/express.d.js";

// [REMOVED] - The import from Prisma's generated client is no longer needed.
// import { SystemRole } from "@/prisma-client";

// Represents a user object with sensitive data (like password) removed.
// This is a Data Transfer Object (DTO) used for API responses.
export type SanitizedUserDto = {
  id: string;
  name: string;
  username: string;
  email: string;
  emailVerified: boolean;
  bio: string | null;
  title: string | null;
  location: string | null;
  profileImage: string | null;
  bannerImage: string | null;
  joinedAt: Date;
  updatedAt: Date;
  systemRole: SystemRole;
  twitterUrl: string | null;
  githubUrl: string | null;
  websiteUrl: string | null;
  followersCount: number;
  followingCount: number;
};

// Represents the data needed for a public user profile page.
// It includes all the sanitized data plus a flag to show if the current user is following them.
export type UserProfile = SanitizedUserDto & {
  isFollowing: boolean;
};
