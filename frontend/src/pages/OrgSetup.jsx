import { useState } from "react";
import { Plus, X } from "lucide-react";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { THEME, fontImport } from "../data/theme";
import {
  Card,
  Pill,
  StatusPill,
  PrimaryButton,
  GhostButton,
  Field,
  ErrorBanner,
  inputStyle,
  inputClass,
} from "../components/ui";

/* ── Departments Tab ─────────────────────────────────────── */
function DepartmentsTab({ departments, employees, refetch }) {
  const { user: currentUser } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [banner, setBanner] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", parent_id: "" });
  const [fieldErrors, setFieldErrors] = useState({});

  const isAdmin = currentUser?.role === "Admin";

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Department name is required.";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const addDepartment = async () => {
    if (!validate()) return;
    setSaving(true);
    setBanner(null);
    const res = await api("/departments", {
      method: "POST",
      body: {
        name: form.name.trim(),
        parent_id: form.parent_id ? Number(form.parent_id) : null,
      },
    });
    if (res.ok) {
      setForm({ name: "", parent_id: "" });
      setShowForm(false);
      await refetch();
    } else {
      setBanner(res.error);
    }
    setSaving(false);
  };

  const deactivate = async (dept) => {
    setBanner(null);
    const res = await api(`/departments/${dept.id}`, {
      method: "PATCH",
      body: { status: "Inactive" },
    });
    if (res.ok) {
      await refetch();
    } else {
      setBanner(res.error);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: `${THEME.soft}bb` }}>
          Create, edit, and deactivate departments. Deactivating checks for dependents first.
        </p>
        {isAdmin && (
          <PrimaryButton onClick={() => setShowForm(true)}>
            <span className="flex items-center gap-1">
              <Plus size={16} /> Add department
            </span>
          </PrimaryButton>
        )}
      </div>

      <ErrorBanner message={banner} onDismiss={() => setBanner(null)} />

      {showForm && (
        <Card>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Name" error={fieldErrors.name}>
              <input
                className={inputClass}
                style={inputStyle}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Finance"
              />
            </Field>
            <Field label="Parent department (optional)">
              <select
                className={inputClass}
                style={inputStyle}
                value={form.parent_id}
                onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
              >
                <option value="">None</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </Field>
            <div className="flex items-end gap-2">
              <PrimaryButton onClick={addDepartment} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </PrimaryButton>
              <GhostButton
                onClick={() => {
                  setShowForm(false);
                  setFieldErrors({});
                }}
              >
                Cancel
              </GhostButton>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <table className="w-full text-left text-sm">
          <thead>
            <tr style={{ color: THEME.sand }}>
              <th className="pb-3 font-medium">Name</th>
              <th className="pb-3 font-medium">Parent</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {departments.map((d) => (
              <tr key={d.id} style={{ borderTop: `1px solid ${THEME.bronze}33` }}>
                <td className="py-3 font-medium" style={{ color: THEME.white }}>
                  {d.name}
                </td>
                <td className="py-3" style={{ color: THEME.soft }}>
                  {departments.find((p) => p.id === d.parent_id)?.name || "—"}
                </td>
                <td className="py-3">
                  <StatusPill status={d.status} />
                </td>
                <td className="py-3 text-right">
                  {!isAdmin ? (
                    <span className="text-xs" style={{ color: `${THEME.soft}55` }}>
                      Admin only
                    </span>
                  ) : d.status === "Active" ? (
                    <button
                      className="text-xs font-semibold"
                      style={{ color: THEME.danger }}
                      onClick={() => deactivate(d)}
                    >
                      Deactivate
                    </button>
                  ) : (
                    <span className="text-xs" style={{ color: `${THEME.soft}66` }}>
                      Inactive
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/* ── Categories Tab ──────────────────────────────────────── */
function CategoriesTab({ categories, refetch }) {
  const { user: currentUser } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [banner, setBanner] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", customFieldKey: "", customFieldValue: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const isAdmin = currentUser?.role === "Admin";

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Category name is required.";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const addCategory = async () => {
    if (!validate()) return;
    setSaving(true);
    setBanner(null);
    const custom = form.customFieldKey.trim()
      ? JSON.stringify({ [form.customFieldKey.trim()]: form.customFieldValue.trim() })
      : "{}";
    const res = await api("/categories", {
      method: "POST",
      body: {
        name: form.name.trim(),
        custom_fields: custom,
      },
    });
    if (res.ok) {
      setForm({ name: "", customFieldKey: "", customFieldValue: "" });
      setShowForm(false);
      await refetch();
    } else {
      setBanner(res.error);
    }
    setSaving(false);
  };

  const parseCustom = (raw) => {
    try {
      const obj = JSON.parse(raw || "{}");
      const entries = Object.entries(obj);
      return entries.length ? entries.map(([k, v]) => `${k}: ${v}`).join(", ") : null;
    } catch {
      return null;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: `${THEME.soft}bb` }}>
          Categories drive the dropdown on Asset Registration. Custom fields are optional (e.g. warranty_months).
        </p>
        {isAdmin && (
          <PrimaryButton onClick={() => setShowForm(true)}>
            <span className="flex items-center gap-1">
              <Plus size={16} /> Add category
            </span>
          </PrimaryButton>
        )}
      </div>

      <ErrorBanner message={banner} onDismiss={() => setBanner(null)} />

      {showForm && (
        <Card>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <Field label="Category name" error={fieldErrors.name}>
              <input
                className={inputClass}
                style={inputStyle}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. IT Peripherals"
              />
            </Field>
            <Field label="Custom field key (optional)">
              <input
                className={inputClass}
                style={inputStyle}
                value={form.customFieldKey}
                onChange={(e) => setForm({ ...form, customFieldKey: e.target.value })}
                placeholder="e.g. warranty_months"
              />
            </Field>
            <Field label="Custom field value">
              <input
                className={inputClass}
                style={inputStyle}
                value={form.customFieldValue}
                onChange={(e) => setForm({ ...form, customFieldValue: e.target.value })}
                placeholder="e.g. 24"
              />
            </Field>
            <div className="flex items-end gap-2">
              <PrimaryButton onClick={addCategory} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </PrimaryButton>
              <GhostButton onClick={() => setShowForm(false)}>Cancel</GhostButton>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <Card key={c.id}>
            <p className="font-semibold" style={{ color: THEME.white }}>
              {c.name}
            </p>
            <p className="mt-1 text-xs" style={{ color: THEME.sand }}>
              {parseCustom(c.custom_fields)
                ? `Custom field: ${parseCustom(c.custom_fields)}`
                : "No custom fields"}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ── Employees Tab ───────────────────────────────────────── */
function EmployeesTab({ employees, refetch }) {
  const { user: currentUser } = useAuth();
  const [banner, setBanner] = useState(null);
  const isAdmin = currentUser?.role === "Admin";

  const promote = async (id, role) => {
    setBanner(null);
    const res = await api(`/employees/${id}/role`, {
      method: "PATCH",
      body: { role },
    });
    if (res.ok) {
      await refetch();
    } else {
      setBanner(res.error);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm" style={{ color: `${THEME.soft}bb` }}>
        The only place roles are ever assigned. Signup always creates an Employee — promotion happens here.
      </p>
      <ErrorBanner message={banner} onDismiss={() => setBanner(null)} />
      <Card>
        <table className="w-full text-left text-sm">
          <thead>
            <tr style={{ color: THEME.sand }}>
              <th className="pb-3 font-medium">Name</th>
              <th className="pb-3 font-medium">Email</th>
              <th className="pb-3 font-medium">Role</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium text-right">Promote</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => (
              <tr key={e.id} style={{ borderTop: `1px solid ${THEME.bronze}33` }}>
                <td className="py-3 font-medium" style={{ color: THEME.white }}>
                  {e.name}
                </td>
                <td className="py-3" style={{ color: THEME.soft }}>
                  {e.email}
                </td>
                <td className="py-3">
                  <Pill
                    tone={
                      e.role === "Admin"
                        ? "danger"
                        : e.role === "Employee"
                        ? "bronze"
                        : "sand"
                    }
                  >
                    {e.role}
                  </Pill>
                </td>
                <td className="py-3">
                  <StatusPill status={e.status} />
                </td>
                <td className="py-3 text-right">
                  {isAdmin && e.role === "Employee" ? (
                    <select
                      className="rounded-lg px-2 py-1 text-xs"
                      style={inputStyle}
                      defaultValue=""
                      onChange={(ev) => ev.target.value && promote(e.id, ev.target.value)}
                    >
                      <option value="" disabled>
                        Promote to…
                      </option>
                      <option value="Department Head">Department Head</option>
                      <option value="Asset Manager">Asset Manager</option>
                    </select>
                  ) : (
                    <span className="text-xs" style={{ color: `${THEME.soft}55` }}>
                      {isAdmin ? "—" : "Admin only"}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/* ── OrgSetup Page ───────────────────────────────────────── */
export default function OrgSetup({
  departments,
  categories,
  employees,
  refetchDepartments,
  refetchCategories,
  refetchEmployees,
}) {
  const [tab, setTab] = useState("departments");
  const tabs = [
    { id: "departments", label: "Departments" },
    { id: "categories", label: "Categories" },
    { id: "employees", label: "Employee Directory" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <style>{fontImport}</style>
      <div>
        <h1
          className="text-3xl font-semibold"
          style={{ fontFamily: "'Playfair Display', serif", color: THEME.white }}
        >
          Organization Setup
        </h1>
        <p className="mt-1 text-sm" style={{ color: THEME.soft }}>
          The master data every other module depends on.
        </p>
      </div>

      <div className="flex gap-2 border-b" style={{ borderColor: `${THEME.bronze}33` }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-4 py-2 text-sm font-semibold transition-colors duration-300"
            style={{
              color: tab === t.id ? THEME.sand : THEME.soft,
              borderBottom: tab === t.id ? `2px solid ${THEME.sand}` : "2px solid transparent",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "departments" && (
        <DepartmentsTab
          departments={departments}
          employees={employees}
          refetch={refetchDepartments}
        />
      )}
      {tab === "categories" && (
        <CategoriesTab categories={categories} refetch={refetchCategories} />
      )}
      {tab === "employees" && (
        <EmployeesTab employees={employees} refetch={refetchEmployees} />
      )}
    </div>
  );
}
