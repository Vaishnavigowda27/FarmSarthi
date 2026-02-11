import Review from '../models/Review.js';
import Booking from '../models/Booking.js';
import Equipment from '../models/Equipment.js';
import User from '../models/User.js';
import { sendReviewNotification } from '../utils/notificationService.js';

/**
 * @desc    Create a review after booking completion
 * @route   POST /api/reviews
 * @access  Private (Farmer only)
 */
export const createReview = async (req, res, next) => {
  try {
    const {
      bookingId,
      rating,
      comment,
      serviceQuality,
      equipmentCondition,
      valueForMoney,
    } = req.body;

    if (!bookingId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Please provide booking ID and rating',
      });
    }

    // Get booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Verify user is the farmer who made the booking
    if (booking.farmer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to review this booking',
      });
    }

    // Check if booking is completed
    if (booking.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only review completed bookings',
      });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ booking: bookingId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'Review already submitted for this booking',
      });
    }

    // Handle photos if uploaded
    const photos = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        photos.push({
          url: `/uploads/${file.filename}`,
          publicId: file.filename,
        });
      });
    }

    // Create review
    const review = await Review.create({
      booking: bookingId,
      equipment: booking.equipment,
      farmer: req.user.id,
      renter: booking.renter,
      rating,
      comment,
      serviceQuality,
      equipmentCondition,
      valueForMoney,
      photos,
      isVerified: true,
    });

    // Update booking with review reference
    booking.review = review._id;
    await booking.save();

    // Update equipment rating
    const equipment = await Equipment.findById(booking.equipment);
    const allReviews = await Review.find({ equipment: equipment._id });
    const avgRating =
      allReviews.reduce((sum, rev) => sum + rev.rating, 0) /
      allReviews.length;
    
    equipment.averageRating = avgRating;
    equipment.totalReviews = allReviews.length;
    equipment.totalBookings += 1;
    await equipment.save();

    // Update renter rating
    const renter = await User.findById(booking.renter);
    const renterReviews = await Review.find({ renter: renter._id });
    const renterAvgRating =
      renterReviews.reduce((sum, rev) => sum + rev.rating, 0) /
      renterReviews.length;
    
    renter.averageRating = renterAvgRating;
    renter.totalReviews = renterReviews.length;
    await renter.save();

    // Send notification to renter
    await sendReviewNotification(review);

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get reviews for an equipment
 * @route   GET /api/reviews/equipment/:equipmentId
 * @access  Public
 */
export const getEquipmentReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const reviews = await Review.find({
      equipment: req.params.equipmentId,
      isVerified: true,
    })
      .populate('farmer', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Review.countDocuments({
      equipment: req.params.equipmentId,
      isVerified: true,
    });

    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get reviews by farmer
 * @route   GET /api/reviews/farmer/my-reviews
 * @access  Private (Farmer only)
 */
export const getFarmerReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ farmer: req.user.id })
      .populate('equipment', 'name photos')
      .populate('renter', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get reviews for renter's equipment
 * @route   GET /api/reviews/renter/received
 * @access  Private (Renter only)
 */
export const getRenterReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ renter: req.user.id })
      .populate('equipment', 'name photos')
      .populate('farmer', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Renter responds to a review
 * @route   PUT /api/reviews/:id/respond
 * @access  Private (Renter only)
 */
export const respondToReview = async (req, res, next) => {
  try {
    const { comment } = req.body;

    if (!comment) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a response comment',
      });
    }

    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    // Verify user is the renter
    if (review.renter.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to respond to this review',
      });
    }

    review.renterResponse = {
      comment,
      respondedAt: Date.now(),
    };

    await review.save();

    res.status(200).json({
      success: true,
      message: 'Response added successfully',
      review,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete review (Admin only)
 * @route   DELETE /api/reviews/:id
 * @access  Private (Admin only)
 */
export const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    await review.deleteOne();

    // Recalculate equipment and renter ratings
    const equipment = await Equipment.findById(review.equipment);
    const allReviews = await Review.find({ equipment: equipment._id });
    
    if (allReviews.length > 0) {
      const avgRating =
        allReviews.reduce((sum, rev) => sum + rev.rating, 0) /
        allReviews.length;
      equipment.averageRating = avgRating;
      equipment.totalReviews = allReviews.length;
    } else {
      equipment.averageRating = 0;
      equipment.totalReviews = 0;
    }
    
    await equipment.save();

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};