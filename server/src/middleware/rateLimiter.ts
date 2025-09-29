// src/middleware/rateLimiter.ts

import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { createClient } from "redis";
import { config } from "../config/index.js";
import { logger } from "../config/logger.js";

// This is a placeholder; you would need to add REDIS_URL to your .env and config files.
const REDIS_URL = process.env.REDIS_URL;

// Create a reusable Redis client instance.
// NOTE: For this to work, you need to install `redis` and `rate-limit-redis`:
// pnpm add redis rate-limit-redis
let redisClient: ReturnType<typeof createClient> | undefined;
let store: rateLimit.Store;

// For a large-scale app, use a distributed Redis store in production.
if (config.nodeEnv === "production" && REDIS_URL) {
  redisClient = createClient({ url: REDIS_URL });

  // It's crucial to handle connection errors.
  redisClient.on("error", (err) => {
    logger.error({ err }, "Redis Client Error");
  });

  // Connect the client. As of redis@4, you must explicitly connect.
  redisClient.connect().catch((err) => {
    logger.error({ err }, "Failed to connect to Redis for rate limiting");
  });

  logger.info("✅ Rate limiter configured to use Redis store for production.");
  store = new RedisStore({
    // @ts-expect-error - The types between Redis v4 and rate-limit-redis might mismatch.
    // This is a known issue, but the functionality works.
    sendCommand: (...args: string[]) => redisClient!.sendCommand(args),
  });
} else {
  // In development or if Redis isn't configured, use the default in-memory store.
  logger.info("✅ Rate limiter configured to use in-memory store.");
  // The default is MemoryStore, so no 'store' property is needed.
}

// A general limiter for most API routes to prevent abuse.
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: "Too many requests from this IP, please try again after 15 minutes.",
  standardHeaders: "draft-7",
  legacyHeaders: false,
  store: store, // Apply the configured store (Redis or default)
});

// A stricter limiter for sensitive authentication routes to prevent brute-force attacks.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 authentication attempts per window
  message:
    "Too many login or registration attempts from this IP, please try again after 15 minutes.",
  standardHeaders: "draft-7",
  legacyHeaders: false,
  store: store, // Apply the configured store (Redis or default)
});
