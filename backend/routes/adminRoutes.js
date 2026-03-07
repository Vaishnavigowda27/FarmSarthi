import express from 'express';
import {
  getAdminDashboard,
  getConflicts,
  resolveConflict,
  verifyEquipment,
  getPendingEquipment,
  getAnalytics,
  getAllUsers,
  getAllEquipments,
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require admin role
router.use(protect, authorize('admin'));

router.get('/dashboard', getAdminDashboard);
router.get('/users', getAllUsers);
router.get('/equipments', getAllEquipments);
router.get('/equipment/pending', getPendingEquipment);
router.put('/equipment/:id/verify', verifyEquipment);
router.get('/conflicts', getConflicts);
router.put('/conflicts/:id/resolve', resolveConflict);
router.get('/analytics', getAnalytics);

export default router;
