import Notification from '../models/Notification.js';
import { sendFcmToUser } from './fcmService.js';

/**
 * Create a notification
 * @param {Object} data - Notification data
 * @returns {Promise<Object>} Created notification
 */
export const createNotification = async (data) => {
  try {
    const notification = await Notification.create(data);

    // Optionally send push notification via FCM if configured
    if (process.env.SEND_PUSH_NOTIFICATIONS === 'true') {
      try {
        await sendFcmToUser(data.recipient, {
          title: data.title,
          body: data.message,
          data: {
            type: data.type,
            notificationId: String(notification._id),
            entityType: data.relatedEntity?.entityType || '',
            entityId: data.relatedEntity?.entityId ? String(data.relatedEntity.entityId) : '',
          },
        });
      } catch (err) {
        console.error('FCM push failed:', err?.message || err);
      }
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Send booking confirmation notification
 */
export const sendBookingConfirmation = async (booking) => {
  try {
    // Notification to farmer
    await createNotification({
      recipient: booking.farmer,
      type: 'booking_confirmation',
      title: 'Booking Confirmed!',
      message: `Your booking for equipment has been confirmed for ${new Date(
        booking.bookingDate
      ).toLocaleDateString()}.`,
      relatedEntity: {
        entityType: 'Booking',
        entityId: booking._id,
      },
      priority: 'high',
    });

    // Notification to renter
    await createNotification({
      recipient: booking.renter,
      type: 'booking_confirmation',
      title: 'New Booking Received!',
      message: `You have a new booking for ${new Date(
        booking.bookingDate
      ).toLocaleDateString()}.`,
      relatedEntity: {
        entityType: 'Booking',
        entityId: booking._id,
      },
      priority: 'high',
    });
  } catch (error) {
    console.error('Error sending booking confirmation:', error);
  }
};

/**
 * Send cancellation notification
 */
export const sendCancellationNotification = async (booking, cancelledBy) => {
  try {
    const recipients = [booking.farmer, booking.renter].filter(
      (id) => id.toString() !== cancelledBy.toString()
    );

    for (const recipient of recipients) {
      await createNotification({
        recipient,
        type: 'booking_cancelled',
        title: 'Booking Cancelled',
        message: `A booking has been cancelled for ${new Date(
          booking.bookingDate
        ).toLocaleDateString()}.`,
        relatedEntity: {
          entityType: 'Booking',
          entityId: booking._id,
        },
        priority: 'high',
      });
    }
  } catch (error) {
    console.error('Error sending cancellation notification:', error);
  }
};

/**
 * Send payment notification
 */
export const sendPaymentNotification = async (payment, type = 'received') => {
  try {
    if (type === 'received') {
      // Notification to renter
      await createNotification({
        recipient: payment.renter,
        type: 'payment_received',
        title: 'Payment Received!',
        message: `Payment of ₹${payment.amount} has been received for your equipment.`,
        relatedEntity: {
          entityType: 'Payment',
          entityId: payment._id,
        },
        priority: 'medium',
      });
    } else if (type === 'pending') {
      // Notification to farmer
      await createNotification({
        recipient: payment.farmer,
        type: 'payment_pending',
        title: 'Payment Pending',
        message: `Please complete the remaining payment of ₹${payment.amount}.`,
        relatedEntity: {
          entityType: 'Payment',
          entityId: payment._id,
        },
        priority: 'high',
      });
    }
  } catch (error) {
    console.error('Error sending payment notification:', error);
  }
};

/**
 * Send proximity notification to nearby farmers (when equipment is listed)
 */
export const sendProximityNotification = async (equipment, nearbyFarmers) => {
  try {
    for (const farmerData of nearbyFarmers) {
      await createNotification({
        recipient: farmerData.user._id,
        type: 'equipment_nearby',
        title: 'Equipment Available Nearby!',
        message: `${equipment.name} is now available ${farmerData.distance.toFixed(
          1
        )}km from your location.`,
        relatedEntity: {
          entityType: 'Equipment',
          entityId: equipment._id,
        },
        priority: 'medium',
      });
    }
  } catch (error) {
    console.error('Error sending proximity notifications:', error);
  }
};

/**
 * Send equipment arrival notification to nearby farmers
 * When equipment arrives at a location (e.g. for seasonal work), nearby farmers get notified
 */
export const sendEquipmentArrivalNotification = async (equipment, location, nearbyFarmers) => {
  try {
    for (const farmerData of nearbyFarmers) {
      await createNotification({
        recipient: farmerData.user._id,
        type: 'equipment_arrived',
        title: 'Equipment Arrived Nearby!',
        message: `${equipment.name} has arrived ${farmerData.distance.toFixed(
          1
        )}km from your location. Book now for seasonal crops!`,
        relatedEntity: {
          entityType: 'Equipment',
          entityId: equipment._id,
        },
        priority: 'high',
      });
    }
  } catch (error) {
    console.error('Error sending equipment arrival notifications:', error);
  }
};

/**
 * Send review notification
 */
export const sendReviewNotification = async (review) => {
  try {
    await createNotification({
      recipient: review.renter,
      type: 'review_received',
      title: 'New Review Received!',
      message: `You received a ${review.rating}-star review for your equipment.`,
      relatedEntity: {
        entityType: 'Review',
        entityId: review._id,
      },
      priority: 'low',
    });
  } catch (error) {
    console.error('Error sending review notification:', error);
  }
};

/**
 * Send booking reminder
 */
export const sendBookingReminder = async (booking, hoursBeforeBooking) => {
  try {
    await createNotification({
      recipient: booking.farmer,
      type: 'booking_reminder',
      title: 'Upcoming Booking Reminder',
      message: `Your booking is scheduled in ${hoursBeforeBooking} hours.`,
      relatedEntity: {
        entityType: 'Booking',
        entityId: booking._id,
      },
      priority: 'medium',
    });
  } catch (error) {
    console.error('Error sending booking reminder:', error);
  }
};

/**
 * Get user notifications
 */
export const getUserNotifications = async (userId, limit = 20, skip = 0) => {
  try {
    const notifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate('relatedEntity.entityId');

    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });

    return {
      notifications,
      unreadCount,
    };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

/**
 * Mark notification as read
 */
export const markAsRead = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { isRead: true, readAt: Date.now() },
      { new: true }
    );

    return notification;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (userId) => {
  try {
    await Notification.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true, readAt: Date.now() }
    );
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};