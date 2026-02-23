const API_URL = import.meta.env.VITE_API_BASE_URL;

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

    const err = new Error(errorData.message || "Request failed");
    err.status = res.status;
    err.response = {
      status: res.status,
      data: errorData,
    };
    throw err;
  }

  if (res.status === 204) return null;
  return res.json();
}

const api = {
  get: (url, config = {}) => {
    let finalUrl = url;
    if (config.params) {
      const params = new URLSearchParams();
      Object.keys(config.params).forEach((key) => {
        const value = config.params[key];
        if (value !== undefined && value !== null) {
          params.append(key, value);
        }
      });

      const queryString = params.toString();
      if (queryString) {
        finalUrl = `${url}?${queryString}`;
      }
    }

    return request(finalUrl, {
      method: "GET",
      ...config,
    });
  },

  post: (url, data) =>
    request(url, {
      method: "POST",
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),

  put: (url, data) =>
    request(url, {
      method: "PUT",
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),

  delete: (url, data) =>
    request(url, {
      method: "DELETE",
      body: JSON.stringify(data),
    }),
};

export default api;
