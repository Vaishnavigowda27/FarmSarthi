import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import FarmerDashboard from './pages/FarmerDashboard';
import RenterDashboard from './pages/RenterDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Equipments from './pages/Equipments';
import Payment from './pages/Payment';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Dashboards */}
        <Route path="/farmer" element={<FarmerDashboard />} />
        <Route path="/renter" element={<RenterDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        
        {/* Equipment & Booking */}
        <Route path="/equipments" element={<Equipments />} />
        <Route path="/payment/:bookingId" element={<Payment />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;