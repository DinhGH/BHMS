import { fetchApi } from "../services/api.js";

export const loginUser = async (email, password) => {
  try {
    const response = await fetchApi("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    return response;
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};

export const registerUser = async (email, password, passwordConfirm) => {
  try {
    const response = await fetchApi("/auth/register", {
      method: "POST",
      body: { email, password, passwordConfirm },
    });
    return response;
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};

export const logoutUser = async (userId) => {
  try {
    const response = await fetchApi("/auth/logout", {
      method: "POST",
      body: { userId },
    });
    return response;
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};
