import { useEffect, useState } from "react";
import { FaTimes, FaEye, FaEyeSlash } from "react-icons/fa";
import api from "../server/api";

export default function OwnerProfileModal({ open, onClose, user, onProfileUpdate }) {
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [editForm, setEditForm] = useState({
    fullName: "",
    imageUrl: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Fetch owner profile when modal opens
  useEffect(() => {
    if (open && !profileData) {
      fetchProfile();
    }
  }, [open]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await api.get("/api/owner/profile");
      setProfileData(data);
      setEditForm({
        fullName: data.fullName || "",
        imageUrl: data.imageUrl || "",
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

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({
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
        "Are you sure you want to update your profile?"
      );
      if (!confirmed) {
        setLoading(false);
        return;
      }

      const result = await api.put("/api/owner/profile", {
        fullName: editForm.fullName.trim(),
        imageUrl: editForm.imageUrl || null,
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

  const handleChangePassword = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      // Validation
      if (!passwordForm.currentPassword) {
        setError("Current password is required");
        setLoading(false);
        return;
      }

      if (!passwordForm.newPassword) {
        setError("New password is required");
        setLoading(false);
        return;
      }

      if (passwordForm.newPassword.length < 6) {
        setError("New password must be at least 6 characters");
        setLoading(false);
        return;
      }

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setError("New passwords do not match");
        setLoading(false);
        return;
      }

      const confirmed = window.confirm(
        "Are you sure you want to change your password?"
      );
      if (!confirmed) {
        setLoading(false);
        return;
      }

      const result = await api.post("/api/owner/profile/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });

      if (result.success) {
        setSuccess("Password changed successfully!");
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setIsChangingPassword(false);
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      setError(err.message || "Failed to change password");
      console.error("Change password error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-600 bg-slate-700">
          <h2 className="text-xl font-bold text-white">Hồ Sơ Cá Nhân</h2>
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
            Thông Tin
          </button>
          <button
            onClick={() => {
              setActiveTab("security");
              setIsChangingPassword(true);
              setError("");
              setSuccess("");
            }}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === "security"
                ? "text-slate-900 border-b-2 border-slate-700 bg-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Bảo Mật
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
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                  {profileData.fullName
                    ? profileData.fullName.charAt(0).toUpperCase()
                    : profileData.email.charAt(0).toUpperCase()}
                </div>
              </div>

              <div className="space-y-4 bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="border-b border-slate-200 pb-3">
                  <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    Email
                  </p>
                  <p className="text-sm text-slate-900 mt-1">{profileData.email}</p>
                </div>

                <div className="border-b border-slate-200 pb-3">
                  <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    Họ & Tên
                  </p>
                  <p className="text-sm text-slate-900 mt-1">
                    {profileData.fullName || "Chưa cập nhật"}
                  </p>
                </div>

                <div className="border-b border-slate-200 pb-3">
                  <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    Số Nhà Trọ
                  </p>
                  <p className="text-sm text-slate-900 mt-1">
                    {profileData.totalHouses}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    Thành Viên Từ
                  </p>
                  <p className="text-sm text-slate-900 mt-1">
                    {new Date(profileData.createdAt).toLocaleDateString(
                      "vi-VN"
                    )}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsEditing(true)}
                className="w-full mt-4 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium text-sm"
              >
                Chỉnh Sửa Hồ Sơ
              </button>
            </div>
          )}

          {/* Edit Profile Form */}
          {activeTab === "profile" && isEditing && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Họ & Tên
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={editForm.fullName}
                  onChange={handleEditChange}
                  placeholder="Nhập họ & tên của bạn"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700 text-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  URL Ảnh (tùy chọn)
                </label>
                <input
                  type="url"
                  name="imageUrl"
                  value={editForm.imageUrl}
                  onChange={handleEditChange}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700 text-slate-900 text-sm"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditForm({
                      fullName: profileData.fullName || "",
                      imageUrl: profileData.imageUrl || "",
                    });
                    setError("");
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors font-medium text-sm"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors font-medium text-sm"
                >
                  {loading ? "Đang lưu..." : "Lưu Thay Đổi"}
                </button>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && isChangingPassword && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Mật Khẩu Hiện Tại
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? "text" : "password"}
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Nhập mật khẩu hiện tại"
                    className="w-full px-3 py-2 pr-10 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700 text-slate-900 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords((prev) => ({
                        ...prev,
                        current: !prev.current,
                      }))
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  >
                    {showPasswords.current ? (
                      <FaEyeSlash className="w-4 h-4" />
                    ) : (
                      <FaEye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Mật Khẩu Mới
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                    className="w-full px-3 py-2 pr-10 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700 text-slate-900 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords((prev) => ({
                        ...prev,
                        new: !prev.new,
                      }))
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  >
                    {showPasswords.new ? (
                      <FaEyeSlash className="w-4 h-4" />
                    ) : (
                      <FaEye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Xác Nhận Mật Khẩu Mới
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Xác nhận mật khẩu mới"
                    className="w-full px-3 py-2 pr-10 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700 text-slate-900 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords((prev) => ({
                        ...prev,
                        confirm: !prev.confirm,
                      }))
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  >
                    {showPasswords.confirm ? (
                      <FaEyeSlash className="w-4 h-4" />
                    ) : (
                      <FaEye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => {
                    setIsChangingPassword(false);
                    setPasswordForm({
                      currentPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                    });
                    setError("");
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors font-medium text-sm"
                >
                  Hủy
                </button>
                <button
                  onClick={handleChangePassword}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors font-medium text-sm"
                >
                  {loading ? "Đang đổi..." : "Đổi Mật Khẩu"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
