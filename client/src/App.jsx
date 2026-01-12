import React from "react";
import { Routes, Route } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout.jsx";

function App() {
  return (
    <Routes>
      <Route path="/admin" element={<AdminLayout />}></Route>
    </Routes>
  );
}

export default App;
