import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { showToast } from '../utils/helpers';

export default function FarmerDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [myBookings, setMyBookings] = useState([]);
  const [stats, setStats] = useState({ total: 0, upcoming: 0, completed: 0, totalSpent: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // all, upcoming, completed, cancelled
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });

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
      const response = await axios.get('/api/booking/farmer');
      const bookings = response.data.bookings || [];
      setMyBookings(bookings);
      
      // Calculate stats
      const total = bookings.length;
      const upcoming = bookings.filter(b => b.status === 'confirmed' || b.status === 'hold').length;
      const completed = bookings.filter(b => b.status === 'completed').length;
      const totalSpent = bookings
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + (b.totalCost || 0), 0);
      
      setStats({ total, upcoming, completed, totalSpent });
      
    } catch (error) {
      console.error('Error fetching bookings:', error);
      showToast('Failed to load bookings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this booking? Advance payment is non-refundable.')) {
      return;
    }
    
    try {
      await axios.put(`/api/booking/cancel/${bookingId}`);
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

  const handleSubmitReview = async () => {
    if (!reviewData.comment.trim()) {
      showToast('Please write a review', 'error');
      return;
    }
    
    try {
      await axios.post('/api/review/create', {
        bookingId: selectedBooking._id,
        rating: reviewData.rating,
        comment: reviewData.comment
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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filterBookings = () => {
    switch (activeTab) {
      case 'upcoming':
        return myBookings.filter(b => b.status === 'confirmed' || b.status === 'hold');
      case 'completed':
        return myBookings.filter(b => b.status === 'completed');
      case 'cancelled':
        return myBookings.filter(b => b.status === 'cancelled');
      default:
        return myBookings;
    }
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
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Farmer Dashboard</h1>
            <p className="text-blue-100 text-sm mt-1">Manage your equipment rentals</p>
          </div>
          <div className="flex gap-4 items-center">
            <span className="text-white font-medium"> {user?.name}</span>
            <button 
              onClick={handleLogout} 
              className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-500 text-sm font-medium mb-2">Total Bookings</h3>
                <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
              </div>
              <div className="text-4xl"></div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-500 text-sm font-medium mb-2">Upcoming</h3>
                <p className="text-3xl font-bold text-orange-600">{stats.upcoming}</p>
              </div>
              <div className="text-4xl"></div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-500 text-sm font-medium mb-2">Completed</h3>
                <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <div className="text-4xl"></div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-500 text-sm font-medium mb-2">Total Spent</h3>
                <p className="text-3xl font-bold text-purple-600">₹{stats.totalSpent}</p>
              </div>
              <div className="text-4xl"></div>
            </div>
          </div>
        </div>

        {/* Search Equipment Button */}
        <div className="mb-8">
          <Link
            to="/equipment"
            className="inline-block bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-8 py-4 rounded-lg font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg"
          >
             Search for Equipment
          </Link>
        </div>

        {/* Bookings Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">My Bookings</h2>

          {/* Tabs */}
          <div className="flex border-b mb-6">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'all'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              All ({myBookings.length})
            </button>
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'upcoming'
                  ? 'border-b-2 border-orange-600 text-orange-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Upcoming ({stats.upcoming})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'completed'
                  ? 'border-b-2 border-green-600 text-green-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Completed ({stats.completed})
            </button>
            <button
              onClick={() => setActiveTab('cancelled')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'cancelled'
                  ? 'border-b-2 border-red-600 text-red-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Cancelled
            </button>
          </div>

          {/* Bookings List */}
          <div className="space-y-4">
            {filterBookings().length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-gray-500 text-lg">No bookings found</p>
                <Link
                  to="/equipment"
                  className="inline-block mt-4 text-blue-600 hover:underline"
                >
                  Browse equipment →
                </Link>
              </div>
            ) : (
              filterBookings().map(booking => (
                <div key={booking._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    {/* Left Side - Equipment Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="text-4xl"></div>
                        <div>
                          <h3 className="font-bold text-xl text-gray-800">
                            {booking.equipmentId?.name || 'Equipment'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Owner: {booking.renterId?.name || 'N/A'} • {booking.renterId?.phone}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600"> Date:</span>
                          <span className="ml-2 font-medium">
                            {new Date(booking.bookingDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600"> Time:</span>
                          <span className="ml-2 font-medium">
                            {booking.startTime} - {booking.endTime}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Duration:</span>
                          <span className="ml-2 font-medium">{booking.hours} hours</span>
                        </div>
                        <div>
                          <span className="text-gray-600"> Distance:</span>
                          <span className="ml-2 font-medium">{booking.distance} km</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Payment:</span>
                          <div className="text-right">
                            <div className="text-sm text-gray-600">
                              Advance Paid: <span className="font-semibold text-green-600">₹{booking.advancePaid}</span>
                            </div>
                            <div className="text-sm text-gray-600">
                              Remaining: <span className="font-semibold text-orange-600">₹{booking.remainingAmount}</span>
                            </div>
                            <div className="text-lg font-bold text-gray-800 mt-1">
                              Total: ₹{booking.totalCost}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Side - Status & Actions */}
                    <div className="ml-6 text-right">
                      <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold mb-4 ${
                        booking.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                        booking.status === 'completed' ? 'bg-green-100 text-green-700' :
                        booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        booking.status === 'hold' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {booking.status === 'hold' ? ' On Hold' :
                         booking.status === 'confirmed' ? ' Confirmed' :
                         booking.status === 'completed' ? ' Completed' :
                         booking.status === 'cancelled' ? ' Cancelled' :
                         booking.status}
                      </span>

                      <div className="space-y-2">
                        {booking.status === 'confirmed' && (
                          <button
                            onClick={() => handleCancelBooking(booking._id)}
                            className="block w-full bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                          >
                            Cancel Booking
                          </button>
                        )}

                        {booking.status === 'completed' && !booking.hasReview && (
                          <button
                            onClick={() => openReviewModal(booking)}
                            className="block w-full bg-yellow-100 text-yellow-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-200 transition-colors"
                          >
                             Write Review
                          </button>
                        )}

                        {booking.status === 'completed' && booking.hasReview && (
                          <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm font-medium">
                            ✓ Reviewed
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-4 text-gray-800">Write a Review</h3>
            
            <div className="mb-4">
              <p className="text-gray-700 font-medium mb-2">
                {selectedBooking?.equipmentId?.name}
              </p>
              <p className="text-sm text-gray-600">
                Owner: {selectedBooking?.renterId?.name}
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setReviewData({ ...reviewData, rating: star })}
                    className={`text-4xl ${
                      star <= reviewData.rating ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  >
                    
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">Your Review</label>
              <textarea
                value={reviewData.comment}
                onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="4"
                placeholder="Share your experience with this equipment..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setReviewData({ rating: 5, comment: '' });
                }}
                className="flex-1 border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700"
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}