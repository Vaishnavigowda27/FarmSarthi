import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { formatCurrency, formatDate, showToast } from '../utils/helpers';

const RenterDashboard = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [equipment, setEquipment] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await api.get('/users/renter/dashboard');
      setStats(response.data.stats);
      setEquipment(response.data.equipment || []);
      setBookings(response.data.recentBookings || []);
    } catch (error) {
      showToast('Failed to load dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8 gradient-primary bg-clip-text text-transparent">
          {t('dashboard.renter')}
        </h1>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-gray-600 mb-2">Total Equipment</div>
            <div className="text-3xl font-bold text-primary">
              {stats?.totalEquipment || 0}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-gray-600 mb-2">Active</div>
            <div className="text-3xl font-bold text-green-600">
              {stats?.activeEquipment || 0}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-gray-600 mb-2">Total Bookings</div>
            <div className="text-3xl font-bold text-blue-600">
              {stats?.totalBookings || 0}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-gray-600 mb-2">Total Earnings</div>
            <div className="text-3xl font-bold text-secondary">
              {formatCurrency(stats?.totalEarnings || 0)}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <Link
            to="/add-equipment"
            className="bg-primary text-white px-8 py-4 rounded-lg font-semibold inline-block hover:bg-primary-dark"
          >
            {t('equipment.addEquipment')}
          </Link>
        </div>

        {/* My Equipment */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">{t('dashboard.myEquipment')}</h2>
          
          {equipment.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No equipment added yet</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {equipment.map((item) => (
                <div key={item._id} className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">{item.name}</h3>
                  <div className="text-sm text-gray-600 mb-2">
                    {formatCurrency(item.pricing?.perHour || 0)}/hour
                  </div>
                  <div className={`inline-block px-3 py-1 rounded-full text-sm ${
                    item.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {item.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Bookings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">Recent Bookings</h2>
          
          {bookings.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No bookings yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">Equipment</th>
                    <th className="px-4 py-3 text-left">Farmer</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking._id} className="border-b">
                      <td className="px-4 py-3">{booking.equipment?.name || 'N/A'}</td>
                      <td className="px-4 py-3">{booking.farmer?.name || 'N/A'}</td>
                      <td className="px-4 py-3">{formatDate(booking.bookingDate)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                          booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                          booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        {formatCurrency(booking.pricing?.totalCost || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RenterDashboard;