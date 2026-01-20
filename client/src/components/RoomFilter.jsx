import { useEffect, useRef } from "react";

const ROOM_STATUS = ["ALL", "EMPTY", "OCCUPIED", "LOCKED"];
const PAYMENT_STATUS = [
  "ALL",
  "NO_TENANT",
  "NO_INVOICE",
  "PENDING",
  "PAID",
  "OVERDUE",
];

export default function RoomFilter({ filters, setFilters }) {
  const initialized = useRef(false);

  /* ===== LOAD FILTER FROM URL (ONCE) ===== */
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const params = new URLSearchParams(window.location.search);

    const minPrice = params.get("minPrice");
    const maxPrice = params.get("maxPrice");
    const status = params.get("status");
    const paymentStatus = params.get("paymentStatus");

    setFilters((prev) => ({
      ...prev,

      priceRange:
        minPrice && maxPrice
          ? { min: Number(minPrice), max: Number(maxPrice) }
          : prev.priceRange,

      roomStatus: ROOM_STATUS.includes(status) ? status : prev.roomStatus,

      paymentStatus: PAYMENT_STATUS.includes(paymentStatus)
        ? paymentStatus
        : prev.paymentStatus,
    }));
  }, [setFilters]);

  /* ===== UPDATE URL ===== */
  const updateURL = (next) => {
    const params = new URLSearchParams();

    if (next.priceRange) {
      params.set("minPrice", next.priceRange.min);
      params.set("maxPrice", next.priceRange.max);
    }

    if (next.roomStatus !== "ALL") {
      params.set("status", next.roomStatus);
    }

    if (next.paymentStatus !== "ALL") {
      params.set("paymentStatus", next.paymentStatus);
    }

    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}?${params.toString()}`,
    );
  };

  const updateFilters = (next) => {
    setFilters(next);
    updateURL(next);
  };

  return (
    <div className="flex flex-wrap gap-3">
      {/* ===== PRICE ===== */}
      <select
        className="border px-3 py-2 rounded-md text-sm"
        value={
          filters.priceRange
            ? `${filters.priceRange.min}-${filters.priceRange.max}`
            : ""
        }
        onChange={(e) => {
          const value = e.target.value;
          updateFilters({
            ...filters,
            priceRange: value
              ? (() => {
                  const [min, max] = value.split("-").map(Number);
                  return { min, max };
                })()
              : null,
          });
        }}
      >
        <option value="">All prices</option>
        <option value="0-50">0 - 50</option>
        <option value="0-100">0 - 100</option>
        <option value="100-200">100 - 200</option>
        <option value="200-500">200 - 500</option>
      </select>

      {/* ===== ROOM STATUS ===== */}
      <select
        className="border px-3 py-2 rounded-md text-sm"
        value={filters.roomStatus}
        onChange={(e) =>
          updateFilters({ ...filters, roomStatus: e.target.value })
        }
      >
        <option value="ALL">All status</option>
        <option value="EMPTY">Empty</option>
        <option value="OCCUPIED">Occupied</option>
        <option value="LOCKED">Locked</option>
      </select>

      {/* ===== PAYMENT ===== */}
      <select
        className="border px-3 py-2 rounded-md text-sm"
        value={filters.paymentStatus}
        onChange={(e) =>
          updateFilters({ ...filters, paymentStatus: e.target.value })
        }
      >
        <option value="ALL">All payment</option>
        <option value="NO_TENANT">No tenant</option>
        <option value="NO_INVOICE">No invoice</option>
        <option value="PENDING">Unpaid</option>
        <option value="PAID">Paid</option>
        <option value="OVERDUE">Overdue</option>
      </select>
    </div>
  );
}
