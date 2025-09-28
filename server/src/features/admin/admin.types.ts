// FILE: client/src/lib/features/admin/adminTypes.ts (Corrected)

export enum SystemRole {
  USER = "USER",
  SYSTEM_CONTENT_CREATOR = "SYSTEM_CONTENT_CREATOR",
  DEVELOPER = "DEVELOPER",
  SUPER_ADMIN = "SUPER_ADMIN",
}

export interface AdminDashboardStats {
  totalUsers: number;
}

export interface AdminUserRow {
  id: string;
  name: string;
  username: string;
  email: string;
  profileImage: string | null;
  systemRole: SystemRole;
  joinedAt: string;
  // --- FIX: Removed the _count property as it's no longer sent by the backend ---
}

export interface AdminApiQuery {
  page?: number;
  limit?: number;
  q?: string;
  sortBy?: "name" | "username" | "email" | "joinedAt";
  order?: "asc" | "desc";
  filterByRole?: SystemRole;
}

export interface PaginationInfo {
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

export interface GetAdminStatsResponse {
  status: string;
  data: AdminDashboardStats;
}

export interface GetAdminUsersResponse {
  status: string;
  data: {
    users: AdminUserRow[];
    pagination: PaginationInfo;
  };
}
