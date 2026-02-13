import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  otp: {
    type: String,
    required: [true, 'OTP is required']
  },
  verified: {
    type: Boolean,
    default: false
  },
  attempts: {
    type: Number,
    default: 0
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    index: { expires: 0 } // Auto-delete after expiry
  }
}, {
  timestamps: true
});

// Increment attempts before validation
otpSchema.pre('save', function(next) {
  if (!this.isNew && !this.verified) {
    this.attempts += 1;
  }
  next();
});

const OTP = mongoose.model('OTP', otpSchema);

export default OTP;