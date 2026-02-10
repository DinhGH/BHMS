export default function InfoBox({ label, value }) {
  return (
    <div className="border bg-white px-4 py-3 rounded-md">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}
