import { useEffect, useState } from "react";
import { FaTimes } from "react-icons/fa";
import api from "../server/api";

export default function OwnerProfileModal({ open, onClose, onProfileUpdate }) {
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    imageUrl: "",
    qrImageUrl: "",
  });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);

  // Fetch owner profile when modal opens
  useEffect(() => {
    if (open && !profileData) {
      fetchProfile();
    }
  }, [open, profileData]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await api.get("/api/owner/profile");
      setProfileData(data);
      setEditForm({
        fullName: data.fullName || "",
        email: data.email || "",
        imageUrl: data.imageUrl || "",
        qrImageUrl: data.qrImageUrl || "",
      });
    } catch (err) {
      setError(err.message || "Failed to load profile");
      console.error("Fetch profile error:", err);
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
    setError("");
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      if (!editForm.fullName.trim()) {
        setError("Full name is required");
        setLoading(false);
        return;
      }

      const confirmed = window.confirm(
        "Are you sure you want to update your profile?",
      );
      if (!confirmed) {
        setLoading(false);
        return;
      }

      const result = await api.put("/api/owner/profile", {
        fullName: editForm.fullName.trim(),
        email: editForm.email.trim().toLowerCase(),
        imageUrl: editForm.imageUrl || null,
        qrImageUrl: editForm.qrImageUrl || null,
      });

      if (result.success) {
        setSuccess("Profile updated successfully!");
        setProfileData(result.data);
        setIsEditing(false);
        if (onProfileUpdate) {
          onProfileUpdate(result.data);
        }
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      setError(err.message || "Failed to update profile");
      console.error("Update profile error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file, target) => {
    if (!file) return;

    const body = new FormData();
    body.append("image", file);

    const setUploading =
      target === "owner-avatar" ? setUploadingAvatar : setUploadingQr;

    try {
      setUploading(true);
      setError("");
      const result = await api.post(
        `/api/owner/uploads/image?target=${encodeURIComponent(target)}`,
        body,
      );

      const uploadedUrl = result?.url || "";
      if (!uploadedUrl) {
        throw new Error("Upload succeeded but no URL was returned");
      }

      setEditForm((prev) => ({
        ...prev,
        ...(target === "owner-avatar"
          ? { imageUrl: uploadedUrl }
          : { qrImageUrl: uploadedUrl }),
      }));
    } catch (err) {
      setError(err.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
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
              setError("");
              setSuccess("");
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
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-slate-500">Loading...</div>
            </div>
          )}

          {/* Error and Success messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-100 rounded-lg text-green-700 text-sm">
              {success}
            </div>
          )}

          {/* Profile Tab */}
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
                  <div className="w-24 h-24 rounded-full bg-linear-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                    {profileData.fullName
                      ? profileData.fullName.charAt(0).toUpperCase()
                      : profileData.email.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="space-y-4 bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="border-b border-slate-200 pb-3">
                  <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    Email
                  </p>
                  <p className="text-sm text-slate-900 mt-1">
                    {profileData.email}
                  </p>
                </div>

                <div className="border-b border-slate-200 pb-3">
                  <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    Full Name
                  </p>
                  <p className="text-sm text-slate-900 mt-1">
                    {profileData.fullName || "Not updated"}
                  </p>
                </div>

                <div className="border-b border-slate-200 pb-3">
                  <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    Boarding Houses
                  </p>
                  <p className="text-sm text-slate-900 mt-1">
                    {profileData.totalHouses}
                  </p>
                </div>

                <div className="border-b border-slate-200 pb-3">
                  <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    Payment QR
                  </p>
                  {profileData.qrImageUrl ? (
                    <img
                      src={profileData.qrImageUrl}
                      alt="Owner payment QR"
                      className="mt-2 w-28 h-28 rounded border border-slate-200 object-cover"
                    />
                  ) : (
                    <p className="text-sm text-slate-500 mt-1">
                      No QR uploaded
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    Member Since
                  </p>
                  <p className="text-sm text-slate-900 mt-1">
                    {new Date(profileData.createdAt).toLocaleDateString(
                      "en-US",
                    )}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsEditing(true)}
                className="w-full mt-4 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium text-sm"
              >
                Edit Profile
              </button>
            </div>
          )}

          {/* Edit Profile Form */}
          {activeTab === "profile" && isEditing && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={editForm.fullName}
                  onChange={handleEditChange}
                  placeholder="Enter your full name"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700 text-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={editForm.email}
                  onChange={handleEditChange}
                  placeholder="owner@example.com"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700 text-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Profile Image
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      handleImageUpload(e.target.files?.[0], "owner-avatar")
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm"
                  />
                </div>
                {uploadingAvatar && (
                  <p className="text-xs text-blue-600 mt-1">
                    Uploading profile image...
                  </p>
                )}
                {editForm.imageUrl && (
                  <img
                    src={editForm.imageUrl}
                    alt="Owner avatar"
                    className="mt-2 w-24 h-24 rounded-full border border-slate-200 object-cover"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Payment QR (Optional)
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      handleImageUpload(e.target.files?.[0], "owner-qr")
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setEditForm((prev) => ({ ...prev, qrImageUrl: "" }))
                    }
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-100"
                  >
                    Clear
                  </button>
                </div>
                {uploadingQr && (
                  <p className="text-xs text-blue-600 mt-1">
                    Uploading payment QR...
                  </p>
                )}
                {editForm.qrImageUrl ? (
                  <img
                    src={editForm.qrImageUrl}
                    alt="Payment QR"
                    className="mt-2 w-28 h-28 rounded border border-slate-200 object-cover"
                  />
                ) : (
                  <p className="text-xs text-slate-500 mt-1">No QR uploaded</p>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditForm({
                      fullName: profileData.fullName || "",
                      email: profileData.email || "",
                      imageUrl: profileData.imageUrl || "",
                      qrImageUrl: profileData.qrImageUrl || "",
                    });
                    setError("");
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors font-medium text-sm"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          )}


        </div>
      </div>
    </div>
  );
}
