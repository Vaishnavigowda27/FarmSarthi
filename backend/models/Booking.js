import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    equipment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Equipment',
      required: true,
    },
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    renter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    bookingDate: {
      type: Date,
      required: true,
    },
    timeSlot: {
      startTime: {
        type: String, // Format: "HH:mm"
        required: true,
      },
      endTime: {
        type: String, // Format: "HH:mm"
        required: true,
      },
      duration: {
        type: Number, // in hours
        required: true,
      },
    },
    pickupLocation: {
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
    },
    distance: {
      type: Number, // in km
      required: true,
    },
    pricing: {
      hourlyRate: {
        type: Number,
        required: true,
      },
      perKmRate: {
        type: Number,
        required: true,
      },
      totalHoursCost: {
        type: Number,
        required: true,
      },
      totalDistanceCost: {
        type: Number,
        required: true,
      },
      totalCost: {
        type: Number,
        required: true,
      },
      serviceCharge: {
        type: Number,
        required: true,
      },
      remainingPayment: {
        type: Number,
        required: true,
      },
    },
    status: {
      type: String,
      enum: ['pending', 'hold', 'confirmed', 'ongoing', 'completed', 'cancelled', 'disputed'],
      default: 'pending',
    },
    paymentStatus: {
      advance: {
        type: Boolean,
        default: false,
      },
      full: {
        type: Boolean,
        default: false,
      },
      advancePaymentId: String,
      fullPaymentId: String,
    },
    cancellation: {
      isCancelled: {
        type: Boolean,
        default: false,
      },
      cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      cancelledAt: Date,
      reason: String,
      refundAmount: {
        type: Number,
        default: 0,
      },
    },
    conflictResolution: {
      hasConflict: {
        type: Boolean,
        default: false,
      },
      conflictReason: String,
      resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      resolvedAt: Date,
      resolution: String,
    },
    review: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Review',
    },
    notes: String,
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
bookingSchema.index({ equipment: 1, bookingDate: 1 });
bookingSchema.index({ farmer: 1, status: 1 });
bookingSchema.index({ renter: 1, status: 1 });

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;