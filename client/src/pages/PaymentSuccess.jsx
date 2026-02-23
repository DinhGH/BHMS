import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export default function PaymentSuccess() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const sessionId = params.get("session_id");

  const [confirmState, setConfirmState] = useState("idle");
  const [confirmMessage, setConfirmMessage] = useState("");

  useEffect(() => {
    const confirmPayment = async () => {
      if (!sessionId) {
        setConfirmState("missing_session");
        setConfirmMessage(
          "Missing payment session ID. Please contact support if your invoice is still pending.",
        );
        return;
      }

      setConfirmState("loading");

      try {
        const res = await fetch(
          `${API_BASE_URL}/api/payments/confirm-session`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ sessionId }),
          },
        );

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data?.message || "Failed to confirm payment");
        }

        setConfirmState("success");
        setConfirmMessage(data?.message || "Invoice status updated to PAID.");
      } catch (error) {
        setConfirmState("error");
        setConfirmMessage(
          error?.message ||
            "Could not auto-confirm payment. Please contact support.",
        );
      }
    };

    confirmPayment();
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white shadow-lg rounded-2xl p-8 max-w-lg w-full text-center">
        <div className="text-4xl mb-3">✅</div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Payment successful
        </h1>
        <p className="mt-2 text-slate-600">
          Your invoice has been recorded. Thank you for your payment.
        </p>

        {confirmState === "loading" && (
          <p className="mt-3 text-sm text-slate-500">
            Confirming payment status...
          </p>
        )}

        {confirmMessage && (
          <p
            className={`mt-3 text-sm ${
              confirmState === "success" ? "text-green-600" : "text-amber-600"
            }`}
          >
            {confirmMessage}
          </p>
        )}

        {sessionId && (
          <p className="mt-2 text-xs text-slate-400">Session: {sessionId}</p>
        )}
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
