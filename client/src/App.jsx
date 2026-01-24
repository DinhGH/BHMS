import "./App.css";
import { Routes, Route } from "react-router-dom";
import HomePageOwner from "./pages/owner/HomePageOwner";
import ServiceManagement from "./components/ServiceManagement";
import ReportManagement from "./components/ReportManagement";

function App() {
  return (
    <div className="flex">
      <div className="flex-1">
        <Routes>
          <Route path="/owner" element={<HomePageOwner />} />
          <Route path="/services" element={<ServiceManagement />} />
          <Route path="/reports" element={<ReportManagement />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
