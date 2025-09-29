// src/db/index.ts

import { Pool, PoolClient, QueryResult, QueryResultRow } from "pg"; // MODIFIED: Imported QueryResultRow
import { config } from "../config/index.js";
import { logger } from "../config/logger.js";

// --- 1. Initialize the Connection Pool (with improved SSL) ---
const pool = new Pool({
  connectionString: config.databaseUrl,
  ...(config.nodeEnv === "production" && {
    ssl: {
      // Prioritize using the CA cert from env var for maximum security.
      // Fallback to rejectUnauthorized for services that require it.
      ...(process.env.DATABASE_CA
        ? { ca: process.env.DATABASE_CA }
        : { rejectUnauthorized: false }),
    },
  }),
});

pool.on("error", (err) => {
  logger.error({ err }, "Unexpected error on idle client in pool");
  process.exit(-1);
});

// --- 2. Connection Logic with Retries (Unchanged) ---
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

export async function disconnectDb(): Promise<void> {
  try {
    await pool.end();
    logger.info("🔌 Database pool disconnected successfully.");
  } catch (error) {
    logger.error({ err: error }, "❌ Error during database pool disconnect");
  }
}

// --- 3. The Unified Query Function (with improved logging) ---
export const query = async <T extends QueryResultRow>( // MODIFIED: Added constraint
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
    logger.error({ err: error, sql: text, params }, "Database query failed");
    throw error;
  }
};

// --- 4. NEW: Transaction Management Utility ---

// Define a type for the work to be done inside a transaction.
// It receives a client that is connected and part of the transaction.
type TransactionCallback<T> = (client: PoolClient) => Promise<T>;

/**
 * Executes a series of database operations within a single transaction.
 *
 * @param callback A function that receives a database client and performs queries.
 * @returns The result of the callback function.
 * @example
 * await transaction(async (client) => {
 * await client.query('UPDATE accounts SET balance = balance - 100 WHERE id = 1');
 * await client.query('UPDATE accounts SET balance = balance + 100 WHERE id = 2');
 * });
 */
export const transaction = async <T>(
  callback: TransactionCallback<T>
): Promise<T> => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    logger.error({ err: error }, "Transaction rolled back due to an error");
    throw error;
  } finally {
    client.release();
  }
};

export { pool };
