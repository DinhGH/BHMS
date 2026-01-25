const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
const defaultHeaders = { "Content-Type": "application/json" };

const withAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function fetchApi(path, { method = "GET", body } = {}) {
  const headers = { ...defaultHeaders, ...withAuthHeaders() };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message || data?.error || "Request failed";
    throw new Error(message);
  }
  return data;
}

// Helper: apply client-side filters
const applyServiceFilters = (list, filters = {}) => {
  const {
    text, // search by name/description
    priceType, // FIXED | UNIT_BASED | PERCENTAGE
    isActive, // true/false
    minPrice, // number
    maxPrice, // number
    unit, // match unit
  } = filters;

  return list.filter((s) => {
    const name = (s.name || "").toLowerCase();
    const desc = (s.description || "").toLowerCase();
    const unitStr = (s.unit || "").toLowerCase();

    if (text) {
      const q = text.toLowerCase();
      if (!name.includes(q) && !desc.includes(q)) return false;
    }
    if (priceType && s.priceType !== priceType) return false;
    if (typeof isActive === "boolean" && s.isActive !== isActive) return false;
    if (typeof minPrice === "number" && s.price < minPrice) return false;
    if (typeof maxPrice === "number" && s.price > maxPrice) return false;
    if (unit && !unitStr.includes(unit.toLowerCase())) return false;

    return true;
  });
};

// Service Management APIs
export const getServices = async (filters) => {
  const token = localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const response = await fetch(`${API_BASE_URL}/services`, { headers });
  if (!response.ok) throw new Error("Failed to fetch services");
  const data = await response.json();
  return filters
    ? applyServiceFilters(Array.isArray(data) ? data : [], filters)
    : data;
};

export const createService = async (serviceData) => {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const response = await fetch(`${API_BASE_URL}/services`, {
    method: "POST",
    headers,
    body: JSON.stringify(serviceData),
  });
  if (!response.ok) throw new Error("Failed to create service");
  return await response.json();
};

export const updateService = async (serviceId, serviceData) => {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const response = await fetch(`${API_BASE_URL}/services/${serviceId}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(serviceData),
  });
  if (!response.ok) throw new Error("Failed to update service");
  return await response.json();
};

export const deleteService = async (serviceId) => {
  const token = localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const response = await fetch(`${API_BASE_URL}/services/${serviceId}`, {
    method: "DELETE",
    headers,
  });
  if (!response.ok) throw new Error("Failed to delete service");
  return await response.json();
};

// Notifications API (implement basic fetch)
export const getNotifications = async () => {
  const token = localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(`${API_BASE_URL}/notifications`, { headers });
  if (!res.ok) throw new Error("Failed to fetch notifications");
  return res.json();
};
