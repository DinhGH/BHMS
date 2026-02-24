import React, { useEffect, useState } from "react";
import { Search, Trash2 } from "lucide-react";
import Loading from "../../components/loading.jsx";
import Pagination from "../../components/Admin/Pagination.jsx";
import SearchInput from "../../components/Admin/SearchInput.jsx";
import api from "../../services/api.js";

const STATUS_COLORS = {
  PENDING: "bg-amber-100 text-amber-800 ring-1 ring-amber-200",
  PROCESSING: "bg-sky-100 text-sky-800 ring-1 ring-sky-200",
  RESOLVED: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200",
  REVIEWING: "bg-indigo-100 text-indigo-800 ring-1 ring-indigo-200",
  FIXING: "bg-rose-100 text-rose-800 ring-1 ring-rose-200",
};

const STATUS_OPTIONS = [
  "PENDING",
  "PROCESSING",
  "RESOLVED",
  "REVIEWING",
  "FIXING",
];

export default function ReportAdmin() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);

  const pageSize = 10;

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", currentPage);
      params.set("limit", pageSize);

      if (filter !== "all") {
        params.set("status", filter);
      }

      if (searchQuery) {
        params.set("search", searchQuery);
      }

      const res = await api.get(`/api/report-admins?${params.toString()}`);
      setReports(res.data || []);
    } catch (error) {
      console.error("Fetch reports error:", error);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery]);

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, filter, searchQuery]);

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      setSearchQuery(search);
    }
  };

  const handleStatusChange = async (reportId, newStatus) => {
    const confirmed = window.confirm(
      `Confirm updating report #${reportId} to ${newStatus}?`,
    );
    if (!confirmed) return;

    try {
      const response = await api.patch(`/api/report-admins/${reportId}/status`, {
        status: newStatus,
        confirm: true,
      });
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r)),
      );

      const emailStats = response?.email;
      if (emailStats) {
        alert(
          `Status updated successfully. Email: attempted ${emailStats.attempted}, sent ${emailStats.sent}, failed ${emailStats.failed}.`,
        );
      } else {
        alert("Status updated successfully");
      }
    } catch (error) {
      console.error("Update status error:", error);
      alert("Failed to update status");
    }
  };

  const handleDelete = async (reportId) => {
    if (!window.confirm("Are you sure you want to delete this report?")) return;

    try {
      await api.delete(`/api/report-admins/${reportId}`, { confirm: true });
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      alert("Report deleted successfully");
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete report");
    }
  };

  const toggleCheckbox = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id],
    );
  };

  const toggleAll = () => {
    setSelectedIds(
      selectedIds.length === reports.length ? [] : reports.map((r) => r.id),
    );
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      alert("Select at least one report to delete");
      return;
    }

    if (!window.confirm(`Delete ${selectedIds.length} report(s)?`)) return;

    try {
      for (const id of selectedIds) {
        await api.delete(`/api/report-admins/${id}`, { confirm: true });
      }
      setReports((prev) => prev.filter((r) => !selectedIds.includes(r.id)));
      setSelectedIds([]);
      alert("Reports deleted successfully");
    } catch (error) {
      console.error("Bulk delete error:", error);
      alert("Failed to delete some reports");
    }
  };

  if (loading) {
    return <Loading isLoading={true} />;
  }

  return (
    <div className="h-full flex flex-col max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-black mb-2">Admin Reports</h1>
        <p className="text-gray-600">Manage reports from owners</p>
      </div>

      {/* Filters & Search */}
      <div className="mb-4 flex flex-col md:flex-row gap-4">
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder="Search by email or content... (Press Enter)"
        />

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="mb-4 flex gap-2">
          <button
            onClick={handleBulkDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Delete Selected ({selectedIds.length})
          </button>
          <button
            onClick={() => setSelectedIds([])}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition"
          >
            Clear Selection
          </button>
        </div>
      )}

      {/* Table Container - Scrollable */}
      <div className="flex-1 bg-white shadow-lg rounded-lg overflow-hidden flex flex-col min-h-0">
        {reports.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No reports found</p>
          </div>
        ) : (
          <>
            <div className="overflow-auto flex-1">
              <table className="w-full">
                <thead className="bg-gray-100 border-b border-gray-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={
                          selectedIds.length === reports.length &&
                          reports.length > 0
                        }
                        onChange={toggleAll}
                        className="rounded"
                      />
                    </th>
                    <th className="px-6 py-3 text-left font-semibold">ID</th>
                    <th className="px-6 py-3 text-left font-semibold">Owner</th>
                    <th className="px-6 py-3 text-left font-semibold">
                      Target
                    </th>
                    <th className="px-6 py-3 text-left font-semibold">
                      Content
                    </th>
                    <th className="px-6 py-3 text-left font-semibold">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left font-semibold">Date</th>
                    <th className="px-6 py-3 text-left font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(report.id)}
                          onChange={() => toggleCheckbox(report.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-6 py-3 font-semibold">#{report.id}</td>
                      <td className="px-6 py-3">
                        <div className="text-sm">
                          <p className="font-medium">
                            {report.sender?.email || "Unknown"}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <span className="inline-flex max-w-xs items-center justify-center rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-800 leading-tight shadow-sm ring-1 ring-slate-200 whitespace-nowrap">
                          {report.target}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm max-w-xs truncate">
                        {report.content}
                      </td>
                      <td className="px-6 py-3">
                        <select
                          value={report.status || ""}
                          onChange={(e) =>
                            handleStatusChange(report.id, e.target.value)
                          }
                          className={`w-full rounded-lg px-3 py-2 text-xs font-semibold uppercase cursor-pointer border-2 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                            STATUS_COLORS[report.status] ||
                            "bg-gray-100 text-gray-800 ring-1 ring-gray-200"
                          } border-current`}
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3">
                        <button
                          onClick={() => handleDelete(report.id)}
                          className="text-red-600 hover:text-red-800 transition"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination - Fixed at bottom */}
            {reports.length > 0 && (
              <div className="border-t border-gray-200 p-4 flex justify-center bg-white">
                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(reports.length / pageSize)}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
