// FILE: src/types/express.d.ts

// [REMOVED] - This import is for Prisma's auto-generated types, which no longer exist.
// import { SystemRole } from "@/prisma-client";

// [ADDED] - We now define the SystemRole enum manually.
// This gives you direct control over the roles in your application.
export enum SystemRole {
  USER = "USER",
  ADMIN = "ADMIN",
  SUPER_ADMIN = "SUPER_ADMIN",
}

// This line is important for declaration merging to work correctly.
export {};

// Define the shape of the user object that your authentication middleware will add to the request.
interface SanitizedUser {
  id: string;
  name: string;
  username: string;
  email: string;
  profileImage: string | null;
  bannerImage: string | null;
  systemRole: SystemRole; // This now correctly refers to the enum defined above
}

declare global {
  namespace Express {
    // Here, we are "merging" our custom user property into the global Express Request type.
    // This allows you to access `req.user` in your controllers with full type safety.
    interface Request {
      user?: SanitizedUser | null;
    }
  }
}
