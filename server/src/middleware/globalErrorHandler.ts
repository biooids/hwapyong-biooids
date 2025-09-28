// FILE 3: src/middleware/globalErrorHandler.ts

import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { MulterError } from "multer";
import { config } from "../config/index.js";
import { HttpError } from "../utils/HttpError.js";
import { logger } from "../config/logger.js";

// A small type guard to help TypeScript identify errors from the 'pg' driver
interface PgError extends Error {
  code?: string;
}

export const globalErrorHandler: ErrorRequestHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = "An internal server error occurred.";
  let status = "error";

  // The first step is to always log the raw error for debugging purposes.
  logger.error({ err }, "💥 Global Error Handler Caught");

  // --- Specific Error Type Handling ---

  // 1. Handle custom, predictable application errors (e.g., "Not Found")
  if (err instanceof HttpError) {
    statusCode = err.statusCode;
    message = err.message;
    status = statusCode < 500 ? "fail" : "error";

    // 2. Handle errors from the PostgreSQL ('pg') driver
  } else if (err instanceof Error && "code" in err) {
    const pgErr = err as PgError;
    // We check for specific, known database error codes
    switch (pgErr.code) {
      case "23505": // unique_violation
        statusCode = 409; // Conflict
        message = "A record with this value already exists.";
        status = "fail";
        break;
      case "23503": // foreign_key_violation
        statusCode = 400; // Bad Request
        message = "The operation violates a data integrity constraint.";
        status = "fail";
        break;
      case "22P02": // invalid_text_representation (e.g., bad UUID format)
        statusCode = 400; // Bad Request
        message = "A provided value has an invalid format.";
        status = "fail";
        break;
      default:
        // For other, less common database errors, we use a generic message.
        message = "A database error occurred.";
        break;
    }

    // 3. Handle errors from Multer (file uploads)
  } else if (err instanceof MulterError) {
    statusCode = 400; // Bad Request
    status = "fail";
    switch (err.code) {
      case "LIMIT_FILE_SIZE":
        message = "The uploaded file is too large.";
        break;
      case "LIMIT_UNEXPECTED_FILE":
        message = "An unexpected file was uploaded.";
        break;
      default:
        message = "A file upload error occurred.";
        break;
    }

    // 4. Handle errors from the 'jsonwebtoken' library
  } else if (err instanceof TokenExpiredError) {
    statusCode = 401; // Unauthorized
    message = "Your session has expired. Please log in again.";
    status = "fail";
  } else if (err instanceof JsonWebTokenError) {
    statusCode = 401; // Unauthorized
    message = "Invalid session. Please log in again.";
    status = "fail";
  }

  // --- Final JSON Response ---
  // This structure is sent back to the client for any error.
  const responsePayload: { status: string; message: string; stack?: string } = {
    status,
    message,
  };

  // In development mode, we add the error stack trace for easier debugging.
  // We NEVER send the stack trace in production for security reasons.
  if (config.nodeEnv === "development" && err instanceof Error && err.stack) {
    responsePayload.stack = err.stack;
  }

  res.status(statusCode).json(responsePayload);
};
