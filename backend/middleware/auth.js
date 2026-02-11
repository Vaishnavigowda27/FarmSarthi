import express from 'express';
import {
  createReview,
  getEquipmentReviews,
  getFarmerReviews,
  getRenterReviews,
  respondToReview,
  deleteReview,
} from '../controllers/reviewController.js';
import { protect, authorize } from '../middleware/auth.js';
import { uploadMultiple } from '../middleware/upload.js';

const router = express.Router();

// Public routes
router.get('/equipment/:equipmentId', getEquipmentReviews);

// Protected routes - Farmer
router.post('/', protect, authorize('farmer'), uploadMultiple, createReview);
router.get('/farmer/my-reviews', protect, authorize('farmer'), getFarmerReviews);

// Protected routes - Renter
router.get('/renter/received', protect, authorize('renter'), getRenterReviews);
router.put('/:id/respond', protect, authorize('renter'), respondToReview);

// Admin only
router.delete('/:id', protect, authorize('admin'), deleteReview);

export default router;