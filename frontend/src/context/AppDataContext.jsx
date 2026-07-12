import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "../api/client";

const AppDataContext = createContext(null);

export function AppDataProvider({ children }) {
  const [assets, setAssets] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [assetsRes, deptsRes, catsRes, empsRes] = await Promise.all([
        api("/assets"),
        api("/departments"),
        api("/categories"),
        api("/employees"),
      ]);

      if (!assetsRes.ok) throw new Error(assetsRes.error || "Failed to load assets.");
      if (!deptsRes.ok) throw new Error(deptsRes.error || "Failed to load departments.");
      if (!catsRes.ok) throw new Error(catsRes.error || "Failed to load categories.");
      if (!empsRes.ok) throw new Error(empsRes.error || "Failed to load employees.");

      setAssets(Array.isArray(assetsRes.data) ? assetsRes.data : assetsRes.data?.items || []);
      setDepartments(deptsRes.data || []);
      setCategories(catsRes.data || []);
      setEmployees(empsRes.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const refetchDepartments = useCallback(async () => {
    const res = await api("/departments");
    if (res.ok) setDepartments(res.data || []);
    return res;
  }, []);

  const refetchCategories = useCallback(async () => {
    const res = await api("/categories");
    if (res.ok) setCategories(res.data || []);
    return res;
  }, []);

  const refetchEmployees = useCallback(async () => {
    const res = await api("/employees");
    if (res.ok) setEmployees(res.data || []);
    return res;
  }, []);

  const refetchAssets = useCallback(async () => {
    const res = await api("/assets");
    if (res.ok) setAssets(Array.isArray(res.data) ? res.data : res.data?.items || []);
    return res;
  }, []);

  return (
    <AppDataContext.Provider
      value={{
        assets,
        setAssets,
        departments,
        setDepartments,
        categories,
        setCategories,
        employees,
        setEmployees,
        loading,
        error,
        fetchAll,
        refetchDepartments,
        refetchCategories,
        refetchEmployees,
        refetchAssets,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  return useContext(AppDataContext);
}
