// src/features/auth/auth.types.ts

import { JwtPayload as OriginalJwtPayload } from "jsonwebtoken";
import { SystemRole } from "../../types/express.d.js";

// --- Service Input DTOs (Data Transfer Objects) ---
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

// --- JWT & Database Types (Single Source of Truth) ---
export interface UserForToken {
  id: string;
  systemRole: SystemRole;
}

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

export interface RefreshToken {
  jti: string;
  user_id: string;
  expires_at: Date;
  revoked: boolean;
}
