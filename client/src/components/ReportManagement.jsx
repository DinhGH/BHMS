import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Loading from "./loading.jsx";
import {
  createReport,
  deleteReport,
  getReports,
  updateReport,
  updateReportStatus,
} from "../services/api";

// Icon components
const Plus = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const Minus = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const Search = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="11" cy="11" r="8"></circle>
    <path d="m21 21-4.35-4.35"></path>
  </svg>
);

// ── Validation ────────────────────────────────────────────────────────────────
function validateCreateForm(form) {
  const errors = {};
  const email = form.senderEmail.trim();
  if (!email) {
    errors.senderEmail = "Sender email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.senderEmail = "Please enter a valid email address.";
  }
  if (!form.target.trim()) {
    errors.target = "Target is required.";
  } else if (form.target.trim().length > 100) {
    errors.target = "Target must not exceed 100 characters.";
  }
  if (!form.content.trim()) {
    errors.content = "Content is required.";
  } else if (form.content.trim().length < 20) {
    errors.content = "Content must be at least 20 characters.";
  } else if (form.content.trim().length > 2000) {
    errors.content = "Content must not exceed 2000 characters.";
  }
  return errors;
}

function validateEditForm(form) {
  const errors = {};
  if (!form.target.trim()) {
    errors.target = "Target is required.";
  } else if (form.target.trim().length > 100) {
    errors.target = "Target must not exceed 100 characters.";
  }
  if (!form.content.trim()) {
    errors.content = "Content is required.";
  } else if (form.content.trim().length < 20) {
    errors.content = "Content must be at least 20 characters.";
  } else if (form.content.trim().length > 2000) {
    errors.content = "Content must not exceed 2000 characters.";
  }
  return errors;
}

