import { useEffect, useState } from "react";
import TenantGrid from "../components/tenants/TenantGrid";
import Pagination from "../components/common/Pagination";
import "./Tenants.css";

const API = "http://localhost:3000/api/tenants";


export default function Tenants() {
  const [tenants, setTenants] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    fetch(`${API}?page=${page}&search=${search}`)
      .then(res => res.json())
      .then(res => {
        if (res?.data) {
          setTenants(res.data);
          setTotalPages(res.totalPages || 1);
        } else {
          setTenants([]);
          setTotalPages(1);
        }
      })
      .catch(err => {
        console.error("Fetch tenants error:", err);
        setTenants([]);
        setTotalPages(1);
      })
      .finally(() => setLoading(false));
  }, [page, search]);



  return (
    <div className="tenants-page">
      {/* TOP BAR */}
      <div className="tenants-header">
        <input
          className="tenants-search"
          placeholder="Search"
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />

        <div className="tenants-actions">
          <button className="btn">Filter</button>
          <button className="btn primary">Add New</button>
        </div>
      </div>

      {/* CONTENT */}
      {loading ? (
        <p style={{ textAlign: "center", marginTop: 40 }}>
          Loading tenants...
        </p>
      ) : (
        <TenantGrid tenants={tenants} />
      )}

      {/* PAGINATION */}
      {/* {!loading && totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onChange={setPage}
        />
      )} */}

      {!loading && (
  <Pagination
    page={page}
    totalPages={totalPages}
    onChange={setPage}
  />
)}

    </div>
  );
}
