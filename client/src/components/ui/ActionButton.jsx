export default function ActionButton({ label, danger = false, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-8 py-2 text-sm rounded-md transition ${
        danger
          ? "bg-slate-200 text-red-600 hover:bg-red-100"
          : "bg-slate-200 text-slate-800 hover:bg-slate-300"
      }`}
    >
      {label}
    </button>
  );
}
