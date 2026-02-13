import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { showToast } from '../utils/helpers';

const Payment = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadBooking();
  }, [bookingId]);

  const loadBooking = async () => {
    try {
      const response = await axios.get(`/api/booking/${bookingId}`);
      setBooking(response.data.booking);
    } catch (error) {
      showToast('Failed to load booking', 'error');
      navigate('/farmer');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setProcessing(true);
    
    try {
      // For now, simulate payment
      // Later integrate with Razorpay
      
      await axios.post('/api/booking/confirm', {
        bookingId: bookingId,
        paymentId: 'DEMO_' + Date.now()
      });

      showToast('Payment successful!', 'success');
      navigate('/farmer');
      
    } catch (error) {
      showToast(error.response?.data?.message || 'Payment failed', 'error');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Booking not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-800">Complete Payment</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Security Badge */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100 px-6 py-4">
            <div className="flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-green-700">Secure Payment Gateway</span>
            </div>
          </div>

          <div className="p-8">
            {/* Booking Summary */}
            <div className="mb-8">
              <h2 className="text-lg font-bold mb-4 text-gray-800">Booking Summary</h2>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">Equipment:</span>
                  <span className="font-semibold text-gray-800">{booking.equipmentId?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">Booking Date:</span>
                  <span className="font-medium text-gray-800">
                    {new Date(booking.bookingDate).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">Time Slot:</span>
                  <span className="font-medium text-gray-800">
                    {booking.startTime} - {booking.endTime} ({booking.hours} hours)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">Distance:</span>
                  <span className="font-medium text-gray-800">{booking.distance} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">Owner:</span>
                  <span className="font-medium text-gray-800">
                    {booking.renterId?.name || 'N/A'} • {booking.renterId?.phone}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-lg p-6 mb-8">
              <h3 className="text-lg font-bold mb-4">Payment Breakdown</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm opacity-90">
                  <span>Hourly Cost ({booking.hours}hrs × ₹{booking.equipmentId?.pricePerHour}):</span>
                  <span className="font-semibold">₹{(booking.hours * (booking.equipmentId?.pricePerHour || 0)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm opacity-90">
                  <span>Distance Cost ({booking.distance}km × ₹{booking.equipmentId?.pricePerKm}):</span>
                  <span className="font-semibold">₹{(booking.distance * (booking.equipmentId?.pricePerKm || 0)).toFixed(2)}</span>
                </div>
                
                <div className="border-t border-white/20 pt-3 mt-3">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">Total Cost:</span>
                    <span className="font-bold text-xl">₹{booking.totalCost}</span>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3 mt-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Pay Now (10% Advance):</span>
                      <span className="font-bold text-lg">₹{booking.advancePaid}</span>
                    </div>
                    <div className="flex justify-between text-sm opacity-75">
                      <span>Remaining (Pay After Service):</span>
                      <span>₹{booking.remainingAmount}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Important Notes */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <svg className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <h4 className="font-semibold text-yellow-800 mb-1">Important Information</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Advance payment is non-refundable</li>
                    <li>• Remaining 90% to be paid after service completion</li>
                    <li>• Please contact the owner before the scheduled time</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Payment Button */}
            <button
              onClick={handlePayment}
              disabled={processing}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-lg font-bold text-lg hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {processing ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing Payment...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Pay ₹{booking.advancePaid} Now
                </span>
              )}
            </button>

            <p className="text-center text-gray-500 mt-4 text-sm flex items-center justify-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Secured by Razorpay Payment Gateway
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;