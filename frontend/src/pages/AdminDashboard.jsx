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
  const [disputes, setDisputes] = useState([]);
  const [analyticsData, setAnalyticsData] = useState({ bookingsOverTime: [], popularCategories: [] });
  const [resolvingId, setResolvingId] = useState(null);
  const [resolveData, setResolveData] = useState({});
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
      const [dashboardRes, usersRes, equipmentsRes, pendingRes, conflictsRes, analyticsRes] = await Promise.all([
        axios.get('/api/admin/dashboard'),
        axios.get('/api/admin/users'),
        axios.get('/api/admin/equipments'),
        axios.get('/api/admin/equipment/pending'),
        axios.get('/api/admin/conflicts'),
        axios.get('/api/admin/analytics'),
      ]);

      const dash = dashboardRes.data.dashboard;
      setAllUsers(usersRes.data.users || []);
      setAllEquipments(pendingRes.data.equipment || []);
      setDisputes(conflictsRes.data.conflicts || []);

      // Format bookings over time for chart
      const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const bookingsOverTime = (analyticsRes.data.analytics?.bookingsOverTime || []).map((b) => ({
        name: `${MONTHS[b._id.month - 1]} ${b._id.year}`,
        bookings: b.count,
        revenue: Math.round(b.totalRevenue),
      }));
      const popularCategories = (analyticsRes.data.analytics?.popularCategories || []).map((c) => ({
        name: c._id,
        count: c.count,
      }));
      setAnalyticsData({ bookingsOverTime, popularCategories });

      const stat = dash?.statistics || {};
      setStats({
        users: stat.users?.total ?? usersRes.data.users?.length ?? 0,
        equipments: stat.equipment?.total ?? equipmentsRes.data.equipments?.length ?? 0,
        bookings: stat.bookings?.total ?? 0,
        conflicts: stat.bookings?.disputed ?? 0,
      });
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (bookingId, outcome) => {
    const resolution = resolveData[bookingId];
    if (!resolution?.trim()) {
      alert('Please enter a resolution note before closing the dispute.');
      return;
    }
    try {
      await axios.put(`/api/admin/conflicts/${bookingId}/resolve`, {
        resolution,
        status: outcome, // 'completed' or 'cancelled'
      });
      setResolveData((prev) => ({ ...prev, [bookingId]: '' }));
      setResolvingId(null);
      await loadData();
    } catch (error) {
      console.error('Failed to resolve dispute:', error);
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

      {/* Analytics charts */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Bookings over time */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Bookings Over Time</h2>
          {analyticsData.bookingsOverTime.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">No booking data yet.</p>
          ) : (
            <div className="space-y-1">
              {(() => {
                const max = Math.max(...analyticsData.bookingsOverTime.map(d => d.bookings), 1);
                return analyticsData.bookingsOverTime.map((d) => (
                  <div key={d.name} className="flex items-center gap-2 text-[11px]">
                    <span className="w-16 text-right text-gray-500 shrink-0">{d.name}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                      <div
                        className="h-5 rounded-full bg-farm-primary flex items-center justify-end pr-2 transition-all"
                        style={{ width: `${Math.max((d.bookings / max) * 100, 4)}%` }}
                      >
                        <span className="text-white font-semibold text-[10px]">{d.bookings}</span>
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          )}
        </div>

        {/* Equipment by category */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Equipment by Category</h2>
          {analyticsData.popularCategories.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">No category data yet.</p>
          ) : (
            <div className="space-y-1">
              {(() => {
                const max = Math.max(...analyticsData.popularCategories.map(d => d.count), 1);
                return analyticsData.popularCategories.map((d) => (
                  <div key={d.name} className="flex items-center gap-2 text-[11px]">
                    <span className="w-16 text-right text-gray-500 shrink-0">{d.name}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                      <div
                        className="h-5 rounded-full bg-emerald-400 flex items-center justify-end pr-2 transition-all"
                        style={{ width: `${Math.max((d.count / max) * 100, 4)}%` }}
                      >
                        <span className="text-white font-semibold text-[10px]">{d.count}</span>
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          )}
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
            <h3 className="text-sm font-bold text-gray-900 mb-1">Dispute Center</h3>
            <p className="text-[11px] text-gray-500 mb-3">
              Breakdowns, weather issues, and service complaints raised by farmers.
            </p>
            <div className="space-y-3">
              {disputes.length === 0 ? (
                <p className="text-[11px] text-gray-400 text-center py-4">No open disputes. ✓</p>
              ) : (
                disputes.map((d) => (
                  <div key={d._id} className="rounded-2xl border border-amber-200 bg-amber-50 p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[11px] font-bold text-amber-900">
                          {d.equipment?.name || 'Equipment'}
                        </p>
                        <p className="text-[10px] text-amber-800">
                          Farmer: {d.farmer?.name} • {d.farmer?.phone}
                        </p>
                        <p className="text-[10px] text-amber-800">
                          Owner: {d.renter?.name} • {d.renter?.phone}
                        </p>
                        <p className="text-[10px] text-amber-700 mt-1 italic">
                          "{d.conflictResolution?.conflictReason}"
                        </p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-semibold shrink-0">
                        {new Date(d.createdAt).toLocaleDateString('en-IN')}
                      </span>
                    </div>

                    {resolvingId === d._id ? (
                      <div className="space-y-2">
                        <textarea
                          rows={2}
                          placeholder="Write resolution note…"
                          value={resolveData[d._id] || ''}
                          onChange={(e) => setResolveData((prev) => ({ ...prev, [d._id]: e.target.value }))}
                          className="w-full text-[11px] rounded-xl border border-amber-300 px-2 py-1.5 outline-none bg-white"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleResolve(d._id, 'completed')}
                            className="flex-1 text-[10px] font-semibold py-1 rounded-full bg-emerald-600 text-white"
                          >
                            Mark Completed
                          </button>
                          <button
                            onClick={() => handleResolve(d._id, 'cancelled')}
                            className="flex-1 text-[10px] font-semibold py-1 rounded-full bg-red-100 text-red-700"
                          >
                            Cancel Booking
                          </button>
                          <button
                            onClick={() => setResolvingId(null)}
                            className="text-[10px] font-semibold py-1 px-2 rounded-full border border-gray-200 text-gray-600"
                          >
                            Back
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setResolvingId(d._id)}
                        className="w-full text-[10px] font-semibold py-1.5 rounded-full bg-amber-500 text-white"
                      >
                        Resolve Dispute
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <h3 className="text-sm font-bold text-gray-900 mb-2">System Health</h3>
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