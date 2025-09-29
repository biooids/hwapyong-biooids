// migrate-pg-config.js

import "dotenv/config";

// This object mirrors the production SSL config in `src/db/index.ts`.
const productionSslConfig = {
  ssl: {
    ...(process.env.DATABASE_CA
      ? { ca: process.env.DATABASE_CA }
      : { rejectUnauthorized: false }),
  },
};

export default {
  databaseUrl: process.env.DATABASE_URL,
  dir: "migrations",
  migrationsTable: "pgmigrations",
  ...(process.env.NODE_ENV === "production" && productionSslConfig),
  schema: "public",
  verbose: true,
};
