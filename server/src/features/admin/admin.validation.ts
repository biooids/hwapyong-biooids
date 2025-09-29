// src/features/admin/admin.validation.ts
import { z } from "zod";
import { SystemRole } from "@/types/express.d.js";

export const updateUserRoleSchema = z.object({
  body: z.object({
    role: z.enum(Object.values(SystemRole) as [string, ...string[]], {
      error: "Invalid role provided.",
    }),
  }),
  params: z.object({
    id: z.uuid({ message: "Invalid user ID format." }),
  }),
});

export const deleteUserParamsSchema = z.object({
  params: z.object({
    id: z.uuid({ message: "Invalid user ID format." }),
  }),
});
