import twilio from 'twilio';
import OTP from '../models/OTP.js';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Generate a 6-digit OTP
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP via Twilio
export const sendOTP = async (phone, otp) => {
  try {
    // For development, you can skip actual SMS sending
    if (process.env.NODE_ENV === 'development') {
      console.log(`OTP for ${phone}: ${otp}`);
      return { success: true, message: 'OTP logged to console (dev mode)' };
    }

    // Send SMS via Twilio
    const message = await client.messages.create({
      body: `Your verification OTP for Agri Rental is: ${otp}. Valid for 10 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: `+91${phone}`, // Assuming Indian phone numbers
    });

    return { success: true, messageSid: message.sid };
  } catch (error) {
    console.error('Twilio Error:', error);
    throw new Error('Failed to send OTP');
  }
};

// Create and send OTP
export const createAndSendOTP = async (phone) => {
  try {
    // Delete any existing OTPs for this phone
    await OTP.deleteMany({ phone });

    // Generate new OTP
    const otpCode = generateOTP();

    // Save OTP to database
    const otp = await OTP.create({
      phone,
      otp: otpCode,
    });

    // Send OTP
    await sendOTP(phone, otpCode);

    return {
      success: true,
      message: 'OTP sent successfully',
      expiresIn: 600, // 10 minutes in seconds
    };
  } catch (error) {
    throw error;
  }
};

// Verify OTP
export const verifyOTP = async (phone, otpCode) => {
  try {
    // Find OTP
    const otp = await OTP.findOne({
      phone,
      otp: otpCode,
      verified: false,
      expiresAt: { $gt: Date.now() },
    });

    if (!otp) {
      return { success: false, message: 'Invalid or expired OTP' };
    }

    // Check attempts
    if (otp.attempts >= 3) {
      await OTP.deleteOne({ _id: otp._id });
      return { success: false, message: 'Too many attempts. Please request a new OTP.' };
    }

    // Mark as verified
    otp.verified = true;
    await otp.save();

    return { success: true, message: 'OTP verified successfully' };
  } catch (error) {
    throw error;
  }
};

// Resend OTP
export const resendOTP = async (phone) => {
  try {
    // Check if there's a recent OTP (within last 2 minutes)
    const recentOTP = await OTP.findOne({
      phone,
      createdAt: { $gt: new Date(Date.now() - 2 * 60 * 1000) },
    });

    if (recentOTP) {
      return {
        success: false,
        message: 'Please wait 2 minutes before requesting a new OTP',
      };
    }

    // Create and send new OTP
    return await createAndSendOTP(phone);
  } catch (error) {
    throw error;
  }
};