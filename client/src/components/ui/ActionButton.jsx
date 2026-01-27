export default function ActionButton({
  label,
  variant = "default",
  disabled = false,
  onClick,
}) {
  const base =
    "px-5 py-2.5 text-sm rounded-md font-semibold transition-all duration-200 " +
    "focus:outline-none focus:ring-2 focus:ring-offset-2 " +
    "shadow-sm hover:shadow disabled:shadow-none";

  const variants = {
    default:
      "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 " +
      "focus:ring-gray-400 active:bg-gray-100",

    success:
      "bg-emerald-600 text-white hover:bg-emerald-700 " +
      "focus:ring-emerald-500 active:bg-emerald-800 border border-emerald-600",

    info:
      "bg-blue-600 text-white hover:bg-blue-700 " +
      "focus:ring-blue-500 active:bg-blue-800 border border-blue-600",

    warning:
      "bg-amber-500 text-white hover:bg-amber-600 " +
      "focus:ring-amber-400 active:bg-amber-700 border border-amber-500",

    danger:
      "bg-red-600 text-white hover:bg-red-700 " +
      "focus:ring-red-500 active:bg-red-800 border border-red-600",
  };

  const disabledStyle =
    "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed " +
    "hover:bg-gray-100 opacity-60";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${disabled ? disabledStyle : variants[variant]}`}
    >
      {label}
    </button>
  );
}
