import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { showToast } from '../utils/helpers';

export default function RenterDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [myEquipments, setMyEquipments] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newEquipment, setNewEquipment] = useState({
    name: '',
    description: '',
    pricePerHour: '',
    pricePerKm: '',
    photos: []
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (user.role !== 'renter') {
      navigate('/');
      return;
    }
    
    fetchMyEquipments();
    fetchBookings();
  }, [user, navigate]);

  const fetchMyEquipments = async () => {
    try {
      const response = await axios.get(`/api/equipment/renter/${user.id}`);
      setMyEquipments(response.data.equipment || []);
    } catch (error) {
      console.error('Error fetching equipment:', error);
      showToast('Failed to load equipment', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await axios.get('/api/booking/renter');
      setBookings(response.data.bookings || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const handleAddEquipment = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const equipmentData = {
        ...newEquipment,
        pricePerHour: parseFloat(newEquipment.pricePerHour),
        pricePerKm: parseFloat(newEquipment.pricePerKm),
        location: user.location // Use renter's location
      };
      
      await axios.post('/api/equipment/create', equipmentData);
      
      showToast('Equipment added successfully!', 'success');
      setShowAddForm(false);
      fetchMyEquipments();
      
      // Reset form
      setNewEquipment({
        name: '',
        description: '',
        pricePerHour: '',
        pricePerKm: '',
        photos: []
      });
      
    } catch (error) {
      console.error('Error adding equipment:', error);
      showToast(error.response?.data?.message || 'Failed to add equipment', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Renter Dashboard</h1>
            <p className="text-green-100 text-sm mt-1">Manage your equipment & bookings</p>
          </div>
          <div className="flex gap-4 items-center">
            <span className="text-white font-medium"> {user?.name}</span>
            <button 
              onClick={handleLogout} 
              className="bg-white text-green-600 px-4 py-2 rounded-lg font-semibold hover:bg-green-50 transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-500 text-sm font-medium mb-2">My Equipment</h3>
                <p className="text-3xl font-bold text-green-600">{myEquipments.length}</p>
              </div>
              <div className="text-4xl"></div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-500 text-sm font-medium mb-2">Active Rentals</h3>
                <p className="text-3xl font-bold text-blue-600">
                  {bookings.filter(b => b.status === 'confirmed').length}
                </p>
              </div>
              <div className="text-4xl"></div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-500 text-sm font-medium mb-2">Total Earnings</h3>
                <p className="text-3xl font-bold text-green-600">
                  ₹{bookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + (b.totalCost || 0), 0)}
                </p>
              </div>
              <div className="text-4xl"></div>
            </div>
          </div>
        </div>

        {/* Add Equipment Button */}
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="mb-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition-all shadow-md hover:shadow-lg"
        >
          {showAddForm ? '✕ Cancel' : '+ Add New Equipment'}
        </button>

        {/* Add Equipment Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Add New Equipment</h2>
            <form onSubmit={handleAddEquipment} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Equipment Name *</label>
                  <input
                    type="text"
                    value={newEquipment.name}
                    onChange={(e) => setNewEquipment({...newEquipment, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., John Deere Tractor"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Description *</label>
                  <input
                    type="text"
                    value={newEquipment.description}
                    onChange={(e) => setNewEquipment({...newEquipment, description: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Brief description"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Price per Hour (₹) *</label>
                  <input
                    type="number"
                    value={newEquipment.pricePerHour}
                    onChange={(e) => setNewEquipment({...newEquipment, pricePerHour: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="500"
                    min="0"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Price per KM (₹) *</label>
                  <input
                    type="number"
                    value={newEquipment.pricePerKm}
                    onChange={(e) => setNewEquipment({...newEquipment, pricePerKm: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="50"
                    min="0"
                    required
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 disabled:bg-gray-400 transition-all shadow-md"
              >
                {loading ? 'Adding...' : '✓ Add Equipment'}
              </button>
            </form>
          </div>
        )}

        {/* My Equipment List */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">My Equipment</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myEquipments.length === 0 ? (
              <p className="text-gray-500 col-span-full text-center py-8">No equipment added yet. Add your first equipment above!</p>
            ) : (
              myEquipments.map(eq => (
                <div key={eq._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-lg text-gray-800">{eq.name}</h3>
                  <p className="text-gray-600 text-sm mt-1">{eq.description}</p>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Per Hour:</span>
                      <span className="font-semibold text-green-600">₹{eq.pricePerHour}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Per KM:</span>
                      <span className="font-semibold text-green-600">₹{eq.pricePerKm}</span>
                    </div>
                    <div className="pt-2 border-t">
                      <span className={`text-xs px-2 py-1 rounded-full ${eq.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {eq.isActive ? '✓ Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Current Bookings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Current Bookings</h2>
          <div className="space-y-3">
            {bookings.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No bookings yet</p>
            ) : (
              bookings.map(booking => (
                <div key={booking._id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center hover:shadow-md transition-shadow">
                  <div>
                    <h3 className="font-semibold text-gray-800">{booking.equipmentId?.name || 'Equipment'}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Farmer: {booking.farmerId?.name || 'N/A'} • {booking.farmerId?.phone}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                       {new Date(booking.bookingDate).toLocaleDateString()} •  {booking.startTime} - {booking.endTime}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                      booking.status === 'pending' || booking.status === 'hold' ? 'bg-yellow-100 text-yellow-700' :
                      booking.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {booking.status}
                    </span>
                    <p className="mt-2 font-bold text-green-600">₹{booking.totalCost}</p>
                    <p className="text-xs text-gray-500">Advance: ₹{booking.advancePaid}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}