import { useEffect, useState, useRef } from "react";
import {
  previewInvoice,
  sendInvoice,
  createInvoiceWithQr,
} from "../services/invoiceApi";
import { getRoomDetail } from "../services/boardingHouse";
import toast from "react-hot-toast";
import { ChevronDown, AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import ActionButton from "./ui/ActionButton.jsx";
import EditRoomModal from "./EditRoomModal.jsx";

export default function InvoicePreviewModal({ room, open, onClose }) {
  const [data, setData] = useState(null);
  const fileInputRef = useRef(null);
  const [roomDetail, setRoomDetail] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [warning, setWarning] = useState(null);
  const [error, setError] = useState(null);
  const [showServices, setShowServices] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  /* =========================
     VALIDATION HELPERS
  ========================= */

  const validateInvoiceData = (invoiceData) => {
    const errors = [];

    if (!invoiceData) {
      errors.push("Invoice data is missing");
      return errors;
    }

    // Validate number of tenants
    if (
      invoiceData.numberOfTenants === 0 ||
      invoiceData.numberOfTenants === null
    ) {
      errors.push("Room has no active rental contract");
    }

    // Validate total amount
    if (
      !invoiceData.total ||
      invoiceData.total <= 0 ||
      isNaN(invoiceData.total)
    ) {
      errors.push("Invalid invoice total amount");
    }

    // Validate room price
    if (invoiceData.roomPrice < 0 || isNaN(invoiceData.roomPrice)) {
      errors.push("Invalid room price");
    }

    // Validate electric cost
    if (invoiceData.electricCost < 0 || isNaN(invoiceData.electricCost)) {
      errors.push("Invalid electric cost calculation");
    }

    // Validate water cost
    if (invoiceData.waterCost < 0 || isNaN(invoiceData.waterCost)) {
      errors.push("Invalid water cost calculation");
    }

    // Validate service cost
    if (invoiceData.serviceCost < 0 || isNaN(invoiceData.serviceCost)) {
      errors.push("Invalid service cost calculation");
    }

    // Validate services array
    if (invoiceData.services && !Array.isArray(invoiceData.services)) {
      errors.push("Invalid services data format");
    }

    // Validate individual services
    if (invoiceData.services && Array.isArray(invoiceData.services)) {
      invoiceData.services.forEach((service, index) => {
        if (!service.name) {
          errors.push(`Service #${index + 1} is missing a name`);
        }
        if (service.quantity <= 0 || isNaN(service.quantity)) {
          errors.push(`Service "${service.name}" has invalid quantity`);
        }
        if (service.total < 0 || isNaN(service.total)) {
          errors.push(`Service "${service.name}" has invalid total`);
        }
      });
    }

    // Check for potential calculation mismatch
    const calculatedTotal =
      (invoiceData.roomPrice || 0) +
      (invoiceData.electricCost || 0) +
      (invoiceData.waterCost || 0) +
      (invoiceData.serviceCost || 0);

    const difference = Math.abs(calculatedTotal - (invoiceData.total || 0));
    if (difference > 0.01) {
      // Allow for floating point precision
      errors.push(
        `Total calculation mismatch: Expected ${format(calculatedTotal)}, got ${format(invoiceData.total)}`,
      );
    }

    return errors;
  };

  const validateFileUpload = (selectedFile) => {
    const errors = [];

    if (!selectedFile) {
      return errors; // File is optional, so no file is valid
    }

    // Check file type
    if (!selectedFile.type.startsWith("image/")) {
      errors.push("Only image files are allowed for QR codes");
    }

    // Check file size (2MB limit)
    if (selectedFile.size > 2 * 1024 * 1024) {
      errors.push("QR image must be under 2MB");
    }

    // Additional validation for common image formats
    const allowedFormats = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];
    if (selectedFile.type && !allowedFormats.includes(selectedFile.type)) {
      errors.push("QR image must be JPEG, PNG, or WebP format");
    }

    return errors;
  };

  /* =========================
     LOAD PREVIEW
  ========================= */

  useEffect(() => {
    if (!open || !room?.id) return;

    const loadPreview = async () => {
      try {
        setLoadingPreview(true);
        setError(null);
        setData(null);
        setValidationErrors([]);
        setWarning(null);
        setFile(null);

        const res = await previewInvoice(room.id);

        // Validate response structure
        if (!res || typeof res !== "object") {
          throw new Error("Invalid invoice data received from server");
        }

        // Run comprehensive validation
        const errors = validateInvoiceData(res);

        if (errors.length > 0) {
          setValidationErrors(errors);

          // If critical errors (no tenants or invalid total), set as error
          const criticalErrors = errors.filter(
            (e) =>
              e.includes("no active rental contract") ||
              e.includes("Invalid invoice total"),
          );

          if (criticalErrors.length > 0) {
            setError(criticalErrors[0]);
          } else {
            // Non-critical errors shown as warnings
            setWarning(errors.join("; "));
          }
        }

        setData(res);
      } catch (err) {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Unable to load invoice preview. Please try again.";

        setError(message);
        toast.error(message);
      } finally {
        setLoadingPreview(false);
      }
    };

    loadPreview();
  }, [open, room?.id]);
  const fetchRoomDetail = async () => {
    try {
      setLoading(true);
      const res = await getRoomDetail(room?.id);
      setRoomDetail(res);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load room detail");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     SEND INVOICE
  ========================= */

  const handleSend = async () => {
    try {
      if (!data) {
        toast.error("Invoice data not loaded");
        return;
      }

      if (!file) {
        toast.error("Please upload owner QR code before sending invoice");
        return;
      }
      const errors = validateInvoiceData(data);

      const criticalErrors = errors.filter(
        (e) =>
          e.includes("no active rental contract") ||
          e.includes("Invalid invoice total"),
      );

      if (criticalErrors.length > 0) {
        toast.error(criticalErrors[0]);
        return;
      }

      if (file) {
        const fileErrors = validateFileUpload(file);
        if (fileErrors.length > 0) {
          toast.error(fileErrors[0]);
          return;
        }
      }

      setLoading(true);
      setWarning(null);

      const request = file
        ? createInvoiceWithQr(room.id, file)
        : sendInvoice(room.id);

      const response = await toast.promise(request, {
        loading: "Sending invoice...",
        success: "Invoice sent successfully!",
        error: "Failed to send invoice",
      });

      if (response?.data?.warning) {
        setWarning(response.data.warning);
        setTimeout(() => {
          onClose();
        }, 3000);
        return;
      }

      onClose();
    } catch (err) {
      console.error("Invoice send error:", err);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     FILE HANDLING
  ========================= */

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];

    if (!selected) {
      setFile(null);
      return;
    }

    const errors = validateFileUpload(selected);

    if (errors.length > 0) {
      toast.error(errors[0]);
      e.target.value = ""; // Reset input
      setFile(null);
      return;
    }

    setFile(selected);
    toast.success("QR image uploaded successfully");
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /* =========================
     FORMAT SAFE
  ========================= */

  const format = (n) => {
    if (n === null || n === undefined || isNaN(n)) return "0đ";
    return Number(n).toLocaleString("vi-VN") + "đ";
  };

  /* =========================
     RENDER CONDITIONS
  ========================= */

  if (!open) return null;

  const canSend =
    data &&
    data.numberOfTenants > 0 &&
    data.total > 0 &&
    !isNaN(data.total) &&
    validationErrors.filter(
      (e) =>
        e.includes("no active rental contract") ||
        e.includes("Invalid invoice total"),
    ).length === 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-bold text-gray-800">Invoice Preview</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* LOADING STATE */}
          {loadingPreview && (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
              <p className="text-sm text-gray-500 animate-pulse">
                Loading invoice preview...
              </p>
            </div>
          )}

          {/* ERROR STATE */}
          {error && !loadingPreview && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start space-x-3">
              <AlertCircle
                className="text-red-600 flex-shrink-0 mt-0.5"
                size={20}
              />
              <div className="flex-1">
                <h3 className="font-semibold text-red-800 mb-1">
                  Error Loading Invoice
                </h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* VALIDATION WARNINGS (Non-critical) */}
          {!loadingPreview && !error && validationErrors.length > 0 && data && (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 space-y-2">
              <div className="flex items-start space-x-3">
                <AlertCircle
                  className="text-amber-600 flex-shrink-0 mt-0.5"
                  size={20}
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-800 mb-2">
                    Validation Warnings
                  </h3>
                  <ul className="space-y-1 text-sm text-amber-700">
                    {validationErrors.map((err, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{err}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* SUCCESS STATE */}
          {!loadingPreview && !error && data && (
            <>
              {/* SERVER WARNING */}
              {warning && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 flex items-start space-x-3">
                  <Info
                    className="text-blue-600 flex-shrink-0 mt-0.5"
                    size={20}
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-800 mb-1">Notice</h3>
                    <p className="text-sm text-blue-700">{warning}</p>
                  </div>
                </div>
              )}

              {/* ROOM INFO */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-5 rounded-xl border border-slate-200 space-y-3">
                <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
                  Room Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Room:</span>
                    <span className="font-semibold text-gray-900">
                      {room?.name || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Active Tenants:</span>
                    <span className="font-semibold text-gray-900">
                      {data.numberOfTenants || 0}
                      {data.numberOfTenants === 0 && (
                        <span className="ml-2 text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                          No Contract
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* COST BREAKDOWN */}
              <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
                    Cost Breakdown
                  </h3>
                </div>

                <div className="divide-y divide-gray-200">
                  <div className="flex justify-between items-center p-4 hover:bg-gray-50 transition-colors">
                    <span className="text-gray-700">Room Price</span>
                    <span className="font-medium text-gray-900">
                      {format(data.roomPrice)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-4 hover:bg-gray-50 transition-colors">
                    <span className="text-gray-700">Electric Cost</span>
                    <span className="font-medium text-gray-900">
                      {format(data.electricCost)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-4 hover:bg-gray-50 transition-colors">
                    <span className="text-gray-700">Water Cost</span>
                    <span className="font-medium text-gray-900">
                      {format(data.waterCost)}
                    </span>
                  </div>

                  {/* SERVICES ACCORDION */}
                  <div>
                    <button
                      onClick={() => setShowServices(!showServices)}
                      className="w-full flex justify-between items-center p-4 hover:bg-gray-50 transition-colors"
                    >
                      <span className="font-medium text-gray-700">
                        Service Cost
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-gray-900">
                          {format(data.serviceCost)}
                        </span>
                        <ChevronDown
                          size={18}
                          className={`text-gray-500 transition-transform duration-200 ${
                            showServices ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </button>

                    {showServices && (
                      <div className="bg-slate-50 border-t border-gray-200 p-4">
                        {data.services && data.services.length > 0 ? (
                          <div className="space-y-2">
                            {data.services.map((service, index) => (
                              <div
                                key={index}
                                className="flex justify-between items-center text-sm bg-white rounded-lg px-3 py-2 border border-gray-200"
                              >
                                <div className="flex items-center space-x-2">
                                  <CheckCircle2
                                    size={14}
                                    className="text-green-600"
                                  />
                                  <span className="text-gray-700">
                                    {service.name}
                                    <span className="text-gray-500 ml-1">
                                      × {service.quantity || 1}
                                    </span>
                                  </span>
                                </div>
                                <span className="font-medium text-gray-900">
                                  {format(service.total)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-sm text-gray-500">
                            <Info size={16} className="inline-block mb-1" />
                            <p>No additional services</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* TOTAL */}
                  <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 border-t-2 border-blue-300">
                    <span className="font-bold text-blue-900 text-lg">
                      Total
                    </span>
                    <span className="font-bold text-blue-900 text-lg">
                      {format(data.total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* QR UPLOAD */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">
                  Owner QR Code{" "}
                  <span className="text-gray-400 font-normal">(Optional)</span>
                </label>

                {!file ? (
                  <div className="relative">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleFileChange}
                      className="w-full border-2 border-dashed border-gray-300 rounded-lg px-4 py-3 text-sm
                        file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0
                        file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100 cursor-pointer hover:border-blue-400 transition-colors"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Supported formats: JPEG, PNG, WebP (max 2MB)
                    </p>
                  </div>
                ) : (
                  <div className="bg-green-50 border-2 border-green-300 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 size={18} className="text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-800">
                          {file.name}
                        </p>
                        <p className="text-xs text-green-600">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveFile}
                      className="text-red-600 hover:text-red-800 transition-colors"
                      aria-label="Remove file"
                    >
                      <X size={20} />
                    </button>
                  </div>
                )}
              </div>

              {/* ACTIONS */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="px-5 py-2.5 border-2 border-gray-300 rounded-lg font-medium text-gray-700 
                    hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50 
                    disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <ActionButton
                  label="Edit Contract"
                  variant="info"
                  onClick={() => setShowEdit(true)}
                />
                {/* EDIT MODAL */}
                {showEdit && (
                  <EditRoomModal
                    open={showEdit}
                    room={room}
                    onClose={() => setShowEdit(false)}
                    onUpdated={fetchRoomDetail}
                  />
                )}
                <button
                  onClick={handleSend}
                  disabled={loading || !canSend}
                  className={`px-5 py-2.5 rounded-lg font-medium transition-all
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${
                      canSend
                        ? "bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  title={
                    !canSend
                      ? "Cannot send invoice due to validation errors"
                      : ""
                  }
                >
                  {loading ? (
                    <span className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Sending...</span>
                    </span>
                  ) : (
                    "Send Invoice"
                  )}
                </button>
              </div>
            </>
          )}

          {/* EMPTY STATE (no data and no loading/error) */}
          {!loadingPreview && !error && !data && (
            <div className="text-center py-12 text-gray-500">
              <AlertCircle size={48} className="mx-auto mb-4 text-gray-400" />
              <p>No invoice data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
