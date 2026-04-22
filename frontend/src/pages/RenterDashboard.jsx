import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { showToast } from '../utils/helpers';
import { useTranslation } from 'react-i18next';

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');

function StarRating({ rating = 0, size = 'sm' }) {
  const starSize = size === 'sm' ? 'text-xs' : 'text-base';
  return (
    <span className={`${starSize} tracking-tight`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= Math.round(rating) ? 'text-amber-400' : 'text-gray-200'}>★</span>
      ))}
    </span>
  );
}

export default function RenterDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [myEquipments, setMyEquipments] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [selectedEquipmentFilter, setSelectedEquipmentFilter] = useState('all');

  const [newEquipment, setNewEquipment] = useState({
    name: '', description: '', category: 'Tractor', brand: '', model: '',
    pricePerHour: '', pricePerKm: '', totalUnits: '1', imageFiles: [],
  });

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (user.role !== 'renter') { navigate('/'); return; }
    fetchMyEquipments();
    fetchBookings();
  }, [user, navigate]);

  useEffect(() => {
    if (myEquipments.length > 0) fetchAllReviews(myEquipments);
  }, [myEquipments]);

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

  const fetchAllReviews = async (equipmentList) => {
    setReviewsLoading(true);
    try {
      const results = await Promise.allSettled(
        equipmentList.map((eq) =>
          axios.get(`/api/reviews/equipment/${eq._id}`).then((res) => ({
            equipmentId: eq._id, equipmentName: eq.name, reviews: res.data.reviews || [],
          }))
        )
      );
      const allReviews = results
        .filter((r) => r.status === 'fulfilled')
        .flatMap((r) => r.value.reviews.map((review) => ({ ...review, equipmentId: r.value.equipmentId, equipmentName: r.value.equipmentName })));
      allReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setReviews(allReviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleAddEquipment = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const perHour = parseFloat(newEquipment.pricePerHour) || 0;
      const perKm = parseFloat(newEquipment.pricePerKm) || 0;
      const locationData = { type: 'Point', coordinates: user?.location?.coordinates || [76.6394, 12.2958], address: user?.location?.address || 'Mysore, Karnataka' };

      if (newEquipment.imageFiles?.length > 0) {
        const formData = new FormData();
        formData.append('name', newEquipment.name);
        formData.append('description', newEquipment.description);
        formData.append('category', newEquipment.category);
        formData.append('pricing', JSON.stringify({ perHour, perKm }));
        formData.append('location', JSON.stringify(locationData));
        formData.append('totalUnits', newEquipment.totalUnits || '1');
        formData.append('specifications', JSON.stringify({ brand: newEquipment.brand || 'N/A', model: newEquipment.model || 'N/A' }));
        newEquipment.imageFiles.forEach((file) => formData.append('images', file));
        await axios.post('/api/equipment', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await axios.post('/api/equipment', {
          name: newEquipment.name, description: newEquipment.description, category: newEquipment.category,
          specifications: { brand: newEquipment.brand || 'N/A', model: newEquipment.model || 'N/A' },
          pricing: { perHour, perKm }, totalUnits: parseInt(newEquipment.totalUnits) || 1, location: locationData,
        });
      }
      showToast('Equipment added! Pending admin approval.', 'success');
      setShowAddForm(false);
      setNewEquipment({ name: '', description: '', category: 'Tractor', brand: '', model: '', pricePerHour: '', pricePerKm: '', totalUnits: '1', imageFiles: [] });
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
    } catch { showToast('Failed to accept booking', 'error'); }
  };

  const handleRejectBooking = async (bookingId) => {
    if (!confirm('Reject this booking?')) return;
    try {
      await axios.put(`/api/bookings/${bookingId}/cancel`, { reason: 'Rejected by owner' });
      showToast('Booking rejected', 'success');
      fetchBookings();
    } catch { showToast('Failed to reject booking', 'error'); }
  };

  const handleMarkComplete = async (bookingId) => {
    try {
      await axios.put(`/api/bookings/${bookingId}/status`, { status: 'completed' });
      showToast('Booking marked as completed!', 'success');
      fetchBookings();
    } catch { showToast('Failed to update status', 'error'); }
  };

  const toggleAvailability = async (eq) => {
    try {
      await axios.put(`/api/equipment/${eq._id}`, { availability: { ...(eq.availability || {}), isAvailable: !eq.availability?.isAvailable } });
      showToast(eq.availability?.isAvailable ? 'Equipment paused' : 'Equipment resumed', 'success');
      fetchMyEquipments();
    } catch { showToast('Failed to update availability', 'error'); }
  };

  const deleteListing = async (eq) => {
    if (!confirm('Delete this equipment listing?')) return;
    try {
      await axios.delete(`/api/equipment/${eq._id}`);
      showToast('Equipment deleted', 'success');
      fetchMyEquipments();
    } catch { showToast('Failed to delete equipment', 'error'); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-farm-primary border-t-transparent mx-auto mb-3" />
          <p className="text-sm text-gray-600">{t('renter.loading')}</p>
        </div>
      </div>
    );
  }

  const totalRevenue = bookings.filter((b) => b.status === 'completed').reduce((sum, b) => sum + (b.pricing?.totalCost || 0), 0);
  const pendingPayments = bookings.filter((b) => b.status === 'confirmed').reduce((sum, b) => sum + (b.pricing?.remainingPayment || 0), 0);
  const activeRents = bookings.filter((b) => b.status === 'ongoing').length;
  const pendingBookings = bookings.filter((b) => b.status === 'hold');

  const avgOverallRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : null;

  const filteredReviews = selectedEquipmentFilter === 'all'
    ? reviews
    : reviews.filter((r) => r.equipmentId === selectedEquipmentFilter);

  const ratingByEquipment = reviews.reduce((acc, r) => {
    if (!acc[r.equipmentId]) acc[r.equipmentId] = { sum: 0, count: 0 };
    acc[r.equipmentId].sum += r.rating || 0;
    acc[r.equipmentId].count += 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs text-gray-500 mb-1">{t('renter.totalRevenue')}</p>
          <p className="text-2xl font-bold text-farm-primary">₹{totalRevenue.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs text-gray-500 mb-1">{t('renter.pendingPayments')}</p>
          <p className="text-2xl font-bold text-amber-600">₹{pendingPayments.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs text-gray-500 mb-1">{t('renter.activeRents')}</p>
          <p className="text-2xl font-bold text-emerald-600">{activeRents}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Booking Requests */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900">{t('renter.bookingRequests')}</h2>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-farm-light/20 text-farm-primary">
              {pendingBookings.length} {t('renter.pending')}
            </span>
          </div>
          <div className="space-y-3">
            {pendingBookings.length === 0 ? (
              <p className="text-xs text-gray-500">{t('renter.noRequests')}</p>
            ) : (
              pendingBookings.map((booking) => (
                <div key={booking._id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{booking.equipment?.name || 'Equipment'}</p>
                      <p className="text-xs text-gray-500">{t('renter.farmerLabel')} {booking.farmer?.name || 'N/A'} • {booking.farmer?.phone || ''}</p>
                      <p className="text-xs text-gray-500">
                        {t('renter.dateLabel')} {new Date(booking.bookingDate).toLocaleDateString('en-IN')}
                        {booking.endDate && booking.endDate !== booking.bookingDate && ` → ${new Date(booking.endDate).toLocaleDateString('en-IN')}`}
                      </p>
                      <p className="text-xs text-gray-500">{t('renter.slotLabel')} {booking.timeSlot?.startTime} – {booking.timeSlot?.endTime}</p>
                    </div>
                    <div className="text-right text-xs">
                      <p className="font-bold text-farm-primary">₹{(booking.pricing?.totalCost || 0).toLocaleString('en-IN')}</p>
                      <p className="text-gray-400">Service: ₹{booking.pricing?.serviceCharge || 0}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => handleAcceptBooking(booking._id)}
                      className="px-4 py-1.5 rounded-2xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700">
                      {t('renter.accept')}
                    </button>
                    <button onClick={() => handleRejectBooking(booking._id)}
                      className="px-4 py-1.5 rounded-2xl text-xs font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100">
                      {t('renter.reject')}
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
                <h2 className="text-base font-bold text-gray-900">{t('renter.addEquipment')}</h2>
                <button onClick={() => setShowAddForm(false)} className="text-xs text-gray-500 hover:text-gray-700">{t('common.cancel')}</button>
              </div>
              <form onSubmit={handleAddEquipment} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{t('renter.equipmentName')}</label>
                  <input type="text" value={newEquipment.name} onChange={(e) => setNewEquipment({ ...newEquipment, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-2xl border border-gray-300 text-sm outline-none" placeholder="John Deere Tractor" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{t('renter.category')}</label>
                  <select value={newEquipment.category} onChange={(e) => setNewEquipment({ ...newEquipment, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-2xl border border-gray-300 text-sm outline-none" required>
                    {['Tractor','Harvester','Plough','Seeder','Sprayer','Thresher','Other'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{t('renter.description')}</label>
                  <input type="text" value={newEquipment.description} onChange={(e) => setNewEquipment({ ...newEquipment, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-2xl border border-gray-300 text-sm outline-none" placeholder="Short description" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">{t('renter.pricePerHour')}</label>
                    <input type="number" value={newEquipment.pricePerHour} onChange={(e) => setNewEquipment({ ...newEquipment, pricePerHour: e.target.value })}
                      className="w-full px-3 py-2 rounded-2xl border border-gray-300 text-sm outline-none" min="0" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">{t('renter.pricePerKm')}</label>
                    <input type="number" value={newEquipment.pricePerKm} onChange={(e) => setNewEquipment({ ...newEquipment, pricePerKm: e.target.value })}
                      className="w-full px-3 py-2 rounded-2xl border border-gray-300 text-sm outline-none" min="0" required />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{t('renter.noOfUnits')}</label>
                  <input type="number" value={newEquipment.totalUnits} onChange={(e) => setNewEquipment({ ...newEquipment, totalUnits: e.target.value })}
                    className="w-full px-3 py-2 rounded-2xl border border-gray-300 text-sm outline-none" min="1" max="20" required />
                  <p className="mt-1 text-[11px] text-gray-400">{t('renter.unitsHint')}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{t('renter.photos')}</label>
                  <input type="file" accept="image/*" multiple onChange={(e) => setNewEquipment({ ...newEquipment, imageFiles: Array.from(e.target.files || []) })}
                    className="w-full text-xs" />
                  {newEquipment.imageFiles?.length > 0 && (
                    <p className="mt-1 text-[11px] text-gray-500">{newEquipment.imageFiles.length} {t('renter.imagesSelected')}</p>
                  )}
                </div>
                <button type="submit" disabled={loading} className="w-full bg-farm-primary text-white px-4 py-2.5 rounded-2xl text-sm font-semibold disabled:bg-gray-400">
                  {loading ? t('renter.adding') : t('renter.publish')}
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-gray-900">{t('renter.myEquipment')}</h2>
                <button onClick={() => setShowAddForm(true)} className="px-3 py-1.5 rounded-2xl text-xs font-semibold bg-farm-primary text-white">
                  {t('renter.addNew')}
                </button>
              </div>
              <div className="space-y-3">
                {myEquipments.length === 0 ? (
                  <p className="text-xs text-gray-500">{t('renter.noEquipment')}</p>
                ) : (
                  myEquipments.map((eq) => {
                    const eqRating = ratingByEquipment[eq._id];
                    const avgRating = eqRating ? (eqRating.sum / eqRating.count).toFixed(1) : null;
                    return (
                      <div key={eq._id} className="border border-gray-100 rounded-2xl overflow-hidden flex">
                        <div
                          className={`h-20 w-24 bg-farm-primary/20 flex-shrink-0 flex items-center justify-center overflow-hidden ${eq.photos?.[0]?.url ? 'cursor-pointer' : ''}`}
                          onClick={() => eq.photos?.[0]?.url && setSelectedImage(`${BASE_URL}${eq.photos[0].url}`)}
                        >
                          {eq.photos?.[0]?.url
                            ? <img src={`${BASE_URL}${eq.photos[0].url}`} alt={eq.name} className="w-full h-full object-cover" />
                            : <span className="text-2xl">🚜</span>}
                        </div>
                        <div className="flex-1 p-3 space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <p className="font-semibold text-sm text-gray-900 line-clamp-1">{eq.name}</p>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold shrink-0">{eq.category}</span>
                          </div>
                          <p className="text-[11px] text-gray-500 line-clamp-2">{eq.description}</p>
                          <p className="text-[11px] text-gray-600 font-medium">₹{eq.pricing?.perHour || 0}/hr • ₹{eq.pricing?.perKm || 0}/km</p>
                          <p className="text-[11px] text-gray-500">{eq.totalUnits || 1} unit{(eq.totalUnits || 1) > 1 ? 's' : ''} listed</p>
                          {avgRating ? (
                            <div className="flex items-center gap-1">
                              <StarRating rating={parseFloat(avgRating)} />
                              <span className="text-[11px] text-gray-500">{avgRating} ({eqRating.count} review{eqRating.count !== 1 ? 's' : ''})</span>
                            </div>
                          ) : (
                            <p className="text-[11px] text-gray-400 italic">{t('renter.noReviews')}</p>
                          )}
                          {eq.verificationStatus !== 'verified' && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold">
                              {t('renter.pendingApproval')}
                            </span>
                          )}
                          <div className="pt-1 flex flex-wrap justify-end gap-2">
                            <button onClick={() => toggleAvailability(eq)}
                              className="px-3 py-1 rounded-full text-[11px] font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50">
                              {eq.availability?.isAvailable ? t('renter.pause') : t('renter.resume')}
                            </button>
                            <button onClick={() => deleteListing(eq)}
                              className="px-3 py-1 rounded-full text-[11px] font-semibold border border-red-200 text-red-700 hover:bg-red-50">
                              {t('renter.delete')}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* All Bookings */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-base font-bold mb-4 text-gray-900">{t('renter.allBookings')}</h2>
        <div className="space-y-3">
          {bookings.length === 0 ? (
            <p className="text-xs text-gray-500">{t('renter.noBookings')}</p>
          ) : (
            bookings.map((booking) => (
              <div key={booking._id} className="border border-gray-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="font-semibold text-sm text-gray-900">{booking.equipment?.name || 'Equipment'}</p>
                  <p className="text-xs text-gray-500">
                    {t('renter.farmerLabel')} {booking.farmer?.name || 'N/A'} • {new Date(booking.bookingDate).toLocaleDateString('en-IN')}
                  </p>
                  <p className="text-xs text-gray-500">{t('renter.slotLabel')} {booking.timeSlot?.startTime} – {booking.timeSlot?.endTime}</p>
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
                      {t('renter.markDone')}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Equipment Reviews — content (names, comments) kept as-is */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-gray-900">Equipment Reviews</h2>
            {avgOverallRating && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-100">
                <StarRating rating={parseFloat(avgOverallRating)} />
                <span className="text-xs font-bold text-amber-700">{avgOverallRating}</span>
                <span className="text-xs text-amber-600">({reviews.length} total)</span>
              </div>
            )}
          </div>
        </div>

        {reviewsLoading ? (
          <div className="flex items-center gap-2 py-6 justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-farm-primary border-t-transparent" />
            <p className="text-xs text-gray-500">Loading reviews...</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-2xl mb-2">⭐</p>
            <p className="text-sm text-gray-500">No reviews yet for your equipment.</p>
            <p className="text-xs text-gray-400 mt-1">Reviews will appear here once farmers complete bookings and leave feedback.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReviews.map((review) => (
              <div key={review._id} className="border border-gray-100 rounded-2xl p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-farm-primary/10 flex items-center justify-center text-sm font-bold text-farm-primary flex-shrink-0">
                      {(review.farmer?.name || review.user?.name || 'F')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{review.farmer?.name || review.user?.name || 'Anonymous Farmer'}</p>
                      <p className="text-[11px] text-gray-400">
                        for <span className="text-farm-primary font-medium">{review.equipmentName}</span>
                        {' • '}{new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                    <StarRating rating={review.rating} />
                    <span className="text-[11px] font-bold text-amber-600">{review.rating}/5</span>
                  </div>
                </div>
                {review.comment && (
                  <p className="text-xs text-gray-600 leading-relaxed pl-10">"{review.comment}"</p>
                )}
                {review.ratings && (
                  <div className="pl-10 flex flex-wrap gap-3">
                    {Object.entries(review.ratings).map(([key, val]) => (
                      <div key={key} className="flex items-center gap-1">
                        <span className="text-[10px] text-gray-400 capitalize">{key}:</span>
                        <StarRating rating={val} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image lightbox */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 px-4" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh] bg-black rounded-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <img src={selectedImage} alt="Equipment" className="w-full h-full object-contain" />
            <button onClick={() => setSelectedImage(null)} className="absolute top-3 right-3 bg-black/60 text-white rounded-full px-3 py-1 text-sm font-semibold hover:bg-black/80">
              {t('renter.close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}