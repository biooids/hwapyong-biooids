//src/middleware/validate.ts

import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";
import { createHttpError } from "../utils/error.factory.js";

/**
 * A middleware that validates the request against a provided Zod schema.
 * @param schema The Zod schema to validate against.
 */
export const validate =
  (schema: AnyZodObject) =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      // If validation is successful, pass control to the next middleware.
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        // --- FIX: Instead of sending a custom response, throw an HttpError. ---
        // We take the message from the FIRST validation error to keep it simple.
        const firstErrorMessage = error.errors[0]?.message || "Invalid input.";
        // The globalErrorHandler will now catch this and format it correctly.
        return next(createHttpError(400, firstErrorMessage));
      }
      // For any other unexpected errors, pass them to the global error handler.
      next(createHttpError(500, "Internal Server Error during validation."));
    }
  };
