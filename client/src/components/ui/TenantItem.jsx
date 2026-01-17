export default function TenantItem({ tenant }) {
  const user = tenant.user;

  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
        {user?.avatar ? (
          <img
            src={user.avatar}
            alt={user.fullName}
            className="w-full h-full object-cover"
          />
        ) : (
          "👤"
        )}
      </div>

      <div className="text-sm font-medium">{user?.fullName || "Unknown"}</div>

      <div className="text-xs text-slate-500">Tenant</div>
    </div>
  );
}
