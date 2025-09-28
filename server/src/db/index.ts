// FILE: src/db/index.ts

import { Pool, QueryResult } from "pg";
import { config } from "../config/index.js";
import { logger } from "../config/logger.js";

// 1. Initialize the Connection Pool
const pool = new Pool({
  connectionString: config.databaseUrl,

  // --- ADDED: Conditional SSL Configuration ---
  // This uses the spread syntax to add the 'ssl' property ONLY if
  // the NODE_ENV is 'production'. In development, this property will not exist.
  ...(config.nodeEnv === "production" && {
    ssl: {
      // Disables certificate validation. This is a common requirement for
      // cloud database providers like Heroku, but you should always
      // check your specific provider's documentation for the most secure setting.
      rejectUnauthorized: false,
    },
  }),
});

// It's a best practice to listen for errors on idle clients to prevent the app from crashing.
pool.on("error", (err) => {
  logger.error({ err }, "Unexpected error on idle client in pool");
  // In a production environment, you might want to exit the process
  // to allow a process manager (like PM2 or Docker) to restart it.
  process.exit(-1);
});

// --- Connection Logic with Retries (Unchanged) ---
const MAX_CONNECT_RETRIES = 5;
const CONNECT_RETRY_DELAY_MS = 5000;

export async function connectDb(
  retriesLeft: number = MAX_CONNECT_RETRIES
): Promise<void> {
  try {
    const client = await pool.connect();
    logger.info("✅ Successfully connected to the database.");
    client.release();
  } catch (error: any) {
    const currentAttempt = MAX_CONNECT_RETRIES - retriesLeft + 1;
    logger.error(
      { err: error, attempt: currentAttempt, maxRetries: MAX_CONNECT_RETRIES },
      `❌ Database Connection Error`
    );
    if (retriesLeft > 0) {
      logger.info(
        `Retrying connection in ${CONNECT_RETRY_DELAY_MS / 1000} seconds...`
      );
      await new Promise((resolve) =>
        setTimeout(resolve, CONNECT_RETRY_DELAY_MS)
      );
      return connectDb(retriesLeft - 1);
    } else {
      logger.fatal(
        "❌ Exhausted all retries. Failed to connect to the database. Exiting."
      );
      process.exit(1);
    }
  }
}

/**
 * Disconnects from the database by gracefully closing all clients in the pool.
 */
export async function disconnectDb(): Promise<void> {
  try {
    await pool.end();
    logger.info("🔌 Database pool disconnected successfully.");
  } catch (error) {
    logger.error({ err: error }, "❌ Error during database pool disconnect");
  }
}

// 2. The Unified Query Function (Unchanged)
export const query = async <T>(
  text: string,
  params: any[] = []
): Promise<QueryResult<T>> => {
  const start = Date.now();
  try {
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    logger.debug(
      { sql: text, duration: `${duration}ms`, rowCount: res.rowCount },
      "Executed query"
    );
    return res;
  } catch (error) {
    logger.error({ err: error }, "Database query failed");
    throw error;
  }
};
