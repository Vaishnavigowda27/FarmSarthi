import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Please provide a phone number'],
      unique: true,
      match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number'],
    },
    role: {
      type: String,
      enum: ['farmer', 'renter', 'admin'],
      required: [true, 'Please select a role'],
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, 'Please provide location coordinates'],
      },
      address: {
        type: String,
        required: [true, 'Please provide an address'],
      },
      city: String,
      state: String,
      pincode: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Renter specific fields
    equipmentListed: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Equipment',
    }],
    totalEarnings: {
      type: Number,
      default: 0,
    },
    // Farmer specific fields
    bookingHistory: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
    }],
    totalSpent: {
      type: Number,
      default: 0,
    },
    // Common
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Create geospatial index for location-based queries
userSchema.index({ location: '2dsphere' });

// Method to check if user is within proximity
userSchema.methods.isWithinProximity = function (targetLocation, radiusInKm = 10) {
  const R = 6371; // Earth's radius in km
  const lat1 = this.location.coordinates[1];
  const lon1 = this.location.coordinates[0];
  const lat2 = targetLocation.coordinates[1];
  const lon2 = targetLocation.coordinates[0];

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance <= radiusInKm;
};

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

const User = mongoose.model('User', userSchema);

export default User;