// src/middleware/rateLimiter.ts

import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { createClient } from "redis";
import { config } from "@/config/index.js";
import { logger } from "@/config/logger.js";

const REDIS_URL = process.env.REDIS_URL;
let redisClient: ReturnType<typeof createClient> | undefined;

let apiStore: RedisStore | undefined;
let authStore: RedisStore | undefined;

if (config.nodeEnv === "production" && REDIS_URL) {
  redisClient = createClient({ url: REDIS_URL });
  redisClient.on("error", (err) => logger.error({ err }, "Redis Client Error"));
  redisClient
    .connect()
    .catch((err) => logger.error({ err }, "Failed to connect to Redis"));

  logger.info("✅ Rate limiter configured to use Redis store for production.");

  apiStore = new RedisStore({
    sendCommand: (...args: string[]) => redisClient!.sendCommand(args),
    prefix: "rl_api:",
  });

  authStore = new RedisStore({
    sendCommand: (...args: string[]) => redisClient!.sendCommand(args),
    prefix: "rl_auth:",
  });
} else {
  logger.info("✅ Rate limiter configured to use in-memory store.");
}

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again after 15 minutes.",
  standardHeaders: "draft-7",
  legacyHeaders: false,
  ...(apiStore && { store: apiStore }),
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many login or registration attempts from this IP.",
  standardHeaders: "draft-7",
  legacyHeaders: false,
  ...(authStore && { store: authStore }),
});
