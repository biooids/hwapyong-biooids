// FILE: src/features/settings/settings.service.ts

import { logger } from "../../config/logger.js";
import { query } from "../../db/index.js";
import { UpdateUserSettingsDto, ThemePreference } from "./settings.types.js";
export interface UserSettings {
  id: string;
  theme: ThemePreference;
  notifications_enabled: boolean;
  email_marketing: boolean;
  email_social: boolean;
  updated_at: Date;
  user_id: string;
}

class SettingsService {
  public async getUserSettings(userId: string): Promise<UserSettings> {
    // [MODIFIED] - Replaced prisma.userSettings.findUnique with a direct SQL SELECT.
    const findSql = 'SELECT * FROM "user_settings" WHERE "user_id" = $1';
    const findResult = await query<UserSettings>(findSql, [userId]);
    let settings = findResult.rows[0];

    // If no settings exist, create them with default values, mimicking the original logic.
    if (!settings) {
      logger.info(
        { userId },
        "No settings found for user, creating default settings."
      );
      const createSql =
        'INSERT INTO "user_settings" ("user_id") VALUES ($1) RETURNING *';
      const createResult = await query<UserSettings>(createSql, [userId]);
      settings = createResult.rows[0];
    }

    return settings;
  }

  public async updateUserSettings(
    userId: string,
    data: UpdateUserSettingsDto
  ): Promise<UserSettings> {
    // [MODIFIED] - This block dynamically builds the fields for an INSERT ... ON CONFLICT (upsert) query.
    const fields = Object.keys(data) as (keyof UpdateUserSettingsDto)[];
    const values = fields.map((field) => data[field]);
    const fieldNames = fields.map((field) => `"${field}"`).join(", ");
    const valuePlaceholders = fields.map((_, i) => `$${i + 2}`).join(", ");
    const setClauses = fields
      .map((field) => `"${field}" = EXCLUDED."${field}"`)
      .join(", ");

    const upsertSql = `
      INSERT INTO "user_settings" ("user_id", ${fieldNames})
      VALUES ($1, ${valuePlaceholders})
      ON CONFLICT ("user_id")
      DO UPDATE SET ${setClauses}
      RETURNING *;
    `;

    const result = await query<UserSettings>(upsertSql, [userId, ...values]);
    const updatedSettings = result.rows[0];

    logger.info({ userId, ...data }, "User settings updated successfully.");
    return updatedSettings;
  }
}

export const settingsService = new SettingsService();
