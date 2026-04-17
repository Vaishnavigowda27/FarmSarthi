import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export default function AdminAnalytics() {

  const navigate = useNavigate();
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/'); return; }
    loadAnalytics();
  }, [user, navigate]);

  const loadAnalytics = async () => {
    try {
      const [analyticsRes, paymentsRes] = await Promise.all([
        axios.get('/api/admin/analytics'),
        axios.get('/api/payments'),
      ]);
      setAnalytics(analyticsRes.data.analytics || {});
      setPayments(paymentsRes.data.payments || []);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-farm-primary border-t-transparent mx-auto mb-3" />
          <p className="text-sm text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  // Format bookings over time
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const bookingsOverTime = (analytics?.bookingsOverTime || []).map((b) => ({
    name: `${MONTHS[b._id.month - 1]} ${b._id.year}`,
    bookings: b.count,
    revenue: Math.round(b.totalRevenue),
  }));

  const popularCategories = (analytics?.popularCategories || []).map((c) => ({
    name: c._id,
    count: c.count,
  }));

  const topRenters = analytics?.topRenters || [];
  const topRatedEquipment = analytics?.topRatedEquipment || [];

  // Revenue summary from payments
  const completedPayments = payments.filter(p => p.status === 'completed');
  const platformRevenue = completedPayments.filter(p => p.paymentType === 'advance').reduce((sum, p) => sum + (p.amount || 0), 0);
  {/*
  const totalRevenue = completedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const platformRevenue = completedPayments.filter(p => p.paymentType === 'advance').reduce((sum, p) => sum + (p.amount || 0), 0);
  const fullRevenue = completedPayments.filter(p => p.paymentType === 'full').reduce((sum, p) => sum + (p.amount || 0), 0);*/}

  // Monthly revenue from bookings data
  const revenueData = bookingsOverTime;

  function Bar({ data, valueKey, colorClass, formatValue }) {
    const max = Math.max(...data.map(d => d[valueKey]), 1);
    return (
      <div className="space-y-2">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-2 text-[11px]">
            <span className="w-20 text-right text-gray-500 shrink-0 truncate">{d.name}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
              <div
                className={`h-6 rounded-full ${colorClass} flex items-center justify-end pr-2 transition-all`}
                style={{ width: `${Math.max((d[valueKey] / max) * 100, 4)}%` }}
              >
                <span className="text-white font-semibold text-[10px]">
                  {formatValue ? formatValue(d[valueKey]) : d[valueKey]}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/admin')}
          className="text-xs text-gray-500 hover:text-gray-700 font-medium"
        >
          ← Back to Dashboard
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Platform Analytics</h1>
          <p className="text-xs text-gray-500">Revenue, bookings, and performance overview</p>
        </div>
      </div>

      {/* Revenue summary cards */}
      
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-500 mb-1">Platform Revenue</p>
          <p className="text-2xl font-bold text-farm-primary">
            ₹{platformRevenue.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-gray-500 mt-1">
            Total gross revenue across all bookings.
          </p>
        </div>
        {/*<div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs text-gray-500 mb-1">Total Revenue Collected</p>
          <p className="text-2xl font-bold text-farm-primary">
            ₹{totalRevenue.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">Across all completed payments</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs text-gray-500 mb-1">Advance Payments</p>
          <p className="text-2xl font-bold text-emerald-600">
            ₹{advanceRevenue.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">Service charges collected upfront</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs text-gray-500 mb-1">Full Payments</p>
          <p className="text-2xl font-bold text-blue-600">
            ₹{fullRevenue.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">Remaining amounts settled</p>
        </div>*/}
      </section>

      {/* Charts row 1 */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Bookings over time */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-1">Bookings Over Time</h2>
          <p className="text-[11px] text-gray-500 mb-4">Number of bookings per month</p>
          {bookingsOverTime.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">No booking data yet.</p>
          ) : (
            <Bar data={bookingsOverTime} valueKey="bookings" colorClass="bg-farm-primary" />
          )}
        </div>

        {/* Revenue over time */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-1">Revenue Over Time</h2>
          <p className="text-[11px] text-gray-500 mb-4">Total booking value generated per month</p>
          {revenueData.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">No revenue data yet.</p>
          ) : (
            <Bar
              data={revenueData}
              valueKey="revenue"
              colorClass="bg-amber-500"
              formatValue={(v) => `₹${v.toLocaleString('en-IN')}`}
            />
          )}
        </div>
      </section>

      {/* Charts row 2 */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Equipment by category */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-1">Equipment by Category</h2>
          <p className="text-[11px] text-gray-500 mb-4">Distribution of listed equipment types</p>
          {popularCategories.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">No category data yet.</p>
          ) : (
            <Bar data={popularCategories} valueKey="count" colorClass="bg-emerald-400" />
          )}
        </div>

        {/* Top renters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-1">Top Equipment Owners</h2>
          <p className="text-[11px] text-gray-500 mb-4">By total earnings on the platform</p>
          {topRenters.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">No renter data yet.</p>
          ) : (
            <Bar
              data={topRenters.map(r => ({ name: r.name, earnings: r.totalEarnings || 0 }))}
              valueKey="earnings"
              colorClass="bg-blue-500"
              formatValue={(v) => `₹${v.toLocaleString('en-IN')}`}
            />
          )}
        </div>
      </section>

      {/* Top rated equipment table */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-sm font-bold text-gray-900 mb-4">Top Rated Equipment</h2>
        {topRatedEquipment.length === 0 ? (
          <p className="text-xs text-gray-400">No rated equipment yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600">Equipment</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600">Category</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600">Avg Rating</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600">Reviews</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {topRatedEquipment.map((eq) => (
                  <tr key={eq._id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-gray-900">{eq.name}</td>
                    <td className="px-3 py-2 text-gray-500">{eq.category}</td>
                    <td className="px-3 py-2">
                      <span className="font-semibold text-amber-600">
                        {'★'.repeat(Math.round(eq.averageRating))} {eq.averageRating.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-500">{eq.totalReviews}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}