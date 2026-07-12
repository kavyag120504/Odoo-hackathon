const today = new Date();
export const daysAgo = (n) =>
  new Date(today.getTime() - n * 86400000).toISOString().slice(0, 10);
export const daysFromNow = (n) =>
  new Date(today.getTime() + n * 86400000).toISOString().slice(0, 10);

export const seedDepartments = [
  { id: "d1", name: "Engineering", head: "Priya Sharma", parent: null, status: "Active" },
  { id: "d2", name: "Engineering — QA", head: "Rahul Verma", parent: "d1", status: "Active" },
  { id: "d3", name: "Human Resources", head: "Ananya Iyer", parent: null, status: "Active" },
];

export const seedCategories = [
  { id: "c1", name: "Electronics", customField: "warranty_months" },
  { id: "c2", name: "Furniture", customField: "" },
  { id: "c3", name: "Vehicles", customField: "insurance_expiry" },
];

export const seedEmployees = [
  { id: "e1", name: "Priya Sharma", email: "priya.sharma@assetflow.com", department: "Engineering", role: "Department Head", status: "Active" },
  { id: "e2", name: "Rahul Verma", email: "rahul.verma@assetflow.com", department: "Engineering — QA", role: "Department Head", status: "Active" },
  { id: "e3", name: "Ananya Iyer", email: "ananya.iyer@assetflow.com", department: "Human Resources", role: "Department Head", status: "Active" },
  { id: "e4", name: "Karan Mehta", email: "karan.mehta@assetflow.com", department: "Engineering", role: "Asset Manager", status: "Active" },
  { id: "e5", name: "Neha Kulkarni", email: "neha.kulkarni@assetflow.com", department: "Engineering", role: "Employee", status: "Active" },
  { id: "e6", name: "Sameer Khan", email: "sameer.khan@assetflow.com", department: "Human Resources", role: "Employee", status: "Active" },
  { id: "e7", name: "Divya Nair", email: "divya.nair@assetflow.com", department: "Engineering — QA", role: "Employee", status: "Active" },
  { id: "e8", name: "Admin User", email: "admin@assetflow.com", department: "—", role: "Admin", status: "Active" },
];