// ── Main Component ────────────────────────────────────────────────────────────
function ReportManagement() {
  const [expandedReport, setExpandedReport] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [targetFilter, setTargetFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [reports, setReports] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts] = useState({ reviewing: 0, fixing: 0, fixed: 0 });
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createFieldErrors, setCreateFieldErrors] = useState({});
  const [createForm, setCreateForm] = useState({
    senderEmail: "",
    target: "Room",
    content: "",
    images: [],
  });

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editFieldErrors, setEditFieldErrors] = useState({});
  const [editForm, setEditForm] = useState({
    id: null,
    target: "",
    content: "",
    images: [],
  });

  const [deleteLoadingId, setDeleteLoadingId] = useState(null);

  const reportsPerPage = 10;
  const currentReports = reports;
  const reviewingCount = counts.reviewing || 0;
  const fixingCount = counts.fixing || 0;
  const fixedCount = counts.fixed || 0;

  const tabToStatus = (tab) => {
    if (tab === "reviewing") return "REVIEWING";
    if (tab === "fixing") return "FIXING";
    if (tab === "fixed") return "FIXED";
    return undefined;
  };

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const res = await getReports({
          page: currentPage,
          limit: reportsPerPage,
          status: tabToStatus(activeTab),
          search: searchQuery,
          target: targetFilter === "all" ? undefined : targetFilter,
          orderBy: sortBy,
          order: sortOrder,
        });
        setReports(res.data || []);
        setTotalPages(res.pagination?.totalPages || 1);
        setCounts(res.counts || { reviewing: 0, fixing: 0, fixed: 0 });
        setExpandedReport(null);
      } catch (err) {
        toast.error(err?.message || "Failed to load reports.");
        setReports([]);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [
    activeTab,
    currentPage,
    searchQuery,
    targetFilter,
    sortBy,
    sortOrder,
    refreshKey,
  ]);

  const toggleReport = (id) =>
    setExpandedReport(expandedReport === id ? null : id);
  const goToPage = (pageNumber) => {
    setCurrentPage(pageNumber);
    setExpandedReport(null);
  };
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      setExpandedReport(null);
    }
  };
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      setExpandedReport(null);
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
    setExpandedReport(null);
  };
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setExpandedReport(null);
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setTargetFilter("all");
    setActiveTab("all");
    setCurrentPage(1);
    setExpandedReport(null);
    setSortBy("createdAt");
    setSortOrder("desc");
    setRefreshKey((prev) => prev + 1);
  };

  const resetCreateForm = () => {
    setCreateForm({ senderEmail: "", target: "Room", content: "", images: [] });
    setCreateFieldErrors({});
  };

  const resetEditForm = () => {
    setEditForm({ id: null, target: "", content: "", images: [] });
    setEditFieldErrors({});
  };

  const handleCreateFiles = async (files) => {
    if (!files || files.length === 0) return;
    const toBase64 = (file) =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    try {
      const images = await Promise.all([...files].map(toBase64));
      setCreateForm((prev) => ({
        ...prev,
        images: [...prev.images, ...images],
      }));
    } catch {
      toast.error("Failed to read images.");
    }
  };

  const handleCreateFormChange = (field, value) => {
    setCreateForm((prev) => ({ ...prev, [field]: value }));
    if (createFieldErrors[field]) {
      setCreateFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleCreateReport = async (e) => {
    e.preventDefault();
    const errors = validateCreateForm(createForm);
    if (Object.keys(errors).length > 0) {
      setCreateFieldErrors(errors);
      toast.error("Please fix the highlighted fields before saving.");
      return;
    }
    setCreateFieldErrors({});

    try {
      setCreateLoading(true);
      await createReport({
        senderEmail: createForm.senderEmail.trim(),
        target: createForm.target.trim(),
        content: createForm.content.trim(),
        images: createForm.images.length ? createForm.images : undefined,
      });
      toast.success("Report created successfully.");
      setIsCreateOpen(false);
      resetCreateForm();
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      toast.error(err?.message || "Failed to create report.");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleOpenEdit = (report) => {
    setEditForm({
      id: report.id,
      target: report.target || "",
      content: report.content || "",
      images: Array.isArray(report.images) ? report.images : [],
    });
    setEditFieldErrors({});
    setIsEditOpen(true);
  };

  const handleEditFiles = async (files) => {
    if (!files || files.length === 0) return;
    const toBase64 = (file) =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    try {
      const images = await Promise.all([...files].map(toBase64));
      setEditForm((prev) => ({ ...prev, images: [...prev.images, ...images] }));
    } catch {
      toast.error("Failed to read images.");
    }
  };

  const handleEditFormChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
    if (editFieldErrors[field]) {
      setEditFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleEditReport = async (e) => {
    e.preventDefault();
    const errors = validateEditForm(editForm);
    if (Object.keys(errors).length > 0) {
      setEditFieldErrors(errors);
      toast.error("Please fix the highlighted fields before saving.");
      return;
    }
    setEditFieldErrors({});

    try {
      setEditLoading(true);
      await updateReport(editForm.id, {
        target: editForm.target.trim(),
        content: editForm.content.trim(),
        images: editForm.images.length ? editForm.images : null,
      });
      toast.success("Report updated successfully.");
      setIsEditOpen(false);
      resetEditForm();
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      toast.error(err?.message || "Failed to update report.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteReport = async (id) => {
    if (!id) return;
    if (!window.confirm("Delete this report?")) return;
    try {
      setDeleteLoadingId(id);
      await deleteReport(id);
      toast.success("Report deleted.");
      setExpandedReport(null);
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      toast.error(err?.message || "Failed to delete report.");
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const markStatus = async (id, status) => {
    const previousReports = reports;
    const previousCounts = counts;

    setReports((prev) =>
      prev
        .map((report) => (report.id === id ? { ...report, status } : report))
        .filter((report) => {
          if (activeTab === "all") return true;
          return report.status === tabToStatus(activeTab);
        }),
    );

    setCounts((prev) => {
      const current = previousReports.find((report) => report.id === id);
      const currentStatus = current?.status;
      if (!currentStatus || currentStatus === status) return prev;
      const next = { ...prev };
      if (currentStatus === "REVIEWING")
        next.reviewing = Math.max(0, next.reviewing - 1);
      if (currentStatus === "FIXING")
        next.fixing = Math.max(0, next.fixing - 1);
      if (currentStatus === "FIXED") next.fixed = Math.max(0, next.fixed - 1);
      if (status === "REVIEWING") next.reviewing += 1;
      if (status === "FIXING") next.fixing += 1;
      if (status === "FIXED") next.fixed += 1;
      return next;
    });

    setExpandedReport(null);
    try {
      await updateReportStatus(id, status);
      toast.success(`Status updated to ${statusLabel(status)}.`);
    } catch (err) {
      toast.error(err?.message || "Failed to update status.");
      setReports(previousReports);
      setCounts(previousCounts);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return "";
    return new Date(iso).toLocaleString();
  };

  const statusLabel = (status) => {
    if (status === "REVIEWING") return "Reviewing";
    if (status === "FIXING") return "Fixing";
    if (status === "FIXED") return "Fixed";
    return status;
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    if (totalPages <= maxPagesToShow + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= maxPagesToShow; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - maxPagesToShow + 1; i <= totalPages; i++)
          pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const inputCls = (errors, field) =>
    `mt-2 w-full rounded-md border px-3 py-2 text-base focus:outline-none focus:ring-2 transition ${
      errors[field]
        ? "border-red-400 focus:ring-red-300"
        : "border-gray-300 focus:ring-blue-500"
    }`;

  return (
    <div className="w-full h-full bg-gray-50">
      <div className="w-full h-full flex flex-col">
        {/* Header */}
        <div className="px-4 pt-5 pb-3 sm:px-6 sm:pt-6 sm:pb-4">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-4xl">
            Report
          </h1>
        </div>

        <div className="bg-white rounded-none shadow-sm flex-1 flex flex-col w-full">
          {/* Tabs and Actions */}
          <div className="flex flex-col gap-4 px-4 py-4 border-b border-gray-200 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex flex-wrap gap-4 sm:gap-8">
              {[
                { key: "all", label: "All Reports", badge: null },
                {
                  key: "reviewing",
                  label: "Reviewing",
                  badge: reviewingCount,
                  badgeCls: "bg-blue-100 text-blue-600",
                },
                {
                  key: "fixing",
                  label: "Fixing",
                  badge: fixingCount,
                  badgeCls: "bg-amber-100 text-amber-700",
                },
                {
                  key: "fixed",
                  label: "Fixed",
                  badge: fixedCount,
                  badgeCls: "bg-emerald-100 text-emerald-700",
                },
              ].map(({ key, label, badge, badgeCls }) => (
                <button
                  key={key}
                  className={`pb-3 font-medium transition-colors relative text-base ${
                    activeTab === key
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  onClick={() => handleTabChange(key)}
                >
                  {label}
                  {badge !== null && (
                    <span
                      className={`ml-2 text-xs font-semibold px-2.5 py-1 rounded-full ${badgeCls}`}
                    >
                      {badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                className="px-5 py-2.5 text-base font-medium text-white bg-blue-600 border border-blue-600 rounded-md transition-all duration-200 hover:bg-blue-700 hover:-translate-y-0.5 active:translate-y-0"
                onClick={() => {
                  resetCreateForm();
                  setIsCreateOpen(true);
                }}
              >
                Add Report
              </button>
              <button
                className="px-5 py-2.5 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md transition-all duration-200 hover:bg-gray-50 hover:-translate-y-0.5 active:translate-y-0"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
              >
                Filter
              </button>
              <button
                className="px-5 py-2.5 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md transition-all duration-200 hover:bg-gray-50 hover:-translate-y-0.5 active:translate-y-0"
                onClick={handleRefresh}
              >
                Refresh
              </button>
              <div className="relative w-full sm:w-auto">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <Search />
                </div>
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={handleSearch}
                  className="w-full pl-11 pr-4 py-2.5 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-64"
                />
              </div>
            </div>
          </div>

          {/* Filter Panel */}
          {isFilterOpen && (
            <div className="px-4 py-4 border-b border-gray-200 bg-gray-50 sm:px-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Order By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="id">ID</option>
                    <option value="createdAt">Date</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Order</label>
                  <select
                    value={sortOrder}
                    onChange={(e) => {
                      setSortOrder(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="asc">Asc</option>
                    <option value="desc">Desc</option>
                  </select>
                </div>
                <button
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md transition-all duration-200 hover:bg-gray-50"
                  onClick={() => {
                    setTargetFilter("all");
                    setSortBy("createdAt");
                    setSortOrder("desc");
                  }}
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}

          {/* Report List */}
          <div className="divide-y divide-gray-200 flex-1 overflow-y-auto">
            <Loading isLoading={loading} />
            {!loading &&
              (currentReports.length > 0 ? (
                currentReports.map((report) => (
                  <div key={report.id} className="border-b border-gray-200">
                    <div
                      className={`flex flex-col gap-3 px-4 py-4 cursor-pointer transition-colors sm:flex-row sm:items-center sm:justify-between sm:px-6 ${
                        report.status === "REVIEWING"
                          ? "bg-gray-100 hover:bg-gray-200"
                          : "bg-white hover:bg-gray-50"
                      }`}
                      onClick={() => toggleReport(report.id)}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-base text-gray-500 font-medium">
                          {report.id < 10 ? `0${report.id}` : report.id}
                        </span>
                        <span className="text-base font-medium text-gray-900">
                          Report ID #{report.id} By{" "}
                          {report.sender?.fullName ||
                            report.sender?.email ||
                            "Unknown"}
                        </span>
                      </div>
                      <button className="self-end text-gray-400 hover:text-gray-600 sm:self-auto">
                        {expandedReport === report.id ? <Minus /> : <Plus />}
                      </button>
                    </div>

                    {expandedReport === report.id && (
                      <div className="px-4 py-5 bg-white border-t border-gray-200 sm:px-6">
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_260px]">
                          <div className="space-y-5">
                            <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                                <span className="text-gray-500 text-sm">
                                  👤
                                </span>
                              </div>
                              <div>
                                <div className="text-sm text-gray-500">
                                  Reported By
                                </div>
                                <div className="text-base font-semibold text-gray-900">
                                  {report.sender?.fullName || "Unknown"}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {report.sender?.email || ""}
                                </div>
                              </div>
                            </div>

                            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                              <div className="text-sm font-medium text-gray-500">
                                Detail Report
                              </div>
                              <div className="mt-2 text-base text-gray-700 leading-relaxed">
                                {report.content}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                <div className="text-sm text-gray-500">
                                  Date
                                </div>
                                <div className="mt-1 text-sm font-semibold text-gray-900">
                                  {formatDate(report.createdAt)}
                                </div>
                              </div>
                              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                <div className="text-sm text-gray-500">
                                  Target
                                </div>
                                <div className="mt-1 text-sm font-semibold text-gray-900">
                                  {report.target}
                                </div>
                              </div>
                              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                <div className="text-sm text-gray-500">
                                  Status
                                </div>
                                <div
                                  className={`mt-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                    report.status === "REVIEWING"
                                      ? "bg-blue-100 text-blue-700"
                                      : report.status === "FIXING"
                                        ? "bg-amber-100 text-amber-700"
                                        : "bg-emerald-100 text-emerald-700"
                                  }`}
                                >
                                  {statusLabel(report.status)}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                              <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                Actions
                              </div>
                              <div className="mt-3 flex flex-col gap-2">
                                <button
                                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition-all duration-200 hover:bg-gray-100"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenEdit(report);
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  className="w-full rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition-all duration-200 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                                  disabled={deleteLoadingId === report.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteReport(report.id);
                                  }}
                                >
                                  {deleteLoadingId === report.id
                                    ? "Deleting..."
                                    : "Delete"}
                                </button>
                              </div>
                            </div>

                            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                              <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                Set Status
                              </div>
                              <div className="mt-3 flex flex-col gap-2">
                                <button
                                  className="w-full rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition-all duration-200 hover:bg-blue-100"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markStatus(report.id, "REVIEWING");
                                  }}
                                >
                                  Mark as Reviewing
                                </button>
                                <button
                                  className="w-full rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 transition-all duration-200 hover:bg-amber-100"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markStatus(report.id, "FIXING");
                                  }}
                                >
                                  Mark as Fixing
                                </button>
                                <button
                                  className="w-full rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition-all duration-200 hover:bg-emerald-100"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markStatus(report.id, "FIXED");
                                  }}
                                >
                                  Mark as Fixed
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="px-4 py-10 text-center text-gray-500 sm:px-6 sm:py-12">
                  <p className="text-lg">No reports found</p>
                  <p className="text-sm mt-2">
                    Try adjusting your search or filter criteria
                  </p>
                </div>
              ))}
          </div>

          {/* Pagination */}
          {totalPages > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 px-4 py-4 border-t border-gray-200 sm:px-6">
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className={`px-4 py-2 text-base rounded transition-all duration-200 ${
                  currentPage === 1
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-gray-600 hover:bg-gray-100 hover:-translate-y-0.5 active:translate-y-0"
                }`}
              >
                Previous
              </button>
              {getPageNumbers().map((page, index) =>
                page === "..." ? (
                  <span
                    key={`ellipsis-${index}`}
                    className="px-3 text-gray-400 text-base"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`px-4 py-2 text-base rounded min-w-10 transition-all duration-200 ${
                      currentPage === page
                        ? "bg-blue-600 text-white font-medium"
                        : "text-gray-600 hover:bg-gray-100 hover:-translate-y-0.5 active:translate-y-0"
                    }`}
                  >
                    {page}
                  </button>
                ),
              )}
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 text-base rounded transition-all duration-200 ${
                  currentPage === totalPages
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-gray-600 hover:bg-gray-100 hover:-translate-y-0.5 active:translate-y-0"
                }`}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Add Report
              </h2>
              <button
                className="text-gray-400 hover:text-gray-600"
                onClick={() => {
                  setIsCreateOpen(false);
                  resetCreateForm();
                }}
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleCreateReport}
              className="px-6 py-5"
              noValidate
            >
              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Sender Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={createForm.senderEmail}
                    onChange={(e) =>
                      handleCreateFormChange("senderEmail", e.target.value)
                    }
                    className={inputCls(createFieldErrors, "senderEmail")}
                    placeholder="tenant@example.com"
                  />
                  {createFieldErrors.senderEmail && (
                    <p className="mt-1 text-xs text-red-600 font-medium">
                      {createFieldErrors.senderEmail}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Target <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={createForm.target}
                    onChange={(e) =>
                      handleCreateFormChange("target", e.target.value)
                    }
                    className={inputCls(createFieldErrors, "target")}
                    placeholder="Room / Service / Payment"
                  />
                  {createFieldErrors.target && (
                    <p className="mt-1 text-xs text-red-600 font-medium">
                      {createFieldErrors.target}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Content <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={createForm.content}
                    onChange={(e) =>
                      handleCreateFormChange("content", e.target.value)
                    }
                    className={inputCls(createFieldErrors, "content")}
                    placeholder="Describe the issue (min. 20 characters)"
                  />
                  <div className="flex justify-between mt-1">
                    {createFieldErrors.content ? (
                      <p className="text-xs text-red-600 font-medium">
                        {createFieldErrors.content}
                      </p>
                    ) : (
                      <span />
                    )}
                    <p
                      className={`text-xs ${createForm.content.length > 1900 ? "text-red-500" : "text-gray-400"}`}
                    >
                      {createForm.content.length}/2000
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Images (optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleCreateFiles(e.target.files)}
                    className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {createForm.images.length > 0 && (
                    <p className="mt-2 text-sm text-gray-500">
                      {createForm.images.length} image(s) selected
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => {
                    setIsCreateOpen(false);
                    resetCreateForm();
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {createLoading ? "Creating..." : "Create Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Edit Report
              </h2>
              <button
                className="text-gray-400 hover:text-gray-600"
                onClick={() => {
                  setIsEditOpen(false);
                  resetEditForm();
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditReport} className="px-6 py-5" noValidate>
              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Target <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.target}
                    onChange={(e) =>
                      handleEditFormChange("target", e.target.value)
                    }
                    className={inputCls(editFieldErrors, "target")}
                    placeholder="Room / Service / Payment"
                  />
                  {editFieldErrors.target && (
                    <p className="mt-1 text-xs text-red-600 font-medium">
                      {editFieldErrors.target}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Content <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={editForm.content}
                    onChange={(e) =>
                      handleEditFormChange("content", e.target.value)
                    }
                    className={inputCls(editFieldErrors, "content")}
                    placeholder="Describe the issue (min. 20 characters)"
                  />
                  <div className="flex justify-between mt-1">
                    {editFieldErrors.content ? (
                      <p className="text-xs text-red-600 font-medium">
                        {editFieldErrors.content}
                      </p>
                    ) : (
                      <span />
                    )}
                    <p
                      className={`text-xs ${editForm.content.length > 1900 ? "text-red-500" : "text-gray-400"}`}
                    >
                      {editForm.content.length}/2000
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Images (optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleEditFiles(e.target.files)}
                    className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {editForm.images.length > 0 && (
                    <p className="mt-2 text-sm text-gray-500">
                      {editForm.images.length} image(s) selected
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => {
                    setIsEditOpen(false);
                    resetEditForm();
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {editLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportManagement;
