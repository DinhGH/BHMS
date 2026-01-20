import { useEffect, useState } from "react";
import TenantCard from "../components/TenantCard";
import "./TenantManagement.css";

export default function TenantManagement() {
  const [tenants, setTenants] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/tenants")
      .then(res => res.json())
      .then(data => setTenants(data));
  }, []);

  return (
    <div className="tenant-page">
      <div className="tenant-header">
        <input placeholder="Search tenant..." />
        <button>Add New</button>
      </div>

      <div className="tenant-grid">
        {tenants.map(t => (
          <TenantCard key={t.id} tenant={t} />
        ))}
      </div>
    </div>
  );
}
