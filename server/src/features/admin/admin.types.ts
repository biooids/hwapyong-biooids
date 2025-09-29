// src/features/admin/admin.types.ts
import { SystemRole } from "../../types/express.d.js";

export interface AdminDashboardStats {
  totalUsers: number;
}

export interface AdminApiQuery {
  page?: number;
  limit?: number;
  q?: string;
  sortBy?: "joined_at" | "name" | "email";
  order?: "asc" | "desc";
  filterByRole?: SystemRole;
}
