import mongoose from 'mongoose';

const equipmentSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide equipment name'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide equipment description'],
    },
    category: {
      type: String,
      required: [true, 'Please provide equipment category'],
      enum: ['Tractor', 'Harvester', 'Plough', 'Seeder', 'Sprayer', 'Other'],
    },
    photos: [{
      url: String,
      publicId: String,
    }],
    pricing: {
      perHour: {
        type: Number,
        required: [true, 'Please provide hourly rate'],
        min: 0,
      },
      perKm: {
        type: Number,
        required: [true, 'Please provide per km rate'],
        min: 0,
      },
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
      address: String,
      city: String,
      state: String,
    },
    availability: {
      isAvailable: {
        type: Boolean,
        default: true,
      },
      schedule: [{
        date: {
          type: Date,
          required: true,
        },
        slots: [{
          startTime: {
            type: String, // Format: "HH:mm"
            required: true,
          },
          endTime: {
            type: String, // Format: "HH:mm"
            required: true,
          },
          isBooked: {
            type: Boolean,
            default: false,
          },
          bookingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Booking',
          },
        }],
      }],
    },
    specifications: {
      make: String,
      model: String,
      year: Number,
      horsepower: Number,
      capacity: String,
    },
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
    totalBookings: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Create geospatial index for location-based queries
equipmentSchema.index({ location: '2dsphere' });

// Method to calculate distance from a point (Haversine formula)
equipmentSchema.methods.calculateDistance = function (targetLocation) {
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

  return distance;
};

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

const Equipment = mongoose.model('Equipment', equipmentSchema);

export default Equipment;