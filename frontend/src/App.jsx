import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import useAuthStore from './context/authStore';

// Placeholder components - to be created
const Register = () => <div className="min-h-screen flex items-center justify-center"><h1 className="text-3xl">Register Page - To be implemented</h1></div>;
const Equipment = () => <div className="min-h-screen flex items-center justify-center"><h1 className="text-3xl">Equipment Page - To be implemented</h1></div>;
const FarmerDashboard = () => <div className="min-h-screen flex items-center justify-center"><h1 className="text-3xl">Farmer Dashboard - To be implemented</h1></div>;
const RenterDashboard = () => <div className="min-h-screen flex items-center justify-center"><h1 className="text-3xl">Renter Dashboard - To be implemented</h1></div>;
const AdminDashboard = () => <div className="min-h-screen flex items-center justify-center"><h1 className="text-3xl">Admin Dashboard - To be implemented</h1></div>;
const Checkout = () => <div className="min-h-screen flex items-center justify-center"><h1 className="text-3xl">Checkout Page - To be implemented</h1></div>;
const Payment = () => <div className="min-h-screen flex items-center justify-center"><h1 className="text-3xl">Payment Page - To be implemented</h1></div>;

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/equipment" element={<Equipment />} />

            {/* Farmer Routes */}
            <Route
              path="/farmer/dashboard"
              element={
                <ProtectedRoute allowedRoles={['farmer']}>
                  <FarmerDashboard />
                </ProtectedRoute>
              }
            />

            {/* Renter Routes */}
            <Route
              path="/renter/dashboard"
              element={
                <ProtectedRoute allowedRoles={['renter']}>
                  <RenterDashboard />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Booking Routes */}
            <Route
              path="/checkout/:equipmentId"
              element={
                <ProtectedRoute allowedRoles={['farmer']}>
                  <Checkout />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payment/:bookingId"
              element={
                <ProtectedRoute allowedRoles={['farmer']}>
                  <Payment />
                </ProtectedRoute>
              }
            />

            {/* 404 */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        <Footer />
      </div>
      
      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#333',
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </Router>
  );
}

export default App;