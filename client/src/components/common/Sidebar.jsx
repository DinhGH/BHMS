import { useState } from "react";
import "./Sidebar.css";

export default function Sidebar() {
  const [activeItem, setActiveItem] = useState(null);
  const [search, setSearch] = useState("");

  const menuItems = [
    "Boarding House Management",
    "Tenants Management",
    "Service & Bill",
    "Contract Management",
    "Payments",
    "Chat",
    "Reports & Issues",
    "Dashboard",
  ];

  const filteredItems = menuItems.filter((item) =>
    item.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <aside className="sidebar">
      {/* Logo + Brand */}
      <div className="sidebar-header">
        <img src="/icon.png" alt="BHMS Logo" className="logo" />
        <div className="brand-text">
          <span className="brand-name">BHMS</span>
          <span className="brand-sub">for Owner</span>
        </div>
      </div>

      {/* Search (UI unchanged) */}
      <div className="sidebar-search">
        <input
          type="text"
          placeholder="Search for..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Menu (same UI, filtered data only) */}
      <nav className="menu">
        <ul>
          {filteredItems.map((item) => (
            <li
              key={item}
              className={`menu-item ${
                activeItem === item ? "active" : ""
              }`}
              onClick={() => setActiveItem(item)}
            >
              {item}
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout */}
      <button className="logout">Log out</button>
    </aside>
  );
}

