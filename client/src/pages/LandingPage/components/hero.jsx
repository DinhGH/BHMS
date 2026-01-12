import { useNavigate } from 'react-router-dom';

export default function Hero(){
    const navigate = useNavigate();
    return(
        <header className="hero" id="home">
        <div className="hero-contents">
          <h1>Smart & Efficient </h1>
          <h1>Boarding House Management System</h1>
          <p>Streamline your operations with our all-in-one solution. Digitalize contracts, automate utility billing with AI, and connect landlords with tenants seamlessly.</p>
          <div className="btn-hero">
            <button className="btn-getstart" onClick={() => navigate('/signup')}>Get Started Now!</button>
            <button className="btn-trydemo">Try Demo</button>
          </div>
        </div>
        <div className="hero-image">
          <img src="/images/hr-bnr.webp" alt="Dashboard Preview" className='hero-img'/>
        </div>
      </header>
    )
}