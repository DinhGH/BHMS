import { useEffect, useMemo, useState } from "react";
import {
  FaChartLine,
  FaCoins,
  FaDoorOpen,
  FaExclamationTriangle,
  FaFileInvoiceDollar,
  FaHome,
  FaUsers,
} from "react-icons/fa";
import api from "../server/api";
import Loading from "./loading.jsx";

const formatCompactCurrency = (value) => {
  const amount = Number(value || 0);
  if (amount >= 1_000_000_000)
    return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`;
  return `$${amount.toLocaleString("en-US")}`;
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const chartColors = {
  room: "#475569",
  electric: "#64748b",
  water: "#94a3b8",
  service: "#cbd5e1",
};

function Dashboard() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(null);
  const [hasManualYearSelection, setHasManualYearSelection] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const yearOptions = useMemo(() => {
    const apiYears = Array.isArray(data?.availableYears)
      ? data.availableYears
      : [];
    if (apiYears.length > 0) {
      return apiYears;
    }

    return Array.from({ length: 6 }, (_, idx) => currentYear - idx);
  }, [currentYear, data?.availableYears]);

  useEffect(() => {
    let cancelled = false;

    const fetchDashboard = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get("/api/owner/dashboard", {
          params: {
            year: year ?? undefined,
          },
        });
        if (!cancelled) {
          setData(response);

          if (
            !hasManualYearSelection &&
            response?.year &&
            response.year !== year
          ) {
            setYear(response.year);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Failed to load dashboard data");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchDashboard();

    return () => {
      cancelled = true;
    };
  }, [year, hasManualYearSelection]);

  const summary = data?.summary || {};
  const monthlyRevenue = data?.monthlyRevenue || [];
  const invoiceStatusTrend = data?.invoiceStatusTrend || [];
  const roomStatus = data?.roomStatus || {
    available: 0,
    occupied: 0,
    locked: 0,
    total: 0,
  };
  const costBreakdown = data?.costBreakdown || [];
  const propertyPerformance = data?.propertyPerformance || [];
  const recentInvoices = data?.recentInvoices || [];
  const alerts = data?.alerts || [];
  const isInitialLoading = loading && !data;

  const maxMonthlyRevenue = Math.max(
    ...monthlyRevenue.map((item) => Number(item.value || 0)),
    1,
  );

  const linePoints = monthlyRevenue
    .map((item, index) => {
      const x = (index / Math.max(monthlyRevenue.length - 1, 1)) * 100;
      const y = 100 - (Number(item.value || 0) / maxMonthlyRevenue) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  const occupiedPercent =
    roomStatus.total > 0
      ? Math.round((roomStatus.occupied / roomStatus.total) * 100)
      : 0;

  const availablePercent =
    roomStatus.total > 0
      ? Math.round((roomStatus.available / roomStatus.total) * 100)
      : 0;

  const roomPieStyle = {
    background: `conic-gradient(
      #475569 0% ${availablePercent}%,
      #cbd5e1 ${availablePercent}% ${availablePercent + occupiedPercent}%,
      #94a3b8 ${availablePercent + occupiedPercent}% 100%
    )`,
  };

  const statusBarMax = Math.max(
    ...invoiceStatusTrend.map(
      (item) => item.paid + item.pending + item.overdue,
    ),
    1,
  );

  const cardItems = [
    {
      key: "revenue",
      icon: <FaCoins className="text-slate-500" />,
      label: "Annual Revenue",
      value: formatCompactCurrency(summary.yearRevenue),
      extra: `This month: ${formatCurrency(summary.thisMonthRevenue)}`,
    },
    {
      key: "outstanding",
      icon: <FaFileInvoiceDollar className="text-slate-500" />,
      label: "Outstanding Amount",
      value: formatCompactCurrency(summary.outstandingAmount),
      extra: `${summary.overdueInvoices || 0} overdue invoices`,
    },
    {
      key: "collection",
      icon: <FaChartLine className="text-slate-500" />,
      label: "Collection Rate",
      value: `${Number(summary.collectionRate || 0)}%`,
      extra: `${summary.paidInvoices || 0}/${(summary.paidInvoices || 0) + (summary.pendingInvoices || 0) + (summary.overdueInvoices || 0)} invoices paid`,
    },
    {
      key: "occupancy",
      icon: <FaDoorOpen className="text-slate-500" />,
      label: "Occupancy Rate",
      value: `${Number(summary.occupancyRate || 0)}%`,
      extra: `${summary.occupiedRooms || 0}/${summary.totalRooms || 0} rooms occupied`,
    },
    {
      key: "properties",
      icon: <FaHome className="text-slate-500" />,
      label: "Properties",
      value: Number(summary.totalBoardingHouses || 0).toLocaleString("en-US"),
      extra: `${summary.availableRooms || 0} rooms available`,
    },
    {
      key: "tenants",
      icon: <FaUsers className="text-slate-500" />,
      label: "Active Tenants",
      value: Number(summary.totalTenants || 0).toLocaleString("en-US"),
      extra: `Avg paid invoice: ${formatCurrency(summary.avgRevenuePerPaidInvoice)}`,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-5 text-slate-900">
      <Loading isLoading={isInitialLoading} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Owner Dashboard</h1>
        <div className="flex items-center gap-2">
          {loading && data ? (
            <div className="rounded-md bg-amber-100 px-3 py-1 text-sm text-amber-700">
              Updating data...
            </div>
          ) : null}
          <div className="rounded-md bg-slate-100 px-3 py-1 text-sm text-slate-600">
            Currency: {data?.currency || "USD"}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {cardItems.map((item) => (
          <div
            key={item.key}
            className="rounded-md border border-slate-200 bg-white px-4 py-3"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-500">{item.label}</span>
              <span>{item.icon}</span>
            </div>
            <div className="text-3xl font-semibold leading-tight">
              {loading ? (
                <div className="h-8 w-24 animate-pulse rounded bg-slate-200" />
              ) : (
                item.value
              )}
            </div>
            <div className="mt-2 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {loading ? "Loading data..." : item.extra}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <section className="rounded-md border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Monthly Revenue</h2>
            <select
              className="rounded-md border border-slate-300 px-2 py-1 text-sm bg-white"
              value={year ?? data?.year ?? currentYear}
              onChange={(e) => {
                setHasManualYearSelection(true);
                setYear(Number(e.target.value));
              }}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div className="h-64 rounded-sm border border-slate-300 bg-slate-50 p-3">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <line
                x1="0"
                y1="100"
                x2="100"
                y2="100"
                stroke="#94a3b8"
                strokeWidth="0.6"
              />
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="100"
                stroke="#94a3b8"
                strokeWidth="0.6"
              />
              {[25, 50, 75].map((yAxis) => (
                <line
                  key={yAxis}
                  x1="0"
                  y1={yAxis}
                  x2="100"
                  y2={yAxis}
                  stroke="#e2e8f0"
                  strokeWidth="0.5"
                />
              ))}
              <polyline
                fill="none"
                stroke="#475569"
                strokeWidth="1.8"
                points={linePoints}
              />
            </svg>
          </div>

          <div className="mt-3 grid grid-cols-6 gap-1 text-[11px] text-slate-500">
            {monthlyRevenue.map((item) => (
              <span key={item.month}>{item.label}</span>
            ))}
          </div>
        </section>

        <section className="rounded-md border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold mb-3">Room</h2>
          <div className="flex items-center gap-4 text-sm text-slate-600 mb-5">
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />{" "}
              Available
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />{" "}
              Occupied
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-400" /> Locked
            </span>
          </div>

          <div className="h-64 rounded-sm border border-slate-300 bg-slate-50 flex items-center justify-center">
            <div className="relative w-44 h-44" style={roomPieStyle}>
              <div className="absolute inset-7 rounded-full bg-slate-50 border border-slate-200 flex flex-col items-center justify-center">
                <span className="text-2xl font-semibold text-slate-800">
                  {roomStatus.total || 0}
                </span>
                <span className="text-xs text-slate-500">Rooms</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <section className="rounded-md border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold mb-3">Invoice Status Trend</h2>
          <div className="space-y-3">
            {invoiceStatusTrend.map((item) => {
              const total = item.paid + item.pending + item.overdue;
              const widthPercent = (total / statusBarMax) * 100;
              return (
                <div key={item.month}>
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                    <span>{item.label}</span>
                    <span>{total}</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 float-left"
                      style={{
                        width: `${total > 0 ? (item.paid / total) * widthPercent : 0}%`,
                      }}
                    />
                    <div
                      className="h-full bg-amber-400 float-left"
                      style={{
                        width: `${total > 0 ? (item.pending / total) * widthPercent : 0}%`,
                      }}
                    />
                    <div
                      className="h-full bg-rose-500 float-left"
                      style={{
                        width: `${total > 0 ? (item.overdue / total) * widthPercent : 0}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-md border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold mb-3">Priority Alerts</h2>
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                All key metrics are within healthy ranges.
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.title}
                  className={`rounded-md border p-3 text-sm ${
                    alert.type === "danger"
                      ? "border-rose-200 bg-rose-50 text-rose-700"
                      : alert.type === "warning"
                        ? "border-amber-200 bg-amber-50 text-amber-700"
                        : "border-blue-200 bg-blue-50 text-blue-700"
                  }`}
                >
                  <div className="mb-1 flex items-center gap-2 font-semibold">
                    <FaExclamationTriangle />
                    <span>{alert.title}</span>
                  </div>
                  <p>{alert.description}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="rounded-md border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold mb-3">Cost</h2>
        <div className="grid grid-cols-1 lg:grid-cols-[180px_1fr] gap-4 items-start">
          <div className="h-32 w-40 border border-slate-300 bg-slate-50 rounded-sm relative mx-auto lg:mx-0">
            <div
              className="absolute inset-0 rounded-sm"
              style={{
                background: `conic-gradient(${costBreakdown
                  .map((item, idx) => {
                    const before = costBreakdown
                      .slice(0, idx)
                      .reduce(
                        (sum, cost) => sum + Number(cost.percent || 0),
                        0,
                      );
                    const after = before + Number(item.percent || 0);
                    return `${chartColors[item.key] || "#cbd5e1"} ${before}% ${after}%`;
                  })
                  .join(", ")})`,
              }}
            />
            <div className="absolute inset-8 rounded-full bg-white border border-slate-200" />
          </div>

          <div className="space-y-2">
            {costBreakdown.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between gap-4 text-sm"
              >
                <div className="flex items-center gap-2 min-w-32.5">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor: chartColors[item.key] || "#cbd5e1",
                    }}
                  />
                  <span className="text-slate-600">{item.label}</span>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-slate-500">
                    {formatCompactCurrency(item.amount)}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    +{item.percent || 0}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <section className="rounded-md border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold mb-3">
            Top Property Performance
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="py-2">Property</th>
                  <th className="py-2">Rooms</th>
                  <th className="py-2">Occupancy</th>
                  <th className="py-2 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {propertyPerformance.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-slate-500">
                      No property data available.
                    </td>
                  </tr>
                ) : (
                  propertyPerformance.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100">
                      <td className="py-2">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-slate-500">
                          {item.address}
                        </div>
                      </td>
                      <td className="py-2">{item.rooms}</td>
                      <td className="py-2">{item.occupancyRate}%</td>
                      <td className="py-2 text-right font-medium">
                        {formatCurrency(item.yearRevenue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-md border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold mb-3">Recent Invoices</h2>
          <div className="space-y-2 max-h-75 overflow-y-auto pr-1">
            {recentInvoices.length === 0 ? (
              <div className="text-sm text-slate-500">
                No recent invoices found.
              </div>
            ) : (
              recentInvoices.map((item) => (
                <div
                  key={item.id}
                  className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-sm text-slate-800">
                      {item.houseName} / {item.roomName}
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        item.status === "PAID"
                          ? "bg-emerald-100 text-emerald-700"
                          : item.status === "OVERDUE"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                    <span>
                      {item.tenantName} • Period {item.period}
                    </span>
                    <span className="font-semibold text-slate-700">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
