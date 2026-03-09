import User from '../models/User.js';
import { generateToken } from '../utils/jwt.js';
import { normalizeTo10DigitPhone, verifyFirebaseIdToken } from '../utils/firebaseAuth.js';

// Register
export const register = async (req, res, next) => {
  try {
    const { name, role, location, idToken } = req.body;

    const decoded = await verifyFirebaseIdToken(idToken);
    const tokenPhone10 = normalizeTo10DigitPhone(decoded.phone_number);

    if (!tokenPhone10) {
      return res.status(400).json({
        success: false,
        message: 'Unable to read phone number from Firebase token',
      });
    }

    console.log('📝 Registration attempt:', { name, phone: tokenPhone10, role });

    // Validate
    if (!name || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Validate role
    if (!['farmer', 'renter'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be farmer or renter'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ phone: tokenPhone10 });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this phone number already exists'
      });
    }

    // Default location (frontend doesn't collect location during registration)
    const userLocation = {
      type: 'Point',
      coordinates: [76.6394, 12.2958],
      address: 'Mysore, Karnataka',
      city: 'Mysore',
      state: 'Karnataka',
      pincode: '570001'
    };

    // Create user
    const user = await User.create({
      name,
      phone: tokenPhone10,
      role,
      location: location?.coordinates?.length ? {
        type: 'Point',
        coordinates: location.coordinates,
        address: location.address || userLocation.address,
        city: location.city || userLocation.city,
        state: location.state || userLocation.state,
        pincode: location.pincode || userLocation.pincode,
      } : userLocation,
      isVerified: true,
      isActive: true
    });

    console.log('✅ User created:', user._id);

    // Generate JWT token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        location: user.location
      }
    });

  } catch (error) {
    console.error('❌ Register Error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
};

// Login
export const login = async (req, res, next) => {
  try {
    const { idToken } = req.body;

    const decoded = await verifyFirebaseIdToken(idToken);
    const tokenPhone10 = normalizeTo10DigitPhone(decoded.phone_number);

    if (!tokenPhone10) {
      return res.status(400).json({
        success: false,
        message: 'Unable to read phone number from Firebase token',
      });
    }

    console.log('🔑 Login attempt for:', tokenPhone10);

    // Validate
    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'Please provide Firebase ID token'
      });
    }

    // Find user
    const user = await User.findOne({ phone: tokenPhone10 });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Please register first.'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated'
      });
    }

    // Generate JWT token
    const token = generateToken(user._id);

    console.log('✅ Login successful for user:', user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        location: user.location
      }
    });

  } catch (error) {
    console.error('❌ Login Error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
};

// Get current user
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-__v');
    
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('❌ Get User Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user'
    });
  }
};