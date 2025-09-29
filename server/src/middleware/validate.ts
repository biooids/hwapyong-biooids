// src/middleware/validate.ts

import { Request, Response, NextFunction } from "express";
import { ZodObject, ZodError } from "zod";
import { createHttpError } from "@/utils/error.factory.js";

/**
 * A middleware that validates the request against a provided Zod schema.
 * @param schema The Zod schema to validate against.
 */
export const validate =
  (schema: ZodObject<any>) =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const firstErrorMessage = error.issues[0]?.message || "Invalid input.";
        return next(createHttpError(400, firstErrorMessage));
      }
      next(createHttpError(500, "Internal Server Error during validation."));
    }
  };
