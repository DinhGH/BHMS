import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Navbar(){
    const navigate = useNavigate();
    return(
      <nav className="navbar">
        <div className="logo-section">
          <img src="/images/icon.png" alt="Logo" className='logo-img'/>
          <span className="logo-text">Boarding House Management System</span>
        </div>
        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#features">Our Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#about">About Us</a>
          <span className="divider"></span>
          <button className="btn-reg" onClick={() => navigate('/signup')}>Register</button>
          <button className="btn-login">Login</button>
        </div>
      </nav>
    )
}
