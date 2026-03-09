import express from 'express';
import {
  addEquipment,
  getAllEquipment,
  getEquipmentById,
  updateEquipment,
  deleteEquipment,
  getEquipmentAvailability,
  getRenterEquipment,
  markEquipmentArrived,
} from '../controllers/equipmentController.js';
import { protect, authorize } from '../middleware/auth.js';
import { uploadMultiple, optionalUpload } from '../middleware/upload.js';

const router = express.Router();

// Public routes (specific routes before :id to avoid conflicts)
router.get('/', getAllEquipment);
router.get('/renter/my-equipment', protect, authorize('renter'), getRenterEquipment);
router.get('/:id', getEquipmentById);
router.get('/:id/availability', getEquipmentAvailability);

// Protected routes - Renter only (optionalUpload: parses files only for multipart, allows JSON)
router.post('/', protect, authorize('renter'), optionalUpload, addEquipment);
router.put('/:id', protect, authorize('renter'), optionalUpload, updateEquipment);
router.delete('/:id', protect, authorize('renter'), deleteEquipment);
router.post('/:id/arrived', protect, authorize('renter'), markEquipmentArrived);

export default router;