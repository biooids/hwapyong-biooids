//src/config/logger.ts

import pino from "pino";
import { config } from "./index.js";

// Determine the log level from environment variables, defaulting to 'info'
const level = config.logLevel || "info";

// Define transport options based on the environment
const transport =
  config.nodeEnv === "development"
    ? // In development, use pino-pretty for human-readable, colorful logs
      pino.transport({
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:yyyy-mm-dd HH:MM:ss", // Human-readable time format
          ignore: "pid,hostname", // Don't show process ID and hostname
        },
      })
    : // In production, log as standard JSON (which is the default)
      undefined;

/**
 * The application's central logger instance.
 * It's configured to be environment-aware.
 */
export const logger = pino(
  {
    level: level,
    // Redact sensitive information from logs automatically
    redact: ["req.headers.authorization", "req.body.password"],
  },
  transport
);

logger.info(`✅ Logger configured with level: '${level}'`);
