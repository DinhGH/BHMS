import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { getInvoiceDetails, confirmPayment } from "../services/invoiceApi";

export default function PaymentMethodModal() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const preMethod = searchParams.get("method");

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(preMethod?.toUpperCase() || "");
  const [proofFile, setProofFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    getInvoiceDetails(id)
      .then(setInvoice)
      .catch((err) => setError(err.message || "Failed to load invoice"))
      .finally(() => setLoading(false));
  }, [id]);

  // Cleanup preview URL tránh leak bộ nhớ
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleSubmit = async () => {
    if (!selected) return setMessage("Vui lòng chọn phương thức thanh toán");

    setSubmitting(true);
    setMessage("");

    try {
      if (selected === "QR_TRANSFER") {
        if (!proofFile)
          return setMessage("Vui lòng tải lên ảnh minh chứng chuyển khoản");
        await confirmPayment(id, selected, proofFile);
      } else if (selected === "CASH") {
        await confirmPayment(id, selected, null);
      }
      setMessage("Đã gửi thông tin thanh toán. Chủ trọ sẽ xác nhận sớm.");
    } catch (err) {
      setMessage(err.message || "Thanh toán thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen text-gray-600">
        Đang tải...
      </div>
    );

  if (error)
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        {error}
      </div>
    );

  if (!invoice)
    return (
      <div className="flex justify-center items-center h-screen text-gray-600">
        Không tìm thấy hóa đơn
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-6 space-y-5 border border-gray-100">
        <h2 className="text-2xl font-bold text-center text-gray-800">
          Hóa đơn #{invoice.id}
        </h2>

        {/* Thông tin hóa đơn */}
        <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-1 border">
          <p>
            <span className="font-semibold">Phòng:</span> {invoice.Room?.name}
          </p>
          <p>
            <span className="font-semibold">Tháng:</span> {invoice.month}/
            {invoice.year}
          </p>
          <p className="text-lg font-bold text-green-600">
            Tổng tiền: ${invoice.totalAmount}
          </p>
        </div>

        {/* QR của chủ trọ (nếu có) */}
        {invoice.imageUrl && (
          <div className="text-center">
            <img
              src={invoice.imageUrl}
              alt="QR Code"
              className="mx-auto w-40 rounded-lg border shadow-sm"
            />
            <p className="text-xs text-gray-500 mt-2">
              Quét mã QR để chuyển khoản
            </p>
          </div>
        )}

        {/* Chọn phương thức */}
        <div className="space-y-3">
          <p className="font-semibold text-gray-700">
            Chọn phương thức thanh toán
          </p>

          <label
            className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition 
            ${
              selected === "QR_TRANSFER"
                ? "border-indigo-500 bg-indigo-50"
                : "border-gray-200 hover:bg-gray-50"
            }`}
          >
            <input
              type="radio"
              checked={selected === "QR_TRANSFER"}
              onChange={() => setSelected("QR_TRANSFER")}
            />
            <span>Chuyển khoản ngân hàng (tải ảnh minh chứng)</span>
          </label>

          <label
            className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition 
            ${
              selected === "CASH"
                ? "border-indigo-500 bg-indigo-50"
                : "border-gray-200 hover:bg-gray-50"
            }`}
          >
            <input
              type="radio"
              checked={selected === "CASH"}
              onChange={() => setSelected("CASH")}
            />
            <span>Thanh toán tiền mặt</span>
          </label>

          {/* Upload ảnh khi chọn chuyển khoản */}
          {selected === "QR_TRANSFER" && (
            <div className="space-y-3">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  setProofFile(file);

                  if (file) {
                    const url = URL.createObjectURL(file);
                    setPreviewUrl(url);
                  }
                }}
                className="block w-full text-sm text-gray-500
                           file:mr-4 file:py-2 file:px-4
                           file:rounded-lg file:border-0
                           file:text-sm file:font-semibold
                           file:bg-indigo-50 file:text-indigo-700
                           hover:file:bg-indigo-100"
              />

              {previewUrl && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Ảnh minh chứng:</p>
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full max-h-64 object-contain rounded-lg border shadow-sm"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Nút submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
        >
          {submitting ? "Đang xử lý..." : "Xác nhận thanh toán"}
        </button>

        {/* Thông báo */}
        {message && (
          <div
            className={`text-center text-sm font-medium ${
              message.includes("thất") ? "text-red-500" : "text-green-600"
            }`}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
