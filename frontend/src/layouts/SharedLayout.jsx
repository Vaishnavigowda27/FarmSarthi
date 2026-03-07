import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Tractor,
  LayoutDashboard,
  Settings,
  LogOut,
} from 'lucide-react';
import Navbar from '../components/Navbar';

const navItemsByRole = (role) => {
  if (role === 'renter') {
    return [
      { label: 'Dashboard', to: '/renter', icon: LayoutDashboard },
    ];
  }
  if (role === 'farmer') {
    return [
      { label: 'Search', to: '/equipment', icon: Tractor },
      { label: 'My Bookings', to: '/farmer', icon: LayoutDashboard },
    ];
  }
  if (role === 'admin') {
    return [
      { label: 'Admin Dashboard', to: '/admin', icon: LayoutDashboard },
      { label: 'Settings', to: '/admin/settings', icon: Settings },
    ];
  }
  return [];
};

export default function SharedLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const items = navItemsByRole(user?.role);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-gray-900 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex md:flex-col w-64 bg-farm-dark text-white sticky top-0 h-screen">
        <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3">
          <div className="h-9 w-9 rounded-2xl bg-white/10 flex items-center justify-center">
            <Tractor className="w-5 h-5 text-farm-light" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight">
              FarmSaarthi
            </p>
            <p className="text-[11px] text-white/60">
              Connecting Farmers & Equipment
            </p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {items.map(({ label, to, icon: Icon }) => {
            const active = location.pathname === to || location.pathname.startsWith(to + '/');
            return (
              <button
                key={to}
                onClick={() => navigate(to)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition
                  ${active ? 'bg-white text-farm-dark shadow-sm' : 'text-white/80 hover:bg-white/10'}`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-farm-dark' : 'text-farm-light'}`} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-white/10 space-y-2">
          {user && (
            <div className="text-xs text-white/80">
              <p className="font-semibold">{user.name}</p>
              <p className="capitalize text-white/60">{user.role}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-white"
          >
            <span className="flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="flex-1 px-4 md:px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

