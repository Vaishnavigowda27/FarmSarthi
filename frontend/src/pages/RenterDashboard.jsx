import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { showToast } from '../utils/helpers';

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');

export default function RenterDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
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
    if (!user) { navigate('/login'); return; }
    if (user.role !== 'renter') { navigate('/'); return; }
    fetchMyEquipments();
    fetchBookings();
  }, [user, navigate]);

  // ✅ Fixed: use dedicated renter endpoint
  const fetchMyEquipments = async () => {
    try {
      const response = await axios.get('/api/equipment/renter/my-equipment');
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

      if (newEquipment.imageFiles?.length > 0) {
        const formData = new FormData();
        formData.append('name', newEquipment.name);
        formData.append('description', newEquipment.description);
        formData.append('category', newEquipment.category);
        formData.append('pricing', JSON.stringify({ perHour, perKm }));
        formData.append('location', JSON.stringify(locationData));
        formData.append('specifications', JSON.stringify({ brand: newEquipment.brand || 'N/A', model: newEquipment.model || 'N/A' }));
        newEquipment.imageFiles.forEach((file) => formData.append('images', file));
        await axios.post('/api/equipment', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await axios.post('/api/equipment', {
          name: newEquipment.name,
          description: newEquipment.description,
          category: newEquipment.category,
          specifications: { brand: newEquipment.brand || 'N/A', model: newEquipment.model || 'N/A' },
          pricing: { perHour, perKm },
          location: locationData,
        });
      }

      showToast('Equipment added! Pending admin approval.', 'success');
      setShowAddForm(false);
      setNewEquipment({ name: '', description: '', category: 'Tractor', brand: '', model: '', pricePerHour: '', pricePerKm: '', imageFiles: [] });
      fetchMyEquipments();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to add equipment', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptBooking = async (bookingId) => {
    try {
      await axios.put(`/api/bookings/${bookingId}/status`, { status: 'ongoing' });
      showToast('Booking accepted!', 'success');
      fetchBookings();
    } catch {
      showToast('Failed to accept booking', 'error');
    }
  };

  const handleRejectBooking = async (bookingId) => {
    if (!confirm('Reject this booking?')) return;
    try {
      await axios.put(`/api/bookings/${bookingId}/cancel`, { reason: 'Rejected by owner' });
      showToast('Booking rejected', 'success');
      fetchBookings();
    } catch {
      showToast('Failed to reject booking', 'error');
    }
  };

  const handleMarkComplete = async (bookingId) => {
    try {
      await axios.put(`/api/bookings/${bookingId}/status`, { status: 'completed' });
      showToast('Booking marked as completed!', 'success');
      fetchBookings();
    } catch {
      showToast('Failed to update status', 'error');
    }
  };

  const toggleAvailability = async (eq) => {
    try {
      await axios.put(`/api/equipment/${eq._id}`, {
        availability: { ...(eq.availability || {}), isAvailable: !eq.availability?.isAvailable },
      });
      showToast(eq.availability?.isAvailable ? 'Equipment paused' : 'Equipment resumed', 'success');
      fetchMyEquipments();
    } catch {
      showToast('Failed to update availability', 'error');
    }
  };

  const deleteListing = async (eq) => {
    if (!confirm('Delete this equipment listing?')) return;
    try {
      await axios.delete(`/api/equipment/${eq._id}`);
      showToast('Equipment deleted', 'success');
      fetchMyEquipments();
    } catch {
      showToast('Failed to delete equipment', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-farm-primary border-t-transparent mx-auto mb-3" />
          <p className="text-sm text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const totalRevenue = bookings.filter((b) => b.status === 'completed').reduce((sum, b) => sum + (b.pricing?.totalCost || 0), 0);
  const pendingPayments = bookings.filter((b) => b.status === 'confirmed').reduce((sum, b) => sum + (b.pricing?.remainingPayment || 0), 0);
  const activeRents = bookings.filter((b) => b.status === 'ongoing').length;
  const pendingBookings = bookings.filter((b) => b.status === 'hold');

  return (
    <div className="space-y-6">

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs text-gray-500 mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-farm-primary">₹{totalRevenue.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs text-gray-500 mb-1">Pending Payments</p>
          <p className="text-2xl font-bold text-amber-600">₹{pendingPayments.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs text-gray-500 mb-1">Active Rents</p>
          <p className="text-2xl font-bold text-emerald-600">{activeRents}</p>
        </div>
      </div>

      {/* Booking requests + My Equipment */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Booking Requests */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900">Booking Requests</h2>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-farm-light/20 text-farm-primary">
              {pendingBookings.length} pending
            </span>
          </div>
          <div className="space-y-3">
            {pendingBookings.length === 0 ? (
              <p className="text-xs text-gray-500">No new booking requests at the moment.</p>
            ) : (
              pendingBookings.map((booking) => (
                <div key={booking._id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{booking.equipment?.name || 'Equipment'}</p>
                      <p className="text-xs text-gray-500">
                        Farmer: {booking.farmer?.name || 'N/A'} • {booking.farmer?.phone || ''}
                      </p>
                      <p className="text-xs text-gray-500">
                        Date: {new Date(booking.bookingDate).toLocaleDateString('en-IN')}
                        {booking.endDate && booking.endDate !== booking.bookingDate &&
                          ` → ${new Date(booking.endDate).toLocaleDateString('en-IN')}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        Slot: {booking.timeSlot?.startTime} – {booking.timeSlot?.endTime}
                      </p>
                    </div>
                    <div className="text-right text-xs">
                      <p className="font-bold text-farm-primary">₹{(booking.pricing?.totalCost || 0).toLocaleString('en-IN')}</p>
                      <p className="text-gray-400">Service: ₹{booking.pricing?.serviceCharge || 0}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleAcceptBooking(booking._id)}
                      className="px-4 py-1.5 rounded-2xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleRejectBooking(booking._id)}
                      className="px-4 py-1.5 rounded-2xl text-xs font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* My Equipment */}
        <div>
          {showAddForm ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-gray-900">Add Equipment</h2>
                <button onClick={() => setShowAddForm(false)} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
              </div>
              <form onSubmit={handleAddEquipment} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Equipment Name</label>
                  <input type="text" value={newEquipment.name} onChange={(e) => setNewEquipment({ ...newEquipment, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-2xl border border-gray-300 text-sm outline-none" placeholder="John Deere Tractor" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                  <select value={newEquipment.category} onChange={(e) => setNewEquipment({ ...newEquipment, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-2xl border border-gray-300 text-sm outline-none" required>
                    {['Tractor','Harvester','Plough','Seeder','Sprayer','Thresher','Other'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                  <input type="text" value={newEquipment.description} onChange={(e) => setNewEquipment({ ...newEquipment, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-2xl border border-gray-300 text-sm outline-none" placeholder="Short description" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">₹/Hour</label>
                    <input type="number" value={newEquipment.pricePerHour} onChange={(e) => setNewEquipment({ ...newEquipment, pricePerHour: e.target.value })}
                      className="w-full px-3 py-2 rounded-2xl border border-gray-300 text-sm outline-none" min="0" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">₹/KM</label>
                    <input type="number" value={newEquipment.pricePerKm} onChange={(e) => setNewEquipment({ ...newEquipment, pricePerKm: e.target.value })}
                      className="w-full px-3 py-2 rounded-2xl border border-gray-300 text-sm outline-none" min="0" required />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Photos</label>
                  <input type="file" accept="image/*" multiple onChange={(e) => setNewEquipment({ ...newEquipment, imageFiles: Array.from(e.target.files || []) })}
                    className="w-full text-xs" />
                  {newEquipment.imageFiles?.length > 0 && (
                    <p className="mt-1 text-[11px] text-gray-500">{newEquipment.imageFiles.length} image(s) selected</p>
                  )}
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-farm-primary text-white px-4 py-2.5 rounded-2xl text-sm font-semibold disabled:bg-gray-400">
                  {loading ? 'Adding...' : 'Publish Equipment'}
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-gray-900">My Equipment</h2>
                <button onClick={() => setShowAddForm(true)} className="px-3 py-1.5 rounded-2xl text-xs font-semibold bg-farm-primary text-white">
                  + Add New
                </button>
              </div>
              <div className="space-y-3">
                {myEquipments.length === 0 ? (
                  <p className="text-xs text-gray-500">No equipment added yet.</p>
                ) : (
                  myEquipments.map((eq) => (
                    <div key={eq._id} className="border border-gray-100 rounded-2xl overflow-hidden flex">
                      <div
                        className={`h-20 w-24 bg-farm-primary/20 flex-shrink-0 flex items-center justify-center overflow-hidden ${eq.photos?.[0]?.url ? 'cursor-pointer' : ''}`}
                        onClick={() => eq.photos?.[0]?.url && setSelectedImage(`${BASE_URL}${eq.photos[0].url}`)}
                      >
                        {eq.photos?.[0]?.url ? (
                          <img src={`${BASE_URL}${eq.photos[0].url}`} alt={eq.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl">🚜</span>
                        )}
                      </div>
                      <div className="flex-1 p-3 space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className="font-semibold text-sm text-gray-900 line-clamp-1">{eq.name}</p>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold shrink-0">{eq.category}</span>
                        </div>
                        <p className="text-[11px] text-gray-500 line-clamp-2">{eq.description}</p>
                        <p className="text-[11px] text-gray-600 font-medium">₹{eq.pricing?.perHour || 0}/hr • ₹{eq.pricing?.perKm || 0}/km</p>
                        {eq.verificationStatus !== 'verified' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold">
                            ⏳ Pending approval
                          </span>
                        )}
                        <div className="pt-1 flex flex-wrap justify-end gap-2">
                          <button onClick={() => toggleAvailability(eq)}
                            className="px-3 py-1 rounded-full text-[11px] font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50">
                            {eq.availability?.isAvailable ? 'Pause' : 'Resume'}
                          </button>
                          <button onClick={() => deleteListing(eq)}
                            className="px-3 py-1 rounded-full text-[11px] font-semibold border border-red-200 text-red-700 hover:bg-red-50">
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* All Bookings */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-base font-bold mb-4 text-gray-900">All Bookings</h2>
        <div className="space-y-3">
          {bookings.length === 0 ? (
            <p className="text-xs text-gray-500">No bookings yet.</p>
          ) : (
            bookings.map((booking) => (
              <div key={booking._id} className="border border-gray-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="font-semibold text-sm text-gray-900">{booking.equipment?.name || 'Equipment'}</p>
                  <p className="text-xs text-gray-500">
                    Farmer: {booking.farmer?.name || 'N/A'} • {new Date(booking.bookingDate).toLocaleDateString('en-IN')}
                  </p>
                  <p className="text-xs text-gray-500">
                    Slot: {booking.timeSlot?.startTime} – {booking.timeSlot?.endTime}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right text-xs">
                    <p className="font-semibold text-farm-primary">₹{(booking.pricing?.totalCost || 0).toLocaleString('en-IN')}</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold
                      ${booking.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                        booking.status === 'ongoing' ? 'bg-blue-50 text-blue-700' :
                        booking.status === 'confirmed' ? 'bg-green-50 text-green-700' :
                        booking.status === 'cancelled' ? 'bg-red-50 text-red-600' :
                        'bg-amber-50 text-amber-700'}`}>
                      {booking.status}
                    </span>
                  </div>
                  {booking.status === 'ongoing' && (
                    <button onClick={() => handleMarkComplete(booking._id)}
                      className="px-3 py-1.5 rounded-2xl text-xs font-semibold bg-farm-primary text-white">
                      Mark Done
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Image lightbox */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 px-4" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh] bg-black rounded-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <img src={selectedImage} alt="Equipment" className="w-full h-full object-contain" />
            <button onClick={() => setSelectedImage(null)} className="absolute top-3 right-3 bg-black/60 text-white rounded-full px-3 py-1 text-sm font-semibold hover:bg-black/80">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}