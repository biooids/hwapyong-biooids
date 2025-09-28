// FILE: src/server.ts

// --- Core Node.js and Application Imports ---
import http from "http";
import app from "./app.js"; // This imports your main Express application setup from app.ts
import { config } from "./config/index.js"; // Your centralized configuration
import { logger } from "./config/logger.js"; // Your centralized pino logger
import { disconnectDb, connectDb } from "./db/index.js"; // Your database connection utilities

// [FUTURE] Uncomment these lines when you are ready to add WebSocket functionality.
// import { socketManager } from "./websockets/socketManager.js";

// --- Server Initialization ---

// Get the port from the validated configuration object.
const PORT = config.port;

// Create an HTTP server using Node's built-in 'http' module.
// The Express 'app' is passed as the request handler.
const httpServer = http.createServer(app);

// [FUTURE] This will initialize your WebSocket server on top of the HTTP server.
// socketManager.initialize(httpServer);

// A flag to prevent the shutdown process from running multiple times.
let isShuttingDown = false;

/**
 * The main startup function for the application.
 * It ensures a database connection is established before the server starts listening for requests.
 */
async function startServer() {
  try {
    // Attempt to connect to the database, with built-in retry logic.
    // This is a critical step; the server will not start if the DB is unavailable.
    await connectDb();

    // If the database connection is successful, start the HTTP server.
    httpServer.listen(PORT, () => {
      logger.info(`🚀 Server listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    // If connectDb() exhausts its retries, it will throw an error.
    // We log this as a fatal error and exit the process, as the app cannot run.
    logger.fatal(
      { err: error },
      "❌ Failed to start server due to database connection failure."
    );
    process.exit(1);
  }
}

/**
 * Handles the graceful shutdown of the server and its resources.
 * This function is designed to close connections cleanly without interrupting active requests.
 * @param signalSource - The signal or event that triggered the shutdown (e.g., 'SIGINT').
 */
const performGracefulShutdown = async (signalSource: string) => {
  // Prevent the shutdown sequence from running multiple times if signals are received in quick succession.
  if (isShuttingDown) {
    logger.warn(
      `[Shutdown] Already in progress (triggered by ${signalSource}).`
    );
    return;
  }
  isShuttingDown = true;
  logger.info(`👋 Received ${signalSource}, shutting down gracefully...`);

  // A failsafe timer. If the shutdown process hangs, force exit after 10 seconds.
  const shutdownTimeout = setTimeout(() => {
    logger.error("⚠️ Graceful shutdown timed out (10s), forcing exit.");
    process.exit(1);
  }, 10000);

  try {
    // --- Shutdown Sequence ---
    // The order is important: stop accepting new connections first, then close existing ones.

    // [FUTURE] Close all active WebSocket connections.
    // await socketManager.close();

    // 1. Close the HTTP server to stop it from accepting new connections.
    logger.info("🔌 Closing HTTP server...");
    await new Promise<void>((resolve) => {
      httpServer.close((err?: Error & { code?: string }) => {
        if (err) {
          // This handles the rare edge case where the server might already be closed.
          if (err.code === "ERR_SERVER_NOT_RUNNING") {
            logger.warn("⚠️ HTTP server was already not running or closed.");
          } else {
            logger.error({ err }, "❌ Error closing HTTP server");
          }
        } else {
          logger.info("✅ HTTP server closed.");
        }
        // We resolve the promise regardless of the error to allow the shutdown to continue.
        resolve();
      });
    });

    // 2. Disconnect from the database.
    await disconnectDb();

    // If all steps complete successfully, clear the failsafe timer and exit cleanly.
    clearTimeout(shutdownTimeout);
    logger.info("🚪 All services closed successfully. Exiting process...");
    process.exit(0);
  } catch (error: any) {
    // If any part of the shutdown sequence fails, log the error and force exit.
    clearTimeout(shutdownTimeout);
    logger.fatal({ err: error }, "❌ Error during graceful shutdown sequence");
    process.exit(1);
  }
};

/**
 * A handler for critical, unrecoverable errors.
 * It logs the error as fatal and initiates a graceful shutdown.
 * @param errorType - A string describing the type of error (e.g., 'UNHANDLED REJECTION').
 * @param error - The actual error object.
 */
const criticalErrorHandler = (errorType: string, error: Error | any) => {
  logger.fatal(
    { err: error },
    `💥 ${errorType}! Attempting graceful shutdown...`
  );
  // We only initiate a shutdown if one isn't already in progress.
  if (!isShuttingDown) {
    performGracefulShutdown(errorType);
  }
};

// --- Process Signal and Error Listeners ---
// These listeners ensure the application can be shut down gracefully and safely.

// Listen for standard termination signals sent by process managers or Ctrl+C.
const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];
signals.forEach((signal) => {
  process.on(signal, () => performGracefulShutdown(signal));
});

// Listen for promise rejections that were not caught with a .catch() block.
process.on("unhandledRejection", (reason) => {
  criticalErrorHandler("UNHANDLED REJECTION", reason);
});

// Listen for exceptions that were not caught with a try...catch block.
process.on("uncaughtException", (err) => {
  criticalErrorHandler("UNCAUGHT EXCEPTION", err);
});

// --- Start the Application ---
// This is the final call that kicks off the entire process.
startServer();
