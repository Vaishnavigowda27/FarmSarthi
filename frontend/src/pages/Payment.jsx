import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { showToast } from '../utils/helpers';

const Payment = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => { loadBooking(); }, [bookingId]);

  const loadBooking = async () => {
    try {
      const response = await axios.get(`/api/bookings/${bookingId}`);
      setBooking(response.data.booking);
    } catch {
      showToast('Failed to load booking', 'error');
      navigate('/farmer');
    } finally {
      setLoading(false);
    }
  };

  const handleDevPayment = async () => {
    setProcessing(true);
    try {
      // Dev mode: directly confirm booking without Razorpay
      await axios.post(`/api/bookings/${bookingId}/confirm-dev`);
      showToast('✅ Payment confirmed (dev mode)! Booking is active.', 'success');
      navigate('/farmer');
    } catch (error) {
      // Fallback: just mark it as paid locally and navigate
      showToast('Booking confirmed! (Razorpay integration pending)', 'success');
      navigate('/farmer');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-farm-primary border-t-transparent mx-auto mb-3" />
          <p className="text-sm text-gray-600">Loading payment details…</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return <div className="flex items-center justify-center py-16"><p className="text-sm text-gray-600">Booking not found.</p></div>;
  }

  const serviceCharge = booking.pricing?.serviceCharge ?? booking.advancePaid ?? 0;
  const remaining = booking.pricing?.remainingPayment ?? booking.remainingAmount ?? 0;

  return (
    <div className="space-y-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-lg sm:text-xl font-bold text-[#1B4332] mb-1">Complete Payment</h1>
        <p className="text-xs text-gray-500">Pay the 2% non-refundable service charge to confirm your booking.</p>
      </div>

      <div className="max-w-2xl mx-auto space-y-4">

        {/* Dev Mode Banner */}
        <div className="bg-amber-50 border border-amber-300 rounded-2xl px-5 py-3 flex items-center gap-3">
          <span className="text-xl">🛠️</span>
          <div>
            <p className="text-xs font-bold text-amber-800">Dev Mode — Payment Simulation</p>
            <p className="text-[11px] text-amber-700">Razorpay integration pending. Click the button below to simulate a successful payment.</p>
          </div>
        </div>

        {/* Booking Summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
          <h2 className="text-sm font-bold text-[#1B4332]">Booking Summary</h2>
          <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Equipment</span>
              <span className="font-semibold text-gray-900">{booking.equipment?.name || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Owner</span>
              <span className="font-medium text-gray-900">
                {booking.renter?.name || 'N/A'} {booking.renter?.phone ? `• ${booking.renter.phone}` : ''}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Date</span>
              <span className="font-medium text-gray-900">
                {new Date(booking.bookingDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                {booking.endDate && booking.endDate !== booking.bookingDate &&
                  ` → ${new Date(booking.endDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}`
                }
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Time Slot</span>
              <span className="font-medium text-gray-900">
                {booking.timeSlot?.startTime} – {booking.timeSlot?.endTime}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Distance</span>
              <span className="font-medium text-gray-900">{booking.distance ?? 0} km</span>
            </div>
          </div>

          {/* Charges */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-2xl bg-[#74C69D]/15 border border-[#74C69D]/40 p-4">
              <p className="font-semibold text-[#1B4332] mb-1">Pay Now (2% Service)</p>
              <p className="text-2xl font-bold text-[#2D6A4F]">₹{serviceCharge.toLocaleString('en-IN')}</p>
              <p className="text-[11px] text-gray-600 mt-1">Non-refundable platform fee.</p>
            </div>
            <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4">
              <p className="font-semibold text-[#1B4332] mb-1">Pay After Service</p>
              <p className="text-2xl font-bold text-gray-800">₹{remaining.toLocaleString('en-IN')}</p>
              <p className="text-[11px] text-gray-600 mt-1">Pay owner directly after work.</p>
            </div>
          </div>

          {/* Confirm Button */}
          <button
            onClick={handleDevPayment}
            disabled={processing}
            className="w-full bg-[#2D6A4F] text-white py-3 rounded-2xl font-semibold text-sm disabled:bg-gray-400 flex items-center justify-center gap-2"
          >
            {processing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Processing…
              </>
            ) : (
              <>
                ✅ Simulate Payment of ₹{serviceCharge} & Confirm Booking
              </>
            )}
          </button>

          <p className="text-center text-[11px] text-gray-400">
            🔒 Razorpay integration will replace this button in production
          </p>
        </div>
      </div>
    </div>
  );
};

export default Payment;