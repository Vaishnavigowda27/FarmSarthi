import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({ users: 0, equipments: 0, bookings: 0, conflicts: 0 });
  const [allEquipments, setAllEquipments] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is admin
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (user.role !== 'admin') {
      navigate('/'); // Redirect non-admins
      return;
    }
    
    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Fetch admin dashboard (includes stats) and users/equipments
      const [dashboardRes, usersRes, equipmentsRes, pendingRes] = await Promise.all([
        axios.get('/api/admin/dashboard'),
        axios.get('/api/admin/users'),
        axios.get('/api/admin/equipments'),
        axios.get('/api/admin/equipment/pending')
      ]);
      
      const dash = dashboardRes.data.dashboard;
      setAllUsers(usersRes.data.users || []);
      // Keep all for counts, but show only pending in verification queue
      setAllEquipments(pendingRes.data.equipment || []);
      
      // Calculate stats from dashboard
      const stat = dash?.statistics || {};
      setStats({
        users: stat.users?.total ?? usersRes.data.users?.length ?? 0,
        equipments: stat.equipment?.total ?? equipmentsRes.data.equipments?.length ?? 0,
        bookings: stat.bookings?.total ?? 0,
        conflicts: stat.bookings?.disputed ?? 0
      });
      
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const setVerificationStatus = async (equipmentId, status) => {
    try {
      await axios.put(`/api/admin/equipment/${equipmentId}/verify`, { status });
      await loadData();
    } catch (error) {
      console.error('Failed to update verification status:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-sm text-gray-500">Loading admin dashboard…</div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  const platformRevenue = (stats.bookings || 0) * 1000; // placeholder calc

  return (
    <div className="space-y-6">
      {/* Top row: title + quick stats */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Admin & Support Dashboard
          </h1>
          <p className="text-xs text-gray-500">
            Monitor revenue, users, disputes and verification queue.
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs font-semibold px-3 py-2 rounded-2xl bg-gray-900 text-white"
        >
          Logout
        </button>
      </div>

      {/* Platform revenue cards */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-500 mb-1">Platform Revenue</p>
          <p className="text-2xl font-bold text-farm-primary">
            ₹{platformRevenue.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-gray-500 mt-1">
            Total gross revenue across all bookings.
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-500 mb-1">Total Users</p>
          <p className="text-2xl font-bold text-gray-900">
            {stats.users.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-gray-500 mt-1">Farmers & Owners.</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-500 mb-1">Total Equipment</p>
          <p className="text-2xl font-bold text-gray-900">
            {stats.equipments.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-gray-500 mt-1">Listed on the platform.</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-500 mb-1">Open Disputes</p>
          <p className="text-2xl font-bold text-red-600">
            {stats.conflicts.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-gray-500 mt-1">
            Awaiting manual resolution.
          </p>
        </div>
      </section>

      {/* Verification queue + disputes/system health */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Verification queue table */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-900">
              Verification Queue
            </h2>
            <span className="text-xs px-3 py-1 rounded-full bg-farm-light/20 text-farm-primary font-semibold">
              {allEquipments.length} equipment
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600">
                    User / Equipment
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600">
                    Uploaded Docs
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600">
                    Status
                  </th>
                  <th className="px-3 py-2 text-right font-semibold text-gray-600">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {allEquipments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-4 text-center text-gray-500"
                    >
                      No equipment pending verification.
                    </td>
                  </tr>
                ) : (
                  allEquipments.map((eq) => (
                    <tr key={eq._id || eq.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2">
                        <p className="font-semibold text-gray-900">
                          {eq.name}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          Owner: {eq.owner?.name || 'N/A'}
                        </p>
                      </td>
                      <td className="px-3 py-2 text-[11px] text-gray-600">
                        Aadhaar, RC Book, PAN
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            eq.verificationStatus === 'verified'
                              ? 'bg-emerald-50 text-emerald-700'
                              : eq.verificationStatus === 'rejected'
                              ? 'bg-red-50 text-red-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {eq.verificationStatus || 'pending'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => setVerificationStatus(eq._id, 'verified')}
                          className="mr-1 px-2 py-1 rounded-full text-[11px] font-semibold bg-farm-primary text-white"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => setVerificationStatus(eq._id, 'rejected')}
                          className="px-2 py-1 rounded-full text-[11px] font-semibold bg-red-100 text-red-700"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Disputes & system health */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <h3 className="text-sm font-bold text-gray-900 mb-2">
              Dispute Center
            </h3>
            <p className="text-[11px] text-gray-600 mb-2">
              Track and resolve payment or service disputes raised by users.
            </p>
            <div className="space-y-2 text-[11px]">
              {[1, 2].map((id) => (
                <div
                  key={id}
                  className="rounded-2xl border border-gray-100 bg-amber-50 p-2"
                >
                  <p className="font-semibold text-amber-900">
                    Dispute #{id} • Payment Issue
                  </p>
                  <p className="text-amber-800">
                    Farmer claims over‑billing. Awaiting evidence.
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <h3 className="text-sm font-bold text-gray-900 mb-2">
              System Health
            </h3>
            <p className="text-[11px] text-gray-600 mb-1">
              Server status: <span className="font-semibold text-emerald-700">Operational</span>
            </p>
            <p className="text-[11px] text-gray-600 mb-1">
              API uptime: <span className="font-semibold">99.8%</span>
            </p>
            <p className="text-[11px] text-gray-600">
              No critical alerts in the last 24 hours.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}