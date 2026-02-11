import express from 'express';
import User from '../models/User.js';
import Equipment from '../models/Equipment.js';
import Booking from '../models/Booking.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// All routes require admin authentication
router.use(authenticate, authorizeRoles('admin'));

// Get platform statistics
router.get('/stats', async (req, res) => {
  try {
    const [users, equipments, bookings] = await Promise.all([
      User.countDocuments(),
      Equipment.countDocuments(),
      Booking.countDocuments()
    ]);

    // Find booking conflicts
    const allBookings = await Booking.find({ 
      status: { $in: ['pending', 'confirmed'] } 
    }).sort({ equipment: 1, startTime: 1 });

    let conflicts = 0;
    for (let i = 0; i < allBookings.length - 1; i++) {
      for (let j = i + 1; j < allBookings.length; j++) {
        const b1 = allBookings[i];
        const b2 = allBookings[j];
        
        if (b1.equipment.toString() === b2.equipment.toString()) {
          if (
            (b1.startTime < b2.endTime && b1.endTime > b2.startTime)
          ) {
            conflicts++;
          }
        }
      }
    }

    res.json({
      users,
      equipments,
      bookings,
      conflicts
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Failed to fetch statistics', error: error.message });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find()
      .select('-__v')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
});

// Get all equipment
router.get('/equipments', async (req, res) => {
  try {
    const equipment = await Equipment.find()
      .populate('owner', 'name phone')
      .sort({ createdAt: -1 });

    res.json(equipment);
  } catch (error) {
    console.error('Get equipment error:', error);
    res.status(500).json({ message: 'Failed to fetch equipment', error: error.message });
  }
});

// Get booking conflicts
router.get('/conflicts', async (req, res) => {
  try {
    const bookings = await Booking.find({ 
      status: { $in: ['pending', 'confirmed'] } 
    })
    .populate('equipment', 'name')
    .populate('farmer', 'name phone')
    .sort({ equipment: 1, startTime: 1 });

    const conflicts = [];
    
    for (let i = 0; i < bookings.length - 1; i++) {
      for (let j = i + 1; j < bookings.length; j++) {
        const b1 = bookings[i];
        const b2 = bookings[j];
        
        if (b1.equipment._id.toString() === b2.equipment._id.toString()) {
          if (b1.startTime < b2.endTime && b1.endTime > b2.startTime) {
            conflicts.push({
              _id: `conflict_${b1._id}_${b2._id}`,
              equipment: b1.equipment.name,
              bookings: [
                {
                  id: b1._id,
                  farmer: b1.farmer.name,
                  start: b1.startTime,
                  end: b1.endTime,
                  status: b1.status
                },
                {
                  id: b2._id,
                  farmer: b2.farmer.name,
                  start: b2.startTime,
                  end: b2.endTime,
                  status: b2.status
                }
              ],
              description: `Overlapping bookings for ${b1.equipment.name}`
            });
          }
        }
      }
    }

    res.json(conflicts);
  } catch (error) {
    console.error('Get conflicts error:', error);
    res.status(500).json({ message: 'Failed to fetch conflicts', error: error.message });
  }
});

// Resolve conflict (cancel a booking)
router.post('/conflicts/resolve', async (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    booking.status = 'cancelled';
    await booking.save();

    res.json({ message: 'Conflict resolved - booking cancelled', booking });
  } catch (error) {
    console.error('Resolve conflict error:', error);
    res.status(500).json({ message: 'Failed to resolve conflict', error: error.message });
  }
});

// Delete user (admin only)
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
});

export default router;