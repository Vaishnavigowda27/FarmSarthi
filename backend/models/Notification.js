import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'booking_confirmation',
        'booking_cancelled',
        'payment_received',
        'payment_pending',
        'equipment_nearby',
        'equipment_arrived',
        'equipment_on_roll',
        'review_received',
        'booking_reminder',
        'dispute_raised',
        'dispute_resolved',
        'equipment_approved',
        'equipment_rejected',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    relatedEntity: {
      entityType: {
        type: String,
        enum: ['Booking', 'Equipment', 'Payment', 'Review', 'User'],
      },
      entityId: {
        type: mongoose.Schema.Types.ObjectId,
      },
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;