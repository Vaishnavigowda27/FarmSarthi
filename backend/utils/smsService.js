import OTP from '../models/OTP.js';

export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

async function sendViaAndroidGateway(phone, otp) {
  const gatewayUrl = process.env.ANDROID_GATEWAY_URL;

  if (!gatewayUrl) {
    console.log('ANDROID_GATEWAY_URL not set. Skipping real SMS, logging OTP instead.');
    console.log(`OTP for ${phone}: ${otp}`);
    return { success: true, message: 'OTP logged for development (no SMS sent)' };
  }

  try {
    const payload = {
      to: phone,
      message: `Your FarmSaarthi OTP is ${otp}. It is valid for 10 minutes.`,
    };

    const res = await fetch(gatewayUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error('Android gateway error response:', text);
      throw new Error('Android SMS gateway request failed');
    }

    return { success: true };
  } catch (err) {
    console.error('Android SMS gateway request error:', err);
    throw err;
  }
}

export const createAndSendOTP = async (rawPhone) => {
  try {
    const phone = rawPhone.replace(/^\+91/, '').replace(/\s/g, '');

    await OTP.deleteMany({ phone });

    const otpCode = generateOTP();

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await OTP.create({
      phone,
      otp: otpCode,
      verified: false,
      attempts: 0,
      expiresAt,
    });

    await sendViaAndroidGateway(phone, otpCode);

    return {
      success: true,
      message: 'OTP sent successfully',
      expiresIn: 600,
    };
  } catch (error) {
    console.error('Create OTP Error:', error);
    throw error;
  }
};

export const verifyOTP = async (rawPhone, otpCode) => {
  try {
    const phone = rawPhone.replace(/^\+91/, '').replace(/\s/g, '');

    if (!/^\d{6}$/.test(otpCode)) {
      return { success: false, message: 'Please enter a valid 6-digit OTP' };
    }

    const otp = await OTP.findOne({
      phone,
      otp: otpCode,
      verified: false,
      expiresAt: { $gt: Date.now() },
    });

    if (!otp) {
      return { success: false, message: 'Invalid or expired OTP' };
    }

    if (otp.attempts >= 3) {
      await OTP.deleteOne({ _id: otp._id });
      return {
        success: false,
        message: 'Too many attempts. Please request a new OTP.',
      };
    }

    await OTP.deleteOne({ _id: otp._id });

    return { success: true, message: 'OTP verified successfully' };
  } catch (error) {
    console.error('Verify OTP Error:', error);
    throw error;
  }
};

export const resendOTP = async (rawPhone) => {
  try {
    const phone = rawPhone.replace(/^\+91/, '').replace(/\s/g, '');

    const recent = await OTP.findOne({
      phone,
      createdAt: { $gt: new Date(Date.now() - 2 * 60 * 1000) },
    });

    if (recent) {
      return {
        success: false,
        message: 'Please wait 2 minutes before requesting a new OTP',
      };
    }

    return await createAndSendOTP(phone);
  } catch (error) {
    console.error('Resend OTP Error:', error);
    throw error;
  }
};

