import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Plus, Search, QrCode, Boxes } from "lucide-react";
import { api } from "../api/client";
import { THEME, fontImport } from "../data/theme";
import {
  Card,
  StatusPill,
  PrimaryButton,
  GhostButton,
  Field,
  ErrorBanner,
  LoadingBlock,
  inputStyle,
  inputClass,
} from "../components/ui";

const STATUS_OPTIONS = ["Available", "Allocated", "Reserved", "Under Maintenance", "Lost", "Retired", "Disposed"];
const CONDITION_OPTIONS = ["New", "Good", "Fair", "Poor"];

function useDebouncedValue(value, delayMs) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export default function AssetRegistry({ categories, departments }) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 350);
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [lastSaved, setLastSaved] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const requestId = useRef(0);

  const emptyForm = useMemo(() => ({
    name: "",
    category_id: categories[0]?.id ?? "",
    serial_number: "",
    acquisition_date: "",
    acquisition_cost: "",
    condition: "Good",
    location: "",
    is_bookable: false,
  }), [categories]);

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    setForm(emptyForm);
  }, [emptyForm]);

  const fetchAssets = useCallback(async () => {
    const myRequest = ++requestId.current;
    setLoading(true);
    setListError(null);

    const params = {
      q: debouncedQuery || undefined,
      category_id: filterCategory || undefined,
      status: filterStatus || undefined,
      department_id: filterDept || undefined,
    };

    const res = await api("/assets", { params });

    if (myRequest === requestId.current) {
      if (res.ok) {
        setAssets(Array.isArray(res.data) ? res.data : res.data?.items || []);
      } else {
        setListError(res.error);
      }
      setLoading(false);
    }
  }, [debouncedQuery, filterCategory, filterStatus, filterDept]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Asset name is required.";
    if (!form.category_id) errs.category_id = "Choose a category.";
    if (form.acquisition_cost && Number(form.acquisition_cost) < 0) {
      errs.acquisition_cost = "Cost can't be negative.";
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const register = async () => {
    if (!validate()) return;
    setSaving(true);
    setSaveError(null);

    const payload = {
      name: form.name.trim(),
      category_id: Number(form.category_id),
      serial_number: form.serial_number.trim() || undefined,
      acquisition_date: form.acquisition_date || undefined,
      acquisition_cost: form.acquisition_cost ? Number(form.acquisition_cost) : undefined,
      condition: form.condition,
      location: form.location.trim() || undefined,
      is_bookable: form.is_bookable,
    };

    const res = await api("/assets", {
      method: "POST",
      body: payload,
    });

    if (res.ok) {
      setLastSaved(res.data);
      setForm(emptyForm);
      setShowForm(false);
      await fetchAssets();
    } else {
      setSaveError(res.error);
    }
    setSaving(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <style>{fontImport}</style>
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-3xl font-semibold"
            style={{ fontFamily: "'Playfair Display', serif", color: THEME.white }}
          >
            Asset Registry
          </h1>
          <p className="mt-1 text-sm" style={{ color: THEME.soft }}>
            Register assets and search/track them centrally.
          </p>
        </div>
        <PrimaryButton onClick={() => setShowForm(true)}>
          <span className="flex items-center gap-1">
            <Plus size={16} /> Register asset
          </span>
        </PrimaryButton>
      </div>

      {lastSaved && (
        <div
          className="flex items-center gap-3 rounded-2xl px-5 py-4"
          style={{ backgroundColor: `${THEME.success}1A`, border: `1px solid ${THEME.success}55` }}
        >
          <QrCode size={18} color={THEME.success} />
          <p className="text-sm" style={{ color: THEME.soft }}>
            Registered <span className="font-semibold" style={{ color: THEME.white }}>{lastSaved.asset_tag}</span> — QR code{" "}
            <span className="font-semibold" style={{ color: THEME.white }}>{lastSaved.qr_code}</span> generated automatically by the backend.
          </p>
        </div>
      )}

      {showForm && (
        <Card>
          <h3
            className="mb-4 text-sm font-semibold uppercase tracking-wide"
            style={{ color: THEME.sand }}
          >
            Register new asset
          </h3>
          <ErrorBanner message={saveError} onDismiss={() => setSaveError(null)} />
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Name" error={fieldErrors.name}>
              <input
                className={inputClass}
                style={inputStyle}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Dell Latitude 5440"
              />
            </Field>
            <Field label="Category" error={fieldErrors.category_id}>
              <select
                className={inputClass}
                style={inputStyle}
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Asset tag / QR code">
              <input
                className={inputClass}
                style={{ ...inputStyle, opacity: 0.6 }}
                value="Auto-generated on save"
                disabled
              />
            </Field>
            <Field label="Serial number">
              <input
                className={inputClass}
                style={inputStyle}
                value={form.serial_number}
                onChange={(e) => setForm({ ...form, serial_number: e.target.value })}
                placeholder="e.g. DL5440-991"
              />
            </Field>
            <Field label="Acquisition date">
              <input
                type="date"
                className={inputClass}
                style={inputStyle}
                value={form.acquisition_date}
                onChange={(e) => setForm({ ...form, acquisition_date: e.target.value })}
              />
            </Field>
            <Field label="Acquisition cost (reports only)" error={fieldErrors.acquisition_cost}>
              <input
                type="number"
                min="0"
                className={inputClass}
                style={inputStyle}
                value={form.acquisition_cost}
                onChange={(e) => setForm({ ...form, acquisition_cost: e.target.value })}
                placeholder="₹"
              />
            </Field>
            <Field label="Condition">
              <select
                className={inputClass}
                style={inputStyle}
                value={form.condition}
                onChange={(e) => setForm({ ...form, condition: e.target.value })}
              >
                {CONDITION_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Location">
              <input
                className={inputClass}
                style={inputStyle}
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. Engineering Floor 2"
              />
            </Field>
            <label className="flex items-center gap-2 self-end text-sm" style={{ color: THEME.soft }}>
              <input
                type="checkbox"
                checked={form.is_bookable}
                onChange={(e) => setForm({ ...form, is_bookable: e.target.checked })}
              />
              Shared / bookable resource
            </label>
            <div className="flex items-end gap-2">
              <PrimaryButton onClick={register} disabled={saving}>
                {saving ? "Saving…" : "Save asset"}
              </PrimaryButton>
              <GhostButton
                onClick={() => {
                  setShowForm(false);
                  setFieldErrors({});
                  setSaveError(null);
                }}
              >
                Cancel
              </GhostButton>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div
            className="flex flex-1 items-center gap-2 rounded-xl px-3 py-2"
            style={{ backgroundColor: THEME.navy, border: `1px solid ${THEME.bronze}55` }}
          >
            <Search size={16} color={THEME.sand} />
            <input
              className="w-full bg-transparent text-sm outline-none"
              style={{ color: THEME.white }}
              placeholder="Search by tag, serial, or QR code…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              className="rounded-xl px-3 py-2 text-sm"
              style={inputStyle}
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              className="rounded-xl px-3 py-2 text-sm"
              style={inputStyle}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              className="rounded-xl px-3 py-2 text-sm"
              style={inputStyle}
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
            >
              <option value="">All departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <ErrorBanner message={listError} onDismiss={() => setListError(null)} />

        {loading ? (
          <LoadingBlock label="Fetching assets…" />
        ) : assets.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Boxes size={28} color={THEME.sand} />
            <p className="font-semibold" style={{ color: THEME.white }}>
              No assets match this search
            </p>
            <p className="text-sm" style={{ color: `${THEME.soft}99` }}>
              Try clearing a filter or searching a different tag, serial, or QR code.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr style={{ color: THEME.sand }}>
                <th className="pb-3 font-medium">Tag</th>
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Category</th>
                <th className="pb-3 font-medium">Current dept.</th>
                <th className="pb-3 font-medium">Current holder</th>
                <th className="pb-3 font-medium">QR code</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((a) => (
                <tr key={a.id} style={{ borderTop: `1px solid ${THEME.bronze}33` }}>
                  <td className="py-3 font-medium" style={{ color: THEME.white }}>
                    {a.asset_tag}
                  </td>
                  <td className="py-3" style={{ color: THEME.soft }}>
                    {a.name}
                  </td>
                  <td className="py-3" style={{ color: THEME.soft }}>
                    {categories.find((c) => c.id === a.category_id)?.name || "—"}
                  </td>
                  <td className="py-3" style={{ color: THEME.soft }}>
                    {a.current_department_name || "Unassigned"}
                  </td>
                  <td className="py-3" style={{ color: THEME.soft }}>
                    {a.current_holder_name || "—"}
                  </td>
                  <td className="py-3 text-xs" style={{ color: `${THEME.soft}99` }}>
                    {a.qr_code}
                  </td>
                  <td className="py-3">
                    <StatusPill status={a.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
