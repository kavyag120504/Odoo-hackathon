// Single source of truth for the left nav. Every screen lives here; `roles`
// restricts visibility (undefined = all authenticated users). The mockup keeps
// the SAME nav on every screen — items just differ by role. Teammates add their
// screen's route here and drop the page into App.jsx.

export const ROLES = {
  EMPLOYEE: "Employee",
  DEPARTMENT_HEAD: "Department Head",
  ASSET_MANAGER: "Asset Manager",
  ADMIN: "Admin",
};

const MANAGERS = [ROLES.ASSET_MANAGER, ROLES.ADMIN, ROLES.DEPARTMENT_HEAD];

export const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: "▦", owner: "C" },
  { to: "/assets", label: "Asset Registry", icon: "▤", owner: "C" },
  { to: "/allocation", label: "Allocation & Transfer", icon: "⇄", owner: "A" },
  { to: "/booking", label: "Resource Booking", icon: "◷", owner: "B" },
  { to: "/maintenance", label: "Maintenance", icon: "⚒", owner: "D" },
  { to: "/audit", label: "Audit", icon: "☑", owner: "A", roles: MANAGERS },
  { to: "/reports", label: "Reports", icon: "▧", owner: "C", roles: MANAGERS },
  { to: "/org", label: "Org Setup", icon: "⚙", owner: "C", roles: [ROLES.ADMIN] },
  { to: "/notifications", label: "Notifications", icon: "◉", owner: "D" },
];

export function visibleNav(role) {
  return NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role));
}

export function canAccess(role, path) {
  const item = NAV_ITEMS.find((i) => i.to === path);
  if (!item) return true;
  return !item.roles || item.roles.includes(role);
}
