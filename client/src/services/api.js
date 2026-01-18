const API_BASE_URL = "http://localhost:5000/api";

export const fetchApi = async (path, options = {}) => {
  const { method = "GET", body, ...rest } = options;

  const headers = {
    "Content-Type": "application/json",
    ...rest.headers,
  };

  // Add token if exists
  const token = localStorage.getItem("token");
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
    ...rest,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, config);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "API request failed");
  }

  return await response.json();
};

export default { fetchApi };
