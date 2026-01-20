import "./Header.css";

export default function Header() {
  const handleProfileClick = () => {
    // later you can navigate("/profile")
    console.log("Go to user profile");
  };

  return (
    <header className="header">
      {/* LEFT */}
      <div className="header-left">
        <button className="header-btn">Menu</button>
        <span className="divider">|</span>
        <button className="header-btn">Back</button>
      </div>

      {/* RIGHT */}
      <div className="header-right">
        <button
          className="avatar"
          onClick={handleProfileClick}
          aria-label="User Profile"
        >
          <span className="avatar-icon">👤</span>
        </button>

        <span className="welcome-text">Welcome, User Name!</span>

        <div className="notification">
          🔔
          <span className="badge">9</span>
        </div>
      </div>
    </header>
  );
}
