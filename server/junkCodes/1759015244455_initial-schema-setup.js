/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.up = async (pgm) => {
  // --- PRE-REQUISITES ---
  console.log("Creating uuid-ossp extension...");
  pgm.createExtension("uuid-ossp", { ifNotExists: true });

  console.log("Creating function for automatic updated_at timestamps...");
  pgm.sql(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
       NEW.updated_at = NOW();
       RETURN NEW;
    END;
    $$ language 'plpgsql';
  `);

  // --- ENUMS ---
  console.log("Creating custom ENUM types...");
  pgm.createType("SystemRole", [
    "USER",
    "SYSTEM_CONTENT_CREATOR",
    "DEVELOPER",
    "SUPER_ADMIN",
  ]);
  pgm.createType("ThemePreference", ["LIGHT", "DARK", "SYSTEM"]);

  // --- TABLES ---

  /**
   * Stores the core user account information, including credentials and profile details.
   * This is the central table for the application.
   */
  console.log("Creating 'users' table...");
  pgm.createTable("users", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("uuid_generate_v4()"),
    },
    name: { type: "text", notNull: true },
    username: { type: "text", notNull: true, unique: true },
    email: { type: "text", notNull: true, unique: true },
    email_verified: { type: "boolean", notNull: true, default: false },
    hashed_password: { type: "text" },
    bio: { type: "text" },
    title: { type: "text" },
    location: { type: "text" },
    profile_image: {
      type: "text",
      default:
        "https://res.cloudinary.com/djtww0vax/image/upload/v1747766773/xi-biooid_bstapi.jpg",
    },
    banner_image: {
      type: "text",
      default:
        "https://res.cloudinary.com/djtww0vax/image/upload/v1747766773/xi-biooid_bstapi.jpg",
    },
    joined_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
    system_role: { type: "SystemRole", notNull: true, default: "USER" },
    deactivated_at: { type: "timestamptz" },
    twitter_url: { type: "text" },
    github_url: { type: "text" },
    linkedin_url: { type: "text" },
    website_url: { type: "text" },
  });
  pgm.createTrigger("users", "set_users_updated_at", {
    when: "BEFORE",
    operation: "UPDATE",
    function: "update_updated_at_column",
    level: "ROW",
  });

  /**
   * A join table that stores the "follow" relationships between users,
   * creating a many-to-many social graph.
   */
  console.log("Creating 'follows' table...");
  pgm.createTable(
    "follows",
    {
      follower_id: {
        type: "uuid",
        notNull: true,
        references: '"users"(id)',
        onDelete: "CASCADE",
      },
      following_id: {
        type: "uuid",
        notNull: true,
        references: '"users"(id)',
        onDelete: "CASCADE",
      },
      created_at: {
        type: "timestamptz",
        notNull: true,
        default: pgm.func("now()"),
      },
    },
    { constraints: { primaryKey: ["follower_id", "following_id"] } }
  );

  /**
   * Stores the unique identifiers (JTI) for refresh tokens. This is crucial for
   * stateful, secure session management, allowing individual sessions to be revoked.
   */
  console.log("Creating 'refresh_tokens' table...");
  pgm.createTable("refresh_tokens", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("uuid_generate_v4()"),
    },
    jti: { type: "text", notNull: true, unique: true },
    user_id: {
      type: "uuid",
      notNull: true,
      references: '"users"(id)',
      onDelete: "CASCADE",
    },
    expires_at: { type: "timestamptz", notNull: true },
    revoked: { type: "boolean", notNull: true, default: false },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });
  pgm.createTrigger("refresh_tokens", "set_refresh_tokens_updated_at", {
    when: "BEFORE",
    operation: "UPDATE",
    function: "update_updated_at_column",
    level: "ROW",
  });

  /**
   * Stores single-use tokens for the "forgot password" functionality,
   * securely linking a reset token to a user account.
   */
  console.log("Creating 'password_reset_tokens' table...");
  pgm.createTable("password_reset_tokens", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("uuid_generate_v4()"),
    },
    token: { type: "text", notNull: true, unique: true },
    expires_at: { type: "timestamptz", notNull: true },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
    user_id: {
      type: "uuid",
      notNull: true,
      references: '"users"(id)',
      onDelete: "CASCADE",
    },
  });

  /**
   * Stores single-use tokens for verifying a user's email address upon registration.
   */
  console.log("Creating 'email_verification_tokens' table...");
  pgm.createTable("email_verification_tokens", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("uuid_generate_v4()"),
    },
    token: { type: "text", notNull: true, unique: true },
    expires_at: { type: "timestamptz", notNull: true },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
    user_id: {
      type: "uuid",
      notNull: true,
      references: '"users"(id)',
      onDelete: "CASCADE",
    },
  });

  /**
   * Stores in-app notifications for individual users.
   */
  console.log("Creating 'notifications' table...");
  pgm.createTable("notifications", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("uuid_generate_v4()"),
    },
    content: { type: "text", notNull: true },
    is_read: { type: "boolean", notNull: true, default: false },
    url: { type: "text" },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
    user_id: {
      type: "uuid",
      notNull: true,
      references: '"users"(id)',
      onDelete: "CASCADE",
    },
  });

  /**
   * A one-to-one extension of the 'users' table to store user-specific
   * application preferences like theme and notification settings.
   */
  console.log("Creating 'user_settings' table...");
  pgm.createTable("user_settings", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("uuid_generate_v4()"),
    },
    theme: { type: "ThemePreference", notNull: true, default: "SYSTEM" },
    notifications_enabled: { type: "boolean", notNull: true, default: true },
    email_marketing: { type: "boolean", notNull: true, default: false },
    email_social: { type: "boolean", notNull: true, default: true },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
    user_id: {
      type: "uuid",
      notNull: true,
      unique: true,
      references: '"users"(id)',
      onDelete: "CASCADE",
    },
  });
  pgm.createTrigger("user_settings", "set_user_settings_updated_at", {
    when: "BEFORE",
    operation: "UPDATE",
    function: "update_updated_at_column",
    level: "ROW",
  });

  /**
   * Stores records of marketing or bulk emails sent out to users,
   * allowing for tracking of campaigns and communication.
   */
  console.log("Creating 'marketing_emails' table...");
  pgm.createTable("marketing_emails", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("uuid_generate_v4()"),
    },
    subject: { type: "text", notNull: true },
    html_content: { type: "text", notNull: true },
    app_version: { type: "text" },
    status: { type: "text", notNull: true, default: "draft" },
    sent_at: { type: "timestamptz" },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  console.log("Migration 'up' complete!");
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.down = async (pgm) => {
  console.log("Reverting migration 'down'...");

  pgm.dropTable("marketing_emails");
  pgm.dropTable("user_settings");
  pgm.dropTable("notifications");
  pgm.dropTable("email_verification_tokens");
  pgm.dropTable("password_reset_tokens");
  pgm.dropTable("refresh_tokens");
  pgm.dropTable("follows");
  pgm.dropTable("users");

  pgm.dropType("ThemePreference");
  pgm.dropType("SystemRole");

  pgm.sql("DROP FUNCTION IF EXISTS update_updated_at_column;");

  console.log("Revert 'down' complete.");
};
