import React from "react";
import { Routes, Route } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout.jsx";
import AdminDashBoard from "./components/Admin/AdminDashBoard.jsx";

function App() {
  return (
    <Routes>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashBoard />} />
      </Route>
    </Routes>
  );
}

export default App;
