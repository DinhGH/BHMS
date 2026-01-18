import { authService } from "../services/authService.js";

export const register = async (req, res) => {
  try {
    const { email, password, passwordConfirm } = req.body;

    const { user, token } = await authService.registerUser(
      email,
      password,
      passwordConfirm,
    );

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: user,
      token,
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Registration failed",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { user, token } = await authService.loginUser(email, password);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: user,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(401).json({
      success: false,
      message: error.message || "Login failed",
    });
  }
};
