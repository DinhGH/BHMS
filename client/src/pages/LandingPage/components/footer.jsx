export default function Footer(){
    return(
        <footer className="footer">
        <div className="up-footer">
          <div className="logo-block">
          <img src="/images/logo.png" alt="Logo" />
          <span>Boarding House Management System</span>
          <div className="logo-links">
  {/* Facebook */}
            <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="icon fb-icon">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
    </svg>
  </a>

  {/* Instagram */}
  <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon ig-icon">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
  </a>

  {/* Gmail */}
  <a href="mailto:contact@example.com" aria-label="Gmail">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon gmail-icon">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
      <polyline points="22,6 12,13 2,6"></polyline>
    </svg>
  </a>
          </div>
          </div>
          <div className="block">
            <h3>About Us</h3>
            <p>Our Story</p>
            <p>Carrers</p>
            <p>Contact Us</p>
          </div>
          <div className="block">
            <h3>Community</h3>
            <p>Blog</p>
            <p>Forums</p>
            <p>Affiliates</p>
          </div>
          <div className="block">
            <h3>Help</h3>
            <p>Help Center</p>
            <p>FAQs</p>
            <p>Terms of Service</p>
          </div>
        </div>
        <div className="down-footer">
          <div className="ending">
            <p>&copy; 2026, Boarding House Management System</p>
              <div className="privacy">
                <p>Privacy & Policy</p>
              <p>Terms & Condition</p>
              </div>
          </div>
          </div>
      </footer>
    )
}