import { Routes, Route } from 'react-router-dom'; // Nhớ cài: npm i react-router-dom
import LandingPage from './pages/LandingPage/landing-page.jsx';
import './App.css';
import SignUp from './pages/SignUp/signup.jsx';
// Sau này ông sẽ import thêm trang Owner ở đây
// import OwnerLayout from './layouts/OwnerLayout';

function App() {
  return (
    <Routes>
      <Route path="/" element={<SignUp />} />
    </Routes>
  );
}

export default App;