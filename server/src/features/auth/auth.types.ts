// FILE: src/features/auth/auth.types.ts

import { JwtPayload as OriginalJwtPayload } from "jsonwebtoken";
// [MODIFIED] - Import the manually defined SystemRole enum from your global types file.
import { SystemRole } from "../../types/express.d.js";

// [REMOVED] - The import from Prisma's generated client is no longer needed.
// import { SystemRole } from "@/prisma-client";

// --- JWT Payloads ---
export interface DecodedAccessTokenPayload {
  id: string;
  systemRole: SystemRole;
  type: "access";
  iat: number;
  exp: number;
}

export interface DecodedRefreshTokenPayload extends OriginalJwtPayload {
  id: string;
  jti: string;
  type: "refresh";
}

// --- Service Input DTOs (Data Transfer Objects) ---
// These remain unchanged as they define the shape of API inputs.
export interface SignUpInputDto {
  email: string;
  username: string;
  password: string;
  name: string;
}

export interface LoginInputDto {
  email: string;
  password: string;
}

export interface RefreshTokenInputDto {
  incomingRefreshToken: string;
}

export interface LogoutInputDto {
  incomingRefreshToken?: string;
}

export interface ChangePasswordInputDto {
  currentPassword: string;
  newPassword: string;
}

// --- Service Output DTOs ---
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}
