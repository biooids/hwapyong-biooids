// src/features/settings/settings.types.ts

export enum ThemePreference {
  LIGHT = "LIGHT",
  DARK = "DARK",
  SYSTEM = "SYSTEM",
}

/**
 * Represents the full UserSettings object, matching the database schema.
 */
export interface UserSettings {
  id: string;
  theme: ThemePreference;
  updated_at: Date;
  user_id: string;
}

/**
 * Represents the data shape for updating a user's settings.
 */
export interface UpdateUserSettingsDto {
  theme?: ThemePreference;
}
