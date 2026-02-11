import User from '../models/User.js';
import Equipment from '../models/Equipment.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import Review from '../models/Review.js';

/**
 * @desc    Get admin dashboard statistics
 * @route   GET /api/admin/dashboard
 * @access  Private (Admin only)
 */
export const getAdminDashboard = async (req, res, next) => {
  try {
    // User statistics
    const totalUsers = await User.countDocuments();
    const totalFarmers = await User.countDocuments({ role: 'farmer' });
    const totalRenters = await User.countDocuments({ role: 'renter' });
    const activeUsers = await User.countDocuments({ isActive: true });

    // Equipment statistics
    const totalEquipment = await Equipment.countDocuments();
    const activeEquipment = await Equipment.countDocuments({ isActive: true });
    const pendingVerification = await Equipment.countDocuments({
      verificationStatus: 'pending',
    });

    // Booking statistics
    const totalBookings = await Booking.countDocuments();
    const confirmedBookings = await Booking.countDocuments({
      status: 'confirmed',
    });
    const completedBookings = await Booking.countDocuments({
      status: 'completed',
    });
    const cancelledBookings = await Booking.countDocuments({
      status: 'cancelled',
    });
    const disputedBookings = await Booking.countDocuments({
      status: 'disputed',
    });

    // Revenue statistics
    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    // Recent activities
    const recentBookings = await Booking.find()
      .populate('farmer', 'name phone')
      .populate('renter', 'name phone')
      .populate('equipment', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    const recentUsers = await User.find()
      .select('name phone role createdAt')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      dashboard: {
        statistics: {
          users: {
            total: totalUsers,
            farmers: totalFarmers,
            renters: totalRenters,
            active: activeUsers,
          },
          equipment: {
            total: totalEquipment,
            active: activeEquipment,
            pendingVerification,
          },
          bookings: {
            total: totalBookings,
            confirmed: confirmedBookings,
            completed: completedBookings,
            cancelled: cancelledBookings,
            disputed: disputedBookings,
          },
          revenue: {
            total: totalRevenue[0]?.total || 0,
          },
        },
        recentActivities: {
          bookings: recentBookings,
          users: recentUsers,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all conflicts/disputes
 * @route   GET /api/admin/conflicts
 * @access  Private (Admin only)
 */
export const getConflicts = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    let query = {
      $or: [
        { status: 'disputed' },
        { 'conflictResolution.hasConflict': true },
      ],
    };

    const conflicts = await Booking.find(query)
      .populate('farmer', 'name phone')
      .populate('renter', 'name phone')
      .populate('equipment', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Booking.countDocuments(query);

    res.status(200).json({
      success: true,
      count: conflicts.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      conflicts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Resolve a conflict
 * @route   PUT /api/admin/conflicts/:id/resolve
 * @access  Private (Admin only)
 */
export const resolveConflict = async (req, res, next) => {
  try {
    const { resolution, status } = req.body;

    if (!resolution || !status) {
      return res.status(400).json({
        success: false,
        message: 'Please provide resolution details and status',
      });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    booking.conflictResolution = {
      hasConflict: false,
      conflictReason: booking.conflictResolution?.conflictReason || '',
      resolvedBy: req.user.id,
      resolvedAt: Date.now(),
      resolution,
    };

    booking.status = status; // e.g., 'completed', 'cancelled'

    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Conflict resolved successfully',
      booking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify equipment
 * @route   PUT /api/admin/equipment/:id/verify
 * @access  Private (Admin only)
 */
export const verifyEquipment = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification status',
      });
    }

    const equipment = await Equipment.findByIdAndUpdate(
      req.params.id,
      { verificationStatus: status },
      { new: true }
    );

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found',
      });
    }

    res.status(200).json({
      success: true,
      message: `Equipment ${status} successfully`,
      equipment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all equipment pending verification
 * @route   GET /api/admin/equipment/pending
 * @access  Private (Admin only)
 */
export const getPendingEquipment = async (req, res, next) => {
  try {
    const equipment = await Equipment.find({
      verificationStatus: 'pending',
    })
      .populate('owner', 'name phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: equipment.length,
      equipment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get platform analytics
 * @route   GET /api/admin/analytics
 * @access  Private (Admin only)
 */
export const getAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      };
    }

    // Bookings over time
    const bookingsOverTime = await Booking.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
          totalRevenue: { $sum: '$pricing.totalCost' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Popular equipment categories
    const popularCategories = await Equipment.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Top rated equipment
    const topRatedEquipment = await Equipment.find()
      .select('name category averageRating totalReviews')
      .sort({ averageRating: -1, totalReviews: -1 })
      .limit(10);

    // Top renters by earnings
    const topRenters = await User.find({ role: 'renter' })
      .select('name phone totalEarnings averageRating')
      .sort({ totalEarnings: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      analytics: {
        bookingsOverTime,
        popularCategories,
        topRatedEquipment,
        topRenters,
      },
    });
  } catch (error) {
    next(error);
  }
};