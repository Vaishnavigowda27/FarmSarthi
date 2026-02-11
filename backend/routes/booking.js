import express from 'express';
import Booking from '../models/Booking.js';
import Equipment from '../models/Equipment.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Create booking
router.post('/', authenticate, authorizeRoles('farmer'), async (req, res) => {
  try {
    const { equipmentId, startTime, hours } = req.body;

    if (!equipmentId || !startTime || !hours) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Find equipment
    const equipment = await Equipment.findById(equipmentId).populate('owner');
    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }

    if (!equipment.isAvailable) {
      return res.status(400).json({ message: 'Equipment is not available' });
    }

    // Calculate end time
    const start = new Date(startTime);
    const end = new Date(start.getTime() + hours * 60 * 60 * 1000);

    // Check for conflicts
    const conflictingBooking = await Booking.findOne({
      equipment: equipmentId,
      status: { $in: ['pending', 'confirmed', 'in-progress'] },
      $or: [
        { startTime: { $lt: end, $gte: start } },
        { endTime: { $gt: start, $lte: end } },
        { startTime: { $lte: start }, endTime: { $gte: end } }
      ]
    });

    if (conflictingBooking) {
      return res.status(400).json({ 
        message: 'Equipment is already booked for this time slot',
        conflictingBooking: {
          start: conflictingBooking.startTime,
          end: conflictingBooking.endTime
        }
      });
    }

    // Calculate amounts
    const hourlyCharge = equipment.pricePerHour * hours;
    const distanceCharge = 0; // Can be calculated later based on actual distance
    const totalAmount = hourlyCharge + distanceCharge;
    const advanceAmount = Math.round(totalAmount * 0.10); // 10% advance
    const remainingAmount = totalAmount - advanceAmount;

    // Create booking
    const booking = await Booking.create({
      equipment: equipmentId,
      farmer: req.userId,
      startTime: start,
      endTime: end,
      hours,
      totalAmount,
      advanceAmount,
      remainingAmount,
      status: 'pending'
    });

    res.status(201).json({ 
      message: 'Booking created successfully', 
      booking 
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ message: 'Failed to create booking', error: error.message });
  }
});

// Get farmer's bookings
router.get('/my-bookings', authenticate, authorizeRoles('farmer'), async (req, res) => {
  try {
    const bookings = await Booking.find({ farmer: req.userId })
      .populate('equipment')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ message: 'Failed to fetch bookings', error: error.message });
  }
});

// Get renter's bookings
router.get('/renter-bookings', authenticate, authorizeRoles('renter'), async (req, res) => {
  try {
    const equipment = await Equipment.find({ owner: req.userId }).select('_id');
    const equipmentIds = equipment.map(eq => eq._id);

    const bookings = await Booking.find({ equipment: { $in: equipmentIds } })
      .populate('equipment')
      .populate('farmer', 'name phone')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error('Get renter bookings error:', error);
    res.status(500).json({ message: 'Failed to fetch bookings', error: error.message });
  }
});

// Get single booking
router.get('/:id', authenticate, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('equipment')
      .populate('farmer', 'name phone');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check access rights
    const equipment = await Equipment.findById(booking.equipment._id);
    if (
      booking.farmer._id.toString() !== req.userId.toString() &&
      equipment.owner.toString() !== req.userId.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(booking);
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ message: 'Failed to fetch booking', error: error.message });
  }
});

// Cancel booking
router.put('/:id/cancel', authenticate, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.farmer.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (booking.status === 'completed' || booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot cancel this booking' });
    }

    booking.status = 'cancelled';
    await booking.save();

    res.json({ message: 'Booking cancelled successfully', booking });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: 'Failed to cancel booking', error: error.message });
  }
});

// Rate equipment (after booking completion)
router.put('/:id/rate', authenticate, authorizeRoles('farmer'), async (req, res) => {
  try {
    const { rating, review } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.farmer.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({ message: 'Can only rate completed bookings' });
    }

    // Update booking rating
    booking.rating = rating;
    booking.review = review;
    await booking.save();

    // Update equipment rating
    const equipment = await Equipment.findById(booking.equipment);
    const newTotalRatings = equipment.totalRatings + 1;
    const newRating = ((equipment.rating * equipment.totalRatings) + rating) / newTotalRatings;
    
    equipment.rating = newRating;
    equipment.totalRatings = newTotalRatings;
    await equipment.save();

    res.json({ message: 'Rating submitted successfully', booking });
  } catch (error) {
    console.error('Rate booking error:', error);
    res.status(500).json({ message: 'Failed to rate booking', error: error.message });
  }
});

export default router;