import express from 'express';
import {
  getUserProfile,
  updateUserProfile,
  getFarmerDashboard,
  getRenterDashboard,
  getAllUsers,
  toggleUserStatus,
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All user routes require auth
router.use(protect);

router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);

router.get('/farmer/dashboard', authorize('farmer'), getFarmerDashboard);
router.get('/renter/dashboard', authorize('renter'), getRenterDashboard);

// Admin-only user management
router.get('/', authorize('admin'), getAllUsers);
router.put('/:id/toggle-status', authorize('admin'), toggleUserStatus);

export default router;