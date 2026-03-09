/**
 * Clear all registered data from MongoDB
 * Removes: Users (farmers, renters), Bookings, Payments, Equipment, Reviews, Notifications
 * Keeps: Admin user (optional)
 *
 * Usage: node backend/scripts/clearAllData.js
 * With --keep-admin: Keeps admin user
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import Equipment from '../models/Equipment.js';
import Review from '../models/Review.js';
import Notification from '../models/Notification.js';
import connectDB from '../config/db.js';

dotenv.config();

const keepAdmin = process.argv.includes('--keep-admin');

const clearAllData = async () => {
  try {
    await connectDB();

    console.log('🗑️  Clearing all data...');

    await Notification.deleteMany({});
    console.log('   ✓ Notifications cleared');

    await Review.deleteMany({});
    console.log('   ✓ Reviews cleared');

    await Payment.deleteMany({});
    console.log('   ✓ Payments cleared');

    await Booking.deleteMany({});
    console.log('   ✓ Bookings cleared');

    await Equipment.deleteMany({});
    console.log('   ✓ Equipment cleared');

    if (keepAdmin) {
      await User.deleteMany({ role: { $in: ['farmer', 'renter'] } });
      console.log('   ✓ Farmers and renters cleared (admin kept)');
    } else {
      await User.deleteMany({});
      console.log('   ✓ All users cleared');
    }

    console.log('\n✅ All registered data cleared successfully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    process.exit(1);
  }
};

clearAllData();
