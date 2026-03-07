import Equipment from '../models/Equipment.js';
import User from '../models/User.js';
import { findNearbyEquipment } from '../utils/distanceCalculator.js';
import { sendProximityNotification } from '../utils/notificationService.js';

/**
 * @desc    Add new equipment
 * @route   POST /api/equipment
 * @access  Private (Renter only)
 */
export const addEquipment = async (req, res, next) => {
  try {
    let { name, description, category, pricing, location, specifications } = req.body;

    // Parse if sent as JSON strings (from FormData)
    if (typeof pricing === 'string') pricing = JSON.parse(pricing);
    if (typeof location === 'string') location = JSON.parse(location);
    if (typeof specifications === 'string' && specifications) specifications = JSON.parse(specifications);

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

    // Notify nearby farmers (within 10km) - don't fail add if notification fails
    try {
      const farmers = await User.find({ role: 'farmer', isActive: true });
      const nearbyFarmers = findNearbyEquipment(
        { coordinates: coords },
        farmers.map((f) => ({ location: f.location, _id: f._id })),
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

    res.status(200).json({
      success: true,
      count: paginatedEquipment.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      equipment: paginatedEquipment,
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
 * @desc    Get equipment availability for a specific date
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

    // Find schedule for the requested date
    const requestedDate = new Date(date);
    const scheduleEntry = equipment.availability.schedule.find(
      (entry) =>
        new Date(entry.date).toDateString() === requestedDate.toDateString()
    );

    if (!scheduleEntry) {
      // No bookings for this date - all 8 hours available (9 AM - 5 PM)
      return res.status(200).json({
        success: true,
        date: requestedDate,
        availableSlots: [
          { startTime: '09:00', endTime: '17:00', isBooked: false },
        ],
      });
    }

    res.status(200).json({
      success: true,
      date: requestedDate,
      availableSlots: scheduleEntry.slots,
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