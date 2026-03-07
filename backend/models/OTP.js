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
    default: 0,
    max: 3
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => Date.now() + 10 * 60 * 1000 // 10 minutes
    // ✅ REMOVED: index: true (was causing duplicate)
  }
  // ✅ REMOVED: createdAt with expires (timestamps: true already adds createdAt)
}, {
  timestamps: true // This adds createdAt and updatedAt automatically
});

// Indexes for faster queries
otpSchema.index({ phone: 1, createdAt: -1 });

// ✅ TTL Index: Auto-delete documents 10 minutes after expiresAt
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OTP = mongoose.model('OTP', otpSchema);

export default OTP;