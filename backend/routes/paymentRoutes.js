import express from 'express';
import { confirmPayment, getPaymentHistory, getPaymentById, requestRefund } from '../controllers/paymentController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/confirm', protect, authorize('farmer'), confirmPayment);
router.get('/', protect, getPaymentHistory);
router.get('/:id', protect, getPaymentById);
router.post('/:id/refund', protect, authorize('admin'), requestRefund);

export default router;