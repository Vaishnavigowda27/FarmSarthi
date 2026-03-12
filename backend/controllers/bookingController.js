import Booking from '../models/Booking.js';
import Equipment from '../models/Equipment.js';
import User from '../models/User.js';
import { calculateDistance, findNearbyUsers } from '../utils/distanceCalculator.js';
import { calculateAdvancePayment } from '../utils/razorpayService.js';
import {
  sendBookingConfirmation,
  sendCancellationNotification,
  sendEquipmentOnRollNearbyNotification,
} from '../utils/notificationService.js';

/**
 * @desc    Create a new booking (with HOLD status)
 * @route   POST /api/bookings
 * @access  Private (Farmer only)
 */
export const createBooking = async (req, res, next) => {
  try {
    const { equipmentId, bookingDate, timeSlot, pickupLocation } = req.body;

    // Validate required fields
    if (!equipmentId || !bookingDate || !timeSlot || !pickupLocation) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    // Get equipment
    const equipment = await Equipment.findById(equipmentId);
    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found',
      });
    }

    if (!equipment.isActive || !equipment.availability.isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Equipment is not available for booking',
      });
    }

    // Normalize date to start of day for consistent matching
    const requestedDate = new Date(bookingDate);
    requestedDate.setHours(0, 0, 0, 0);

    // Check for conflicts (overlapping time slots on same date)
    const existingBooking = await Booking.findOne({
      equipment: equipmentId,
      bookingDate: requestedDate,
      status: { $in: ['hold', 'confirmed', 'ongoing'] },
      'timeSlot.startTime': { $lte: timeSlot.endTime },
      'timeSlot.endTime': { $gte: timeSlot.startTime },
    });

    if (existingBooking) {
      return res.status(409).json({
        success: false,
        message: 'Time slot is already booked or on hold',
      });
    }

    // Calculate distance
    const distance = calculateDistance(
      equipment.location.coordinates[1],
      equipment.location.coordinates[0],
      pickupLocation.coordinates[1],
      pickupLocation.coordinates[0]
    );

    // Calculate pricing
    const duration = calculateDuration(timeSlot.startTime, timeSlot.endTime);
    const totalHoursCost = equipment.pricing.perHour * duration;
    const totalDistanceCost = equipment.pricing.perKm * distance;
    const totalCost = totalHoursCost + totalDistanceCost;
    const advancePayment = calculateAdvancePayment(totalCost);
    const remainingPayment = totalCost - advancePayment;

    // Create booking with HOLD status
    const booking = await Booking.create({
      equipment: equipmentId,
      farmer: req.user.id,
      renter: equipment.owner,
      bookingDate: requestedDate,
      timeSlot: {
        startTime: timeSlot.startTime,
        endTime: timeSlot.endTime,
        duration,
      },
      pickupLocation: {
        type: 'Point',
        coordinates: pickupLocation.coordinates,
        address: pickupLocation.address,
      },
      distance,
      pricing: {
        hourlyRate: equipment.pricing.perHour,
        perKmRate: equipment.pricing.perKm,
        totalHoursCost,
        totalDistanceCost,
        totalCost,
        advancePayment,
        remainingPayment,
      },
      status: 'hold', // Temporary hold until payment
    });

    // Populate booking details
    await booking.populate('equipment farmer renter');

    res.status(201).json({
      success: true,
      message:
        'Booking created with hold status. Please complete payment within 15 minutes.',
      booking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Confirm booking after successful payment
 * @route   PUT /api/bookings/:id/confirm
 * @access  Private (Farmer only)
 */
export const confirmBooking = async (req, res, next) => {
  try {
    const { paymentId } = req.body;

    let booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Check if user is the farmer who made the booking
    if (booking.farmer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to confirm this booking',
      });
    }

    if (booking.status !== 'hold') {
      return res.status(400).json({
        success: false,
        message: 'Booking is not in hold status',
      });
    }

    // Update booking status
    booking.status = 'confirmed';
    booking.paymentStatus.advance = true;
    booking.paymentStatus.advancePaymentId = paymentId;
    await booking.save();

    // Update equipment availability
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

    // Add to user's booking history
    await User.findByIdAndUpdate(req.user.id, {
      $push: { bookingHistory: booking._id },
    });

    // Send notifications
    await sendBookingConfirmation(booking);

    // Proximity notification: other nearby farmers around pickup location
    try {
      const farmers = await User.find({
        role: 'farmer',
        isActive: true,
        _id: { $ne: req.user.id }, // exclude the booking farmer
        'location.coordinates': { $exists: true, $ne: [] },
      }).select('location');

      const nearbyFarmers = findNearbyUsers(
        { coordinates: booking.pickupLocation.coordinates },
        farmers,
        parseInt(process.env.PROXIMITY_RADIUS_KM) || 10
      );

      if (nearbyFarmers.length > 0) {
        await sendEquipmentOnRollNearbyNotification(equipment, booking, nearbyFarmers);
      }
    } catch (notifErr) {
      console.warn('On-roll proximity notification skipped:', notifErr.message);
    }

    // Populate and return
    await booking.populate('equipment farmer renter');

    res.status(200).json({
      success: true,
      message: 'Booking confirmed successfully',
      booking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all bookings (with filters)
 * @route   GET /api/bookings
 * @access  Private
 */
export const getAllBookings = async (req, res, next) => {
  try {
    const { status, role } = req.query;

    let query = {};

    // Filter by role
    if (req.user.role === 'farmer') {
      query.farmer = req.user.id;
    } else if (req.user.role === 'renter') {
      query.renter = req.user.id;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate('equipment')
      .populate('farmer', 'name phone location')
      .populate('renter', 'name phone')
      .sort({ bookingDate: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single booking by ID
 * @route   GET /api/bookings/:id
 * @access  Private
 */
export const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('equipment')
      .populate('farmer', 'name phone location')
      .populate('renter', 'name phone')
      .populate('review');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Check authorization
    if (
      booking.farmer.toString() !== req.user.id &&
      booking.renter.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking',
      });
    }

    res.status(200).json({
      success: true,
      booking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel booking
 * @route   PUT /api/bookings/:id/cancel
 * @access  Private
 */
export const cancelBooking = async (req, res, next) => {
  try {
    const { reason } = req.body;

    let booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Check if user can cancel
    if (
      booking.farmer.toString() !== req.user.id &&
      booking.renter.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking',
      });
    }

    // Can't cancel completed bookings
    if (booking.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed booking',
      });
    }

    // Cancellation policy: No refund of advance payment
    booking.status = 'cancelled';
    booking.cancellation = {
      isCancelled: true,
      cancelledBy: req.user.id,
      cancelledAt: Date.now(),
      reason,
      refundAmount: 0, // As per policy, no refund
    };

    await booking.save();

    // Update equipment availability
    const equipment = await Equipment.findById(booking.equipment);
    const scheduleEntry = equipment.availability.schedule.find(
      (entry) =>
        new Date(entry.date).toDateString() ===
        new Date(booking.bookingDate).toDateString()
    );

    if (scheduleEntry) {
      scheduleEntry.slots = scheduleEntry.slots.filter(
        (slot) => slot.bookingId?.toString() !== booking._id.toString()
      );
      await equipment.save();
    }

    // Send cancellation notifications
    await sendCancellationNotification(booking, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      booking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update booking status
 * @route   PUT /api/bookings/:id/status
 * @access  Private (Renter only)
 */
export const updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const validStatuses = ['ongoing', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }

    let booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Only renter can update status
    if (booking.renter.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update booking status',
      });
    }

    booking.status = status;
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking status updated successfully',
      booking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper function to calculate duration in hours
 */
function calculateDuration(startTime, endTime) {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  return (endMinutes - startMinutes) / 60;
}