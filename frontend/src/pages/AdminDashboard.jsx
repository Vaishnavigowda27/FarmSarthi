import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/mockAPI.js';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ users: 0, equipments: 0, bookings: 0, conflicts: 0 });
  const [allEquipments, setAllEquipments] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    
    const userData = JSON.parse(storedUser);
    setUser(userData);
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, eqData, userData] = await Promise.all([
        API.get('/admin/stats'),
        API.get('/admin/equipments'),
        API.get('/admin/users')
      ]);
      
      setStats(statsData.data || { users: 0, equipments: 0, bookings: 0, conflicts: 0 });
      setAllEquipments(eqData.data || []);
      setAllUsers(userData.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-green-600">Admin Dashboard</h1>
          <div className="flex gap-4 items-center">
            <span className="text-gray-700">Admin: {user?.name || 'Admin'}</span>
            <button onClick={logout} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">Logout</button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm mb-2">Total Users</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.users}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm mb-2">Total Equipment</h3>
            <p className="text-3xl font-bold text-green-600">{stats.equipments}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm mb-2">Total Bookings</h3>
            <p className="text-3xl font-bold text-purple-600">{stats.bookings}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm mb-2">Conflicts</h3>
            <p className="text-3xl font-bold text-red-600">{stats.conflicts}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">All Users</h2>
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Phone</th>
                <th className="px-4 py-2 text-left">Role</th>
              </tr>
            </thead>
            <tbody>
              {allUsers.map(u => (
                <tr key={u._id} className="border-b">
                  <td className="px-4 py-2">{u.name}</td>
                  <td className="px-4 py-2">{u.phone}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs ${u.role === 'farmer' ? 'bg-blue-100 text-blue-700' : u.role === 'renter' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>{u.role}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
