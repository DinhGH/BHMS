const API_URL = import.meta.env.VITE_API_BASE_URL;

async function request(url, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    ...(options.headers || {}),
  };

  // ✅ QUAN TRỌNG: Không set Content-Type cho FormData
  // Browser tự động set với boundary đúng
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  } else {
    // ✅ Xóa Content-Type nếu có để browser tự set
    delete headers["Content-Type"];
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  console.log("🌐 API Request:", {
    url: `${API_URL}${url}`,
    method: config.method,
    isFormData: options.body instanceof FormData,
    headers: config.headers,
  });

  const res = await fetch(`${API_URL}${url}`, config);

  if (!res.ok) {
    let errorData = {};
    try {
      errorData = await res.json();
    } catch {
      // ignore JSON parse error
    }

    console.error("❌ API Error:", errorData);
    throw {
      status: res.status,
      message: errorData.message || "Request failed",
    };
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

  post: (url, data, config = {}) => {
    const isFormData = data instanceof FormData;

    return request(url, {
      method: "POST",
      body: isFormData ? data : JSON.stringify(data),
      ...config,
    });
  },

  put: (url, data, config = {}) => {
    const isFormData = data instanceof FormData;

    return request(url, {
      method: "PUT",
      body: isFormData ? data : JSON.stringify(data),
      ...config,
    });
  },

  delete: (url, data) =>
    request(url, {
      method: "DELETE",
      body: data ? JSON.stringify(data) : undefined,
    }),
};

export default api;
