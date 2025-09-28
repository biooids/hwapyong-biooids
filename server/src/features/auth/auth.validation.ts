// FILE: src/features/auth/auth.validation.ts

import { z } from "zod";

export const signupSchema = z.object({
  body: z.object({
    email: z.string().email("Please enter a valid email address."),
    username: z.string().min(3, "Username must be at least 3 characters long."),
    password: z.string().min(8, "Password must be at least 8 characters long."),
    name: z.string().min(1, "Your name is required."),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string()
      .min(1, "Email is required.")
      .email("Please enter a valid email address."),
    password: z.string().min(1, "Password is required."),
  }),
});

export const changePasswordSchema = z.object({
  body: z
    .object({
      currentPassword: z
        .string()
        .min(1, "You must enter your current password."),
      newPassword: z
        .string()
        .min(8, "Your new password must be at least 8 characters long."),
    })
    .refine((data) => data.currentPassword !== data.newPassword, {
      message: "New password must be different from your current password.",
      path: ["newPassword"],
    }),
});
