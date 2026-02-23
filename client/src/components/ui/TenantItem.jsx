export default function TenantItem({ tenant }) {
  if (!tenant) return null;

  return (
    <div className="flex flex-col items-center gap-2">
      <img
        src={tenant.imageUrl && tenant.imageUrl.startsWith('http') ? tenant.imageUrl : 'https://ui-avatars.com/api/?name=' + encodeURIComponent(tenant.fullName || 'User') + '&background=3b82f6&color=fff&size=128'}
        className="w-12 h-12 rounded-full"
      />
      <div className="font-medium text-sm">{tenant.fullName || "Unknown"}</div>
      <div className="text-xs text-gray-500">Tenant</div>
    </div>
  );
}
