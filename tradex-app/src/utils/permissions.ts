import type { UserProfile } from "../utils/dashboardHelpers";

/** All available permission keys — keep in sync with backend Permission.java */
export const ALL_PERMISSIONS = [
  "MANAGE_USERS",
  "MANAGE_POINTS",
  "MANAGE_DEPOSITS",
  "MANAGE_WITHDRAWALS",
  "MANAGE_SETTINGS",
] as const;

export type PermissionKey = (typeof ALL_PERMISSIONS)[number];

/** Human-readable labels for permissions */
export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  MANAGE_USERS: "User Management",
  MANAGE_POINTS: "Points Management",
  MANAGE_DEPOSITS: "Approve/Reject Deposits",
  MANAGE_WITHDRAWALS: "Approve/Reject Withdrawals",
  MANAGE_SETTINGS: "System Settings",
};

/** Human-readable labels for routing support tickets (max 2 words) */
export const ROUTE_QUEUE_LABELS: Record<string, string> = {
  MANAGE_USERS: "User Ops",
  MANAGE_POINTS: "Points Team",
  MANAGE_DEPOSITS: "Deposit Review",
  MANAGE_WITHDRAWALS: "Withdrawal Review",
  MANAGE_SETTINGS: "System Config",
};

/**
 * Check if a user has a specific permission.
 * SUPER_ADMIN has all permissions implicitly.
 */
export function hasPermission(user: UserProfile | null | undefined, perm: PermissionKey): boolean {
  if (!user) return false;
  if (user.role === "SUPER_ADMIN") return true;
  if (user.role !== "EMPLOYEE") return false;
  return user.permissions?.includes(perm) ?? false;
}

/**
 * Check if a user is admin-like (SUPER_ADMIN or EMPLOYEE).
 */
export function isAdminRole(user: UserProfile | null | undefined): boolean {
  if (!user) return false;
  return user.role === "SUPER_ADMIN" || user.role === "EMPLOYEE";
}

/**
 * Check if user has any of the given permissions.
 */
export function hasAnyPermission(user: UserProfile | null | undefined, perms: PermissionKey[]): boolean {
  return perms.some((p) => hasPermission(user, p));
}
