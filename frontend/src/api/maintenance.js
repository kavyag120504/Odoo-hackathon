import { api } from "./client";

export const listMaintenanceAssets = () => api("/maintenance/assets");
export const listMaintenanceRequests = () => api("/maintenance");
export const raiseMaintenanceRequest = (payload) =>
  api("/maintenance", { method: "POST", body: payload });
export const updateMaintenanceStatus = (id, payload) =>
  api(`/maintenance/${id}/status`, { method: "PATCH", body: payload });
