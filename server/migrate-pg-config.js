// FILE: migrate-pg-config.js

import "dotenv/config";

export default {
  databaseUrl: process.env.DATABASE_URL,
  dir: "migrations",
  migrationsTable: "pgmigrations",
  ssl: process.env.NODE_ENV === "production",
  schema: "public",
  verbose: true,
};
