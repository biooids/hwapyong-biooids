//src/config/corsOptions.ts

import { CorsOptions } from "cors";
import { config } from "./index.js";
import { createHttpError } from "../utils/error.factory.js";
import { logger } from "./logger.js"; // Import the central logger

// Get the comma-separated origins string from the validated config
const allowedOrigins = config.corsOrigin
  .split(",")
  .map((origin) => origin.trim());

// Log allowed origins using the structured logger
logger.info({ origins: allowedOrigins }, "✅ Configured Allowed CORS origins");

export const corsOptions: CorsOptions = {
  origin: function (origin, callback) {
    // 'origin' can be undefined for server-to-server requests or same-origin requests.
    // We allow these, as well as any origin present in our whitelist.
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // If the origin is not in our list, block it.
      // Replace console.warn with a structured log for better analysis.
      logger.warn(
        { blockedOrigin: origin, allowed: allowedOrigins },
        `🚫 CORS: Origin was blocked`
      );
      callback(
        createHttpError(403, `This origin is not allowed by CORS policy.`)
      );
    }
  },
  credentials: true, // Necessary for sending cookies or authorization headers.
};
