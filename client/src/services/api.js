const API_URL = "http://localhost:5000/api";

export async function fetchTenants({ page = 1, limit = 8, search = "" }) {
  const res = await fetch(
    `${API_URL}/tenants?page=${page}&limit=${limit}&search=${search}`
  );
  return res.json();
}
