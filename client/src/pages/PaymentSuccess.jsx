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
  const [receipt, setReceipt] = useState(null);

  const formatMoney = (value) => {
    const num = Number(value || 0);
    return `${num.toLocaleString("vi-VN")} VND`;
  };

  const formatDate = (value) => {
    if (!value) return "N/A";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "N/A";
    return d.toLocaleString("vi-VN");
  };

  const formatStripeTimestamp = (unixTs) => {
    if (!unixTs) return "N/A";
    const ts = Number(unixTs);
    if (Number.isNaN(ts)) return "N/A";
    return new Date(ts * 1000).toLocaleString("vi-VN");
  };

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
        setReceipt(data?.receipt || null);
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
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto w-full max-w-4xl space-y-5">
        <div className="bg-white shadow-lg rounded-2xl p-6 sm:p-8 text-center border border-gray-200">
          <div className="text-5xl mb-3">✅</div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Payment successful
          </h1>
          <p className="mt-2 text-gray-600">
            Thank you! We have recorded your payment and updated the invoice.
          </p>

          {confirmState === "loading" && (
            <p className="mt-3 text-sm text-gray-500">
              Confirming payment status...
            </p>
          )}

          {confirmMessage && (
            <p
              className={`mt-3 text-sm font-medium ${
                confirmState === "success" ? "text-green-600" : "text-amber-600"
              }`}
            >
              {confirmMessage}
            </p>
          )}

          {sessionId && (
            <p className="mt-2 text-xs text-gray-400 break-all">
              Stripe Session: {sessionId}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
            >
              Back to Home
            </Link>
          </div>
        </div>

        {receipt && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">
                Payer Information
              </h2>
              <div className="text-sm space-y-2 text-gray-700">
                <div>
                  <span className="text-gray-500">Full name:</span>{" "}
                  <span className="font-medium">
                    {receipt?.payer?.fullName}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Email:</span>{" "}
                  <span className="font-medium break-all">
                    {receipt?.payer?.email}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Phone:</span>{" "}
                  <span className="font-medium">{receipt?.payer?.phone}</span>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">
                Transaction Information
              </h2>
              <div className="text-sm space-y-2 text-gray-700">
                <div>
                  <span className="text-gray-500">Session ID:</span>{" "}
                  <span className="font-medium break-all">
                    {receipt?.transaction?.sessionId || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Payment Intent:</span>{" "}
                  <span className="font-medium break-all">
                    {receipt?.transaction?.paymentIntentId || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Amount charged:</span>{" "}
                  <span className="font-semibold text-blue-600">
                    {formatMoney(
                      Number(receipt?.transaction?.amountTotal || 0) / 100,
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Payment status:</span>{" "}
                  <span className="font-medium uppercase">
                    {receipt?.transaction?.paymentStatus || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Checkout status:</span>{" "}
                  <span className="font-medium uppercase">
                    {receipt?.transaction?.checkoutStatus || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Paid at:</span>{" "}
                  <span className="font-medium">
                    {formatStripeTimestamp(receipt?.transaction?.paidAt)}
                  </span>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h2 className="text-lg font-semibold text-gray-900">
                  Invoice Details
                </h2>
                <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                  {receipt?.invoice?.status || "PAID"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-gray-700">
                <div>
                  <div className="text-gray-500">Invoice ID</div>
                  <div className="font-medium">#{receipt?.invoice?.id}</div>
                </div>
                <div>
                  <div className="text-gray-500">Billing period</div>
                  <div className="font-medium">
                    {receipt?.invoice?.month}/{receipt?.invoice?.year}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Created at</div>
                  <div className="font-medium">
                    {formatDate(receipt?.invoice?.createdAt)}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Boarding house</div>
                  <div className="font-medium">
                    {receipt?.invoice?.houseName}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Room</div>
                  <div className="font-medium">
                    {receipt?.invoice?.roomName}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Address</div>
                  <div className="font-medium">
                    {receipt?.invoice?.houseAddress}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b text-sm">
                  <span className="text-gray-600">Room fee</span>
                  <span className="font-medium text-gray-900">
                    {formatMoney(receipt?.invoice?.roomPrice)}
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5 border-b text-sm">
                  <span className="text-gray-600">Electric fee</span>
                  <span className="font-medium text-gray-900">
                    {formatMoney(receipt?.invoice?.electricCost)}
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5 border-b text-sm">
                  <span className="text-gray-600">Water fee</span>
                  <span className="font-medium text-gray-900">
                    {formatMoney(receipt?.invoice?.waterCost)}
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5 border-b text-sm">
                  <span className="text-gray-600">Service fee</span>
                  <span className="font-medium text-gray-900">
                    {formatMoney(receipt?.invoice?.serviceCost)}
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-3 bg-blue-50 text-sm">
                  <span className="font-semibold text-blue-700">Total</span>
                  <span className="font-bold text-blue-700">
                    {formatMoney(receipt?.invoice?.totalAmount)}
                  </span>
                </div>
              </div>
            </section>
          </div>
        )}

        {!receipt && confirmState === "success" && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 text-sm text-gray-600 text-center">
            Payment is confirmed, but detailed receipt data is not available.
          </div>
        )}

        {confirmState === "error" && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 text-center">
            We could not verify your payment automatically. If money has been
            deducted, please contact support and provide your Stripe Session ID.
          </div>
        )}
      </div>
    </div>
  );
}
