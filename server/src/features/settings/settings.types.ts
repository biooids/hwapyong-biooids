// FILE: src/features/settings/settings.types.ts

export enum ThemePreference {
  LIGHT = "LIGHT",
  DARK = "DARK",
  SYSTEM = "SYSTEM",
}

export interface UpdateUserSettingsDto {
  theme?: ThemePreference;
}
