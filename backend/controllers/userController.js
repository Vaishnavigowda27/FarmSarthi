import User from '../models/User.js';
import Booking from '../models/Booking.js';
import Equipment from '../models/Equipment.js';

/**
 * @desc    Get user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('equipmentListed')
      .populate({
        path: 'bookingHistory',
        populate: {
          path: 'equipment',
          select: 'name photos',
        },
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
export const updateUserProfile = async (req, res, next) => {
  try {
    const { name, location } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (location) {
      updateData.location = {
        type: 'Point',
        coordinates: location.coordinates,
        address: location.address,
        city: location.city,
        state: location.state,
        pincode: location.pincode,
      };
    }

    const user = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get farmer dashboard data
 * @route   GET /api/users/farmer/dashboard
 * @access  Private (Farmer only)
 */
export const getFarmerDashboard = async (req, res, next) => {
  try {
    // Get all bookings
    const bookings = await Booking.find({ farmer: req.user.id })
      .populate('equipment', 'name photos')
      .populate('renter', 'name phone')
      .sort({ bookingDate: -1 })
      .limit(10);

    // Get statistics
    const totalBookings = await Booking.countDocuments({
      farmer: req.user.id,
    });
    const completedBookings = await Booking.countDocuments({
      farmer: req.user.id,
      status: 'completed',
    });
    const upcomingBookings = await Booking.countDocuments({
      farmer: req.user.id,
      status: 'confirmed',
      bookingDate: { $gte: new Date() },
    });

    // Get user data
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      dashboard: {
        user: {
          name: user.name,
          phone: user.phone,
          totalSpent: user.totalSpent,
          averageRating: user.averageRating,
        },
        statistics: {
          totalBookings,
          completedBookings,
          upcomingBookings,
        },
        recentBookings: bookings,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get renter dashboard data
 * @route   GET /api/users/renter/dashboard
 * @access  Private (Renter only)
 */
export const getRenterDashboard = async (req, res, next) => {
  try {
    // Get all equipment
    const equipment = await Equipment.find({ owner: req.user.id }).sort({
      createdAt: -1,
    });

    // Get recent bookings for renter's equipment
    const bookings = await Booking.find({ renter: req.user.id })
      .populate('equipment', 'name')
      .populate('farmer', 'name phone')
      .sort({ bookingDate: -1 })
      .limit(10);

    // Get statistics
    const totalEquipment = equipment.length;
    const activeEquipment = equipment.filter((e) => e.isActive).length;
    const totalBookings = await Booking.countDocuments({
      renter: req.user.id,
    });
    const upcomingBookings = await Booking.countDocuments({
      renter: req.user.id,
      status: 'confirmed',
      bookingDate: { $gte: new Date() },
    });

    // Get user data
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      dashboard: {
        user: {
          name: user.name,
          phone: user.phone,
          totalEarnings: user.totalEarnings,
          averageRating: user.averageRating,
        },
        statistics: {
          totalEquipment,
          activeEquipment,
          totalBookings,
          upcomingBookings,
        },
        equipment,
        recentBookings: bookings,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all users (Admin only)
 * @route   GET /api/users
 * @access  Private (Admin only)
 */
export const getAllUsers = async (req, res, next) => {
  try {
    const { role, isActive, page = 1, limit = 20 } = req.query;

    let query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const users = await User.find(query)
      .select('-__v')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Deactivate/Activate user (Admin only)
 * @route   PUT /api/users/:id/toggle-status
 * @access  Private (Admin only)
 */
export const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      user,
    });
  } catch (error) {
    next(error);
  }
};