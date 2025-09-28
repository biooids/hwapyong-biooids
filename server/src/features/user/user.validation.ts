// src/features/user/user.validation.ts

import { z } from "zod";

// --- FIX: The schema now directly defines the shape of req.body ---
export const updateUserProfileSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name cannot be empty").optional(),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .optional(),
    bio: z.string().max(250, "Bio cannot exceed 250 characters").optional(),
    title: z.string().max(100).optional(),
    location: z.string().max(100).optional(),
  }),
});
