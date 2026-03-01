import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Loading from "./loading.jsx";
import { getPayments, updatePayment } from "../services/api";

const PAYMENT_METHODS = [
  { value: "QR_TRANSFER", label: "QR Transfer" },
  { value: "CASH", label: "Cash" },
  { value: "GATEWAY", label: "Gateway" },
];

const formatAmount = (amount) => {
  const value = Number(amount || 0);
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

const mapStatus = (invoiceStatus, confirmed) => {
  if (confirmed || invoiceStatus === "PAID") return "Paid";
  if (invoiceStatus === "OVERDUE") return "Overdue";
  return "Pending";
};

const formatMethod = (method) => {
  if (method === "GATEWAY") return "Gateway";
  if (method === "QR_TRANSFER") return "QR Transfer";
  if (method === "CASH") return "Cash";
  return method || "-";
};

const statusBadge = (status) => {
  if (status === "Paid") return "bg-green-100 text-green-800";
  if (status === "Overdue") return "bg-red-100 text-red-800";
  return "bg-amber-100 text-amber-800";
};

function PaymentManagement() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const [editingPayment, setEditingPayment] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    amount: "",
    method: "QR_TRANSFER",
    confirmed: false,
    proofFile: null,
    removeProof: false,
  });

  const itemsPerPage = 6;

  const loadPayments = async (isRefresh = false) => {
    setLoading(true);
    try {
      const data = await getPayments();
      setPayments(Array.isArray(data) ? data : []);
      if (isRefresh) toast.success("Payments refreshed.");
    } catch (err) {
      toast.error(err?.message || "Failed to load payments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const allPayments = useMemo(() => {
    return (payments || []).map((payment) => {
      const roomName = payment.roomName || "";
      const houseName = payment.houseName || "";
      const roomLabel = roomName
        ? `Room ${roomName}${houseName ? ` - Block ${houseName}` : ""}`
        : houseName
          ? `Block ${houseName}`
          : "-";

      return {
        id: payment.id,
        paymentId:
          payment.paymentId || `PAY${String(payment.id).padStart(3, "0")}`,
        author: payment.tenantName || "Unknown",
        room: roomLabel,
        roomName,
        houseName,
        dateCreated: payment.createdAt
          ? new Date(payment.createdAt).toLocaleDateString("vi-VN")
          : "-",
        createdAt: payment.createdAt || null,
        amount: formatAmount(payment.amount),
        rawAmount: Number(payment.amount || 0),
        status: mapStatus(payment.invoiceStatus, payment.confirmed),
        confirmed: !!payment.confirmed,
        method: formatMethod(payment.method),
        methodValue: payment.method,
        imageUrl: payment.img || payment.proofImage || "",
        invoiceId: payment.invoiceId,
        invoice: payment.invoice || {},
      };
    });
  }, [payments]);

  const filteredPayments = useMemo(() => {
    return allPayments.filter((payment) => {
      const q = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !q ||
        payment.author.toLowerCase().includes(q) ||
        payment.room.toLowerCase().includes(q) ||
        payment.paymentId.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "all" || payment.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [allPayments, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPayments = filteredPayments.slice(startIndex, endIndex);

  const selectedInvoice = selectedPayment?.invoice || {};
  const serviceItems = Array.isArray(selectedInvoice?.serviceItems)
    ? selectedInvoice.serviceItems
    : [];

  const handleOpenEdit = (payment) => {
    setEditingPayment(payment);
    setEditForm({
      amount: String(Number(payment.rawAmount || 0)),
      method: payment.methodValue || "QR_TRANSFER",
      confirmed: !!payment.confirmed,
      proofFile: null,
      removeProof: false,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingPayment) return;

    const amountValue = Number(editForm.amount);
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      toast.error("Amount must be greater than 0.");
      return;
    }

    setSavingEdit(true);
    try {
      await updatePayment(editingPayment.id, {
        amount: amountValue,
        method: editForm.method,
        confirmed: editForm.confirmed,
        proofFile: editForm.proofFile,
        removeProof: editForm.removeProof,
      });

      toast.success("Payment updated successfully.");
      setEditingPayment(null);
      await loadPayments(false);

      if (selectedPayment?.id === editingPayment.id) {
        setSelectedPayment(null);
      }
    } catch (err) {
      toast.error(err?.message || "Failed to update payment.");
    } finally {
      setSavingEdit(false);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i += 1) pages.push(i);
      return pages;
    }

    if (currentPage <= 3) {
      return [1, 2, 3, 4, "...", totalPages];
    }
    if (currentPage >= totalPages - 2) {
      return [
        1,
        "...",
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }
    return [
      1,
      "...",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "...",
      totalPages,
    ];
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 md:p-4 lg:p-6">
      <div className="w-full space-y-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Payments</h1>
          <p className="text-sm md:text-base text-gray-600">
            Manage payment confirmations and invoice breakdowns.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex-1 relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search by tenant, room, payment ID..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3">
              <div className="relative">
                <button
                  onClick={() => setShowFilterDropdown((prev) => !prev)}
                  className="px-4 py-2.5 rounded-lg bg-gray-600 text-white hover:bg-gray-700 transition-colors"
                >
                  Filter
                </button>

                {showFilterDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowFilterDropdown(false)}
                    />
                    <div className="absolute right-0 mt-2 z-20 w-52 bg-white border border-gray-200 rounded-lg shadow-lg p-2">
                      {["all", "Paid", "Pending", "Overdue"].map((f) => (
                        <button
                          key={f}
                          onClick={() => {
                            setStatusFilter(f);
                            setCurrentPage(1);
                            setShowFilterDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                            statusFilter === f
                              ? "bg-blue-50 text-blue-700 font-medium"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          {f === "all" ? "All" : f}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={() => {
                  setCurrentPage(1);
                  loadPayments(true);
                }}
                disabled={loading}
                className="px-4 py-2.5 rounded-lg bg-gray-600 text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        <Loading isLoading={loading} />

        {!loading && (
          <div className="text-sm text-gray-600">
            Showing {filteredPayments.length === 0 ? 0 : startIndex + 1} -{" "}
            {Math.min(endIndex, filteredPayments.length)} of {filteredPayments.length}
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading || currentPayments.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              {loading ? "Loading payments..." : "No payments found"}
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        Tenant
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        Payment ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        Method
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {currentPayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{payment.author}</div>
                          <div className="text-xs text-gray-500">{payment.room}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{payment.paymentId}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{payment.amount}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{payment.method}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{payment.dateCreated}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge(payment.status)}`}
                          >
                            {payment.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex gap-2">
                            <button
                              onClick={() => setSelectedPayment(payment)}
                              className="px-3 py-1.5 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm"
                            >
                              Details
                            </button>
                            <button
                              onClick={() => handleOpenEdit(payment)}
                              className="px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-sm"
                            >
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden divide-y divide-gray-200">
                {currentPayments.map((payment) => (
                  <div key={payment.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium text-gray-900">{payment.author}</div>
                        <div className="text-xs text-gray-500">{payment.room}</div>
                        <div className="text-xs text-gray-500 mt-1">{payment.paymentId}</div>
                      </div>
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge(payment.status)}`}
                      >
                        {payment.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700">{payment.amount}</div>
                    <div className="text-sm text-gray-600">{payment.method}</div>
                    <div className="text-xs text-gray-500">{payment.dateCreated}</div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedPayment(payment)}
                        className="flex-1 px-3 py-2 rounded-md border border-gray-200 text-gray-700"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => handleOpenEdit(payment)}
                        className="flex-1 px-3 py-2 rounded-md bg-blue-600 text-white"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 disabled:opacity-50"
            >
              Previous
            </button>

            {getPageNumbers().map((page, index) => (
              <button
                key={`${page}-${index}`}
                onClick={() => typeof page === "number" && setCurrentPage(page)}
                disabled={page === "..."}
                className={`min-w-10 px-3 py-2 text-sm rounded-lg ${
                  page === currentPage
                    ? "bg-blue-600 text-white"
                    : page === "..."
                      ? "text-gray-400"
                      : "border border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div
            className="absolute inset-0 bg-black/45"
            onClick={() => setSelectedPayment(null)}
          />

          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-xl border border-gray-200 max-h-[92vh] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Payment Details</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {selectedPayment.paymentId} - {selectedPayment.author}
                </p>
              </div>
              <button
                onClick={() => setSelectedPayment(null)}
                className="w-9 h-9 rounded-md text-gray-500 hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto max-h-[calc(92vh-72px)] space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="rounded-lg border border-gray-200 p-3 bg-gray-50">
                  <div className="text-xs text-gray-500">Method</div>
                  <div className="text-sm font-semibold text-gray-900 mt-1">{selectedPayment.method}</div>
                </div>
                <div className="rounded-lg border border-gray-200 p-3 bg-gray-50">
                  <div className="text-xs text-gray-500">Amount</div>
                  <div className="text-sm font-semibold text-gray-900 mt-1">{selectedPayment.amount}</div>
                </div>
                <div className="rounded-lg border border-gray-200 p-3 bg-gray-50">
                  <div className="text-xs text-gray-500">Status</div>
                  <div className="mt-1">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge(selectedPayment.status)}`}
                    >
                      {selectedPayment.status}
                    </span>
                  </div>
                </div>
                <div className="rounded-lg border border-gray-200 p-3 bg-gray-50">
                  <div className="text-xs text-gray-500">Created At</div>
                  <div className="text-sm font-semibold text-gray-900 mt-1">
                    {selectedPayment.createdAt
                      ? new Date(selectedPayment.createdAt).toLocaleString("vi-VN")
                      : "-"}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Invoice Breakdown</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
                    <div className="text-xs text-gray-500">Room Price</div>
                    <div className="text-sm font-semibold text-gray-900 mt-1">
                      {formatAmount(selectedInvoice?.roomPrice)}
                    </div>
                  </div>
                  <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
                    <div className="text-xs text-gray-500">Electricity</div>
                    <div className="text-sm font-semibold text-gray-900 mt-1">
                      {formatAmount(selectedInvoice?.electricCost)}
                    </div>
                  </div>
                  <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
                    <div className="text-xs text-gray-500">Water</div>
                    <div className="text-sm font-semibold text-gray-900 mt-1">
                      {formatAmount(selectedInvoice?.waterCost)}
                    </div>
                  </div>
                  <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
                    <div className="text-xs text-gray-500">Services</div>
                    <div className="text-sm font-semibold text-gray-900 mt-1">
                      {formatAmount(selectedInvoice?.serviceCost)}
                    </div>
                  </div>
                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                    <div className="text-xs text-blue-700">Total</div>
                    <div className="text-sm font-bold text-blue-800 mt-1">
                      {formatAmount(selectedInvoice?.totalAmount)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Service Details</h4>
                {serviceItems.length === 0 ? (
                  <div className="text-sm text-gray-500">No service items for this invoice.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-500 border-b border-gray-200">
                          <th className="py-2 pr-3">Service</th>
                          <th className="py-2 pr-3">Qty</th>
                          <th className="py-2 pr-3">Unit Price</th>
                          <th className="py-2">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {serviceItems.map((item, idx) => (
                          <tr key={item.id || idx} className="border-b last:border-b-0 border-gray-100">
                            <td className="py-2 pr-3 text-gray-900">
                              {item.name}
                              {item.unit ? (
                                <span className="ml-1 text-xs text-gray-500">({item.unit})</span>
                              ) : null}
                            </td>
                            <td className="py-2 pr-3 text-gray-700">{item.quantity || 1}</td>
                            <td className="py-2 pr-3 text-gray-700">{formatAmount(item.unitPrice)}</td>
                            <td className="py-2 text-gray-900 font-medium">{formatAmount(item.totalPrice)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Proof Image</h4>
                {selectedPayment.methodValue === "QR_TRANSFER" ? (
                  selectedPayment.imageUrl ? (
                    <a href={selectedPayment.imageUrl} target="_blank" rel="noreferrer" className="block w-full max-w-sm">
                      <img
                        src={selectedPayment.imageUrl}
                        alt="QR proof"
                        className="w-full h-52 object-cover rounded-lg border border-gray-200"
                      />
                      <div className="text-xs text-blue-600 mt-2">Click to open full image</div>
                    </a>
                  ) : (
                    <div className="text-sm text-gray-500">No proof image uploaded yet.</div>
                  )
                ) : (
                  <div className="text-sm text-gray-500">
                    Proof image is not required for Cash/Gateway payments.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {editingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="absolute inset-0 bg-black/45" onClick={() => !savingEdit && setEditingPayment(null)} />

          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Edit Payment</h3>
                <p className="text-xs text-gray-500 mt-0.5">{editingPayment.paymentId}</p>
              </div>
              <button
                onClick={() => !savingEdit && setEditingPayment(null)}
                disabled={savingEdit}
                className="w-9 h-9 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount</label>
                <input
                  type="number"
                  min="1"
                  step="1000"
                  value={editForm.amount}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      amount: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Method</label>
                <select
                  value={editForm.method}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      method: e.target.value,
                      removeProof:
                        e.target.value === "QR_TRANSFER" ? prev.removeProof : true,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmation</label>
                <select
                  value={String(editForm.confirmed)}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      confirmed: e.target.value === "true",
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="false">Unconfirmed</option>
                  <option value="true">Confirmed</option>
                </select>
              </div>

              {editForm.method === "QR_TRANSFER" && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Proof Image (QR only)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        proofFile: e.target.files?.[0] || null,
                        removeProof: false,
                      }))
                    }
                    className="block w-full text-sm text-gray-600 file:mr-3 file:px-3 file:py-2 file:border-0 file:rounded-md file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />

                  {!editForm.proofFile && editingPayment.imageUrl && !editForm.removeProof && (
                    <img
                      src={editingPayment.imageUrl}
                      alt="Current proof"
                      className="w-full max-w-xs h-36 object-cover rounded-lg border border-gray-200"
                    />
                  )}

                  <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={editForm.removeProof}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          removeProof: e.target.checked,
                          proofFile: e.target.checked ? null : prev.proofFile,
                        }))
                      }
                    />
                    Remove current proof image
                  </label>
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setEditingPayment(null)}
                disabled={savingEdit}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {savingEdit ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PaymentManagement;
