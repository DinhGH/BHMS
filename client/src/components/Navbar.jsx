import { useLogout } from '../hooks/useLogout';

const Navbar = () => {
  const handleLogout = useLogout();

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
