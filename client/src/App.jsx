import React from "react";
import { Routes, Route } from "react-router-dom";
import Users from "./pages/Admin/User.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";

function App() {
  return (
    <Routes>
      <Route path="/admin" element={<AdminLayout />}>
        <Route path="users" element={<Users />} />
      </Route>
    </Routes>
  );
}

export default App;
