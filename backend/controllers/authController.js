import User from '../models/User.js';
import { generateToken } from '../utils/jwt.js';
import { createAndSendOTP, verifyOTP, resendOTP as resendOTPService } from '../utils/smsService.js';

// Send OTP
export const sendOTPController = async (req, res, next) => {
  try {
    let { phone } = req.body;

    phone = phone.replace(/^\+91/, '').replace(/\s/g, '');

    // Strict Indian mobile validation: 10 digits, starting 6-9
    if (!/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid Indian mobile number (10 digits starting with 6-9)',
      });
    }

    console.log('📞 Sending OTP to:', phone);

    const result = await createAndSendOTP(phone);

    console.log('✅ OTP result:', result);

    res.status(200).json(result);
  } catch (error) {
    console.error('❌ Send OTP Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
    });
  }
};

// Resend OTP
export const resendOTPController = async (req, res, next) => {
  try {
    let { phone } = req.body;

    phone = phone.replace(/^\+91/, '').replace(/\s/g, '');

    console.log('🔄 Resending OTP to:', phone);

    const result = await resendOTPService(phone);

    res.status(200).json(result);
  } catch (error) {
    console.error('❌ Resend OTP Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend OTP',
    });
  }
};

// Register
export const register = async (req, res, next) => {
  try {
    let { name, phone, otp, role, location } = req.body;

    phone = phone.replace(/^\+91/, '').replace(/\s/g, '');

    console.log('📝 Registration attempt:', { name, phone, role });

    if (!name || !phone || !otp || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    if (!['farmer', 'renter'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be farmer or renter',
      });
    }

    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this phone number already exists',
      });
    }

    console.log('🔐 Verifying OTP...');
    const otpResult = await verifyOTP(phone, otp);

    if (!otpResult.success) {
      console.log('❌ OTP verification failed');
      return res.status(400).json(otpResult);
    }

    const defaultLocation = {
      type: 'Point',
      coordinates: [76.6394, 12.2958],
      address: 'Mysore, Karnataka',
      city: 'Mysore',
      state: 'Karnataka',
      pincode: '570001',
    };

    const finalLocation =
      location && location.coordinates && location.coordinates.length
        ? {
            type: 'Point',
            coordinates: location.coordinates,
            address: location.address || defaultLocation.address,
            city: location.city || defaultLocation.city,
            state: location.state || defaultLocation.state,
            pincode: location.pincode || defaultLocation.pincode,
          }
        : defaultLocation;

    const user = await User.create({
      name,
      phone,
      role,
      location: finalLocation,
      isVerified: true,
      isActive: true,
    });

    console.log('✅ User created:', user._id);

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
        location: user.location,
      },
    });
  } catch (error) {
    console.error('❌ Register Error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
    });
  }
};

// Login
export const login = async (req, res, next) => {
  try {
    let { phone, otp } = req.body;

    phone = phone.replace(/^\+91/, '').replace(/\s/g, '');

    console.log('🔑 Login attempt for:', phone);

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide phone number and OTP',
      });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Please register first.',
      });
    }

    console.log('🔐 Verifying OTP...');
    const otpResult = await verifyOTP(phone, otp);

    if (!otpResult.success) {
      console.log('❌ OTP verification failed');
      return res.status(400).json(otpResult);
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated',
      });
    }

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
        location: user.location,
      },
    });
  } catch (error) {
    console.error('❌ Login Error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
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