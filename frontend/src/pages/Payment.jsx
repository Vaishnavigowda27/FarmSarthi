import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../utils/mockAPI.js'; // Using mock API

export default function Payment() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      const { data } = await API.get(`/bookings/${bookingId}`);
      setBooking(data);
    } catch (error) {
      console.error('Error fetching booking');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    try {
      // Create Razorpay order
      const { data } = await API.post('/payments/create-order', { bookingId });
      
      const options = {
        key: 'YOUR_RAZORPAY_KEY', // Replace with actual key
        amount: data.amount,
        currency: 'INR',
        name: 'AgriRental',
        description: 'Equipment Booking Payment',
        order_id: data.orderId,
        handler: async function (response) {
          // Verify payment
          try {
            await API.post('/payments/verify', {
              bookingId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            });
            
            alert('Payment successful!');
            navigate('/farmer');
          } catch (error) {
            alert('Payment verification failed');
          }
        },
        prefill: {
          name: booking.farmer.name,
          contact: booking.farmer.phone
        },
        theme: {
          color: '#16a34a'
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      alert('Payment initiation failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Booking not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-6 text-center">Payment</h1>
          
          {/* Booking Summary */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Booking Summary</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Equipment:</span>
                <span className="font-semibold">{booking.equipment?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Owner:</span>
                <span>{booking.equipment?.owner?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span>{new Date(booking.startTime).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time:</span>
                <span>{new Date(booking.startTime).toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span>{booking.hours} hours</span>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="bg-green-50 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Payment Details</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Rate per hour:</span>
                <span>₹{booking.equipment?.pricePerHour}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total hours:</span>
                <span>{booking.hours} hours</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-bold">₹{booking.totalAmount}</span>
              </div>
              <div className="flex justify-between text-green-600 font-bold border-t pt-2">
                <span>Advance Payment:</span>
                <span>₹{booking.advanceAmount}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Remaining (Pay offline):</span>
                <span>₹{booking.totalAmount - booking.advanceAmount}</span>
              </div>
            </div>
          </div>

          {/* Payment Button */}
          <button
            onClick={handlePayment}
            className="w-full bg-green-600 text-white py-4 rounded-lg text-lg font-semibold hover:bg-green-700"
          >
            Pay ₹{booking.advanceAmount} Now
          </button>

          <p className="text-center text-sm text-gray-500 mt-4">
            Secure payment powered by Razorpay
          </p>

          <button
            onClick={() => navigate('/farmer')}
            className="w-full mt-4 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}