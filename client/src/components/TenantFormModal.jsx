import { useState } from 'react';
import { createTenant, updateTenant } from '../services/api';

function TenantFormModal({ mode, tenant, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    fullName: tenant?.name || '',
    email: tenant?.email || '',
    phone: tenant?.phone || '',
    gender: tenant?.gender || 'MALE',
    age: tenant?.age || '',
    roomId: tenant?.room?.id || '',
    startDate: tenant?.startDate || new Date().toISOString().split('T')[0],
    endDate: tenant?.endDate || '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    const fullName = formData.fullName.trim();
    const email = formData.email.trim();
    const phone = formData.phone.trim();
    const roomIdRaw = `${formData.roomId}`.trim();
    const roomIdNumber = parseInt(roomIdRaw, 10);
    const ageNumber = parseInt(formData.age, 10);
    const startDate = formData.startDate;

    if (!fullName) {
      newErrors.fullName = 'Họ tên là bắt buộc';
    }

    if (!email) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Định dạng email không hợp lệ';
    }

    if (!phone) {
      newErrors.phone = 'Số điện thoại là bắt buộc';
    }

    if (mode === 'add') {
      if (!roomIdRaw) {
        newErrors.roomId = 'Số phòng là bắt buộc';
      } else if (Number.isNaN(roomIdNumber) || roomIdNumber <= 0) {
        newErrors.roomId = 'Số phòng phải là số hợp lệ';
      }
    }

    if (mode === 'add') {
      if (!startDate) {
        newErrors.startDate = 'Ngày bắt đầu là bắt buộc';
      } else if (Number.isNaN(new Date(startDate).getTime())) {
        newErrors.startDate = 'Ngày bắt đầu không hợp lệ';
      }
    }

    if (!Number.isNaN(ageNumber) && ageNumber < 0) {
      newErrors.age = 'Tuổi không thể âm';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      setShowConfirm(true);
    }
  };

  const handleConfirmSubmit = async () => {
    setIsLoading(true);
    try {
      const ageNumber = parseInt(formData.age, 10);
      const roomIdNumber = parseInt(`${formData.roomId}`.trim(), 10);

      let payload = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        gender: formData.gender,
        age: Number.isNaN(ageNumber) ? 0 : ageNumber,
      };

      if (mode === 'add') {
        payload.roomId = roomIdNumber;
        payload.startDate = formData.startDate;
        await createTenant(payload);
      } else {
        if (formData.endDate) {
          payload.endDate = formData.endDate;
        }
        await updateTenant(tenant.id, payload);
      }

      setShowConfirm(false);
      onSuccess();
    } catch (error) {
      setErrors({ submit: error.message });
      setShowConfirm(false);
    } finally {
      setIsLoading(false);
    }
  };

  const getConfirmTitle = () => {
    return mode === 'add' ? 'Xác nhận thêm người thuê' : 'Xác nhận cập nhật người thuê';
  };

  const getConfirmMessage = () => {
    return mode === 'add'
      ? `Bạn chắc chắn muốn tạo người thuê mới cho ${formData.fullName}?`
      : `Bạn chắc chắn muốn cập nhật thông tin của ${formData.fullName}?`;
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="absolute inset-0 bg-black/40"
          onClick={onClose}
        ></div>
        <div className="relative bg-white w-full sm:max-w-md mx-2 sm:mx-4 rounded-xl shadow-xl border border-gray-200 max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-200 bg-white">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
              {mode === 'add' ? 'Thêm người thuê mới' : 'Chỉnh sửa người thuê'}
            </h3>
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center w-9 h-9 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-4 sm:px-6 py-5 space-y-4 overflow-y-auto max-h-[calc(90vh-9rem)]">
            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {errors.submit}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Họ tên *</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="Nhập họ tên"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.fullName ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Nhập địa chỉ email"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Nhập số điện thoại"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Giới tính</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="MALE">Nam</option>
                  <option value="FEMALE">Nữ</option>
                  <option value="OTHER">Khác</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tuổi</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  placeholder="Tuổi"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {mode === 'add' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Số phòng *</label>
                  <input
                    type="text"
                    name="roomId"
                    value={formData.roomId}
                    onChange={handleInputChange}
                    placeholder="Số phòng (nhập thủ công)"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.roomId ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.roomId && (
                    <p className="mt-1 text-sm text-red-600">{errors.roomId}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu *</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.startDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.startDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
                  )}
                </div>
              </>
            )}

            {mode === 'edit' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày kết thúc</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  placeholder="Ngày kết thúc (tùy chọn)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </form>

          <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row gap-3 justify-end">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full sm:w-auto px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Đang xử lý...' : mode === 'add' ? 'Thêm người thuê' : 'Lưu thay đổi'}
            </button>
          </div>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowConfirm(false)}
          ></div>
          <div className="relative bg-white w-full sm:max-w-sm mx-2 sm:mx-4 rounded-xl shadow-xl border border-gray-200">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">{getConfirmTitle()}</h3>
            </div>

            <div className="px-4 sm:px-6 py-4">
              <p className="text-sm text-gray-600 mb-4">{getConfirmMessage()}</p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Họ tên: </span>
                    <span className="font-medium text-gray-900">{formData.fullName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Email: </span>
                    <span className="font-medium text-gray-900">{formData.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Số điện thoại: </span>
                    <span className="font-medium text-gray-900">{formData.phone}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Giới tính: </span>
                    <span className="font-medium text-gray-900">{formData.gender}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50 flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmSubmit}
                disabled={isLoading}
                className="px-4 py-2 text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default TenantFormModal;
