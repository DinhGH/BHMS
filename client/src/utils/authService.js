import apiClient from "./api";

export const loginUser = async (email, password) => {
  try {
    const response = await apiClient.post("/auth/login", {
      email,
      password,
    });
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Login failed",
    };
  }
};

export const registerUser = async (email, password, passwordConfirm) => {
  try {
    const response = await apiClient.post("/auth/register", {
      email,
      password,
      passwordConfirm,
    });
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Registration failed",
    };
  }
};

export const loginWithGoogle = () => {
  // Implementation for Google login
  console.log("Google login not implemented");
};

export const loginWithFacebook = () => {
  // Implementation for Facebook login
  console.log("Facebook login not implemented");
};
