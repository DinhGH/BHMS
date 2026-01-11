export default function Tile({ title, children }) {
  return (
    <div className="rounded-lg bg-white border border-slate-200 p-4 hover:shadow-md transition cursor-pointer">
      <div className="h-7 w-7 rounded border-2 border-slate-400 bg-black mb-4" />
      <div className="text-sm font-semibold text-slate-800 mb-3">{title}</div>
      <div className="space-y-2">
        <div className="h-3 bg-black rounded w-full" />
        <div className="h-3 bg-black rounded w-4/5" />
        {children}
      </div>
    </div>
  );
}
