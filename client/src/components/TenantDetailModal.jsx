import { useState } from 'react';

function TenantDetailModal({ tenant, onClose, onEdit, onDelete }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = () => {
    if (window.confirm('Bạn chắc chắn muốn xóa người thuê này? Hành động này không thể hoàn tác.')) {
      setIsDeleting(true);
      onDelete(tenant.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      ></div>
      <div className="relative bg-white w-full sm:max-w-2xl mx-2 sm:mx-4 rounded-xl shadow-xl border border-gray-200 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-200 bg-white">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Chi tiết người thuê</h3>
            <div className="mt-0.5 text-xs sm:text-sm text-gray-500">ID: {tenant.id}</div>
          </div>
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

        <div className="px-4 sm:px-6 py-5 space-y-5 text-sm overflow-y-auto max-h-[calc(90vh-5rem)]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg border border-gray-200 p-4">
              <div className="text-xs font-semibold text-gray-500 uppercase mb-3">Thông tin cá nhân</div>
              <div className="space-y-3">
                <div>
                  <div className="text-gray-500 text-xs mb-1">Họ tên</div>
                  <div className="text-gray-900 font-medium">{tenant.name}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs mb-1">Email</div>
                  <div className="text-gray-900 break-all">{tenant.email}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs mb-1">Số điện thoại</div>
                  <div className="text-gray-900">{tenant.phone}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs mb-1">Giới tính</div>
                  <div className="text-gray-900 capitalize">{tenant.gender}</div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 p-4">
              <div className="text-xs font-semibold text-gray-500 uppercase mb-3">Thống kê tài khoản</div>
              <div className="space-y-3">
                <div>
                  <div className="text-gray-500 text-xs mb-1">Tuổi</div>
                  <div className="text-gray-900 font-medium">{tenant.age}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs mb-1">Tổng hóa đơn</div>
                  <div className="text-gray-900 font-medium text-lg">{tenant.invoiceCount}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs mb-1">Thành viên từ</div>
                  <div className="text-gray-900">{tenant.createdAt}</div>
                </div>
              </div>
            </div>
          </div>

          {tenant.room && (
            <div className="rounded-lg border border-gray-200 p-4">
              <div className="text-xs font-semibold text-gray-500 uppercase mb-3">Thông tin phòng</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                <div>
                  <div className="text-gray-500 text-xs mb-1">Tên phòng</div>
                  <div className="text-gray-900">{tenant.room.name}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs mb-1">Tòa nhà</div>
                  <div className="text-gray-900">{tenant.room.house?.name || '-'}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs mb-1">Ngày bắt đầu</div>
                  <div className="text-gray-900">{tenant.startDate}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs mb-1">Ngày kết thúc</div>
                  <div className="text-gray-900">{tenant.endDate || '-'}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row gap-3 justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Đóng
          </button>
          <button
            onClick={() => onEdit(tenant)}
            className="w-full sm:w-auto px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Chỉnh sửa
          </button>
          <button
            onClick={handleDeleteClick}
            disabled={isDeleting}
            className="w-full sm:w-auto px-4 py-2 text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {isDeleting ? 'Đang xóa...' : 'Xóa'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TenantDetailModal;
