export default function About(){
    return(
        <section className="about" id="about">
        <h2>WHY CHOOSE US?</h2>
        <p>We are dedicated to simplifying the rental experience. Our platform offers a seamless, secure, and transparent way to manage properties.</p>
        <div className="about-grid">
          <img src="/images/team.avif" alt="Company Images" />
          <div className="about-content"> 
            <div className="about-card">
              <img src="/images/tick.jpg" alt="Icon" />
              <div className="about-info">
                <h4>Verified Listings</h4>
              <p>All listings are verified to ensure accuracy and trustworthiness.</p>
              </div>
            </div>
            <div className="about-card">
              <img src="/images/ai.jpg" alt="Icon" />
              <div className="about-info">
              <h4>Smart Management</h4>
              <p>Intelligent tools to automate operations, including AI-powered utility reading.</p>
              </div>
            </div>
            <div className="about-card">
              <img src="/images/247.jpg" alt="Icon" />
              <div className="about-info">
              <h4>24/7 Support</h4>
              <p>Our support team is available around the clock to assist you.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
}