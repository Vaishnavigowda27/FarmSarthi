import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import Booking from '../models/Booking.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Initialize Razorpay
let razorpay;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
}

// Create Razorpay order
router.post('/create-order', authenticate, async (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.farmer.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Development mode - mock payment
    if (!razorpay || process.env.NODE_ENV === 'development') {
      console.log('⚠️  Razorpay not configured. Mock payment order created.');
      return res.json({
        orderId: 'order_mock_' + Date.now(),
        amount: booking.advanceAmount * 100, // paise
        currency: 'INR',
        key: 'mock_razorpay_key'
      });
    }

    // Production mode - create actual Razorpay order
    const options = {
      amount: booking.advanceAmount * 100, // amount in paise
      currency: 'INR',
      receipt: `booking_${bookingId}`,
      notes: {
        bookingId: bookingId,
        farmerId: req.userId.toString()
      }
    };

    const order = await razorpay.orders.create(options);

    // Save order ID to booking
    booking.razorpayOrderId = order.id;
    await booking.save();

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Failed to create payment order', error: error.message });
  }
});

// Verify payment
router.post('/verify', authenticate, async (req, res) => {
  try {
    const { bookingId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Development mode - skip verification
    if (!razorpay || process.env.NODE_ENV === 'development') {
      console.log('⚠️  Razorpay not configured. Payment verified in dev mode.');
      
      booking.status = 'confirmed';
      booking.paymentStatus = 'advance-paid';
      booking.razorpayPaymentId = razorpay_payment_id || 'mock_payment_id';
      await booking.save();

      return res.json({ 
        message: 'Payment verified successfully (dev mode)', 
        booking 
      });
    }

    // Production mode - verify signature
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    // Update booking
    booking.status = 'confirmed';
    booking.paymentStatus = 'advance-paid';
    booking.razorpayPaymentId = razorpay_payment_id;
    await booking.save();

    res.json({ message: 'Payment verified successfully', booking });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ message: 'Payment verification failed', error: error.message });
  }
});

export default router;