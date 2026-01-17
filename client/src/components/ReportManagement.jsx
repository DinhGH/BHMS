import { useState } from 'react';

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

  // Tạo data mẫu với nhiều thông tin hơn
  const allReports = Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    user: `User name ${i + 1}`,
    userHouse: `User House ${String.fromCharCode(65 + (i % 26))}`,
    status: i % 3 === 0 ? 'Processed' : 'Unread',
    room: `Room ${String.fromCharCode(65 + (i % 5))} - Block ${String.fromCharCode(65 + (i % 3))}`,
    date: `${10 + (i % 12)}:${(i % 60).toString().padStart(2, '0')} ${i % 2 === 0 ? 'AM' : 'PM'}\n${(i % 28) + 1}/${(i % 12) + 1}/2024`,
    detail: `Lorem ipsum dolor sit amet, consectetur adipisicing elit. Report #${i + 1} - Id rerum eum odit, pariatur pellentesque. Nunc condimentum ex sed facilisis ultricies. Issue details for report ${i + 1}.`
  }));

  const reportsPerPage = 10;

  // Lọc reports theo search query
  const filteredReports = allReports.filter(report => {
    const query = searchQuery.toLowerCase();
    return (
      report.id.toString().includes(query) ||
      report.user.toLowerCase().includes(query) ||
      report.userHouse.toLowerCase().includes(query) ||
      report.room.toLowerCase().includes(query) ||
      report.status.toLowerCase().includes(query) ||
      report.detail.toLowerCase().includes(query)
    );
  });

  // Lọc theo tab
  const tabFilteredReports = filteredReports.filter(report => {
    if (activeTab === 'unread') return report.status === 'Unread';
    if (activeTab === 'processed') return report.status === 'Processed';
    return true; // all reports
  });

  const totalPages = Math.ceil(tabFilteredReports.length / reportsPerPage);

  // Lấy reports của trang hiện tại
  const indexOfLastReport = currentPage * reportsPerPage;
  const indexOfFirstReport = indexOfLastReport - reportsPerPage;
  const currentReports = tabFilteredReports.slice(indexOfFirstReport, indexOfLastReport);

  // Đếm số lượng theo status
  const unreadCount = allReports.filter(r => r.status === 'Unread').length;
  const processedCount = allReports.filter(r => r.status === 'Processed').length;

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
    <div className="w-full h-full bg-gray-50 p-8">
      <div className="w-full h-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Report</h1>
        </div>

        {/* Tabs and Actions */}
        <div className="bg-white rounded-lg shadow-sm mb-6 h-auto">
          <div className="flex items-center justify-between px-8 py-5 border-b border-gray-200">
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

            <div className="flex items-center gap-4">
              <button className="px-5 py-2.5 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                Filter
              </button>
              <button className="px-5 py-2.5 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
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

          {/* Report List */}
          <div className="divide-y divide-gray-200">
            {currentReports.length > 0 ? (
              currentReports.map((report) => (
                <div key={report.id} className="border-b border-gray-200">
                  <div 
                    className="flex items-center justify-between px-8 py-5 hover:bg-gray-50 cursor-pointer"
                    onClick={() => toggleReport(report.id)}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-base text-gray-500 font-medium">
                        {report.id < 10 ? `0${report.id}` : report.id}
                      </span>
                      <span className="text-base font-medium text-gray-900">
                        Report ID #{report.id} By {report.user}
                      </span>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                      {expandedReport === report.id ? <Minus /> : <Plus />}
                    </button>
                  </div>

                  {expandedReport === report.id && (
                    <div className="px-8 py-6 bg-gray-50 border-t border-gray-200">
                      <div className="flex gap-10">
                        <div className="flex items-start gap-4">
                          <span className="text-base text-gray-500 whitespace-nowrap">Reported By</span>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-500 text-sm">👤</span>
                            </div>
                            <div>
                              <div className="text-base font-medium text-gray-900">{report.user}</div>
                              <div className="text-sm text-gray-500">{report.userHouse}</div>
                            </div>
                          </div>
                        </div>

                        <div className="flex-1">
                          <div className="text-base text-gray-500 mb-2">Detail Report</div>
                          <div className="text-base text-gray-700 leading-relaxed">{report.detail}</div>
                        </div>

                        <div className="min-w-[120px]">
                          <div className="text-base text-gray-500 mb-2">Date</div>
                          <div className="text-base font-medium text-gray-900 whitespace-pre-line">
                            {report.date}
                          </div>
                        </div>

                        <div className="min-w-[150px]">
                          <div className="text-base text-gray-500 mb-2">Room</div>
                          <div className="text-base font-medium text-gray-900">{report.room}</div>
                        </div>

                        <div className="min-w-[140px]">
                          <div className="text-base text-gray-500 mb-2">Status</div>
                          <div className={`text-base font-medium ${
                            report.status === 'Unread' ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {report.status}
                          </div>
                          <div className="flex flex-col gap-2 mt-4">
                            <button className="text-sm text-blue-600 hover:underline text-left">
                              Mark it Unread
                            </button>
                            <button className="text-sm text-blue-600 hover:underline text-left">
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
              <div className="px-8 py-12 text-center text-gray-500">
                <p className="text-lg">No reports found</p>
                <p className="text-sm mt-2">Try adjusting your search or filter criteria</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 0 && (
            <div className="flex items-center justify-center gap-2 px-8 py-5 border-t border-gray-200">
              <button 
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className={`px-4 py-2 text-base rounded ${
                  currentPage === 1 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-gray-600 hover:bg-gray-100'
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
                    className={`px-4 py-2 text-base rounded min-w-[40px] ${
                      currentPage === page
                        ? 'bg-blue-600 text-white font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                )
              ))}

              <button 
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 text-base rounded ${
                  currentPage === totalPages 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-gray-600 hover:bg-gray-100'
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