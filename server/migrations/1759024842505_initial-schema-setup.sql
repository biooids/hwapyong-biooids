-- Up Migration

-- Prerequisite: Enable UUID Generation for unique IDs.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Setup: Create a function that automatically updates the 'updated_at' column on any change.
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 1: Create Custom Types (Enums) for roles and themes.
CREATE TYPE "SystemRole" AS ENUM ('USER', 'SYSTEM_CONTENT_CREATOR', 'DEVELOPER', 'SUPER_ADMIN');
CREATE TYPE "ThemePreference" AS ENUM ('LIGHT', 'DARK', 'SYSTEM');

-- Step 2: Create all the necessary tables for the application.

-- Stores the core user account information, including credentials and profile details.
CREATE TABLE "users" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" TEXT NOT NULL,
  "username" TEXT NOT NULL UNIQUE,
  "email" TEXT NOT NULL UNIQUE,
  "email_verified" BOOLEAN NOT NULL DEFAULT false,
  "hashed_password" TEXT,
  "bio" TEXT,
  "title" TEXT,
  "location" TEXT,
  "profile_image" TEXT DEFAULT 'https://res.cloudinary.com/djtww0vax/image/upload/v1747766773/xi-biooid_bstapi.jpg',
  "banner_image" TEXT DEFAULT 'https://res.cloudinary.com/djtww0vax/image/upload/v1747766773/xi-biooid_bstapi.jpg',
  "joined_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "system_role" "SystemRole" NOT NULL DEFAULT 'USER',
  "deactivated_at" TIMESTAMPTZ,
  "twitter_url" TEXT,
  "github_url" TEXT,
  "linkedin_url" TEXT,
  "website_url" TEXT
);

-- A join table for the many-to-many "follow" relationship between users.
CREATE TABLE "follows" (
  "follower_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "following_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY ("follower_id", "following_id")
);

-- Stores unique identifiers (JTI) for refresh tokens for secure session management.
CREATE TABLE "refresh_tokens" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "jti" TEXT NOT NULL UNIQUE,
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "expires_at" TIMESTAMPTZ NOT NULL,
  "revoked" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
 
-- Stores single-use tokens for the "forgot password" feature.
CREATE TABLE "password_reset_tokens" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "token" TEXT NOT NULL UNIQUE,
  "expires_at" TIMESTAMPTZ NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE
);

-- Stores single-use tokens for verifying a user's email upon registration.
CREATE TABLE "email_verification_tokens" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "token" TEXT NOT NULL UNIQUE,
  "expires_at" TIMESTAMPTZ NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE
);

-- Stores in-app notifications for users.
CREATE TABLE "notifications" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "content" TEXT NOT NULL,
  "is_read" BOOLEAN NOT NULL DEFAULT false,
  "url" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE
);

-- Stores user-specific application preferences.
CREATE TABLE "user_settings" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "theme" "ThemePreference" NOT NULL DEFAULT 'SYSTEM',
  "notifications_enabled" BOOLEAN NOT NULL DEFAULT true,
  "email_marketing" BOOLEAN NOT NULL DEFAULT false,
  "email_social" BOOLEAN NOT NULL DEFAULT true,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "user_id" UUID NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE
);

-- Stores records of marketing emails for tracking purposes.
CREATE TABLE "marketing_emails" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "subject" TEXT NOT NULL,
  "html_content" TEXT NOT NULL,
  "app_version" TEXT,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "sent_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- Step 3: Apply Triggers to tables that need automatic 'updated_at' timestamps.
CREATE TRIGGER set_users_updated_at BEFORE UPDATE ON "users" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_refresh_tokens_updated_at BEFORE UPDATE ON "refresh_tokens" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_user_settings_updated_at BEFORE UPDATE ON "user_settings" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Down Migration

-- To revert the migration, we drop everything in the reverse order of creation.

-- Drop triggers first
DROP TRIGGER IF EXISTS set_user_settings_updated_at ON "user_settings";
DROP TRIGGER IF EXISTS set_refresh_tokens_updated_at ON "refresh_tokens";
DROP TRIGGER IF EXISTS set_users_updated_at ON "users";

-- Drop tables
DROP TABLE IF EXISTS "marketing_emails";
DROP TABLE IF EXISTS "user_settings";
DROP TABLE IF EXISTS "notifications";
DROP TABLE IF EXISTS "email_verification_tokens";
DROP TABLE IF EXISTS "password_reset_tokens";
DROP TABLE IF EXISTS "refresh_tokens";
DROP TABLE IF EXISTS "follows";
DROP TABLE IF EXISTS "users";

-- Drop the custom types
DROP TYPE IF EXISTS "ThemePreference";
DROP TYPE IF EXISTS "SystemRole";

-- Drop the helper function
DROP FUNCTION IF EXISTS update_updated_at_column;