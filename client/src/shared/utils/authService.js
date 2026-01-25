import { fetchApi } from "../../services/api";

export const loginUser = async (email, password) => {
  try {
    return await fetchApi("/auth/login", {
      method: "POST",
      body: { email, password },
    });
  } catch (error) {
    return { success: false, message: error.message || "Login failed" };
  }
};

export const registerUser = async (email, password, passwordConfirm) => {
  try {
    return await fetchApi("/auth/register", {
      method: "POST",
      body: { email, password, passwordConfirm },
    });
  } catch (error) {
    return { success: false, message: error.message || "Registration failed" };
  }
};

export const forgotPassword = async (email) => {
  try {
    return await fetchApi("/user/forgot-password", {
      method: "POST",
      body: { email },
    });
  } catch (error) {
    return { success: false, message: error.message || "Failed to send OTP" };
  }
};

export const verifyOtp = async (email, otp) => {
  try {
    return await fetchApi("/user/verify-otp", {
      method: "POST",
      body: { email, otp },
    });
  } catch (error) {
    return {
      success: false,
      message: error.message || "OTP verification failed",
    };
  }
};

export const resetPassword = async (email, otp, newPassword) => {
  try {
    return await fetchApi("/user/reset-password", {
      method: "POST",
      body: { email, otp, newPassword },
    });
  } catch (error) {
    return {
      success: false,
      message: error.message || "Failed to reset password",
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

//jnwr
