import express from 'express';
import {
  createPaymentOrder,
  verifyPayment,
  getPaymentHistory,
  getPaymentById,
  requestRefund,
} from '../controllers/paymentController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Protected routes
router.post('/create-order', protect, authorize('farmer'), createPaymentOrder);
router.post('/verify', protect, authorize('farmer'), verifyPayment);
router.get('/', protect, getPaymentHistory);
router.get('/:id', protect, getPaymentById);

// Admin only
router.post('/:id/refund', protect, authorize('admin'), requestRefund);

export default router;