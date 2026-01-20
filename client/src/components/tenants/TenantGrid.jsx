import TenantCard from "./TenantCard";
import "./TenantGrid.css";

export default function TenantGrid({ tenants }) {
  if (!tenants || tenants.length === 0) {
    return <p className="empty">No tenants found</p>;
  }

  return (
    <div className="tenant-grid">
      {tenants.map(t => (
        <TenantCard key={t.tenant_id} tenant={t} />

      ))}
    </div>
  );
}
