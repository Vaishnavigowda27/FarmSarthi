import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
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
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentType: {
      type: String,
      enum: ['advance', 'full', 'refund'],
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['razorpay', 'offline', 'wallet'],
      default: 'razorpay',
    },
    razorpay: {
      orderId: String,
      paymentId: String,
      signature: String,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    transactionDate: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      type: Map,
      of: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
paymentSchema.index({ booking: 1 });
paymentSchema.index({ farmer: 1, status: 1 });
paymentSchema.index({ renter: 1, status: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;