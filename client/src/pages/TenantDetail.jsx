import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import defaultAvatar from "../assets/default-avatar.png";
import "./TenantDetail.css";

const API = "http://localhost:3000/api/tenants";

export default function TenantDetail() {
  const { id } = useParams();
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);


  // fetch tenant
  useEffect(() => {
  fetch(`${API}/${id}`)
    .then(res => {
      if (!res.ok) throw new Error("Tenant not found");
      return res.json();
    })
    .then(res => {
  const data = res.data ?? res;

  setTenant({
    id: data.tenant_id,
    fullName: data.full_name,
    gender: data.gender,
    room: data.room,
    house: data.house,
    moveInDate: data.move_in_date,
    dob: data.dob,
    email: data.email,
    address: data.address,
    avatarUrl: data.image_url
  });
})

    .catch(() => setTenant(null))
    .finally(() => setLoading(false));
}, [id]);



  // handle input change
  const handleChange = e => {
    const { name, value } = e.target;
    setTenant(prev => ({ ...prev, [name]: value }));
  };

  // update tenant
  const handleUpdate = async () => {
  try {
    const res = await fetch(`${API}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tenant)
    });

    if (!res.ok) throw new Error("Update failed");

    alert("Tenant updated successfully");
    } catch (err) {
    alert("Failed to update tenant");
    console.error(err);
  }
};

  if (loading) return <p>Loading...</p>;
  if (!tenant) return <p>Tenant not found</p>;

const handleAvatarUpload = async e => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("avatar", file);

  try {
    setUploading(true);

    const res = await fetch(`${API}/${id}/avatar`, {
      method: "POST",
      body: formData
    });

    if (!res.ok) throw new Error("Upload failed");

    const result = await res.json();

    // update avatar in UI only
    setTenant(prev => ({
      ...prev,
      avatarUrl: result.imageUrl
    }));

  } catch (err) {
    alert("Avatar upload failed");
    console.error(err);
  } finally {
    setUploading(false);
  }
};


  return (
  <div className="tenant-detail-page">
    {/* HEADER */}
    <div className="tenant-detail-header">
      <div>
        <h2>{tenant.fullName}</h2>
        <p className="subtitle">
          Room {tenant.room} - {tenant.house}
        </p>
      </div>

      <div className="header-actions">
        <button className="btn">View History Renting</button>
        <button className="btn primary" onClick={handleUpdate}>
          Update
        </button>
      </div>
    </div>

    {/* CONTENT */}
    <div className="tenant-detail-content">
      {/* LEFT */}
      <div className="tenant-avatar-card">
        <div className="avatar-placeholder">
          <img
            src={tenant.avatarUrl || defaultAvatar}
            alt="Avatar"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>

        <span className="avatar-label">Avatar</span>

        <div className="avatar-actions">
          <label className="btn upload">
  {uploading ? "Uploading..." : "Upload"}
  <input
    type="file"
    accept="image/*"
    hidden
    onChange={handleAvatarUpload}
  />
</label>

          <button className="btn danger">Delete</button>
        </div>

      </div>

      {/* RIGHT */}
      <div className="tenant-form">
        <div className="form-row">
          <div className="form-group">
            <label>First Name</label>
            <input
              name="firstName"
              value={tenant.firstName || ""}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Last Name</label>
            <input
              name="lastName"
              value={tenant.lastName || ""}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Address</label>
          <input
            name="address"
            value={tenant.address || ""}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            name="email"
            value={tenant.email || ""}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Gender</label>
          <select
            name="gender"
            value={tenant.gender || ""}
            onChange={handleChange}
          >
            <option value="">Select</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Moved-in Date</label>
            <input
              type="date"
              name="moveInDate"
              value={tenant.moveInDate?.slice(0, 10) || ""}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Date Of Birth</label>
            <input
              type="date"
              name="dob"
              value={tenant.dob?.slice(0, 10) || ""}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Room</label>
            <input
              name="room"
              value={tenant.room || ""}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Boarding House</label>
            <input
              name="house"
              value={tenant.house || ""}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>
    </div>
  </div>
);

}
