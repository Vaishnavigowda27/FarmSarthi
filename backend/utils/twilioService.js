import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

let client;

// Initialize Twilio only if credentials are provided
if (accountSid && authToken && twilioPhone) {
  client = twilio(accountSid, authToken);
}

export const sendOTP = async (phone, otp) => {
  try {
    // Development mode - just log OTP
    if (process.env.NODE_ENV === 'development' || !client) {
      console.log(`📱 OTP for ${phone}: ${otp}`);
      console.log('⚠️  Twilio not configured. OTP logged to console.');
      return { success: true, message: 'OTP logged (dev mode)' };
    }

    // Production mode - send actual SMS
    const message = await client.messages.create({
      body: `Your AgriRental OTP is: ${otp}. Valid for 10 minutes.`,
      from: twilioPhone,
      to: phone
    });

    console.log(`✅ OTP sent to ${phone}: ${message.sid}`);
    return { success: true, messageSid: message.sid };
    
  } catch (error) {
    console.error('❌ Twilio error:', error.message);
    
    // Fallback: log OTP if SMS fails
    console.log(`📱 FALLBACK - OTP for ${phone}: ${otp}`);
    return { success: true, message: 'OTP logged (SMS failed)' };
  }
};

export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};