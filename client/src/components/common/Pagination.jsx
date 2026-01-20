// import "./Pagination.css";


// export default function Pagination({ page, totalPages, onChange }) {
//   return (
//     <div className="pagination">
//       {/* Previous */}
//       <button
//         disabled={page === 1}
//         onClick={() => onChange(page - 1)}
//       >
//         &lt;
//       </button>

//       {/* Page numbers */}
//       {Array.from({ length: totalPages || 1 }, (_, i) => (
//         <button
//           key={i}
//           className={page === i + 1 ? "active" : ""}
//           onClick={() => onChange(i + 1)}
//         >
//           {i + 1}
//         </button>
//       ))}

//       {/* Next */}
//       <button
//         disabled={page === totalPages}
//         onClick={() => onChange(page + 1)}
//       >
//         &gt;
//       </button>
//     </div>
//   );
// }

import "./Pagination.css";

export default function Pagination({ page, totalPages, onChange }) {
  // Always render pagination (even if totalPages === 1)

  const maxVisible = 5;

  const getPages = () => {
    if (totalPages <= maxVisible + 2) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = [];
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);

    pages.push(1);

    if (start > 2) pages.push("...");

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages - 1) pages.push("...");

    pages.push(totalPages);

    return pages;
  };

  return (
    <div className="pagination-wrapper">
      <div className="pagination">
        {/* Previous */}
        <button
          className="nav-btn"
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
        >
          ‹ Previous
        </button>

        {/* Page Numbers */}
        {getPages().map((p, idx) =>
          p === "..." ? (
            <span key={idx} className="dots">…</span>
          ) : (
            <button
              key={p}
              className={`page-btn ${page === p ? "active" : ""}`}
              onClick={() => onChange(p)}
            >
              {p}
            </button>
          )
        )}

        {/* Next */}
        <button
          className="nav-btn"
          disabled={page === totalPages}
          onClick={() => onChange(page + 1)}
        >
          Next ›
        </button>
      </div>
    </div>
  );
}
