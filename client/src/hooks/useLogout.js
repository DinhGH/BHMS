import { useAuth } from '../context/AuthContext';

/**
 * Custom hook để logout
 * Cách sử dụng:
 * const handleLogout = useLogout();
 * <button onClick={handleLogout}>Logout</button>
 */
export const useLogout = () => {
  const { logout } = useAuth();
  
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Lỗi khi logout:', error);
    }
  };

  return handleLogout;
};
