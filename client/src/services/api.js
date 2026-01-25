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

async function request(url, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    ...(options.headers || {}),
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorData = {};
    try {
      errorData = await res.json();
    } catch {
      // ignore JSON parse error
    }

    throw {
      status: res.status,
      message: errorData.message || "Unauthorized",
    };
  }

  if (res.status === 204) return null;
  return res.json();
}

const api = {
  get: (url) => request(url),

  post: (url, data) =>
    request(url, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  put: (url, data) =>
    request(url, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (url, data) =>
    request(url, {
      method: "DELETE",
      body: JSON.stringify(data),
    }),
};

export default api;

export async function getReports({
  page = 1,
  limit = 10,
  status,
  search,
  target,
  orderBy,
  order,
}) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  if (status) params.set("status", status);
  if (search) params.set("search", search);
  if (target) params.set("target", target);
  if (orderBy) params.set("orderBy", orderBy);
  if (order) params.set("order", order);

  const url = `${API_BASE_URL}/reports?${params.toString()}`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch reports");
  return await res.json();
}

export async function updateReportStatus(reportId, status) {
  const res = await fetch(`${API_BASE_URL}/reports/${reportId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ status }),
  });

  if (!res.ok) throw new Error("Failed to update report status");
  return await res.json();
}

export async function createReportAdmin(payload) {
  const res = await fetch(`${API_BASE_URL}/report-admins`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("Failed to create report");
  return await res.json();
}
