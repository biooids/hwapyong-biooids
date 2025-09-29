// src/features/admin/admin.validation.ts
import { z } from "zod";
import { SystemRole } from "../../types/express.d.js";

export const updateUserRoleSchema = z.object({
  body: z.object({
    role: z.nativeEnum(SystemRole, {
      errorMap: () => ({ message: "Invalid role provided." }),
    }),
  }),
  params: z.object({
    id: z.string().uuid("Invalid user ID format."),
  }),
});

export const deleteUserParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid user ID format."),
  }),
});
