// src/config/index.ts

/**
 * Helper to get and validate environment variables.
 * Throws an error if a required variable is missing.
 */
const getEnvVariable = (key: string, required: boolean = true): string => {
  const value = process.env[key];
  if (!value && required) {
    throw new Error(
      `❌ Fatal Error: Missing required environment variable ${key}. Check your .env file or platform settings.`
    );
  }
  return value || "";
};

/**
 * Helper to get and validate environment variables as integers.
 * Throws an error for missing or invalid values.
 */
const getEnvVariableAsInt = (
  key: string,
  required: boolean = true,
  defaultValue?: number
): number => {
  const valueStr = process.env[key];

  if (!valueStr) {
    if (required && defaultValue === undefined) {
      throw new Error(
        `❌ Fatal Error: Missing required environment variable ${key}.`
      );
    }
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    // This case should ideally not be hit if required is true, but as a fallback.
    return NaN;
  }

  const intValue = parseInt(valueStr, 10);

  if (isNaN(intValue)) {
    throw new Error(
      `❌ Fatal Error: Invalid integer format for environment variable ${key}. Value: "${valueStr}"`
    );
  }
  return intValue;
};

// Define the structure of your configuration
interface Config {
  nodeEnv: "development" | "production" | "test";
  port: number;
  databaseUrl: string;
  corsOrigin: string;
  jwt: {
    accessSecret: string;
    accessExpiresInSeconds: number;
    refreshSecret: string;
    refreshExpiresInDays: number;
  };
  cloudinary: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
  };
  cookies: {
    refreshTokenName: string;
  };
  logLevel: string;
  frontendUrl: string;
  // ADDED: Optional properties for production-only services
  redisUrl?: string;
  databaseCa?: string;
}

let config: Config;

try {
  const nodeEnv = getEnvVariable("NODE_ENV", true) as
    | "development"
    | "production"
    | "test";

  config = {
    nodeEnv,
    port: getEnvVariableAsInt("PORT", true),
    databaseUrl: getEnvVariable("DATABASE_URL", true),
    corsOrigin: getEnvVariable("CORS_ORIGIN", true),
    jwt: {
      accessSecret: getEnvVariable("ACCESS_TOKEN_SECRET", true),
      accessExpiresInSeconds: getEnvVariableAsInt(
        "ACCESS_TOKEN_EXPIRES_IN_SECONDS",
        true
      ),
      refreshSecret: getEnvVariable("REFRESH_TOKEN_SECRET", true),
      refreshExpiresInDays: getEnvVariableAsInt(
        "REFRESH_TOKEN_EXPIRES_IN_DAYS",
        true
      ),
    },
    cloudinary: {
      cloudName: getEnvVariable("CLOUDINARY_CLOUD_NAME", true),
      apiKey: getEnvVariable("CLOUDINARY_API_KEY", true),
      apiSecret: getEnvVariable("CLOUDINARY_API_SECRET", true),
    },
    cookies: {
      refreshTokenName: "__Secure-refresh-token",
    },
    logLevel: getEnvVariable("LOG_LEVEL", false) || "info",
    frontendUrl: getEnvVariable("FRONTEND_URL", true),
  };

  if (nodeEnv === "production") {
    config.redisUrl = getEnvVariable("REDIS_URL", true);
    config.databaseCa = getEnvVariable("DATABASE_CA", false);
  }
} catch (error) {
  console.error(
    "❌ Critical error during application configuration setup:",
    error
  );
  process.exit(1);
}

export { config };
