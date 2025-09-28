// FILE: src/features/settings/settings.validation.ts

import { z } from "zod";
import { ThemePreference } from "./settings.types.js";

export const updateSettingsSchema = z.object({
  body: z.object({
    theme: z.nativeEnum(ThemePreference).optional(),
  }),
});
