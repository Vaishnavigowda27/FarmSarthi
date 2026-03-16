import { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
  Tractor,
  LayoutDashboard,
  Settings,
  LogOut,
  Bell,
} from 'lucide-react';
import Navbar from '../components/Navbar';

const navItemsByRole = (role) => {
  if (role === 'renter') {
    return [
      { label: 'Dashboard', to: '/renter', icon: LayoutDashboard },
      { label: 'Settings', to: '/settings', icon: Settings },
    ];
  }
  if (role === 'farmer') {
    return [
      { label: 'Search', to: '/equipment', icon: Tractor },
      { label: 'My Bookings', to: '/farmer', icon: LayoutDashboard },
      { label: 'Settings', to: '/settings', icon: Settings },
    ];
  }
  if (role === 'admin') {
    return [
      { label: 'Admin Dashboard', to: '/admin', icon: LayoutDashboard },
      { label: 'Settings', to: '/settings', icon: Settings },
    ];
  }
  return [];
};

// Notification type → icon
const notifIcon = (type) => {
  if (type?.includes('booking')) return '📋';
  if (type?.includes('payment')) return '💰';
  if (type?.includes('equipment')) return '🚜';
  if (type?.includes('review')) return '⭐';
  if (type?.includes('dispute')) return '⚠️';
  return '🔔';
};

export default function SharedLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const panelRef = useRef(null);

  const items = navItemsByRole(user?.role);

  // Fetch notifications + poll every 30s
  const fetchNotifications = async () => {
    try {
      const res = await axios.get('/api/notifications?limit=15');
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch {
      // silent fail — don't spam errors
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Close panel when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setShowNotifPanel(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleBellClick = async () => {
    setShowNotifPanel((prev) => !prev);
    if (!showNotifPanel && unreadCount > 0) {
      try {
        await axios.put('/api/notifications/read-all');
        setUnreadCount(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      } catch {}
    }
  };

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
            <p className="text-sm font-semibold tracking-tight">FarmSaarthi</p>
            <p className="text-[11px] text-white/60">Connecting Farmers & Equipment</p>
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

        {/* Top bar with notification bell */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 md:px-6 h-14 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-700 capitalize">
            {user?.role === 'farmer' ? '👨‍🌾' : user?.role === 'renter' ? '🚜' : '🛡️'} {user?.name}
          </p>

          {/* Bell */}
          <div className="relative" ref={panelRef}>
            <button
              onClick={handleBellClick}
              className="relative p-2 rounded-xl hover:bg-gray-100 transition"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown panel */}
            {showNotifPanel && (
              <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <p className="text-sm font-bold text-gray-900">Notifications</p>
                  <span className="text-[11px] text-gray-500">{notifications.length} recent</span>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-xs text-gray-400">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n._id}
                        className={`px-4 py-3 flex gap-3 items-start ${!n.isRead ? 'bg-farm-light/5' : ''}`}
                      >
                        <span className="text-base mt-0.5">{notifIcon(n.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-semibold text-gray-900 ${!n.isRead ? 'text-farm-dark' : ''}`}>
                            {n.title}
                          </p>
                          <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                            {n.message}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-1">
                            {new Date(n.createdAt).toLocaleString('en-IN', {
                              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                            })}
                          </p>
                        </div>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-farm-primary mt-1.5 shrink-0" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 px-4 md:px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}


