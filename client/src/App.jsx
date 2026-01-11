import { Routes, Route, useLocation } from 'react-router-dom'; 
import { useEffect, useState } from 'react';
import LandingPage from './pages/LandingPage/landing-page.jsx';
import './App.css';
import SignUp from './pages/SignUp/signup.jsx';

function App() {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState('enter');

  useEffect(() => {
    if (location !== displayLocation) {
      setTransitionStage('exit');
    }
  }, [location, displayLocation]);

  return (
    <div className={`page-${transitionStage}`}
      onAnimationEnd={() => {
        if (transitionStage === 'exit') {
          setDisplayLocation(location);
          setTransitionStage('enter');
        }
      }}
    >
      <Routes location={displayLocation}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<SignUp />} />
      </Routes>
    </div>
  );
}

export default App;