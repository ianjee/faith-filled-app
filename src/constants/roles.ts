import type { UserRole } from "@/types/database.types";

export const ROLES = {
  OWNER: "owner",
  ADMIN: "admin",
  THERAPIST: "therapist",
  CLIENT: "client",
} as const satisfies Record<string, UserRole>;

/** Landing route for each role right after login. */
export const HOME_ROUTE_BY_ROLE: Record<UserRole, string> = {
  owner: "/admin/dashboard",
  admin: "/admin/dashboard",
  therapist: "/therapist/dashboard",
  client: "/client/dashboard",
};

export function canManageClinic(role: UserRole): boolean {
  return role === "owner" || role === "admin";
}
