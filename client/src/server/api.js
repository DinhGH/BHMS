const API_URL = import.meta.env.VITE_API_URL;

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

  const res = await fetch(`${API_URL}${url}`, {
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
