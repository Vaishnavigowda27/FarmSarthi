import express from 'express';
import {
  sendOTPController,
  resendOTPController,
  register,
  login,
  getMe,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/send-otp', sendOTPController);
router.post('/resend-otp', resendOTPController);
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', protect, getMe);

export default router;