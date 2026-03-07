import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import SharedLayout from './layouts/SharedLayout';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Equipment from './pages/Equipments';
import FarmerDashboard from './pages/FarmerDashboard';
import RenterDashboard from './pages/RenterDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Checkout from './pages/Checkout';
import Payment from './pages/Payment';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }

  return children;
};

function AppContent() {
  return (
    <Router>
      <Routes>
        {/* Public Routes (no sidebar) */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Farmer + Renter + Admin routes inside shared layout */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['farmer', 'renter', 'admin']}>
              <SharedLayout />
            </ProtectedRoute>
          }
        >
          {/* Farmer */}
          <Route
            path="/farmer"
            element={<FarmerDashboard />}
          />
          <Route
            path="/equipment"
            element={<Equipment />}
          />
          <Route
            path="/checkout/:equipmentId"
            element={<Checkout />}
          />
          <Route
            path="/payment/:bookingId"
            element={<Payment />}
          />

          {/* Renter */}
          <Route
            path="/renter"
            element={<RenterDashboard />}
          />

          {/* Admin */}
          <Route
            path="/admin"
            element={<AdminDashboard />}
          />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;