import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/mockAPI.js'; // Using mock API

export default function RenterDashboard() {
  const navigate = useNavigate();
  const [user] = useState(JSON.parse(localStorage.getItem('user')));
  const [myEquipments, setMyEquipments] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEquipment, setNewEquipment] = useState({
    name: '',
    description: '',
    pricePerHour: '',
    pricePerKm: '',
    advancePayment: ''
  });

  useEffect(() => {
    fetchMyEquipments();
    fetchBookings();
  }, []);

  const fetchMyEquipments = async () => {
    try {
      const { data } = await API.get('/equipments/my-equipments');
      setMyEquipments(data);
    } catch (error) {
      console.error('Error fetching equipment');
    }
  };

  const fetchBookings = async () => {
    try {
      const { data } = await API.get('/bookings/renter-bookings');
      setBookings(data);
    } catch (error) {
      console.error('Error fetching bookings');
    }
  };

  const handleAddEquipment = async (e) => {
    e.preventDefault();
    try {
      await API.post('/equipments', newEquipment);
      alert('Equipment added successfully!');
      setShowAddForm(false);
      fetchMyEquipments();
      setNewEquipment({ name: '', description: '', pricePerHour: '', pricePerKm: '', advancePayment: '' });
    } catch (error) {
      alert('Failed to add equipment');
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-green-600">Renter Dashboard</h1>
          <div className="flex gap-4 items-center">
            <span className="text-gray-700">Hi, {user.name}</span>
            <button onClick={logout} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm">My Equipment</h3>
            <p className="text-3xl font-bold text-green-600">{myEquipments.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm">Active Rentals</h3>
            <p className="text-3xl font-bold text-blue-600">
              {bookings.filter(b => b.status === 'confirmed').length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm">Total Earnings</h3>
            <p className="text-3xl font-bold text-green-600">
              ₹{bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0)}
            </p>
          </div>
        </div>

        {/* Add Equipment Button */}
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="mb-6 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
        >
          {showAddForm ? 'Cancel' : '+ Add New Equipment'}
        </button>

        {/* Add Equipment Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Add New Equipment</h2>
            <form onSubmit={handleAddEquipment} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-2">Equipment Name</label>
                  <input
                    type="text"
                    value={newEquipment.name}
                    onChange={(e) => setNewEquipment({...newEquipment, name: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Description</label>
                  <input
                    type="text"
                    value={newEquipment.description}
                    onChange={(e) => setNewEquipment({...newEquipment, description: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Price per Hour (₹)</label>
                  <input
                    type="number"
                    value={newEquipment.pricePerHour}
                    onChange={(e) => setNewEquipment({...newEquipment, pricePerHour: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Price per KM (₹)</label>
                  <input
                    type="number"
                    value={newEquipment.pricePerKm}
                    onChange={(e) => setNewEquipment({...newEquipment, pricePerKm: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Advance Payment (₹)</label>
                  <input
                    type="number"
                    value={newEquipment.advancePayment}
                    onChange={(e) => setNewEquipment({...newEquipment, advancePayment: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
              >
                Add Equipment
              </button>
            </form>
          </div>
        )}

        {/* My Equipment List */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">My Equipment</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myEquipments.length === 0 ? (
              <p className="text-gray-500">No equipment added yet</p>
            ) : (
              myEquipments.map(eq => (
                <div key={eq._id} className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg">{eq.name}</h3>
                  <p className="text-gray-600 text-sm">{eq.description}</p>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm"><span className="font-semibold">₹{eq.pricePerHour}/hr</span></p>
                    <p className="text-sm text-gray-600">₹{eq.pricePerKm}/km</p>
                    <p className="text-sm text-gray-600">Advance: ₹{eq.advancePayment}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Current Bookings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Current Bookings</h2>
          <div className="space-y-3">
            {bookings.length === 0 ? (
              <p className="text-gray-500">No bookings yet</p>
            ) : (
              bookings.map(booking => (
                <div key={booking._id} className="border rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{booking.equipment?.name}</h3>
                    <p className="text-sm text-gray-600">Farmer: {booking.farmer?.name}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(booking.startTime).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded text-sm ${
                      booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {booking.status}
                    </span>
                    <p className="mt-2 font-bold text-green-600">₹{booking.totalAmount}</p>
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