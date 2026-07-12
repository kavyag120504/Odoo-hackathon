import { api } from "./client";

export const listNotifications = (category) =>
  api(`/notifications${category && category !== "All" ? `?category=${category}` : ""}`);
export const unreadCount = () => api("/notifications/unread-count");
export const markNotificationRead = (id) => api(`/notifications/${id}/read`, { method: "PATCH" });
export const markAllNotificationsRead = () => api("/notifications/read-all", { method: "PATCH" });
export const listActivityLog = (limit = 50) => api(`/activity-log?limit=${limit}`);
