import { useMemo } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Download } from "lucide-react";
import { THEME, fontImport } from "../data/theme";
import { downloadCSV } from "../data/utils";
import { Card, PrimaryButton } from "../components/ui";

const mockMaintenanceTrend = [
  { month: "Feb", requests: 3 },
  { month: "Mar", requests: 5 },
  { month: "Apr", requests: 2 },
  { month: "May", requests: 6 },
  { month: "Jun", requests: 4 },
  { month: "Jul", requests: 7 },
];

export default function Reports({ assets, departments }) {
  const utilizationData = useMemo(() => {
    return departments.map((d) => ({
      name: d.name.replace("Engineering — ", "Eng. "),
      allocated: assets.filter((a) => a.current_department_name === d.name && a.status === "Allocated").length,
    }));
  }, [assets, departments]);

  const mostUsed = useMemo(() => {
    return [...assets]
      .filter((a) => a.usage_count !== undefined)
      .sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0))
      .slice(0, 5);
  }, [assets]);

  const idle = useMemo(() => {
    return assets
      .filter((a) => a.status === "Available")
      .sort((a, b) => (b.days_idle || 0) - (a.days_idle || 0))
      .slice(0, 5);
  }, [assets]);

  const dueSoon = useMemo(() => {
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    return assets.filter(
      (a) =>
        a.condition === "Poor" ||
        (a.next_maintenance_date && a.next_maintenance_date <= thirtyDaysFromNow)
    );
  }, [assets]);

  return (
    <div className="flex flex-col gap-6">
      <style>{fontImport}</style>
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-3xl font-semibold"
            style={{ fontFamily: "'Playfair Display', serif", color: THEME.white }}
          >
            Reports & Analytics
          </h1>
          <p className="mt-1 text-sm" style={{ color: THEME.soft }}>
            Six views, kept minimal by design.
          </p>
        </div>
        <PrimaryButton onClick={() => downloadCSV(assets, "assetflow_assets_export.csv")}>
          <span className="flex items-center gap-2">
            <Download size={16} /> Export CSV
          </span>
        </PrimaryButton>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <h3
            className="mb-4 text-sm font-semibold uppercase tracking-wide"
            style={{ color: THEME.sand }}
          >
            Utilization by department
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={utilizationData}>
              <CartesianGrid strokeDasharray="3 3" stroke={`${THEME.bronze}33`} />
              <XAxis dataKey="name" tick={{ fill: THEME.soft, fontSize: 12 }} />
              <YAxis tick={{ fill: THEME.soft, fontSize: 12 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: THEME.navy, border: `1px solid ${THEME.bronze}` }}
                labelStyle={{ color: THEME.white }}
              />
              <Bar dataKey="allocated" fill={THEME.sand} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3
            className="mb-4 text-sm font-semibold uppercase tracking-wide"
            style={{ color: THEME.sand }}
          >
            Maintenance frequency
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={mockMaintenanceTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke={`${THEME.bronze}33`} />
              <XAxis dataKey="month" tick={{ fill: THEME.soft, fontSize: 12 }} />
              <YAxis tick={{ fill: THEME.soft, fontSize: 12 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: THEME.navy, border: `1px solid ${THEME.bronze}` }}
                labelStyle={{ color: THEME.white }}
              />
              <Line
                type="monotone"
                dataKey="requests"
                stroke={THEME.sand}
                strokeWidth={2.5}
                dot={{ fill: THEME.bronze }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <h3
            className="mb-4 text-sm font-semibold uppercase tracking-wide"
            style={{ color: THEME.sand }}
          >
            Most-used assets
          </h3>
          {mostUsed.length === 0 ? (
            <div className="text-sm py-4" style={{ color: `${THEME.soft}99` }}>
              <p>No usage data available.</p>
              <p className="mt-1 text-xs" style={{ color: THEME.sand }}>
                Note: "Most-used assets" requires a usage count tracker (gap in Person A's current schema).
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {mostUsed.map((a) => (
                <li key={a.id} className="flex items-center justify-between">
                  <span style={{ color: THEME.white }}>
                    {a.asset_tag} · {a.name}
                  </span>
                  <span style={{ color: THEME.sand }}>{a.usage_count || 0} uses</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h3
            className="mb-4 text-sm font-semibold uppercase tracking-wide"
            style={{ color: THEME.sand }}
          >
            Idle assets
          </h3>
          {idle.length === 0 ? (
            <p className="text-sm py-4" style={{ color: `${THEME.soft}99` }}>
              No idle assets right now.
            </p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {idle.map((a) => (
                <li key={a.id} className="flex items-center justify-between">
                  <span style={{ color: THEME.white }}>
                    {a.asset_tag} · {a.name}
                  </span>
                  <span style={{ color: THEME.sand }}>{a.days_idle || 0} days idle</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <h3
          className="mb-4 text-sm font-semibold uppercase tracking-wide"
          style={{ color: THEME.sand }}
        >
          Due for maintenance / nearing retirement
        </h3>
        {dueSoon.length === 0 ? (
          <p className="text-sm" style={{ color: `${THEME.soft}99` }}>
            Nothing flagged right now.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr style={{ color: THEME.sand }}>
                <th className="pb-3 font-medium">Tag</th>
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Condition</th>
                <th className="pb-3 font-medium">Next maintenance</th>
              </tr>
            </thead>
            <tbody>
              {dueSoon.map((a) => (
                <tr key={a.id} style={{ borderTop: `1px solid ${THEME.bronze}33` }}>
                  <td className="py-3" style={{ color: THEME.white }}>
                    {a.asset_tag}
                  </td>
                  <td className="py-3" style={{ color: THEME.soft }}>
                    {a.name}
                  </td>
                  <td className="py-3" style={{ color: THEME.soft }}>
                    {a.condition}
                  </td>
                  <td className="py-3" style={{ color: THEME.soft }}>
                    {a.next_maintenance_date || "—"}
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