export const seedAssets = [
  { id: "a1", tag: "AF-0001", name: "Dell Latitude 5440", category: "Electronics", serial: "DL5440-991", acquisitionDate: "2024-02-11", cost: 82000, condition: "Good", location: "Engineering Floor 2", department: "Engineering", qrCode: "QR-AF-0001-7F3A", isBookable: false, status: "Available", usageCount: 12, daysIdle: 4, nextMaintenanceDate: daysFromNow(45), expectedReturnDate: null },
  { id: "a2", tag: "AF-0002", name: 'MacBook Pro 14"', category: "Electronics", serial: "MBP14-220", acquisitionDate: "2023-11-02", cost: 165000, condition: "Good", location: "Engineering Floor 2", department: "Engineering", qrCode: "QR-AF-0002-9C1D", isBookable: false, status: "Allocated", usageCount: 40, daysIdle: 0, nextMaintenanceDate: daysFromNow(60), expectedReturnDate: daysAgo(6) },
  { id: "a3", tag: "AF-0003", name: "Conference Room Projector", category: "Electronics", serial: "PRJ-4471", acquisitionDate: "2022-08-19", cost: 54000, condition: "Fair", location: "HR Wing, Room B2", department: "Human Resources", qrCode: "QR-AF-0003-1E7B", isBookable: true, status: "Reserved", usageCount: 55, daysIdle: 0, nextMaintenanceDate: daysFromNow(20), expectedReturnDate: null },
  { id: "a4", tag: "AF-0004", name: "Herman Miller Aeron Chair", category: "Furniture", serial: "HMA-3302", acquisitionDate: "2023-01-05", cost: 45000, condition: "Good", location: "HR Wing", department: "Human Resources", qrCode: "QR-AF-0004-2B0F", isBookable: false, status: "Available", usageCount: 3, daysIdle: 58, nextMaintenanceDate: daysFromNow(120), expectedReturnDate: null },
  { id: "a5", tag: "AF-0005", name: "Toyota Innova (Fleet)", category: "Vehicles", serial: "TI-CRYSTA-09", acquisitionDate: "2021-06-30", cost: 1450000, condition: "Poor", location: "Basement Parking", department: "Engineering", qrCode: "QR-AF-0005-6A4C", isBookable: true, status: "Under Maintenance", usageCount: 88, daysIdle: 0, nextMaintenanceDate: daysFromNow(2), expectedReturnDate: null },
  { id: "a6", tag: "AF-0006", name: 'iPad Pro 12.9"', category: "Electronics", serial: "IPD-1290-77", acquisitionDate: "2022-03-14", cost: 98000, condition: "Fair", location: "Last seen: Engineering QA", department: "Engineering — QA", qrCode: "QR-AF-0006-4D8E", isBookable: false, status: "Lost", usageCount: 21, daysIdle: 0, nextMaintenanceDate: null, expectedReturnDate: null },
  { id: "a7", tag: "AF-0007", name: "Standing Desk", category: "Furniture", serial: "SD-2200", acquisitionDate: "2020-09-01", cost: 32000, condition: "Poor", location: "Storage", department: "Human Resources", qrCode: "QR-AF-0007-0F9A", isBookable: false, status: "Retired", usageCount: 9, daysIdle: 0, nextMaintenanceDate: null, expectedReturnDate: null },
  { id: "a8", tag: "AF-0008", name: "Server Rack Unit R1", category: "Electronics", serial: "SRV-R1-01", acquisitionDate: "2018-04-22", cost: 210000, condition: "Poor", location: "Decommissioned", department: "Engineering", qrCode: "QR-AF-0008-8B2C", isBookable: false, status: "Disposed", usageCount: 0, daysIdle: 0, nextMaintenanceDate: null, expectedReturnDate: null },
  { id: "a9", tag: "AF-0009", name: "Meeting Room Table (8-seat)", category: "Furniture", serial: "MRT-808", acquisitionDate: "2023-05-17", cost: 61000, condition: "Good", location: "Engineering QA Wing", department: "Engineering — QA", qrCode: "QR-AF-0009-3E5D", isBookable: true, status: "Available", usageCount: 2, daysIdle: 33, nextMaintenanceDate: daysFromNow(200), expectedReturnDate: null },
  { id: "a10", tag: "AF-0010", name: "Honda City (Fleet)", category: "Vehicles", serial: "HC-2022-14", acquisitionDate: "2022-01-10", cost: 1120000, condition: "Good", location: "Basement Parking", department: "Human Resources", qrCode: "QR-AF-0010-5C6F", isBookable: true, status: "Allocated", usageCount: 64, daysIdle: 0, nextMaintenanceDate: daysFromNow(15), expectedReturnDate: daysFromNow(9) },
  { id: "a11", tag: "AF-0011", name: "Wireless Mic Set", category: "Electronics", serial: "WMS-410", acquisitionDate: "2023-09-09", cost: 18000, condition: "Good", location: "HR Wing, Room B2", department: "Human Resources", qrCode: "QR-AF-0011-7A1B", isBookable: true, status: "Reserved", usageCount: 30, daysIdle: 0, nextMaintenanceDate: daysFromNow(90), expectedReturnDate: null },
  { id: "a12", tag: "AF-0012", name: "Ergonomic Keyboard", category: "Electronics", serial: "EKB-500", acquisitionDate: "2024-06-01", cost: 6500, condition: "Good", location: "Engineering Floor 2", department: "Engineering", qrCode: "QR-AF-0012-9F2E", isBookable: false, status: "Available", usageCount: 1, daysIdle: 71, nextMaintenanceDate: daysFromNow(300), expectedReturnDate: null },
];

export const activityLog = [
  { actor: "Karan Mehta", action: "allocated", entity: 'AF-0002 · MacBook Pro 14"', time: "Today, 9:12 AM" },
  { actor: "System", action: "flagged an overdue return on", entity: 'AF-0002 · MacBook Pro 14"', time: "Today, 8:00 AM" },
  { actor: "Rahul Verma", action: "raised a maintenance request for", entity: "AF-0005 · Toyota Innova", time: "Yesterday, 4:41 PM" },
  { actor: "Admin User", action: "promoted Karan Mehta to", entity: "Asset Manager", time: "Yesterday, 11:03 AM" },
  { actor: "Ananya Iyer", action: "approved a booking for", entity: "AF-0011 · Wireless Mic Set", time: "2 days ago" },
  { actor: "System", action: "auto-flipped audit item to Lost:", entity: 'AF-0006 · iPad Pro 12.9"', time: "3 days ago" },
];

export const maintenanceTrend = [
  { month: "Feb", requests: 3 },
  { month: "Mar", requests: 5 },
  { month: "Apr", requests: 2 },
  { month: "May", requests: 6 },
  { month: "Jun", requests: 4 },
  { month: "Jul", requests: 7 },
];

export const STATUS_OPTIONS = ["Available", "Allocated", "Reserved", "Under Maintenance", "Lost", "Retired", "Disposed"];
export const CONDITION_OPTIONS = ["New", "Good", "Fair", "Poor"];

export function nextTag(assets) {
  const max = assets.reduce((m, a) => {
    const n = parseInt(a.tag.split("-")[1], 10);
    return isNaN(n) ? m : Math.max(m, n);
  }, 0);
  return `AF-${String(max + 1).padStart(4, "0")}`;
}

export function makeQr(tag) {
  const rand = Math.random().toString(16).slice(2, 6).toUpperCase();
  return `QR-${tag}-${rand}`;
}

export function downloadCSV(rows, filename) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(",")]
    .concat(rows.map((r) => headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(",")))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
