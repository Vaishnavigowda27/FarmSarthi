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
  const [selectedImage, setSelectedImage] = useState(null);
  const [newEquipment, setNewEquipment] = useState({
    name: '',
    description: '',
    category: 'Tractor',
    brand: '',
    model: '',
    pricePerHour: '',
    pricePerKm: '',
    imageFiles: [],
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
      const response = await axios.get('/api/equipment', {
        params: { owner: user.id },
      });
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
      const response = await axios.get('/api/bookings');
      setBookings(response.data.bookings || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const handleAddEquipment = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      const perHour = parseFloat(newEquipment.pricePerHour) || 0;
      const perKm = parseFloat(newEquipment.pricePerKm) || 0;
      const locationData = {
        type: 'Point',
        coordinates: user?.location?.coordinates || [76.6394, 12.2958],
        address: user?.location?.address || 'Mysore, Karnataka',
      };

      let response;
      if (newEquipment.imageFiles?.length > 0) {
        const formData = new FormData();
        formData.append('name', newEquipment.name);
        formData.append('description', newEquipment.description);
        formData.append('category', newEquipment.category);
        formData.append('pricing', JSON.stringify({ perHour, perKm }));
        formData.append('location', JSON.stringify(locationData));
        formData.append(
          'specifications',
          JSON.stringify({
            brand: newEquipment.brand || 'N/A',
            model: newEquipment.model || 'N/A',
          }),
        );
        newEquipment.imageFiles.forEach((file) =>
          formData.append('images', file),
        );
        response = await axios.post('/api/equipment', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        response = await axios.post('/api/equipment', {
          name: newEquipment.name,
          description: newEquipment.description,
          category: newEquipment.category,
          specifications: {
            brand: newEquipment.brand || 'N/A',
            model: newEquipment.model || 'N/A',
          },
          pricing: { perHour, perKm },
          location: locationData,
        });
      }

      console.log('Equipment added:', response.data);
      showToast('Equipment added successfully! Pending admin approval.', 'success');
      setShowAddForm(false);
      fetchMyEquipments();
      setNewEquipment({
        name: '',
        description: '',
        category: 'Tractor',
        brand: '',
        model: '',
        pricePerHour: '',
        pricePerKm: '',
        imageFiles: [],
      });
    } catch (error) {
      console.error('Error adding equipment:', error);
      console.error('Error response:', error.response?.data);
      showToast(
        error.response?.data?.message || 'Failed to add equipment',
        'error',
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-sm text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  const totalRevenue = bookings
    .filter((b) => b.status === 'completed')
    .reduce((sum, b) => sum + (b.totalCost || 0), 0);

  const pendingPayments = bookings
    .filter((b) => b.status === 'confirmed')
    .reduce((sum, b) => sum + (b.pricing?.remainingPayment || 0), 0);

  const activeRents = bookings.filter((b) => b.status === 'confirmed').length;

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-500 mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-farm-primary">
            ₹{totalRevenue.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-500 mb-1">Pending Payments</p>
          <p className="text-2xl font-bold text-amber-600">
            ₹{pendingPayments.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-500 mb-1">Active Rents</p>
          <p className="text-2xl font-bold text-emerald-600">{activeRents}</p>
        </div>
      </div>

      {/* Booking requests + equipment column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Booking Requests</h2>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-farm-light/20 text-farm-primary">
              {bookings.filter((b) => b.status === 'pending').length} pending
            </span>
          </div>
          <div className="space-y-3 text-sm">
            {bookings.filter((b) => b.status === 'pending').length === 0 ? (
              <p className="text-xs text-gray-500">
                No new booking requests at the moment.
              </p>
            ) : (
              bookings
                .filter((b) => b.status === 'pending')
                .map((booking) => (
                  <div
                    key={booking._id}
                    className="rounded-2xl border border-gray-100 bg-gray-50 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">
                        {booking.equipment?.name || 'Equipment'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Farmer: {booking.farmer?.name || 'N/A'} •{' '}
                        {new Date(booking.bookingDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 rounded-2xl text-xs font-semibold bg-emerald-600 text-white">
                        Accept
                      </button>
                      <button className="px-3 py-1.5 rounded-2xl text-xs font-semibold bg-red-100 text-red-700">
                        Reject
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        <div className="space-y-4">
          {showAddForm ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-gray-900">
                  Add New Equipment
                </h2>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs font-semibold text-gray-500"
                >
                  Cancel
                </button>
              </div>
              <form onSubmit={handleAddEquipment} className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Equipment Name
                    </label>
                    <input
                      type="text"
                      value={newEquipment.name}
                      onChange={(e) =>
                        setNewEquipment({ ...newEquipment, name: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-2xl border border-gray-300 text-sm outline-none"
                      placeholder="John Deere Tractor"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={newEquipment.category}
                      onChange={(e) =>
                        setNewEquipment({
                          ...newEquipment,
                          category: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 rounded-2xl border border-gray-300 text-sm outline-none"
                      required
                    >
                      <option value="Tractor">Tractor</option>
                      <option value="Harvester">Harvester</option>
                      <option value="Plough">Plough</option>
                      <option value="Seeder">Seeder</option>
                      <option value="Sprayer">Sprayer</option>
                      <option value="Thresher">Thresher</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={newEquipment.description}
                      onChange={(e) =>
                        setNewEquipment({
                          ...newEquipment,
                          description: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 rounded-2xl border border-gray-300 text-sm outline-none"
                      placeholder="Short description"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Price / Hour (₹)
                      </label>
                      <input
                        type="number"
                        value={newEquipment.pricePerHour}
                        onChange={(e) =>
                          setNewEquipment({
                            ...newEquipment,
                            pricePerHour: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 rounded-2xl border border-gray-300 text-sm outline-none"
                        min="0"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Price / KM (₹)
                      </label>
                      <input
                        type="number"
                        value={newEquipment.pricePerKm}
                        onChange={(e) =>
                          setNewEquipment({
                            ...newEquipment,
                            pricePerKm: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 rounded-2xl border border-gray-300 text-sm outline-none"
                        min="0"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Photos
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) =>
                        setNewEquipment({
                          ...newEquipment,
                          imageFiles: Array.from(e.target.files || []),
                        })
                      }
                      className="w-full text-xs"
                    />
                    {newEquipment.imageFiles?.length > 0 && (
                      <p className="mt-1 text-[11px] text-gray-500">
                        {newEquipment.imageFiles.length} image(s) selected
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-farm-primary text-white px-4 py-2.5 rounded-2xl text-sm font-semibold disabled:bg-gray-400"
                >
                  {loading ? 'Adding...' : 'Publish Equipment'}
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-gray-900">
                  My Equipment
                </h2>
                <button
                  type="button"
                  onClick={() => setShowAddForm(true)}
                  className="px-3 py-1.5 rounded-2xl text-xs font-semibold bg-farm-primary text-white"
                >
                  + Add New
                </button>
              </div>
              <div className="space-y-3">
                {myEquipments.length === 0 ? (
                  <p className="text-xs text-gray-500">
                    No equipment added yet.
                  </p>
                ) : (
                  myEquipments.map((eq) => (
                    <div
                      key={eq._id}
                      className="border border-gray-100 rounded-2xl overflow-hidden flex"
                    >
                      <div
                        className={`h-20 w-24 bg-farm-primary/20 flex-shrink-0 flex items-center justify-center overflow-hidden ${
                          eq.photos?.[0]?.url ? 'cursor-pointer' : ''
                        }`}
                        onClick={() => {
                          if (eq.photos?.[0]?.url) {
                            const baseUrl = (
                              import.meta.env.VITE_API_URL ||
                              'http://localhost:5000/api'
                            ).replace(/\/api$/, '');
                            setSelectedImage(`${baseUrl}${eq.photos[0].url}`);
                          }
                        }}
                      >
                        {eq.photos?.[0]?.url ? (
                          <img
                            src={`${
                              (import.meta.env.VITE_API_URL ||
                                'http://localhost:5000/api'
                              ).replace(/\/api$/, '')}${eq.photos[0].url}`}
                            alt={eq.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl">🚜</span>
                        )}
                      </div>
                      <div className="flex-1 p-3 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-sm text-gray-900">
                            {eq.name}
                          </p>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
                            {eq.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 line-clamp-2">
                          {eq.description}
                        </p>
                        <p className="text-[11px] text-gray-600 font-medium">
                          ₹{eq.pricing?.perHour || 0}/hr • ₹
                          {eq.pricing?.perKm || 0}/km
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Current bookings */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-lg font-bold mb-4 text-gray-900">
          Current Bookings
        </h2>
        <div className="space-y-3 text-sm">
          {bookings.length === 0 ? (
            <p className="text-xs text-gray-500">No bookings yet.</p>
          ) : (
            bookings.map((booking) => (
              <div
                key={booking._id}
                className="border border-gray-100 rounded-2xl p-3 flex items-center justify-between gap-3"
              >
                <div>
                  <p className="font-semibold text-gray-900">
                    {booking.equipment?.name || 'Equipment'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Farmer: {booking.farmer?.name || 'N/A'} •{' '}
                    {new Date(booking.bookingDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right text-xs">
                  <p className="font-semibold text-farm-primary">
                    ₹{(booking.pricing?.totalCost || 0).toLocaleString('en-IN')}
                  </p>
                  <p className="text-gray-500">
                    Service charge: ₹
                    {(booking.pricing?.serviceCharge || 0).toLocaleString(
                      'en-IN',
                    )}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 px-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-black rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage}
              alt="Equipment"
              className="w-full h-full object-contain"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-3 right-3 bg-black/60 text-white rounded-full px-3 py-1 text-sm font-semibold hover:bg-black/80"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

