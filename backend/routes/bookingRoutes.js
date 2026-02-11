import express from 'express';
import {
  createBooking,
  confirmBooking,
  getAllBookings,
  getBookingById,
  cancelBooking,
  updateBookingStatus,
} from '../controllers/bookingController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Protected routes
router.post('/', protect, authorize('farmer'), createBooking);
router.put('/:id/confirm', protect, authorize('farmer'), confirmBooking);
router.get('/', protect, getAllBookings);
router.get('/:id', protect, getBookingById);
router.put('/:id/cancel', protect, cancelBooking);
router.put('/:id/status', protect, authorize('renter'), updateBookingStatus);

export default router;