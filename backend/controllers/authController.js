import User from '../models/User.js';
import { generateToken } from '../utils/jwt.js';
import { createAndSendOTP, verifyOTP, resendOTP as resendOTPService } from '../utils/twilioService.js';

// Send OTP
export const sendOTPController = async (req, res, next) => {
  try {
    let { phone } = req.body;

    // Remove +91 if present, keep only 10 digits
    phone = phone.replace(/^\+91/, '').replace(/\s/g, '');

    // Validate phone number (10 digits)
    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 10-digit phone number'
      });
    }

    console.log('📞 Sending OTP to:', phone);

    // Use twilioService to create and send OTP
    const result = await createAndSendOTP(phone);

    console.log('✅ OTP result:', result);

    res.status(200).json(result);

  } catch (error) {
    console.error('❌ Send OTP Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP'
    });
  }
};

// Resend OTP
export const resendOTPController = async (req, res, next) => {
  try {
    let { phone } = req.body;

    // Remove +91 if present
    phone = phone.replace(/^\+91/, '').replace(/\s/g, '');

    console.log('🔄 Resending OTP to:', phone);

    // Use twilioService
    const result = await resendOTPService(phone);

    res.status(200).json(result);

  } catch (error) {
    console.error('❌ Resend OTP Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend OTP'
    });
  }
};

// Register
export const register = async (req, res, next) => {
  try {
    let { name, phone, otp, role, location } = req.body;

    // Remove +91 if present
    phone = phone.replace(/^\+91/, '').replace(/\s/g, '');

    console.log('📝 Registration attempt:', { name, phone, role });

    // Validate
    if (!name || !phone || !otp || !role) {
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
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this phone number already exists'
      });
    }

    console.log('🔐 Verifying OTP...');

    // Verify OTP using twilioService
    const otpResult = await verifyOTP(phone, otp);
    
    if (!otpResult.success) {
      console.log('❌ OTP verification failed');
      return res.status(400).json(otpResult);
    }

    console.log('✅ OTP verified, creating user...');

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
      phone,
      role,
      location: userLocation,
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
    let { phone, otp } = req.body;

    // Remove +91 if present
    phone = phone.replace(/^\+91/, '').replace(/\s/g, '');

    console.log('🔑 Login attempt for:', phone);

    // Validate
    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide phone number and OTP'
      });
    }

    // Find user
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Please register first.'
      });
    }

    console.log('🔐 Verifying OTP...');

    // Verify OTP using twilioService
    const otpResult = await verifyOTP(phone, otp);
    
    if (!otpResult.success) {
      console.log('❌ OTP verification failed');
      return res.status(400).json(otpResult);
    }

    console.log('✅ OTP verified');

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