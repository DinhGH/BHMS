export const authService = {
  logoutUser: async (userId) => {
    // Logout logic - có thể thêm blacklist token nếu cần
    // Hiện tại chỉ trả về success, client sẽ xóa token từ localStorage
    if (!userId) {
      throw new Error("User ID is required");
    }

    return {
      success: true,
      message: "Logout successful",
    };
  },
};
