import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { showToast } from '../utils/helpers';
import { useTranslation } from 'react-i18next';
import Toggle from '../components/Toggle';

export default function FarmerDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [myBookings, setMyBookings] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    completed: 0,
    totalSpent: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeBooking, setDisputeBooking] = useState(null);
  const [disputeData, setDisputeData] = useState({ reason: 'equipment_breakdown', description: '' });
  const [disputeLoading, setDisputeLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'farmer') {
      navigate('/');
      return;
    }
    fetchMyBookings();
  }, [user, navigate]);

  const fetchMyBookings = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/bookings');
      const bookings = response.data.bookings || [];
      setMyBookings(bookings);

      const total = bookings.length;
      const upcoming = bookings.filter(
        (b) => b.status === 'confirmed' || b.status === 'hold',
      ).length;
      const completed = bookings.filter(
        (b) => b.status === 'completed',
      ).length;
      const totalSpent = bookings
        .filter((b) => b.status === 'completed')
        .reduce((sum, b) => sum + (b.totalCost || b.pricing?.totalCost || 0), 0);

      setStats({ total, upcoming, completed, totalSpent });
    } catch (error) {
      console.error('Error fetching bookings:', error);
      showToast('Failed to load bookings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (
      !confirm(
        'Are you sure you want to cancel this booking? Service charge is non-refundable.',
      )
    ) {
      return;
    }
    try {
      await axios.put(`/api/bookings/${bookingId}/cancel`);
      showToast('Booking cancelled successfully', 'success');
      fetchMyBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      showToast(error.response?.data?.message || 'Failed to cancel booking', 'error');
    }
  };

  const openReviewModal = (booking) => {
    setSelectedBooking(booking);
    setShowReviewModal(true);
  };

  const openDisputeModal = (booking) => {
    setDisputeBooking(booking);
    setDisputeData({ reason: 'equipment_breakdown', description: '' });
    setShowDisputeModal(true);
  };

  const handleSubmitDispute = async () => {
    if (!disputeData.description.trim()) {
      showToast('Please describe the issue', 'error');
      return;
    }
    try {
      setDisputeLoading(true);
      await axios.put(`/api/bookings/${disputeBooking._id}/dispute`, {
        reason: disputeData.reason,
        description: disputeData.description,
      });
      showToast('Dispute raised. Support will respond within 24 hours.', 'success');
      setShowDisputeModal(false);
      fetchMyBookings();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to raise dispute', 'error');
    } finally {
      setDisputeLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewData.comment.trim()) {
      showToast('Please write a review', 'error');
      return;
    }
    try {
      await axios.post('/api/reviews', {
        bookingId: selectedBooking._id,
        rating: reviewData.rating,
        comment: reviewData.comment,
      });
      showToast('Review submitted successfully!', 'success');
      setShowReviewModal(false);
      setReviewData({ rating: 5, comment: '' });
      fetchMyBookings();
    } catch (error) {
      console.error('Error submitting review:', error);
      showToast(error.response?.data?.message || 'Failed to submit review', 'error');
    }
  };

  const filterBookings = () => {
    switch (activeTab) {
      case 'upcoming':
        return myBookings.filter(
          (b) => b.status === 'confirmed' || b.status === 'hold',
        );
      case 'completed':
        return myBookings.filter((b) => b.status === 'completed');
      case 'cancelled':
        return myBookings.filter((b) => b.status === 'cancelled');
      default:
        return myBookings;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-sm text-gray-500">Loading your bookings…</div>
      </div>
    );
  }

  return (
    <>
    <Toggle />
    <div className="space-y-6">
      {/* Top stats */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-500 mb-1">Total Bookings</p>
          <p className="text-2xl font-bold text-[#1B4332]">{stats.total}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-500 mb-1">Upcoming</p>
          <p className="text-2xl font-bold text-[#2D6A4F]">{stats.upcoming}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-500 mb-1">Completed</p>
          <p className="text-2xl font-bold text-[#2D6A4F]">{stats.completed}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-500 mb-1">Total Spent</p>
          <p className="text-2xl font-bold text-[#1B4332]">
            ₹{stats.totalSpent.toLocaleString('en-IN')}
          </p>
        </div>
      </section>

      {/* Search CTA */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#1B4332]">
            Need equipment for your next job?
          </p>
          <p className="text-xs text-gray-600">
            Search nearby tractors, harvesters, and more.
          </p>
        </div>
        <Link
          to="/equipment"
          className="px-5 py-2.5 rounded-full bg-[#2D6A4F] text-white text-xs font-semibold min-h-[40px] flex items-center justify-center"
        >
          Search Equipment
        </Link>
      </section>

      {/* Bookings list */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm sm:text-base font-bold text-[#1B4332]">
            My Bookings
          </h2>
          <div className="flex border border-gray-200 rounded-full overflow-hidden text-[11px]">
            {['all', 'upcoming', 'completed', 'cancelled'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 ${
                  activeTab === tab
                    ? 'bg-[#2D6A4F] text-white'
                    : 'text-gray-600'
                }`}
              >
                {tab[0].toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3 text-xs sm:text-sm">
          {filterBookings().length === 0 ? (
            <div className="text-center py-10">
              <p className="text-sm font-semibold text-gray-600">
                No bookings found.
              </p>
              <Link
                to="/equipment"
                className="mt-2 inline-block text-[#2D6A4F] font-semibold hover:underline"
              >
                Browse equipment →
              </Link>
            </div>
          ) : (
            filterBookings().map((booking) => (
              <div
                key={booking._id}
                className="border border-gray-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div className="flex-1 space-y-1">
                  <p className="font-semibold text-[#1B4332]">
                    {booking.equipment?.name ||
                      booking.equipmentId?.name ||
                      'Equipment'}
                  </p>
                  <p className="text-[11px] text-gray-600">
                    Owner: {booking.renter?.name || booking.renterId?.name || 'N/A'} •{' '}
                    {booking.renter?.phone || booking.renterId?.phone || ''}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600">
                    <span>
                      Date:{' '}
                      <span className="font-medium">
                        {new Date(booking.bookingDate).toLocaleDateString()}
                      </span>
                    </span>
                    <span>
                      Time:{' '}
                      <span className="font-medium">
                        {booking.timeSlot?.startTime || booking.startTime} -{' '}
                        {booking.timeSlot?.endTime || booking.endTime}
                      </span>
                    </span>
                    <span>
                      Duration:{' '}
                      <span className="font-medium">
                        {booking.timeSlot?.duration ?? booking.hours ?? 0} hrs
                      </span>
                    </span>
                    <span>
                      Distance:{' '}
                      <span className="font-medium">{booking.distance} km</span>
                    </span>
                  </div>
                  <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-[11px] text-gray-600">Payment</span>
                    <div className="text-right text-[11px]">
                      <p className="text-gray-700">
                        Service charge:{' '}
                        <span className="font-semibold text-[#2D6A4F]">
                          ₹
                          {(
                            booking.pricing?.serviceCharge ??
                            booking.advancePaid ??
                            0
                          ).toLocaleString('en-IN')}
                        </span>
                      </p>
                      <p className="text-gray-700">
                        Remaining:{' '}
                        <span className="font-semibold text-[#1B4332]">
                          ₹
                          {(
                            booking.pricing?.remainingPayment ??
                            booking.remainingAmount ??
                            0
                          ).toLocaleString('en-IN')}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status & actions */}
                <div className="sm:ml-4 text-right space-y-2">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-[11px] font-semibold ${
                      booking.status === 'confirmed'
                        ? 'bg-[#74C69D]/20 text-[#1B4332]'
                        : booking.status === 'completed'
                        ? 'bg-[#2D6A4F]/10 text-[#1B4332]'
                        : booking.status === 'cancelled'
                        ? 'bg-red-50 text-red-600'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {booking.status}
                  </span>

                  {booking.status === 'confirmed' && (
                    <button
                      type="button"
                      onClick={() => handleCancelBooking(booking._id)}
                      className="block w-full rounded-full border border-red-200 text-red-600 text-[11px] font-semibold px-3 py-1"
                    >
                      Cancel Booking
                    </button>
                  )}

                  {(booking.status === 'confirmed' || booking.status === 'ongoing') && (
                    <button
                      type="button"
                      onClick={() => openDisputeModal(booking)}
                      className="block w-full rounded-full border border-amber-300 text-amber-700 bg-amber-50 text-[11px] font-semibold px-3 py-1"
                    >
                      ⚠ Raise Dispute
                    </button>
                  )}

                  {booking.status === 'disputed' && (
                    <div className="text-[11px] font-semibold text-amber-700 bg-amber-50 rounded-full px-3 py-1 text-center">
                       Under Review
                    </div>
                  )}

                  {booking.status === 'completed' && !booking.hasReview && (
                    <button
                      type="button"
                      onClick={() => openReviewModal(booking)}
                      className="block w-full rounded-full bg-[#74C69D]/20 text-[#1B4332] text-[11px] font-semibold px-3 py-1"
                    >
                      Write Review
                    </button>
                  )}

                  {booking.status === 'completed' && booking.hasReview && (
                    <div className="text-[11px] font-semibold text-[#2D6A4F]">
                      ✓ Reviewed
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Review modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-[#1B4332]">
              Write a Review
            </h3>
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {selectedBooking?.equipment?.name ||
                  selectedBooking?.equipmentId?.name}
              </p>
              <p className="text-[11px] text-gray-600">
                Owner:{' '}
                {selectedBooking?.renter?.name ||
                  selectedBooking?.renterId?.name}
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Rating
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() =>
                      setReviewData({ ...reviewData, rating: star })
                    }
                    className={`text-2xl ${
                      star <= reviewData.rating
                        ? 'text-[#74C69D]'
                        : 'text-gray-300'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Your Review
              </label>
              <textarea
                value={reviewData.comment}
                onChange={(e) =>
                  setReviewData({ ...reviewData, comment: e.target.value })
                }
                rows={4}
                className="w-full rounded-2xl border border-gray-200 px-3 py-2 text-sm outline-none"
                placeholder="Share your experience with this equipment…"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowReviewModal(false);
                  setReviewData({ rating: 5, comment: '' });
                }}
                className="flex-1 rounded-2xl border border-gray-200 text-xs font-semibold text-gray-700 py-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitReview}
                className="flex-1 rounded-2xl bg-[#2D6A4F] text-white text-xs font-semibold py-2"
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Dispute modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="text-base font-bold text-gray-900">Raise a Dispute</h3>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {disputeBooking?.equipment?.name} • {new Date(disputeBooking?.bookingDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-[11px] text-amber-800 space-y-1">
              <p className="font-semibold">What happens next?</p>
              <p>• The equipment owner will be notified immediately</p>
              <p>• Our support team will review your case within 24 hours</p>
              <p>• Booking is paused and marked "Under Review" until resolved</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Issue Type</label>
              <select
                value={disputeData.reason}
                onChange={(e) => setDisputeData({ ...disputeData, reason: e.target.value })}
                className="w-full rounded-2xl border border-gray-200 px-3 py-2 text-sm outline-none"
              >
                <option value="equipment_breakdown">Equipment Breakdown</option>
                <option value="weather_condition">Unsuitable Weather Conditions</option>
                <option value="no_show">Equipment / Operator Did Not Show Up</option>
                <option value="quality_issue">Equipment Not as Described</option>
                <option value="safety_concern">Safety Concern</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Describe the Issue</label>
              <textarea
                value={disputeData.description}
                onChange={(e) => setDisputeData({ ...disputeData, description: e.target.value })}
                rows={4}
                className="w-full rounded-2xl border border-gray-200 px-3 py-2 text-sm outline-none"
                placeholder="Describe what happened in detail so our support team can assist you quickly…"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowDisputeModal(false)}
                className="flex-1 rounded-2xl border border-gray-200 text-xs font-semibold text-gray-700 py-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitDispute}
                disabled={disputeLoading}
                className="flex-1 rounded-2xl bg-amber-500 text-white text-xs font-semibold py-2 disabled:opacity-50"
              >
                {disputeLoading ? 'Submitting…' : 'Submit Dispute'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}