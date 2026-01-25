import { useEffect, useMemo, useState } from 'react';
import { getTenants, deleteTenant } from '../services/api';
import TenantDetailModal from './TenantDetailModal';
import TenantFormModal from './TenantFormModal';

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN');
};

function TenantsManagement() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [formMode, setFormMode] = useState('add'); // 'add' or 'edit'
  
  const itemsPerPage = 5;

  // Fetch tenants
  useEffect(() => {
    let isMounted = true;
    loadTenants();

    return () => {
      isMounted = false;
    };
  }, []);

  const loadTenants = () => {
    setLoading(true);
    setError('');
    getTenants()
      .then((data) => {
        setTenants(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        setError(err?.message || 'Failed to load tenants');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Format tenants data
  const allTenants = useMemo(
    () =>
      tenants.map((tenant) => ({
        id: tenant.id,
        name: tenant.fullName || 'Unknown',
        email: tenant.email || '-',
        phone: tenant.phone || '-',
        gender: tenant.gender || '-',
        age: tenant.age || '-',
        status: 'ACTIVE',
        createdAt: tenant.createdAt
          ? new Date(tenant.createdAt).toLocaleDateString('vi-VN')
          : '-',
        startDate: tenant.startDate
          ? new Date(tenant.startDate).toLocaleDateString('vi-VN')
          : '-',
        invoiceCount: tenant.invoiceCount || 0,
        room: tenant.room,
        imageUrl: tenant.imageUrl,
        originalData: tenant,
      })),
    [tenants]
  );

  // Filter tenants
  const filteredTenants = allTenants.filter((tenant) => {
    const matchesSearch =
      tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.phone.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTenants.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTenants = filteredTenants.slice(startIndex, endIndex);

  const handleFilterChange = (filter) => {
    setStatusFilter(filter);
    setCurrentPage(1);
    setShowFilterDropdown(false);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    setCurrentPage(1);
    loadTenants();
  };

  const handleAddNew = () => {
    setFormMode('add');
    setSelectedTenant(null);
    setShowFormModal(true);
  };

  const handleViewDetail = (tenant) => {
    setSelectedTenant(tenant);
    setShowDetailModal(true);
  };

  const handleEditTenant = (tenant) => {
    setSelectedTenant(tenant);
    setFormMode('edit');
    setShowFormModal(true);
    setShowDetailModal(false);
  };

  const handleDeleteTenant = async (tenantId) => {
    if (window.confirm('Are you sure you want to delete this tenant?')) {
      try {
        await deleteTenant(tenantId);
        loadTenants();
        setShowDetailModal(false);
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const handleFormSuccess = () => {
    loadTenants();
    setShowFormModal(false);
    setSelectedTenant(null);
  };

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const getStatusColor = (status) => {
    if (status === 'ACTIVE') return 'bg-green-100 text-green-800';
    if (status === 'BLOCKED') return 'bg-red-100 text-red-800';
    return 'bg-blue-100 text-blue-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 md:p-4 lg:p-6">
      <div className="w-full">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Tenants</h1>
          <p className="text-sm md:text-base text-gray-600">
            Quản lý người thuê trọ
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4 md:mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Tìm kiếm theo tên hoặc email..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-auto">
                <button
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="w-full sm:w-auto px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <span>Giới tính</span>
                  {statusFilter !== 'all' && (
                    <span className="ml-1 px-2 py-0.5 bg-white text-gray-700 text-xs rounded-full">1</span>
                  )}
                </button>

                {showFilterDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowFilterDropdown(false)}
                    ></div>
                    <div className="fixed left-4 right-4 top-24 sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20 max-h-[70vh] overflow-auto">
                      <div className="p-2">
                        <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                          Giới tính
                        </div>
                        <button
                          onClick={() => handleFilterChange('all')}
                          className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 transition-colors ${statusFilter === 'all' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                        >
                          Tất cả
                        </button>
                        <button
                          onClick={() => handleFilterChange('MALE')}
                          className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 transition-colors ${statusFilter === 'MALE' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                        >
                          Nam
                        </button>
                        <button
                          onClick={() => handleFilterChange('FEMALE')}
                          className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 transition-colors ${statusFilter === 'FEMALE' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                        >
                          Nữ
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={handleRefresh}
                disabled={loading}
                className="w-full sm:w-auto px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v6h6M20 20v-6h-6M5 15a7 7 0 0011.95 2.95M19 9a7 7 0 00-11.95-2.95" />
                </svg>
                <span>Làm mới</span>
              </button>

              <button
                onClick={handleAddNew}
                className="w-full sm:w-auto px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Thêm mới</span>
              </button>
            </div>
          </div>
        </div>

        {loading && (
          <div className="mb-4 text-sm text-gray-600">Đang tải danh sách người thuê...</div>
        )}
        {error && (
          <div className="mb-4 text-sm text-red-600">{error}</div>
        )}
        {!loading && !error && (
          <div className="mb-4 text-sm text-gray-600">
            Hiển thị {startIndex + 1} - {Math.min(endIndex, filteredTenants.length)} trên {filteredTenants.length} kết quả
          </div>
        )}

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {loading || error || currentTenants.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {loading ? 'Đang tải danh sách người thuê...' : error ? 'Không tải được danh sách người thuê' : 'Không có kết quả'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {error ? 'Vui lòng thử lại sau' : 'Hãy điều chỉnh bộ lọc hoặc từ khóa'}
              </p>
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Họ tên</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Số điện thoại</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Giới tính</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Hóa đơn</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Ngày tạo</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {currentTenants.map((tenant) => (
                      <tr key={tenant.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center shrink-0">
                              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{tenant.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-700 text-sm">{tenant.email}</td>
                        <td className="px-6 py-4 text-gray-700 text-sm">{tenant.phone}</td>
                        <td className="px-6 py-4 text-gray-700 text-sm capitalize">{tenant.gender}</td>
                        <td className="px-6 py-4 text-gray-700">{tenant.invoiceCount}</td>
                        <td className="px-6 py-4 text-gray-700">{tenant.createdAt}</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleViewDetail(tenant)}
                            className="inline-flex items-center justify-center w-10 h-10 rounded-md border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 hover:shadow focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-1 active:scale-[0.98]"
                            aria-label="View details"
                          >
                            <svg className="w-5 h-5 block" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                              <circle cx="5" cy="10" r="1.6" />
                              <circle cx="10" cy="10" r="1.6" />
                              <circle cx="15" cy="10" r="1.6" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden divide-y divide-gray-200">
                {currentTenants.map((tenant) => (
                  <div key={tenant.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center shrink-0">
                        <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{tenant.name}</div>
                        <div className="text-sm text-gray-500">{tenant.email}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 text-sm">
                      <div>
                        <div className="text-gray-500 mb-1">Số điện thoại</div>
                        <div className="text-gray-900">{tenant.phone}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 mb-1">Giới tính</div>
                        <div className="text-gray-900 capitalize">{tenant.gender}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 mb-1">Hóa đơn</div>
                        <div className="text-gray-900">{tenant.invoiceCount}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 mb-1">Ngày tạo</div>
                        <div className="text-gray-900">{tenant.createdAt}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleViewDetail(tenant)}
                      className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
                    >
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-md border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 hover:shadow active:scale-[0.98]">
                        <svg className="w-5 h-5 block" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <circle cx="5" cy="10" r="1.6" />
                          <circle cx="10" cy="10" r="1.6" />
                          <circle cx="15" cy="10" r="1.6" />
                        </svg>
                      </span>
                      <span>Chi tiết</span>
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2 flex-wrap">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">Trước</span>
            </button>

            {getPageNumbers().map((page, index) => (
              <button
                key={index}
                onClick={() => typeof page === 'number' && setCurrentPage(page)}
                disabled={page === '...'}
                className={`min-w-10 px-3 py-2 rounded-lg transition-colors ${
                  page === currentPage
                    ? 'bg-blue-500 text-white font-medium'
                    : page === '...'
                    ? 'text-gray-400 cursor-default'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
            >
              <span className="hidden sm:inline">Sau</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {showDetailModal && selectedTenant && (
        <TenantDetailModal
          tenant={selectedTenant}
          onClose={() => setShowDetailModal(false)}
          onEdit={handleEditTenant}
          onDelete={handleDeleteTenant}
        />
      )}

      {showFormModal && (
        <TenantFormModal
          mode={formMode}
          tenant={formMode === 'edit' ? selectedTenant : null}
          onClose={() => setShowFormModal(false)}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}

export default TenantsManagement;
