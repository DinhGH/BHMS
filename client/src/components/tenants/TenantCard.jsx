import "./TenantCard.css";
import defaultAvatar from "../../assets/default-avatar.png";
import { useNavigate } from "react-router-dom";

export default function TenantCard({ tenant }) {
  const navigate = useNavigate();

  return (
    <div className="tenant-card">
      <div className="tenant-image">
        <img
          src={tenant.imageUrl || defaultAvatar}
          alt={tenant.fullName || tenant.name}
        />
      </div>

      <div className="tenant-body">
        <h3 className="tenant-name">
          {tenant.fullName || tenant.full_name || tenant.name}
        </h3>

        <p>Gender : {tenant.gender}</p>
        <p>Age : {tenant.age}</p>
        <p>Stayed At : {tenant.room}</p>
        <p>Boarding House : {tenant.house}</p>
        <p>
          Moved-in Date :{" "}
          {tenant.moveInDate
            ? new Date(tenant.moveInDate).toLocaleDateString()
            : "—"}
        </p>

        <button
          className="view-detail"
          onClick={() => navigate(`/tenants/${tenant.id}`)}
        >
          View Detail →
        </button>

      </div>
    </div>
  );
}
