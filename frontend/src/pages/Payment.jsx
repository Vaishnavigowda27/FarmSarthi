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
      const response = await axios.get(`/api/bookings/${bookingId}`);
      setBooking(response.data.booking);
    } catch (error) {
      showToast('Failed to load booking', 'error');
      navigate('/farmer');
    } finally {
      setLoading(false);
    }
  };

  const createPaymentOrder = async () => {
    const res = await axios.post('/api/payments/create-order', {
      bookingId,
      paymentType: 'advance',
    });
    return res.data;
  };

  const handlePayment = async () => {
    if (!booking || booking.status !== 'hold') {
      showToast('Invalid booking state', 'error');
      return;
    }
    setProcessing(true);
    try {
      const { order, razorpayKeyId } = await createPaymentOrder();
      if (!order || !razorpayKeyId) {
        showToast('Failed to create payment order', 'error');
        setProcessing(false);
        return;
      }

      const options = {
        key: razorpayKeyId,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'FarmSaarthi',
        description: `Service charge for ${booking.equipment?.name || 'equipment'} booking`,
        order_id: order.id,
        handler: async (response) => {
          try {
            await axios.post('/api/payments/verify', {
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              bookingId,
              paymentType: 'advance',
            });
            showToast('Payment successful! Booking confirmed.', 'success');
            navigate('/farmer');
          } catch (err) {
            showToast(err.response?.data?.message || 'Payment verification failed', 'error');
          } finally {
            setProcessing(false);
          }
        },
        prefill: {
          name: user?.name || '',
          contact: user?.phone || '',
        },
        theme: { color: '#2D6A4F' },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => {
        showToast('Payment failed. Please try again.', 'error');
        setProcessing(false);
      });
      rzp.open();
    } catch (error) {
      showToast(error.response?.data?.message || 'Payment failed', 'error');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-sm text-gray-500">Loading payment details…</div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-gray-600">Booking not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-lg sm:text-xl font-bold text-[#1B4332] mb-2">
          Complete Payment
        </h1>
        <p className="text-xs text-gray-600">
          Pay the 2% non‑refundable service charge securely to confirm your booking.
        </p>
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Security Badge */}
          <div className="border-b border-[#74C69D]/40 px-6 py-3 bg-[#74C69D]/10">
            <div className="flex items-center justify-center gap-2 text-xs text-[#1B4332]">
              <span className="text-sm">🔒</span>
              <span className="font-semibold">Secure UPI / Razorpay Payment</span>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {/* Booking Summary */}
            <div className="mb-6">
              <h2 className="text-sm font-bold mb-3 text-[#1B4332]">
                Booking Summary
              </h2>
              <div className="bg-gray-50 rounded-2xl p-4 space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">Equipment:</span>
                  <span className="font-semibold text-gray-800">{booking.equipment?.name || booking.equipmentId?.name || 'N/A'}</span>
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
                    {booking.timeSlot?.startTime || booking.startTime} - {booking.timeSlot?.endTime || booking.endTime} ({booking.timeSlot?.duration ?? booking.hours ?? 0} hours)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">Distance:</span>
                  <span className="font-medium text-gray-800">{booking.distance ?? 0} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">Owner:</span>
                  <span className="font-medium text-gray-800">
                    {booking.renter?.name || booking.renterId?.name || 'N/A'} • {booking.renter?.phone || booking.renterId?.phone || ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-xs">
              <div className="rounded-2xl bg-[#74C69D]/15 border border-[#74C69D]/40 p-4 space-y-2">
                <h3 className="text-sm font-bold text-[#1B4332]">
                  Service Charge (Pay Now)
                </h3>
                <p className="text-2xl font-bold text-[#2D6A4F]">
                  ₹{(booking.pricing?.serviceCharge ?? booking.advancePaid ?? 0).toLocaleString('en-IN')}
                </p>
                <p className="text-[11px] text-gray-700">
                  This is a 2% non‑refundable platform service charge paid online to confirm your booking.
                </p>
              </div>
              <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4 space-y-2">
                <h3 className="text-sm font-bold text-[#1B4332]">
                  Remaining Amount (After Service)
                </h3>
                <p className="text-2xl font-bold text-[#1B4332]">
                  ₹{(booking.pricing?.remainingPayment ?? booking.remainingAmount ?? 0).toLocaleString('en-IN')}
                </p>
                <p className="text-[11px] text-gray-700">
                  Pay this directly to the owner once the work is completed.
                </p>
              </div>
            </div>

            {/* Important Notes */}
            <div className="bg-[#F8F9FA] border border-gray-200 rounded-2xl p-4 mb-4 text-[11px] text-gray-700">
              <p className="font-semibold text-[#1B4332] mb-1">
                Important Information
              </p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Service charge is non‑refundable.</li>
                <li>Remaining amount to be paid after service completion.</li>
                <li>Please contact the owner before the scheduled time.</li>
              </ul>
            </div>

            {/* Payment Button */}
            <button
              onClick={handlePayment}
              disabled={processing}
              className="w-full bg-[#2D6A4F] text-white py-3 rounded-2xl font-semibold text-sm disabled:bg-gray-400"
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
                  Pay ₹{booking.pricing?.serviceCharge ?? booking.advancePaid ?? 0} Now
                </span>
              )}
            </button>

            <p className="text-center text-gray-500 mt-4 text-xs flex items-center justify-center">
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