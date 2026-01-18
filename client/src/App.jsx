import "./App.css";
import HomePageOwner from "./pages/HomePageOwner";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <HomePageOwner />;
    </>
  );
}

export default App;
