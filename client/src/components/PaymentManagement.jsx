import { useEffect, useMemo, useState } from 'react';
import { getPayments } from '../services/api';

const formatAmount = (amount) => {
  const value = Number(amount || 0);
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value);
};

const mapStatus = (invoiceStatus, confirmed) => {
  if (confirmed) return 'Paid';
  if (invoiceStatus === 'PAID') return 'Paid';
  if (invoiceStatus === 'OVERDUE') return 'Overdue';
  return 'Pending';
};

const formatMethod = (method) => {
  if (method === 'GATEWAY') return 'Gateway';
  if (method === 'QR_TRANSFER') return 'QR Transfer';
  return method || '-';
};

const formatInvoiceValue = (key, value) => {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (key.toLowerCase().includes('date') || key.toLowerCase().includes('at')) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date.toLocaleString('vi-VN');
  }
  if (
    typeof value === 'number' &&
    (key.toLowerCase().includes('amount') ||
      key.toLowerCase().includes('cost') ||
      key.toLowerCase().includes('price'))
  ) {
    return formatAmount(value);
  }
  return String(value);
};

function PaymentManagement() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  
  const itemsPerPage = 5;
  
  useEffect(() => {
    let isMounted = true;
    getPayments()
      .then((data) => {
        if (!isMounted) return;
        setPayments(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err?.message || 'Failed to load payments');
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const allPayments = useMemo(
    () =>
      payments.map((payment) => {
        const roomName = payment.roomName || '';
        const houseName = payment.houseName || '';
        const roomLabel = roomName
          ? `Room ${roomName}${houseName ? ` -Block ${houseName}` : ''}`
          : houseName
          ? `Block ${houseName}`
          : '-';

        return {
          id: payment.id,
          author: payment.tenantName || 'Unknown',
          room: roomLabel,
          paymentId: payment.paymentId || `PAY${String(payment.id).padStart(3, '0')}`,
          dateCreated: payment.createdAt
            ? new Date(payment.createdAt).toLocaleDateString('vi-VN')
            : '-',
          amount: formatAmount(payment.amount),
          status: mapStatus(payment.invoiceStatus, payment.confirmed),
          method: formatMethod(payment.method),
          imageUrl: payment.img || '',
          invoiceId: payment.invoiceId,
          confirmed: !!payment.confirmed,
          createdAt: payment.createdAt || null,
          invoice: payment.invoice || {},
        };
      }),
    [payments]
  );

  const filteredPayments = allPayments.filter(payment => {
    const matchesSearch = 
      payment.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.room.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.paymentId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPayments = filteredPayments.slice(startIndex, endIndex);

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
    setLoading(true);
    setError('');

    getPayments()
      .then((data) => {
        setPayments(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err?.message || 'Failed to load payments');
        setLoading(false);
      });
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
    if (status === 'Paid')    return 'bg-green-100 text-green-800';
    if (status === 'Pending') return 'bg-yellow-100 text-yellow-800';
    if (status === 'Overdue') return 'bg-red-100 text-red-800';
    return 'bg-blue-100 text-blue-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 md:p-4 lg:p-6">
      <div className="w-full">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Payments</h1>
          <p className="text-sm md:text-base text-gray-600">
            Manage invoices and payments from tenants
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
                placeholder="Search by name, room, payment ID..."
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
                  <span>Filter</span>
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
                          Payment Status
                        </div>
                        <button
                          onClick={() => handleFilterChange('all')}
                          className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 transition-colors ${statusFilter === 'all' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                        >
                          All
                        </button>
                        <button
                          onClick={() => handleFilterChange('Paid')}
                          className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 transition-colors ${statusFilter === 'Paid' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                        >
                          Paid
                        </button>
                        <button
                          onClick={() => handleFilterChange('Pending')}
                          className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 transition-colors ${statusFilter === 'Pending' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                        >
                          Pending
                        </button>
                        <button
                          onClick={() => handleFilterChange('Overdue')}
                          className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 transition-colors ${statusFilter === 'Overdue' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                        >
                          Overdue
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
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {loading && (
          <div className="mb-4 text-sm text-gray-600">Loading payments...</div>
        )}
        {error && (
          <div className="mb-4 text-sm text-red-600">{error}</div>
        )}
        {!loading && !error && (
          <div className="mb-4 text-sm text-gray-600">
            Showing {startIndex + 1} - {Math.min(endIndex, filteredPayments.length)} of {filteredPayments.length} results
          </div>
        )}

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {loading || error || currentPayments.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {loading ? 'Loading payments...' : error ? 'Failed to load payments' : 'No results found'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {error ? 'Please try again later' : 'Try adjusting your filters or search term'}
              </p>
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Tenant</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Payment ID</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date Created</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Image</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Method</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {currentPayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center shrink-0">
                              <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{payment.author}</div>
                              <div className="text-sm text-gray-500">{payment.room}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-700">{payment.paymentId}</td>
                        <td className="px-6 py-4 text-gray-700">{payment.dateCreated}</td>
                        <td className="px-6 py-4">
                          {payment.imageUrl ? (
                            <img
                              src={payment.imageUrl}
                              alt="Payment proof"
                              className="w-24 h-32 object-cover rounded border border-gray-200"
                            />
                          ) : (
                            <div className="w-24 h-32 bg-gray-100 border-2 border-gray-300 rounded flex items-center justify-center">
                              <svg className="w-full h-full text-gray-300" viewBox="0 0 100 140" preserveAspectRatio="none">
                                <line x1="0" y1="0" x2="100" y2="140" stroke="currentColor" strokeWidth="1" />
                                <line x1="100" y1="0" x2="0" y2="140" stroke="currentColor" strokeWidth="1" />
                              </svg>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-700 font-medium">{payment.amount}</td>
                        <td className="px-6 py-4 text-gray-700">{payment.method}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(payment.status)}`}>
                            {payment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setSelectedPayment(payment)}
                            className="inline-flex items-center justify-center w-10 h-10 rounded-md border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 hover:shadow focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-1 active:scale-[0.98]"
                            aria-label="View payment details"
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
                {currentPayments.map((payment) => (
                  <div key={payment.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center shrink-0">
                        <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{payment.author}</div>
                        <div className="text-sm text-gray-500">{payment.room}</div>
                      </div>
                      <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(payment.status)}`}>
                        {payment.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 text-sm">
                      <div>
                        <div className="text-gray-500 mb-1">Payment ID</div>
                        <div className="text-gray-900">{payment.paymentId}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 mb-1">Date</div>
                        <div className="text-gray-900">{payment.dateCreated}</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-gray-500 mb-1">Amount</div>
                        <div className="text-gray-900 font-medium">{payment.amount}</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-gray-500 mb-1">Method</div>
                        <div className="text-gray-900">{payment.method}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedPayment(payment)}
                      className="mt-3 inline-flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
                    >
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-md border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 hover:shadow active:scale-[0.98]">
                        <svg className="w-5 h-5 block" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <circle cx="5" cy="10" r="1.6" />
                          <circle cx="10" cy="10" r="1.6" />
                          <circle cx="15" cy="10" r="1.6" />
                        </svg>
                      </span>
                      <span>Details</span>
                    </button>

                    {payment.imageUrl ? (
                      <img
                        src={payment.imageUrl}
                        alt="Payment proof"
                        className="w-full aspect-3/4 object-cover rounded border border-gray-200"
                      />
                    ) : (
                      <div className="w-full aspect-3/4 bg-gray-100 border-2 border-gray-300 rounded flex items-center justify-center">
                        <svg className="w-full h-full text-gray-300" viewBox="0 0 100 140" preserveAspectRatio="none">
                          <line x1="0" y1="0" x2="100" y2="140" stroke="currentColor" strokeWidth="1" />
                          <line x1="100" y1="0" x2="0" y2="140" stroke="currentColor" strokeWidth="1" />
                        </svg>
                      </div>
                    )}
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
              <span className="hidden sm:inline">Previous</span>
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
              <span className="hidden sm:inline">Next</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSelectedPayment(null)}
          ></div>
          <div className="relative bg-white w-full sm:max-w-lg mx-2 sm:mx-4 rounded-lg shadow-lg border border-gray-200 max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">Payment Details</h3>
              <button
                onClick={() => setSelectedPayment(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-5 space-y-4 text-sm overflow-y-auto max-h-[calc(90vh-4rem)]">
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Invoice Details</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                  {Object.keys(selectedPayment.invoice || {}).length === 0 ? (
                    <div className="text-gray-500">No invoice data</div>
                  ) : (
                    Object.entries(selectedPayment.invoice).map(([key, value]) => (
                      <div key={key} className="flex justify-between sm:block">
                        <div className="text-gray-500 capitalize">{key}</div>
                        <div className="text-gray-900">
                          {formatInvoiceValue(key, value)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Payment</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                  <div className="flex justify-between sm:block">
                    <div className="text-gray-500">ID</div>
                    <div className="text-gray-900">{selectedPayment.id}</div>
                  </div>
                  <div className="flex justify-between sm:block">
                    <div className="text-gray-500">Invoice ID</div>
                    <div className="text-gray-900">{selectedPayment.invoiceId ?? '-'}</div>
                  </div>
                  <div className="flex justify-between sm:block">
                    <div className="text-gray-500">Method</div>
                    <div className="text-gray-900">{selectedPayment.method}</div>
                  </div>
                  <div className="flex justify-between sm:block">
                    <div className="text-gray-500">Amount</div>
                    <div className="text-gray-900 font-medium">{selectedPayment.amount}</div>
                  </div>
                  <div className="flex justify-between sm:block">
                    <div className="text-gray-500">Confirmed</div>
                    <div className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${selectedPayment.confirmed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {selectedPayment.confirmed ? 'true' : 'false'}
                    </div>
                  </div>
                  <div className="flex justify-between sm:block">
                    <div className="text-gray-500">Created At</div>
                    <div className="text-gray-900">
                      {selectedPayment.createdAt
                        ? new Date(selectedPayment.createdAt).toLocaleString('vi-VN')
                        : '-'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PaymentManagement;