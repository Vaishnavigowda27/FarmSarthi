import express from 'express';
import {
  addEquipment,
  getAllEquipment,
  getEquipmentById,
  updateEquipment,
  deleteEquipment,
  getEquipmentAvailability,
  getRenterEquipment,
} from '../controllers/equipmentController.js';
import { protect, authorize } from '../middleware/auth.js';
import { uploadMultiple, optionalUpload } from '../middleware/upload.js';

const router = express.Router();

// Public routes
router.get('/', getAllEquipment);
router.get('/:id', getEquipmentById);
router.get('/:id/availability', getEquipmentAvailability);

// Protected routes - Renter only (optionalUpload: parses files only for multipart, allows JSON)
router.post('/', protect, authorize('renter'), optionalUpload, addEquipment);
router.put('/:id', protect, authorize('renter'), optionalUpload, updateEquipment);
router.delete('/:id', protect, authorize('renter'), deleteEquipment);
router.get('/renter/my-equipment', protect, authorize('renter'), getRenterEquipment);

export default router;