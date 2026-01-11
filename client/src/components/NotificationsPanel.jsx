import { useEffect, useMemo, useState } from "react";
import { getNotifications } from "../services/api";

function timeAgo(dateStr) {
  const dt = new Date(dateStr);
  const diff = Math.floor((Date.now() - dt.getTime()) / 1000);
  const map = [
    [60, "sec"],
    [60, "min"],
    [24, "hr"],
    [7, "day"],
  ];
  let val = diff;
  let unit = "sec";
  for (const [base, name] of map) {
    if (val < base) {
      unit = name;
      break;
    }
    val = Math.floor(val / base);
    unit = name;
  }
  return `${val} ${unit}${val > 1 ? "s" : ""} ago`;
}

export default function NotificationsPanel({ userId }) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);

  const debouncedQ = useMemo(() => q, [q]);

  useEffect(() => {
    let isMounted = true;
    getNotifications(userId, debouncedQ)
      .then((res) => {
        if (isMounted) setItems(res);
      })
      .catch(() => setItems([]));
    return () => {
      isMounted = false;
    };
  }, [userId, debouncedQ]);

  return (
    <aside className="w-full h-full border-l border-slate-200 bg-white flex flex-col">
      <div className="h-12 justify-center px-3 flex items-center sm:px-4 border-y border-slate-200 font-semibold text-sm sm:text-base">
        Notifications
      </div>
      <div className="p-3 sm:p-4 border-b border-slate-200">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search for..."
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="flex-1 px-3 sm:px-4 pb-4 overflow-y-auto">
        <div className="space-y-3">
          {items.map((n) => (
            <div
              key={n.id}
              className="rounded-md border border-slate-200 p-3 bg-slate-50"
            >
              <div className="text-[11px] text-slate-500 mb-1">
                {timeAgo(n.createdAt)}
              </div>
              <div className="text-sm font-medium text-slate-800">
                {n.title}
              </div>
              <div className="text-sm text-slate-600 line-clamp-3">
                {n.content}
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="text-sm text-slate-500">
              No notifications found.
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
