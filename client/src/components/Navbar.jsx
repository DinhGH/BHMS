import { useNavigate } from 'react-router-dom';
import { logout } from '../utils/authService';

const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout(navigate);
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <h1>BHMS</h1>
        <button 
          onClick={handleLogout}
          className="logout-btn"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
