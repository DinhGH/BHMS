import "./App.css";
import { Routes, Route } from "react-router-dom";
import HomePageOwner from "./pages/owner/HomePageOwner";
function App() {
  return (
    <Routes>
      <Route path="/owner" element={<HomePageOwner />} />
    </Routes>
  );
}

export default App;
