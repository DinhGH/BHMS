import { useEffect, useState } from "react";
import { FaTimes } from "react-icons/fa";
import toast from "react-hot-toast";
import api from "../server/api";
import Loading from "./loading.jsx";
import useConfirmDialog from "../hooks/useConfirmDialog";

export default function OwnerProfileModal({ open, onClose, onProfileUpdate }) {
  const { confirm, confirmDialog } = useConfirmDialog();
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    imageUrl: "",
    qrImageUrl: "",
  });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);

  // Fetch profile khi mở modal
  useEffect(() => {
    if (open) {
      fetchProfile();
    }
  }, [open]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await api.get("/api/owner/profile");

      setProfileData(data);
      setEditForm({
        fullName: data?.fullName || "",
        email: data?.email || "",
        imageUrl: data?.imageUrl || "",
        qrImageUrl: data?.qrImageUrl || "",
      });
    } catch (err) {
      console.error("Fetch profile error:", err);
      toast.error(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!editForm.fullName.trim()) {
      toast.error("Full name is required");
      return false;
    }

    if (!editForm.email.trim()) {
      toast.error("Email is required");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editForm.email.trim())) {
      toast.error("Invalid email format");
      return false;
    }

    return true;
  };

  const handleSaveProfile = async () => {
    if (!validateForm()) return;

    const confirmed = await confirm({
      title: "Update profile",
      message: "Are you sure you want to update your profile?",
      confirmText: "Update",
      variant: "default",
    });

    if (!confirmed) return;

    try {
      setLoading(true);

      const result = await api.put("/api/owner/profile", {
        fullName: editForm.fullName.trim(),
        email: editForm.email.trim().toLowerCase(),
        imageUrl: editForm.imageUrl || null,
        qrImageUrl: editForm.qrImageUrl || null,
      });

      if (result?.success) {
        toast.success("Profile updated successfully!");
        setProfileData(result.data);
        setIsEditing(false);

        if (onProfileUpdate) {
          onProfileUpdate(result.data);
        }
      } else {
        toast.error(result?.message || "Update failed");
      }
    } catch (err) {
      console.error("Update profile error:", err);
      toast.error(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file, target) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      return;
    }

    const body = new FormData();
    body.append("image", file);

    const setUploading =
      target === "owner-avatar" ? setUploadingAvatar : setUploadingQr;

    try {
      setUploading(true);

      const result = await api.post(
        `/api/owner/uploads/image?target=${encodeURIComponent(target)}`,
        body,
      );

      const uploadedUrl = result?.url || "";
      if (!uploadedUrl) {
        throw new Error("Upload succeeded but no URL returned");
      }

      setEditForm((prev) => ({
        ...prev,
        ...(target === "owner-avatar"
          ? { imageUrl: uploadedUrl }
          : { qrImageUrl: uploadedUrl }),
      }));

      toast.success("Image uploaded successfully!");
    } catch (err) {
      console.error("Upload error:", err);
      toast.error(err.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({
      fullName: profileData?.fullName || "",
      email: profileData?.email || "",
      imageUrl: profileData?.imageUrl || "",
      qrImageUrl: profileData?.qrImageUrl || "",
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-600 bg-slate-700">
          <h2 className="text-xl font-bold text-white">Owner Profile</h2>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-100">
          <button
            onClick={() => {
              setActiveTab("profile");
            }}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === "profile"
                ? "text-slate-900 border-b-2 border-slate-700 bg-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Profile
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <Loading isLoading={loading} />

          {/* VIEW MODE */}
          {activeTab === "profile" && profileData && !isEditing && (
            <div className="space-y-4">
              <div className="flex justify-center mb-6">
                {profileData.imageUrl ? (
                  <img
                    src={profileData.imageUrl}
                    alt={profileData.fullName || "Owner"}
                    className="w-24 h-24 rounded-full border border-slate-200 object-cover shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                    {(profileData.fullName || profileData.email || "O")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}
              </div>

              <div className="space-y-4 bg-slate-50 rounded-lg p-4 border border-slate-200">
                <InfoItem label="Email" value={profileData.email} />
                <InfoItem
                  label="Full Name"
                  value={profileData.fullName || "Not updated"}
                />
                <InfoItem
                  label="Boarding Houses"
                  value={profileData.totalHouses}
                />

                <div className="border-b border-slate-200 pb-3">
                  <p className="text-xs font-semibold text-slate-700 uppercase">
                    Payment QR
                  </p>
                  {profileData.qrImageUrl ? (
                    <img
                      src={profileData.qrImageUrl}
                      alt="QR"
                      className="mt-2 w-28 h-28 rounded border object-cover"
                    />
                  ) : (
                    <p className="text-sm text-slate-500 mt-1">
                      No QR uploaded
                    </p>
                  )}
                </div>

                <InfoItem
                  label="Member Since"
                  value={new Date(profileData.createdAt).toLocaleDateString(
                    "en-US",
                  )}
                />
              </div>

              <button
                onClick={() => setIsEditing(true)}
                className="w-full mt-4 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition font-medium text-sm"
              >
                Edit Profile
              </button>
            </div>
          )}

          {/* EDIT MODE */}
          {activeTab === "profile" && isEditing && (
            <div className="space-y-4">
              <InputField
                label="Full Name"
                name="fullName"
                value={editForm.fullName}
                onChange={handleEditChange}
                placeholder="Enter your full name"
              />

              <InputField
                label="Email"
                name="email"
                type="email"
                value={editForm.email}
                onChange={handleEditChange}
                placeholder="owner@example.com"
              />

              {/* Avatar Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Profile Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleImageUpload(e.target.files?.[0], "owner-avatar")
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
                {uploadingAvatar && (
                  <p className="text-xs text-blue-600 mt-1">
                    Uploading avatar...
                  </p>
                )}
                {editForm.imageUrl && (
                  <img
                    src={editForm.imageUrl}
                    alt="Avatar"
                    className="mt-2 w-24 h-24 rounded-full object-cover border"
                  />
                )}
              </div>

              {/* QR Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Payment QR (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleImageUpload(e.target.files?.[0], "owner-qr")
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
                {uploadingQr && (
                  <p className="text-xs text-blue-600 mt-1">Uploading QR...</p>
                )}
                {editForm.qrImageUrl && (
                  <img
                    src={editForm.qrImageUrl}
                    alt="QR"
                    className="mt-2 w-28 h-28 border rounded object-cover"
                  />
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={handleCancelEdit}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 text-sm"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {confirmDialog}
    </div>
  );
}

/* Reusable Components */
function InfoItem({ label, value }) {
  return (
    <div className="border-b border-slate-200 pb-3">
      <p className="text-xs font-semibold text-slate-700 uppercase">{label}</p>
      <p className="text-sm text-slate-900 mt-1">{value}</p>
    </div>
  );
}

function InputField({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700 text-sm"
      />
    </div>
  );
}
