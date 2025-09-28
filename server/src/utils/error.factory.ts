// FILE 2: src/utils/error.factory.ts

import { HttpError } from "./HttpError.js";

/**
 * Factory function to create HttpError instances.
 * @param statusCode - The HTTP status code.
 * @param message - The error message.
 * @returns An instance of HttpError.
 */
export const createHttpError = (
  statusCode: number,
  message: string
): HttpError => {
  return new HttpError(statusCode, message);
};
