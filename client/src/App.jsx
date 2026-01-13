import "./App.css";
import { Routes, Route } from "react-router-dom";
import TenantHome from "./pages/tenant/TenantHome.jsx";

function App() {
  return (
    <Routes>
      <Route path="/tenant" element={<TenantHome />} />
    </Routes>
  );
}

export default App;
