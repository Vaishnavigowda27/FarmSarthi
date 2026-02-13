import twilio from 'twilio';
import OTP from '../models/OTP.js';

// Initialize Twilio client (only if credentials exist)
let client = null;
if (process.env.TWILIO_ACCOUNT_SID && 
    process.env.TWILIO_AUTH_TOKEN && 
    process.env.TWILIO_ACCOUNT_SID !== 'dummy') {
  client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
}

// Generate a 6-digit OTP
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP via Twilio
export const sendOTP = async (phone, otp) => {
  try {
    // DEV MODE: Just log to console
    if (process.env.NODE_ENV === 'development') {
      console.log(`\n📱 OTP for ${phone}: ${otp}`);
      console.log(`   (Dev mode - any 6-digit OTP will work)\n`);
      return { success: true, message: 'OTP logged to console (dev mode)' };
    }

    // PRODUCTION: Send real SMS via Twilio
    if (!client) {
      throw new Error('Twilio is not configured');
    }

    const message = await client.messages.create({
      body: `Your FarmSaarthi verification OTP is: ${otp}. Valid for 10 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: `+91${phone}`,
    });

    return { success: true, messageSid: message.sid };
  } catch (error) {
    console.error('Twilio Error:', error);
    // In dev mode, don't fail - just log
    if (process.env.NODE_ENV === 'development') {
      console.log(`⚠️ Twilio failed, but dev mode allows any OTP`);
      return { success: true, message: 'OTP logged to console (dev mode)' };
    }
    throw new Error('Failed to send OTP');
  }
};

// Create and send OTP
export const createAndSendOTP = async (phone) => {
  try {
    // Remove +91 if present, keep only 10 digits
    phone = phone.replace(/^\+91/, '').replace(/\s/g, '');

    // Delete any existing OTPs for this phone
    await OTP.deleteMany({ phone });

    // Generate new OTP
    const otpCode = generateOTP();

    // Save OTP to database
    await OTP.create({
      phone,
      otp: otpCode,
      verified: false,
      attempts: 0
    });

    // Send OTP
    await sendOTP(phone, otpCode);

    return {
      success: true,
      message: 'OTP sent successfully',
      expiresIn: 600, // 10 minutes in seconds
    };
  } catch (error) {
    console.error('Create OTP Error:', error);
    throw error;
  }
};

// Verify OTP
export const verifyOTP = async (phone, otpCode) => {
  try {
    // Remove +91 if present
    phone = phone.replace(/^\+91/, '').replace(/\s/g, '');

    // DEV MODE: Accept any 6-digit OTP
    if (process.env.NODE_ENV === 'development') {
      if (!/^\d{6}$/.test(otpCode)) {
        return { success: false, message: 'Please enter a valid 6-digit OTP' };
      }
      
      console.log(`✅ Dev mode: OTP verified for ${phone}`);
      
      // Delete OTPs for this phone
      await OTP.deleteMany({ phone });
      
      return { success: true, message: 'OTP verified successfully' };
    }

    // PRODUCTION MODE: Verify real OTP
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
      return { 
        success: false, 
        message: 'Too many attempts. Please request a new OTP.' 
      };
    }

    // Mark as verified and delete
    await OTP.deleteOne({ _id: otp._id });

    return { success: true, message: 'OTP verified successfully' };
  } catch (error) {
    console.error('Verify OTP Error:', error);
    throw error;
  }
};

// Resend OTP
export const resendOTP = async (phone) => {
  try {
    // Remove +91 if present
    phone = phone.replace(/^\+91/, '').replace(/\s/g, '');

    // In dev mode, skip the 2-minute wait
    if (process.env.NODE_ENV !== 'development') {
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
    }

    // Create and send new OTP
    return await createAndSendOTP(phone);
  } catch (error) {
    console.error('Resend OTP Error:', error);
    throw error;
  }
};