import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      unique: true,
    },
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
    rating: {
      type: Number,
      required: [true, 'Please provide a rating'],
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      maxlength: 500,
    },
    serviceQuality: {
      type: Number,
      min: 1,
      max: 5,
    },
    equipmentCondition: {
      type: Number,
      min: 1,
      max: 5,
    },
    valueForMoney: {
      type: Number,
      min: 1,
      max: 5,
    },
    photos: [{
      url: String,
      publicId: String,
    }],
    isVerified: {
      type: Boolean,
      default: false,
    },
    renterResponse: {
      comment: String,
      respondedAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
reviewSchema.index({ equipment: 1, rating: -1 });
reviewSchema.index({ farmer: 1 });
reviewSchema.index({ renter: 1 });

const Review = mongoose.model('Review', reviewSchema);

export default Review;