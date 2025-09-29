// src/features/auth/auth.utils.ts

import bcrypt from "bcryptjs";
import { logger } from "../../config/logger.js";

// Centralize the salt rounds for consistency and easy updates.
const SALT_ROUNDS = 10;

/**
 * Hashes a plaintext password using bcrypt.
 * @param plaintextPassword The password to hash.
 * @returns A promise that resolves to the hashed password.
 */
export const hashPassword = async (
  plaintextPassword: string
): Promise<string> => {
  try {
    const hashedPassword = await bcrypt.hash(plaintextPassword, SALT_ROUNDS);
    return hashedPassword;
  } catch (error) {
    logger.error({ err: error }, "Error during password hashing.");
    throw new Error("Could not process password.");
  }
};

/**
 * Compares a plaintext password with a hashed password.
 * @param plaintextPassword The password provided by the user.
 * @param hashedPassword The hash stored in the database.
 * @returns A promise that resolves to true if the passwords match, false otherwise.
 */
export const comparePassword = async (
  plaintextPassword: string,
  hashedPassword: string
): Promise<boolean> => {
  try {
    const isMatch = await bcrypt.compare(plaintextPassword, hashedPassword);
    return isMatch;
  } catch (error) {
    logger.error({ err: error }, "Error during password comparison.");
    // Fail securely: if comparison throws an error, assume passwords do not match.
    return false;
  }
};
