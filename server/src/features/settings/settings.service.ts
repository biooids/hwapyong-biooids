// src/features/settings/settings.service.ts

import { logger } from "../../config/logger.js";
import { transaction } from "../../db/index.js"; // Import transaction utility
import { UpdateUserSettingsDto, UserSettings } from "./settings.types.js"; // Import all types

class SettingsService {
  public async getUserSettings(userId: string): Promise<UserSettings> {
    // Wrap the "get-or-create" logic in a transaction to prevent race conditions.
    return transaction(async (client) => {
      const findSql = 'SELECT * FROM "user_settings" WHERE "user_id" = $1';
      const findResult = await client.query<UserSettings>(findSql, [userId]);
      let settings = findResult.rows[0];

      if (!settings) {
        logger.info(
          { userId },
          "No settings found for user, creating default settings."
        );
        const createSql =
          'INSERT INTO "user_settings" ("user_id") VALUES ($1) RETURNING *';
        const createResult = await client.query<UserSettings>(createSql, [
          userId,
        ]);
        settings = createResult.rows[0];
      }

      return settings;
    });
  }

  public async updateUserSettings(
    userId: string,
    data: UpdateUserSettingsDto
  ): Promise<UserSettings> {
    // This upsert query is already atomic and highly efficient. No changes needed.
    const fields = Object.keys(data) as (keyof UpdateUserSettingsDto)[];
    if (fields.length === 0) {
      return this.getUserSettings(userId);
    }
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

    // The query utility is fine here as it's a single, atomic operation.
    const result = await query<UserSettings>(upsertSql, [userId, ...values]);
    const updatedSettings = result.rows[0];

    logger.info({ userId, ...data }, "User settings updated successfully.");
    return updatedSettings;
  }
}

export const settingsService = new SettingsService();
