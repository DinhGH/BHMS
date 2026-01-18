import { useEffect, useState } from 'react';
import { getReports, updateReportStatus } from '../services/api';

// Icon components
const Plus = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const Minus = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const Search = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"></circle>
    <path d="m21 21-4.35-4.35"></path>
  </svg>
);

function ReportManagement() {
  const [expandedReport, setExpandedReport] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [targetFilter, setTargetFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [reports, setReports] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts] = useState({ unread: 0, processed: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const reportsPerPage = 10;
  const currentReports = reports;

  const unreadCount = counts.unread || 0;
  const processedCount = counts.processed || 0;

  const tabToStatus = (tab) => {
    if (tab === 'unread') return 'unread';
    if (tab === 'processed') return 'processed';
    return undefined;
  };

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await getReports({
          page: currentPage,
          limit: reportsPerPage,
          status: tabToStatus(activeTab),
          search: searchQuery,
          target: targetFilter === 'all' ? undefined : targetFilter,
          orderBy: sortBy,
          order: sortOrder,
        });
        setReports(res.data || []);
        setTotalPages(res.pagination?.totalPages || 1);
        setCounts(res.counts || { unread: 0, processed: 0 });
        setExpandedReport(null);
      } catch (err) {
        console.error(err);
        setError('Failed to load reports');
        setReports([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [activeTab, currentPage, searchQuery, targetFilter, sortBy, sortOrder, refreshKey]);

  const toggleReport = (id) => {
    setExpandedReport(expandedReport === id ? null : id);
  };

  const goToPage = (pageNumber) => {
    setCurrentPage(pageNumber);
    setExpandedReport(null);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      setExpandedReport(null);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      setExpandedReport(null);
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset về trang 1 khi search
    setExpandedReport(null);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1); // Reset về trang 1 khi đổi tab
    setExpandedReport(null);
  };

  const handleRefresh = () => {
    setSearchQuery('');
    setTargetFilter('all');
    setActiveTab('all');
    setCurrentPage(1);
    setExpandedReport(null);
    setSortBy('createdAt');
    setSortOrder('desc');
    setRefreshKey((prev) => prev + 1);
  };

  const markStatus = async (id, status) => {
    try {
      await updateReportStatus(id, status);
      setExpandedReport(null);
      const res = await getReports({
        page: currentPage,
        limit: reportsPerPage,
        status: tabToStatus(activeTab),
        search: searchQuery,
        target: targetFilter === 'all' ? undefined : targetFilter,
        orderBy: sortBy,
        order: sortOrder,
      });
      setReports(res.data || []);
      setTotalPages(res.pagination?.totalPages || 1);
      setCounts(res.counts || { unread: 0, processed: 0 });
    } catch (err) {
      console.error(err);
      setError('Failed to update report');
    }
  };

  const targets = ['OWNER', 'ADMIN'];

  const formatDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString();
  };

  const statusLabel = (status) => {
    if (status === 'unread') return 'Unread';
    if (status === 'processed') return 'Processed';
    return status;
  };

  // Tạo array các số trang để hiển thị
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= maxPagesToShow; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - maxPagesToShow + 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div className="w-full h-full bg-gray-50">
      <div className="w-full h-full flex flex-col">
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <h1 className="text-4xl font-bold text-gray-900">Report</h1>
        </div>

        {/* Tabs and Actions */}
        <div className="bg-white rounded-none shadow-sm flex-1 flex flex-col w-full">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex gap-8">
              <button 
                className={`pb-3 font-medium transition-colors relative text-base ${
                  activeTab === 'all' 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => handleTabChange('all')}
              >
                All Reports
              </button>
              <button 
                className={`pb-3 font-medium transition-colors relative text-base ${
                  activeTab === 'unread' 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => handleTabChange('unread')}
              >
                Unread
                <span className="ml-2 bg-blue-100 text-blue-600 text-xs font-semibold px-2.5 py-1 rounded-full">
                  {unreadCount}
                </span>
              </button>
              <button 
                className={`pb-3 font-medium transition-colors text-base ${
                  activeTab === 'processed' 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => handleTabChange('processed')}
              >
                Processed
                <span className="ml-2 bg-gray-100 text-gray-600 text-xs font-semibold px-2.5 py-1 rounded-full">
                  {processedCount}
                </span>
              </button>
              <button className="pb-3 text-gray-400 font-medium text-base">...</button>
            </div>

            <div className="flex items-center gap-3">
              <button
                className="px-5 py-2.5 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md transition-all duration-200 hover:bg-gray-50 hover:-translate-y-0.5 active:translate-y-0"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
              >
                Filter
              </button>
              <button
                className="px-5 py-2.5 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md transition-all duration-200 hover:bg-gray-50 hover:-translate-y-0.5 active:translate-y-0"
                onClick={handleRefresh}
              >
                Refresh
              </button>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <Search />
                </div>
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={handleSearch}
                  className="pl-11 pr-4 py-2.5 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                />
              </div>
            </div>
          </div>

          {/* Filter Panel */}
          {isFilterOpen && (
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Target</label>
                  <select
                    value={targetFilter}
                    onChange={(e) => {
                      setTargetFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="all">All</option>
                    {targets.map(target => (
                      <option key={target} value={target}>{target}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Order By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="id">ID</option>
                    <option value="createdAt">Date</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Order</label>
                  <select
                    value={sortOrder}
                    onChange={(e) => {
                      setSortOrder(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="asc">Asc</option>
                    <option value="desc">Desc</option>
                  </select>
                </div>
                <button
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md transition-all duration-200 hover:bg-gray-50 hover:-translate-y-0.5 active:translate-y-0"
                  onClick={() => {
                    setTargetFilter('all');
                    setSortBy('createdAt');
                    setSortOrder('desc');
                  }}
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}

          {/* Report List */}
          <div className="divide-y divide-gray-200 flex-1 overflow-y-auto">
            {loading ? (
              <div className="px-6 py-12 text-center text-gray-500">
                <p className="text-lg">Loading...</p>
              </div>
            ) : error ? (
              <div className="px-6 py-12 text-center text-red-600">
                <p className="text-lg">{error}</p>
              </div>
            ) : currentReports.length > 0 ? (
              currentReports.map((report) => (
                <div key={report.id} className="border-b border-gray-200">
                  <div 
                    className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => toggleReport(report.id)}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-base text-gray-500 font-medium">
                        {report.id < 10 ? `0${report.id}` : report.id}
                      </span>
                      <span className="text-base font-medium text-gray-900">
                        Report ID #{report.id} By {report.sender?.fullName || report.sender?.email || 'Unknown'}
                      </span>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                      {expandedReport === report.id ? <Minus /> : <Plus />}
                    </button>
                  </div>

                  {expandedReport === report.id && (
                    <div className="px-6 py-5 bg-gray-50 border-t border-gray-200">
                      <div className="flex flex-wrap gap-8">
                        <div className="flex items-start gap-4">
                          <span className="text-base text-gray-500 whitespace-nowrap">Reported By</span>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-500 text-sm">👤</span>
                            </div>
                            <div>
                              <div className="text-base font-medium text-gray-900">
                                {report.sender?.fullName || 'Unknown'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {report.sender?.email || ''}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex-1">
                          <div className="text-base text-gray-500 mb-2">Detail Report</div>
                          <div className="text-base text-gray-700 leading-relaxed">{report.content}</div>
                        </div>

                        <div className="min-w-30">
                          <div className="text-base text-gray-500 mb-2">Date</div>
                          <div className="text-base font-medium text-gray-900 whitespace-pre-line">
                            {formatDate(report.createdAt)}
                          </div>
                        </div>

                        <div className="min-w-37.5">
                          <div className="text-base text-gray-500 mb-2">Target</div>
                          <div className="text-base font-medium text-gray-900">{report.target}</div>
                        </div>

                        <div className="min-w-35">
                          <div className="text-base text-gray-500 mb-2">Status</div>
                          <div className={`text-base font-medium ${
                            report.status === 'unread' ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {statusLabel(report.status)}
                          </div>
                          <div className="flex flex-col gap-2 mt-4">
                            <button
                              className="text-sm text-blue-600 text-left transition-all duration-200 hover:underline hover:-translate-y-0.5 active:translate-y-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                markStatus(report.id, 'unread');
                              }}
                            >
                              Mark it Unread
                            </button>
                            <button
                              className="text-sm text-blue-600 text-left transition-all duration-200 hover:underline hover:-translate-y-0.5 active:translate-y-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                markStatus(report.id, 'processed');
                              }}
                            >
                              Mark it Processed
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="px-6 py-12 text-center text-gray-500">
                <p className="text-lg">No reports found</p>
                <p className="text-sm mt-2">Try adjusting your search or filter criteria</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 0 && (
            <div className="flex items-center justify-center gap-2 px-6 py-4 border-t border-gray-200">
              <button 
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className={`px-4 py-2 text-base rounded transition-all duration-200 ${
                  currentPage === 1 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-gray-600 hover:bg-gray-100 hover:-translate-y-0.5 active:translate-y-0'
                }`}
              >
                Previous
              </button>
              
              {getPageNumbers().map((page, index) => (
                page === '...' ? (
                  <span key={`ellipsis-${index}`} className="px-3 text-gray-400 text-base">...</span>
                ) : (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`px-4 py-2 text-base rounded min-w-10 transition-all duration-200 ${
                      currentPage === page
                        ? 'bg-blue-600 text-white font-medium'
                        : 'text-gray-600 hover:bg-gray-100 hover:-translate-y-0.5 active:translate-y-0'
                    }`}
                  >
                    {page}
                  </button>
                )
              ))}

              <button 
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 text-base rounded transition-all duration-200 ${
                  currentPage === totalPages 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-gray-600 hover:bg-gray-100 hover:-translate-y-0.5 active:translate-y-0'
                }`}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReportManagement;