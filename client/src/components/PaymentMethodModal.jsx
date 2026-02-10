import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { getInvoiceDetails, confirmPayment } from "../services/invoiceApi";

export default function PaymentMethodModal() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const preMethod = searchParams.get("method") || null;

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(
    preMethod ? preMethod.toUpperCase() : null,
  );
  const [proofFile, setProofFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getInvoiceDetails(id)
      .then((data) => {
        if (mounted) setInvoice(data);
      })
      .catch((err) => setError(err.message || "Failed to load invoice"))
      .finally(() => mounted && setLoading(false));
    return () => (mounted = false);
  }, [id]);

  const handleChoose = (method) => {
    setSelected(method);
    setMessage(null);
  };

  const handleFileChange = (e) => {
    const f = e.target.files && e.target.files[0];
    setProofFile(f || null);
  };

  const handleSubmit = async () => {
    if (!selected) return setMessage("Please choose a payment method");
    setSubmitting(true);
    try {
      if (selected === "QR_TRANSFER") {
        if (!proofFile)
          return setMessage("Please upload proof image for QR transfer.");
        await confirmPayment(id, selected, proofFile);
      } else if (selected === "CASH") {
        await confirmPayment(id, selected, null);
      } else {
        return setMessage("Unsupported method");
      }
      setMessage("Payment method recorded. Owner will confirm soon.");
    } catch (err) {
      setMessage(err.message || "Failed to update payment method");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: 20 }}>Loading invoice...</div>;
  if (error) return <div style={{ padding: 20, color: "red" }}>{error}</div>;
  if (!invoice) return <div style={{ padding: 20 }}>Invoice not found</div>;

  return (
    <div style={{ padding: 20, maxWidth: 720, margin: "0 auto" }}>
      <h2>Invoice #{invoice.id}</h2>
      <p>
        <strong>Room:</strong> {invoice.Room?.name || "-"} - {invoice.month}/
        {invoice.year}
      </p>
      <p>
        <strong>Total:</strong> {invoice.totalAmount}
      </p>

      {invoice.imageUrl && (
        <div style={{ margin: "1rem 0" }}>
          <img
            src={invoice.imageUrl}
            alt="invoice-qr"
            style={{ maxWidth: "100%" }}
          />
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <div>
          <label>
            <input
              type="radio"
              name="method"
              checked={selected === "QR_TRANSFER"}
              onChange={() => handleChoose("QR_TRANSFER")}
            />
            Pay by QR Transfer (upload proof)
          </label>
        </div>
        <div style={{ marginTop: 8 }}>
          <label>
            <input
              type="radio"
              name="method"
              checked={selected === "CASH"}
              onChange={() => handleChoose("CASH")}
            />
            Pay by Cash
          </label>
        </div>

        {selected === "QR_TRANSFER" && (
          <div style={{ marginTop: 12 }}>
            <input type="file" accept="image/*" onChange={handleFileChange} />
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Payment Method"}
          </button>
        </div>

        {message && (
          <div
            style={{
              marginTop: 12,
              color: message.includes("fail") ? "red" : "green",
            }}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
