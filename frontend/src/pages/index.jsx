import Dashboard from "./Dashboard";
import OrgSetup from "./OrgSetup";
import AssetRegistry from "./AssetRegistry";
import Reports from "./Reports";
import { useAppData } from "../context/AppDataContext";

export function DashboardPage() {
  return <Dashboard />;
}

export function OrgSetupPage() {
  const {
    departments,
    categories,
    employees,
    refetchDepartments,
    refetchCategories,
    refetchEmployees,
  } = useAppData();

  return (
    <OrgSetup
      departments={departments}
      categories={categories}
      employees={employees}
      refetchDepartments={refetchDepartments}
      refetchCategories={refetchCategories}
      refetchEmployees={refetchEmployees}
    />
  );
}

export function AssetRegistryPage() {
  const { categories, departments } = useAppData();
  return <AssetRegistry categories={categories} departments={departments} />;
}

export function ReportsPage() {
  const { assets, departments } = useAppData();
  return <Reports assets={assets} departments={departments} />;
}
