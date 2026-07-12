import { api } from "./client";

export const getDashboardSummary = () => api("/dashboard/summary");
