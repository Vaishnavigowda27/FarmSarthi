import Payment from '../models/Payment.js';
import Booking from '../models/Booking.js';
import Equipment from '../models/Equipment.js';
import User from '../models/User.js';
import {
  createOrder,
  verifyPaymentSignature,
  getPaymentDetails,
  initiateRefund,
} from '../utils/razorpayService.js';
import { sendPaymentNotification, sendBookingConfirmation } from '../utils/notificationService.js';

/**
 * @desc    Create payment order for booking
 * @route   POST /api/payments/create-order
 * @access  Private (Farmer only)
 */
export const createPaymentOrder = async (req, res, next) => {
  try {
    const { bookingId, paymentType } = req.body;

    if (!bookingId || !paymentType) {
      return res.status(400).json({
        success: false,
        message: 'Please provide booking ID and payment type',
      });
    }

    // Get booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Verify user is the farmer
    if (booking.farmer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    // Determine amount based on payment type
    let amount;
    if (paymentType === 'advance') {
      if (booking.paymentStatus.advance) {
        return res.status(400).json({
          success: false,
          message: 'Advance payment already completed',
        });
      }
      amount = booking.pricing.advancePayment;
    } else if (paymentType === 'full') {
      if (booking.paymentStatus.full) {
        return res.status(400).json({
          success: false,
          message: 'Full payment already completed',
        });
      }
      amount = booking.pricing.remainingPayment;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment type',
      });
    }

    // Create Razorpay order
    const orderResult = await createOrder(
      amount,
      `booking_${bookingId}`,
      {
        bookingId: bookingId,
        paymentType: paymentType,
        farmerId: req.user.id,
      }
    );

    if (!orderResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create payment order',
      });
    }

    // Create payment record
    const payment = await Payment.create({
      booking: bookingId,
      farmer: booking.farmer,
      renter: booking.renter,
      amount: amount,
      paymentType: paymentType,
      paymentMethod: 'razorpay',
      razorpay: {
        orderId: orderResult.order.id,
      },
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Payment order created successfully',
      order: orderResult.order,
      payment: payment,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify payment and update booking
 * @route   POST /api/payments/verify
 * @access  Private (Farmer only)
 */
export const verifyPayment = async (req, res, next) => {
  try {
    const { orderId, paymentId, signature, bookingId, paymentType } = req.body;

    if (!orderId || !paymentId || !signature || !bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment verification parameters',
      });
    }

    // Verify signature
    const isValid = verifyPaymentSignature(orderId, paymentId, signature);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature',
      });
    }

    // Update payment record
    const payment = await Payment.findOneAndUpdate(
      { 'razorpay.orderId': orderId },
      {
        'razorpay.paymentId': paymentId,
        'razorpay.signature': signature,
        status: 'completed',
        transactionDate: Date.now(),
      },
      { new: true }
    );

    // Update booking
    const booking = await Booking.findById(bookingId);
    
    if (paymentType === 'advance') {
      booking.paymentStatus.advance = true;
      booking.paymentStatus.advancePaymentId = paymentId;
      booking.status = 'confirmed';
    } else if (paymentType === 'full') {
      booking.paymentStatus.full = true;
      booking.paymentStatus.fullPaymentId = paymentId;
    }

    await booking.save();

    // Full confirmation flow for advance payment: update equipment schedule, user history, notifications
    if (paymentType === 'advance') {
      const equipment = await Equipment.findById(booking.equipment);
      let scheduleEntry = equipment.availability.schedule.find(
        (entry) =>
          new Date(entry.date).toDateString() ===
          new Date(booking.bookingDate).toDateString()
      );

      if (!scheduleEntry) {
        equipment.availability.schedule.push({
          date: booking.bookingDate,
          slots: [
            {
              startTime: booking.timeSlot.startTime,
              endTime: booking.timeSlot.endTime,
              isBooked: true,
              bookingId: booking._id,
            },
          ],
        });
      } else {
        scheduleEntry.slots.push({
          startTime: booking.timeSlot.startTime,
          endTime: booking.timeSlot.endTime,
          isBooked: true,
          bookingId: booking._id,
        });
      }
      await equipment.save();

      await User.findByIdAndUpdate(booking.farmer, {
        $push: { bookingHistory: booking._id },
        $inc: { totalSpent: payment.amount },
      });
      await User.findByIdAndUpdate(booking.renter, {
        $inc: { totalEarnings: payment.amount },
      });

      await sendBookingConfirmation(booking);
    } else {
      await User.findByIdAndUpdate(booking.farmer, {
        $inc: { totalSpent: payment.amount },
      });
      await User.findByIdAndUpdate(booking.renter, {
        $inc: { totalEarnings: payment.amount },
      });
      await sendPaymentNotification(payment, 'received');
    }

    res.status(200).json({
      success: true,
      message: paymentType === 'advance' ? 'Payment verified and booking confirmed' : 'Payment verified successfully',
      payment,
      booking: paymentType === 'advance' ? await Booking.findById(bookingId).populate('equipment farmer renter') : undefined,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get payment history
 * @route   GET /api/payments
 * @access  Private
 */
export const getPaymentHistory = async (req, res, next) => {
  try {
    let query = {};

    if (req.user.role === 'farmer') {
      query.farmer = req.user.id;
    } else if (req.user.role === 'renter') {
      query.renter = req.user.id;
    }

    const payments = await Payment.find(query)
      .populate('booking')
      .populate('farmer', 'name phone')
      .populate('renter', 'name phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      payments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single payment details
 * @route   GET /api/payments/:id
 * @access  Private
 */
export const getPaymentById = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('booking')
      .populate('farmer', 'name phone')
      .populate('renter', 'name phone');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    // Check authorization
    if (
      payment.farmer.toString() !== req.user.id &&
      payment.renter.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this payment',
      });
    }

    res.status(200).json({
      success: true,
      payment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Request refund (Admin only)
 * @route   POST /api/payments/:id/refund
 * @access  Private (Admin only)
 */
export const requestRefund = async (req, res, next) => {
  try {
    const { amount, reason } = req.body;

    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only refund completed payments',
      });
    }

    // Initiate refund
    const refundResult = await initiateRefund(
      payment.razorpay.paymentId,
      amount,
      { reason }
    );

    if (!refundResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to initiate refund',
      });
    }

    // Update payment status
    payment.status = 'refunded';
    await payment.save();

    res.status(200).json({
      success: true,
      message: 'Refund initiated successfully',
      refund: refundResult.refund,
    });
  } catch (error) {
    next(error);
  }
};