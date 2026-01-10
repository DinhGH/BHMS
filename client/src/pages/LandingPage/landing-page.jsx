import React from 'react';
import './landing-page.css'; // Import CSS

import Navbar from './components/navbar.jsx';
import Hero from './components/hero.jsx';
import Features from './components/features.jsx';
import Pricing from './components/pricing.jsx';
import About from './components/about-us.jsx';
import Reviews from './components/reviews.jsx';
import Footer from './components/footer.jsx';

function LandingPage() {
  return (
    <div className="container">
      <Navbar />
      <Hero/>
      <Features />
      <Pricing />
      <About />
      <Reviews /> 
      <Footer />
    </div>
  );
}

export default LandingPage;