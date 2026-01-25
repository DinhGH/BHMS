import "./App.css";
import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import HomePageOwner from "./pages/owner/HomePageOwner";
import Loading from "./components/loading";

function App() {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const timeoutId = setTimeout(() => setIsLoading(false), 400);

    return () => clearTimeout(timeoutId);
  }, [location.pathname]);

  return (
    <>
      <Loading isLoading={isLoading} />
      <Routes>
        <Route path="/owner" element={<HomePageOwner />} />
      </Routes>
    </>
  );
}

export default App;
