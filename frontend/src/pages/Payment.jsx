import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { formatCurrency, showToast } from '../utils/helpers';

const Payment = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadBooking();
  }, [bookingId]);

  const loadBooking = async () => {
    try {
      const response = await api.get(`/bookings/${bookingId}`);
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
      // Create payment order
      const orderResponse = await api.post('/payments/create-order', {
        bookingId: bookingId,
        paymentType: 'advance'
      });

      const { order, razorpayKeyId } = orderResponse.data;

      // Razorpay options
      const options = {
        key: razorpayKeyId,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'FarmSaarthi',
        description: 'Equipment Booking Payment',
        order_id: order.id,
        handler: async function (response) {
          try {
            // Verify payment
            await api.post('/payments/verify', {
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              bookingId: bookingId,
              paymentType: 'advance'
            });

            // Confirm booking
            await api.put(`/bookings/${bookingId}/confirm`, {
              paymentId: response.razorpay_payment_id
            });

            showToast('Payment successful!', 'success');
            navigate('/farmer');
          } catch (error) {
            showToast('Payment verification failed', 'error');
            setProcessing(false);
          }
        },
        prefill: {
          name: user?.name || '',
          contact: user?.phone || ''
        },
        theme: {
          color: '#10b981'
        },
        modal: {
          ondismiss: function () {
            setProcessing(false);
            showToast('Payment cancelled', 'error');
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      
    } catch (error) {
      showToast(error.response?.data?.message || 'Payment failed', 'error');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Booking not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-4xl font-bold mb-8 text-center gradient-primary bg-clip-text text-transparent">
            {t('payment.title')}
          </h1>

          {/* Booking Summary */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Booking Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Equipment:</span>
                <span className="font-semibold">{booking.equipment?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Booking Date:</span>
                <span className="font-semibold">
                  {new Date(booking.bookingDate).toLocaleDateString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time:</span>
                <span className="font-semibold">
                  {booking.timeSlot?.startTime} - {booking.timeSlot?.endTime}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pickup Location:</span>
                <span className="font-semibold text-right">
                  {booking.pickupLocation?.address || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="bg-gradient-primary text-white rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Payment Breakdown</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Cost:</span>
                <span className="font-semibold">
                  {formatCurrency(booking.pricing?.totalCost || 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm opacity-90">
                <span>Hours Cost:</span>
                <span>{formatCurrency(booking.pricing?.hoursCost || 0)}</span>
              </div>
              <div className="flex justify-between text-sm opacity-90">
                <span>Distance Cost:</span>
                <span>{formatCurrency(booking.pricing?.distanceCost || 0)}</span>
              </div>
              
              <div className="border-t border-white/30 pt-3 mt-3">
                <div className="flex justify-between text-xl font-bold">
                  <span>Pay Now (10% Advance):</span>
                  <span>{formatCurrency(booking.pricing?.advancePayment || 0)}</span>
                </div>
                <div className="flex justify-between text-sm mt-2 opacity-90">
                  <span>Remaining (90%):</span>
                  <span>{formatCurrency(booking.pricing?.remainingPayment || 0)}</span>
                </div>
                <p className="text-xs mt-2 opacity-75">
                  *Remaining payment to be made after service completion
                </p>
              </div>
            </div>
          </div>

          {/* Payment Button */}
          <button
            onClick={handlePayment}
            disabled={processing}
            className="w-full bg-primary text-white py-4 rounded-lg font-semibold text-lg hover:bg-primary-dark disabled:bg-gray-400"
          >
            {processing ? 'Processing Payment...' : `Pay ${formatCurrency(booking.pricing?.advancePayment || 0)} Now`}
          </button>

          <p className="text-center text-gray-600 mt-4 text-sm">
            Secured by Razorpay
          </p>
        </div>
      </div>
    </div>
  );
};

export default Payment;