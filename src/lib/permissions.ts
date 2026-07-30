// ---------------------------------------------------------------------------
// Auto Dude Command Center — roles, page access, capabilities.
// Enforcement model (per architecture decision): authorization happens in the
// API layer via requireRole() using the service-role key. Technician queries
// are additionally scoped to their own assignments in the *Db.ts helpers.
// RLS is enabled deny-all as defense-in-depth; auth.uid() policies are shipped
// in schema.sql for a future direct-client mode but are not the primary gate.
// ---------------------------------------------------------------------------

export type Role = "Admin" | "Manager" | "Technician";

export const ROLES: Role[] = ["Admin", "Manager", "Technician"];

export interface Profile {
  id: string;               // = auth.users.id
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: Role;
  avatar_url: string;
  is_active: boolean;
  // convenience (joined from technicians when role === "Technician")
  technician_id?: string | null;
}

export function fullName(p: Pick<Profile, "first_name" | "last_name"> | null | undefined): string {
  if (!p) return "";
  return `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim();
}

// --- admin / manager pages (desktop command center) ---
const ADMIN_PAGES = [
  "/", "/jobs", "/schedule", "/leads", "/marketing",
  "/maintenance", "/customers", "/technicians", "/reports", "/settings",
];
// manager: everything except settings (no app config / admin-user management)
const MANAGER_PAGES = ADMIN_PAGES.filter((p) => p !== "/settings");
// technician mobile app (namespaced under /t to avoid colliding with admin routes)
const TECH_PAGES = ["/t/today", "/t/schedule", "/t/jobs", "/t/profile"];

export const ROLE_PAGES: Record<Role, string[]> = {
  Admin: ADMIN_PAGES,
  Manager: MANAGER_PAGES,
  Technician: TECH_PAGES,
};

/** Where each role goes after login / when they hit a page they can't open. */
const LANDING: Record<Role, string> = {
  Admin: "/",
  Manager: "/",
  Technician: "/t/today",
};
export function landingPage(role: Role | undefined): string {
  return role ? (LANDING[role] ?? "/") : "/";
}

export function canAccessPage(role: Role | undefined, path: string): boolean {
  if (!role) return false;
  const pages = ROLE_PAGES[role] ?? [];
  return pages.some((p) => (p === "/" ? path === "/" : path === p || path.startsWith(p + "/")));
}

export function isTechRole(role: Role | undefined): boolean {
  return role === "Technician";
}

// --- capabilities (fine-grained action gates) ---
export type Capability =
  | "createJob" | "editJob" | "deleteJob" | "assignTechnician" | "reschedule"
  | "viewFinancials" | "viewMarketing" | "viewLeads"
  | "manageTechnicians" | "manageSettings" | "manageUsers";

const CAPS: Record<Capability, Role[]> = {
  createJob: ["Admin", "Manager"],
  editJob: ["Admin", "Manager"],
  deleteJob: ["Admin"],
  assignTechnician: ["Admin", "Manager"],
  reschedule: ["Admin", "Manager"],
  viewFinancials: ["Admin", "Manager"],
  viewMarketing: ["Admin", "Manager"],
  viewLeads: ["Admin", "Manager"],
  manageTechnicians: ["Admin"],
  manageSettings: ["Admin"],
  manageUsers: ["Admin"],
};

export function can(role: Role | undefined, capability: Capability): boolean {
  if (!role) return false;
  return (CAPS[capability] ?? []).includes(role);
}

// --- role groupings used by API guards ---
export const ADMIN_MANAGER: Role[] = ["Admin", "Manager"];
export const ALL_ROLES: Role[] = ["Admin", "Manager", "Technician"];
