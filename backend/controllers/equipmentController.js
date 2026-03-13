import Equipment from '../models/Equipment.js';
import User from '../models/User.js';
import Booking from '../models/Booking.js';
import { findNearbyEquipment, findNearbyUsers } from '../utils/distanceCalculator.js';
import { sendProximityNotification, sendEquipmentArrivalNotification } from '../utils/notificationService.js';

/**
 * @desc    Add new equipment
 * @route   POST /api/equipment
 * @access  Private (Renter only)
 */
export const addEquipment = async (req, res, next) => {
  try {
    let { name, description, category, pricing, location, specifications, totalUnits } = req.body;

    // Parse if sent as JSON strings (from FormData)
    if (typeof pricing === 'string') pricing = JSON.parse(pricing);
    if (typeof location === 'string') location = JSON.parse(location);
    if (typeof specifications === 'string' && specifications) specifications = JSON.parse(specifications);
    const units = Math.max(1, parseInt(totalUnits) || 1);

    // Validate required fields
    if (!name || !description || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, description, and category',
      });
    }

    // Validate and parse pricing
    const perHour = parseFloat(pricing?.perHour ?? pricing?.per_hour ?? 0);
    const perKm = parseFloat(pricing?.perKm ?? pricing?.per_km ?? 0);
    if (isNaN(perHour) || perHour < 0 || isNaN(perKm) || perKm < 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid pricing (perHour and perKm must be numbers ≥ 0)',
      });
    }

    // Validate location / use default
    const coords = location?.coordinates || [76.6394, 12.2958];
    const address = location?.address || 'Mysore, Karnataka';

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

    // Map specifications (brand -> make for schema compatibility)
    const specs = specifications ? {
      make: specifications.brand || specifications.make,
      model: specifications.model,
      year: specifications.year,
      horsepower: specifications.horsepower,
      capacity: specifications.capacity,
    } : {};

    // Create equipment
    const equipment = await Equipment.create({
      owner: req.user.id,
      name,
      description,
      category,
      photos,
      totalUnits: units,
      pricing: {
        perHour,
        perKm,
      },
      location: {
        type: 'Point',
        coordinates: coords,
        address,
        city: location?.city,
        state: location?.state,
      },
      specifications: specs,
      availability: {
        isAvailable: true,
        schedule: [],
      },
    });

    // Add equipment to user's listed equipment
    await User.findByIdAndUpdate(req.user.id, {
      $push: { equipmentListed: equipment._id },
    });

    // Notify nearby farmers (within radius) - don't fail add if notification fails
    try {
      const farmers = await User.find({
        role: 'farmer',
        isActive: true,
        'location.coordinates': { $exists: true, $ne: [] },
      }).select('location');
      const nearbyFarmers = findNearbyUsers(
        { coordinates: coords },
        farmers,
        parseInt(process.env.PROXIMITY_RADIUS_KM) || 10
      );
      if (nearbyFarmers.length > 0) {
        await sendProximityNotification(equipment, nearbyFarmers);
      }
    } catch (notifErr) {
      console.warn('Proximity notification skipped:', notifErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Equipment added successfully',
      equipment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all equipment with filters and location-based search
 * @route   GET /api/equipment
 * @access  Public
 */
export const getAllEquipment = async (req, res, next) => {
  try {
    const {
      latitude,
      longitude,
      radius = 10,
      category,
      minPrice,
      maxPrice,
      isAvailable,
      owner,
      verifiedOnly,
      page = 1,
      limit = 10,
    } = req.query;

    let query = { isActive: true };

    // Filter by owner (for renter's equipment)
    if (owner) {
      query.owner = owner;
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by availability
    if (isAvailable === 'true') {
      query['availability.isAvailable'] = true;
    }

    // Filter by verification status (used for farmer listing)
    if (verifiedOnly === 'true') {
      query.verificationStatus = 'verified';
    }

    // Get equipment
    let equipment = await Equipment.find(query)
      .populate('owner', 'name phone averageRating')
      .sort({ createdAt: -1 });

    // Filter by location if coordinates provided
    if (latitude && longitude) {
      const farmerLocation = {
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      };

      equipment = findNearbyEquipment(
        farmerLocation,
        equipment,
        parseFloat(radius)
      );
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      equipment = equipment.filter((e) => {
        const hourlyRate = e.pricing.perHour;
        if (minPrice && hourlyRate < parseFloat(minPrice)) return false;
        if (maxPrice && hourlyRate > parseFloat(maxPrice)) return false;
        return true;
      });
    }

    // Pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = parseInt(page) * parseInt(limit);
    const total = equipment.length;

    const paginatedEquipment = equipment.slice(startIndex, endIndex);

    // Compute availableUnits for today for each equipment
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const equipmentWithUnits = await Promise.all(
      paginatedEquipment.map(async (eq) => {
        const activeBookingsToday = await Booking.countDocuments({
          equipment: eq._id,
          bookingDate: { $gte: today, $lt: tomorrow },
          status: { $in: ['hold', 'confirmed', 'ongoing'] },
        });
        const totalUnits = eq.totalUnits || 1;
        const availableUnits = Math.max(0, totalUnits - activeBookingsToday);
        // eq may be a Mongoose doc or a plain object depending on the path taken
        const obj = typeof eq.toObject === 'function' ? eq.toObject() : { ...eq };
        obj.totalUnits = totalUnits;
        obj.availableUnits = availableUnits;
        return obj;
      })
    );

    res.status(200).json({
      success: true,
      count: equipmentWithUnits.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      equipment: equipmentWithUnits,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single equipment by ID
 * @route   GET /api/equipment/:id
 * @access  Public
 */
export const getEquipmentById = async (req, res, next) => {
  try {
    const equipment = await Equipment.findById(req.params.id)
      .populate('owner', 'name phone location averageRating totalReviews');

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found',
      });
    }

    res.status(200).json({
      success: true,
      equipment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update equipment
 * @route   PUT /api/equipment/:id
 * @access  Private (Renter - Owner only)
 */
export const updateEquipment = async (req, res, next) => {
  try {
    let equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found',
      });
    }

    // Check ownership
    if (equipment.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this equipment',
      });
    }

    // Handle photo uploads if any
    if (req.files && req.files.length > 0) {
      const newPhotos = req.files.map((file) => ({
        url: `/uploads/${file.filename}`,
        publicId: file.filename,
      }));
      req.body.photos = [...equipment.photos, ...newPhotos];
    }

    equipment = await Equipment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Equipment updated successfully',
      equipment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete equipment
 * @route   DELETE /api/equipment/:id
 * @access  Private (Renter - Owner only)
 */
export const deleteEquipment = async (req, res, next) => {
  try {
    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found',
      });
    }

    // Check ownership
    if (equipment.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this equipment',
      });
    }

    // Soft delete - just mark as inactive
    equipment.isActive = false;
    await equipment.save();

    // Remove from user's equipment list
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { equipmentListed: equipment._id },
    });

    res.status(200).json({
      success: true,
      message: 'Equipment deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get equipment availability for a specific date (24hr slots)
 * Returns 24 hourly slots (00:00-01:00, 01:00-02:00, ... 23:00-24:00)
 * @route   GET /api/equipment/:id/availability
 * @access  Public
 */
export const getEquipmentAvailability = async (req, res, next) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a date',
      });
    }

    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found',
      });
    }

    const requestedDate = new Date(date);
    requestedDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(requestedDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Get all bookings for this equipment on this date (hold, confirmed, ongoing)
    const bookings = await Booking.find({
      equipment: equipment._id,
      bookingDate: { $gte: requestedDate, $lt: nextDay },
      status: { $in: ['hold', 'confirmed', 'ongoing'] },
    }).select('timeSlot');

    // Build 24 hourly slots (00:00 to 24:00)
    const allSlots = [];
    for (let h = 0; h < 24; h++) {
      const startTime = `${String(h).padStart(2, '0')}:00`;
      const endTime = h < 23 ? `${String(h + 1).padStart(2, '0')}:00` : '24:00';
      allSlots.push({ startTime, endTime, hour: h });
    }

    // Mark slots as booked if they overlap with any booking
    const availableSlots = allSlots.map((slot) => {
      const slotStart = slot.hour * 60;
      const slotEnd = slot.hour < 23 ? (slot.hour + 1) * 60 : 24 * 60;

      const isBooked = bookings.some((b) => {
        const [bStartH, bStartM] = b.timeSlot.startTime.split(':').map(Number);
        const [bEndH, bEndM] = b.timeSlot.endTime.split(':').map(Number);
        const bStart = bStartH * 60 + bStartM;
        const bEnd = (bEndH === 0 && bEndM === 0 ? 24 : bEndH) * 60 + bEndM;

        // Overlap: slot overlaps with booking
        return slotStart < bEnd && slotEnd > bStart;
      });

      return {
        startTime: slot.startTime,
        endTime: slot.endTime,
        isBooked,
      };
    });

    // Also return available time ranges (consecutive free slots)
    const availableRanges = [];
    let rangeStart = null;
    for (let i = 0; i <= availableSlots.length; i++) {
      const slot = availableSlots[i];
      if (slot && !slot.isBooked) {
        if (rangeStart === null) rangeStart = slot.startTime;
      } else {
        if (rangeStart !== null) {
          availableRanges.push({
            startTime: rangeStart,
            endTime: availableSlots[i - 1].endTime,
          });
          rangeStart = null;
        }
      }
    }

    res.status(200).json({
      success: true,
      date: requestedDate,
      slots: availableSlots,
      availableRanges,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark equipment as arrived at location - notify nearby farmers
 * Used when equipment arrives somewhere (e.g. for seasonal crops) - nearby farmers get notified
 * @route   POST /api/equipment/:id/arrived
 * @access  Private (Renter - Owner only)
 */
export const markEquipmentArrived = async (req, res, next) => {
  try {
    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found',
      });
    }

    if (equipment.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this equipment',
      });
    }

    const { coordinates, address } = req.body;
    const coords = coordinates || equipment.location?.coordinates || [76.6394, 12.2958];

    // Find nearby farmers and notify them
    const farmers = await User.find({
      role: 'farmer',
      isActive: true,
      'location.coordinates': { $exists: true, $ne: [] },
    }).select('location');
    const nearbyFarmers = findNearbyUsers(
      { coordinates: coords },
      farmers,
      parseInt(process.env.PROXIMITY_RADIUS_KM) || 10
    );

    if (nearbyFarmers.length > 0) {
      await sendEquipmentArrivalNotification(equipment, { coordinates: coords }, nearbyFarmers);
    }

    res.status(200).json({
      success: true,
      message: `Equipment arrival notification sent to ${nearbyFarmers.length} nearby farmer(s)`,
      notifiedCount: nearbyFarmers.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get renter's equipment
 * @route   GET /api/equipment/renter/my-equipment
 * @access  Private (Renter only)
 */
export const getRenterEquipment = async (req, res, next) => {
  try {
    const equipment = await Equipment.find({
      owner: req.user.id,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: equipment.length,
      equipment,
    });
  } catch (error) {
    next(error);
  }
};