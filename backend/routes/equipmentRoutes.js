import express from 'express';
import Equipment from '../models/Equipment.js';
import User from '../models/User.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';
import { calculateDistance } from '../utils/distanceCalculator.js';

const router = express.Router();

// Get nearby equipment (within 10km)
router.get('/nearby', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const [userLng, userLat] = user.location.coordinates;

    // Find equipment within 10km
    const equipment = await Equipment.find({
      isAvailable: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: user.location.coordinates
          },
          $maxDistance: 10000 // 10km in meters
        }
      }
    }).populate('owner', 'name phone');

    // Add distance to each equipment
    const equipmentWithDistance = equipment.map(eq => {
      const [eqLng, eqLat] = eq.location.coordinates;
      const distance = calculateDistance(userLat, userLng, eqLat, eqLng);
      
      return {
        ...eq.toObject(),
        distance
      };
    });

    res.json(equipmentWithDistance);
  } catch (error) {
    console.error('Get nearby equipment error:', error);
    res.status(500).json({ message: 'Failed to fetch equipment', error: error.message });
  }
});

// Get renter's own equipment
router.get('/my-equipments', authenticate, authorizeRoles('renter'), async (req, res) => {
  try {
    const equipment = await Equipment.find({ owner: req.userId })
      .sort({ createdAt: -1 });

    res.json(equipment);
  } catch (error) {
    console.error('Get my equipment error:', error);
    res.status(500).json({ message: 'Failed to fetch equipment', error: error.message });
  }
});

// Add new equipment
router.post('/', authenticate, authorizeRoles('renter'), async (req, res) => {
  try {
    const { name, description, pricePerHour, pricePerKm, advancePayment, photos } = req.body;

    if (!name || !description || !pricePerHour || !pricePerKm || !advancePayment) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Get owner's location
    const owner = await User.findById(req.userId);

    const equipment = await Equipment.create({
      name,
      description,
      pricePerHour,
      pricePerKm,
      advancePayment,
      photos: photos || [],
      owner: req.userId,
      location: owner.location
    });

    res.status(201).json({ 
      message: 'Equipment added successfully', 
      equipment 
    });
  } catch (error) {
    console.error('Add equipment error:', error);
    res.status(500).json({ message: 'Failed to add equipment', error: error.message });
  }
});

// Update equipment
router.put('/:id', authenticate, authorizeRoles('renter'), async (req, res) => {
  try {
    const equipment = await Equipment.findOne({ 
      _id: req.params.id, 
      owner: req.userId 
    });

    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }

    const { name, description, pricePerHour, pricePerKm, advancePayment, isAvailable } = req.body;

    if (name) equipment.name = name;
    if (description) equipment.description = description;
    if (pricePerHour) equipment.pricePerHour = pricePerHour;
    if (pricePerKm) equipment.pricePerKm = pricePerKm;
    if (advancePayment) equipment.advancePayment = advancePayment;
    if (typeof isAvailable !== 'undefined') equipment.isAvailable = isAvailable;

    await equipment.save();

    res.json({ message: 'Equipment updated successfully', equipment });
  } catch (error) {
    console.error('Update equipment error:', error);
    res.status(500).json({ message: 'Failed to update equipment', error: error.message });
  }
});

// Delete equipment
router.delete('/:id', authenticate, authorizeRoles('renter'), async (req, res) => {
  try {
    const equipment = await Equipment.findOneAndDelete({ 
      _id: req.params.id, 
      owner: req.userId 
    });

    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }

    res.json({ message: 'Equipment deleted successfully' });
  } catch (error) {
    console.error('Delete equipment error:', error);
    res.status(500).json({ message: 'Failed to delete equipment', error: error.message });
  }
});

export default router;