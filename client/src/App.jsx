import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Tenants from "./pages/Tenants";
import TenantDetail from "./pages/TenantDetail";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Layout route */}
        <Route element={<MainLayout />}>
          {/* Pages inside layout */}
          <Route path="/" element={<Tenants />} />
          <Route path="/tenants" element={<Tenants />} />

          <Route path="/tenants/:id" element={<TenantDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
