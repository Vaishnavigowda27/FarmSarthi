import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { formatCurrency, showToast } from '../utils/helpers';

const AdminDashboard = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [pendingEquipment, setPendingEquipment] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [dashboardRes, equipmentRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/equipment/pending')
      ]);
      
      setStats(dashboardRes.data.stats);
      setPendingEquipment(equipmentRes.data.equipment || []);
    } catch (error) {
      showToast('Failed to load dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id, status) => {
    try {
      await api.put(`/admin/equipment/${id}/verify`, { 
        verificationStatus: status 
      });
      showToast(`Equipment ${status}!`, 'success');
      loadDashboard();
    } catch (error) {
      showToast('Verification failed', 'error');
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
          {t('dashboard.admin')}
        </h1>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-gray-600 mb-2">Total Users</div>
            <div className="text-3xl font-bold text-primary">
              {stats?.totalUsers || 0}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-gray-600 mb-2">Total Equipment</div>
            <div className="text-3xl font-bold text-green-600">
              {stats?.totalEquipment || 0}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-gray-600 mb-2">Total Bookings</div>
            <div className="text-3xl font-bold text-blue-600">
              {stats?.totalBookings || 0}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-gray-600 mb-2">Platform Revenue</div>
            <div className="text-3xl font-bold text-secondary">
              {formatCurrency(stats?.totalRevenue || 0)}
            </div>
          </div>
        </div>

        {/* User Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-gray-600 mb-2">Farmers</div>
            <div className="text-2xl font-bold text-green-600">
              {stats?.farmers || 0}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-gray-600 mb-2">Renters</div>
            <div className="text-2xl font-bold text-blue-600">
              {stats?.renters || 0}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-gray-600 mb-2">Pending Verifications</div>
            <div className="text-2xl font-bold text-yellow-600">
              {pendingEquipment.length}
            </div>
          </div>
        </div>

        {/* Pending Equipment Verifications */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">Pending Equipment Verifications</h2>
          
          {pendingEquipment.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No pending verifications</p>
          ) : (
            <div className="space-y-4">
              {pendingEquipment.map((item) => (
                <div key={item._id} className="border rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-lg">{item.name}</h3>
                    <p className="text-gray-600">{item.category}</p>
                    <p className="text-sm text-gray-500">
                      Owner: {item.renter?.name || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatCurrency(item.pricing?.perHour || 0)}/hour
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleVerify(item._id, 'verified')}
                      className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleVerify(item._id, 'rejected')}
                      className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;