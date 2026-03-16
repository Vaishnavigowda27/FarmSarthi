import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Equipment from './models/Equipment.js';
import Booking from './models/Booking.js';
import Payment from './models/Payment.js';
import Review from './models/Review.js';
import connectDB from './config/db.js';

dotenv.config();

const mysoreLocations = [
  { name: 'Mysore Palace Area', coordinates: [76.6547, 12.3051], address: 'Near Mysore Palace, Mysore', city: 'Mysore', state: 'Karnataka', pincode: '570001' },
  { name: 'Chamundi Hills', coordinates: [76.6727, 12.2724], address: 'Chamundi Hills Road, Mysore', city: 'Mysore', state: 'Karnataka', pincode: '570008' },
  { name: 'Hebbal', coordinates: [76.6411, 12.3375], address: 'Hebbal, Mysore', city: 'Mysore', state: 'Karnataka', pincode: '570016' },
  { name: 'Vijayanagar', coordinates: [76.6194, 12.2958], address: 'Vijayanagar, Mysore', city: 'Mysore', state: 'Karnataka', pincode: '570017' },
  { name: 'Jayalakshmipuram', coordinates: [76.6294, 12.3258], address: 'Jayalakshmipuram, Mysore', city: 'Mysore', state: 'Karnataka', pincode: '570012' },
  { name: 'Gokulam', coordinates: [76.6161, 12.2847], address: 'Gokulam, Mysore', city: 'Mysore', state: 'Karnataka', pincode: '570002' },
  { name: 'Bannimantap', coordinates: [76.6811, 12.2958], address: 'Bannimantap, Mysore', city: 'Mysore', state: 'Karnataka', pincode: '570015' },
  { name: 'Kuvempunagar', coordinates: [76.6028, 12.3411], address: 'Kuvempunagar, Mysore', city: 'Mysore', state: 'Karnataka', pincode: '570023' },
  { name: 'Srirampura', coordinates: [76.6945, 12.2906], address: 'Srirampura, Mysore', city: 'Mysore', state: 'Karnataka', pincode: '570008' },
  { name: 'Nazarbad', coordinates: [76.6578, 12.2964], address: 'Nazarbad, Mysore', city: 'Mysore', state: 'Karnataka', pincode: '570010' },
  { name: 'Hootagalli', coordinates: [76.5967, 12.3479], address: 'Hootagalli, Mysore', city: 'Mysore', state: 'Karnataka', pincode: '570018' },
  { name: 'Bogadi', coordinates: [76.5868, 12.3077], address: 'Bogadi, Mysore', city: 'Mysore', state: 'Karnataka', pincode: '570026' },
  { name: 'Kadakola', coordinates: [76.7604, 12.2136], address: 'Kadakola, Mysore (outskirts)', city: 'Mysore', state: 'Karnataka', pincode: '571311' },
  { name: 'Nanjangud Road', coordinates: [76.7002, 12.2118], address: 'Nanjangud Road, Mysore', city: 'Mysore', state: 'Karnataka', pincode: '570028' },
  { name: 'Varuna', coordinates: [76.5756, 12.1571], address: 'Varuna, Mysore (rural belt)', city: 'Mysore', state: 'Karnataka', pincode: '571311' },
  { name: 'T Narasipura Road', coordinates: [76.4837, 12.2662], address: 'T Narasipura Road, Mysore (outskirts)', city: 'Mysore', state: 'Karnataka', pincode: '570027' },
  { name: 'Belagola', coordinates: [76.7009, 12.3624], address: 'Belagola, Mysore (north side)', city: 'Mysore', state: 'Karnataka', pincode: '571606' },
];

const equipmentData = [
  { name: 'John Deere 5050D Tractor', description: 'Powerful 50 HP tractor suitable for all farming operations including plowing, tilling, and transportation.', category: 'Tractor', photos: [{ url: '/uploads/images/tractor1.jpeg', publicId: 'tractor1' }], specifications: { make: 'John Deere', model: '5050D', year: 2022, horsepower: 50, capacity: '1500 kg' } },
  { name: 'Mini Combine Harvester', description: 'Efficient harvester for wheat, paddy, and other grain crops. Saves time and labor.', category: 'Harvester', photos: [{ url: '/uploads/images/harvester1.jpeg', publicId: 'harvester1' }], specifications: { make: 'VST', model: 'Shakti', year: 2021, horsepower: 20, capacity: '1 acre/hour' } },
  { name: 'Rotary Tiller', description: 'Heavy-duty rotary tiller for soil preparation. Breaks soil clods and mixes crop residue.', category: 'Plough', photos: [{ url: '/uploads/images/tiller1.jpeg', publicId: 'tiller1' }], specifications: { make: 'Mahindra', model: 'RT-180', year: 2023, capacity: '1.8 m width' } },
  { name: 'Seed Drill Machine', description: 'Precision seeding equipment for uniform seed distribution and optimal germination.', category: 'Seeder', photos: [{ url: '/uploads/images/seeder1.jpeg', publicId: 'seeder1' }], specifications: { make: 'Fieldking', model: 'SD-9', year: 2022, capacity: '9 rows' } },
  { name: 'Power Sprayer', description: 'High-pressure sprayer for pesticides and fertilizers. Covers large areas efficiently.', category: 'Sprayer', photos: [{ url: '/uploads/images/sprayer1.jpeg', publicId: 'sprayer1' }], specifications: { make: 'Neptune', model: 'PS-400', year: 2023, capacity: '400 liters' } },
  { name: 'Swaraj 744 FE Tractor', description: 'Popular 48 HP tractor for ploughing and transport. Good mileage and low maintenance.', category: 'Tractor', photos: [{ url: '/uploads/images/tractor3.jpeg', publicId: 'tractor3' }], specifications: { make: 'Swaraj', model: '744 FE', year: 2020, horsepower: 48, capacity: '1500 kg' } },
  { name: 'Mahindra 275 DI XP Plus', description: 'Reliable 37 HP tractor for small and medium farms. Suitable for rotavator and trolley.', category: 'Tractor', photos: [{ url: '/uploads/images/tractor2.jpeg', publicId: 'tractor2' }], specifications: { make: 'Mahindra', model: '275 DI XP Plus', year: 2021, horsepower: 37, capacity: '1200 kg' } },
  { name: 'Thresher Machine', description: 'High output thresher for paddy and ragi. Reduces manual effort and improves throughput.', category: 'Thresher', photos: [{ url: '/uploads/images/thresher1.jpeg', publicId: 'thresher1' }], specifications: { make: 'Local', model: 'TH-900', year: 2022, capacity: '900 kg/hour' } },
  { name: 'Reversible MB Plough', description: 'Reversible mouldboard plough for deep tillage and soil turning. Ideal for field prep.', category: 'Plough', photos: [{ url: '/uploads/images/plougher1.jpeg', publicId: 'plougher1' }], specifications: { make: 'Fieldking', model: 'MB-2', year: 2023, capacity: '2 bottom' } },
  { name: 'Boom Sprayer', description: 'Wide boom sprayer for uniform pesticide application over large areas.', category: 'Sprayer', photos: [{ url: '/uploads/images/sprayer2.jpeg', publicId: 'sprayer2' }], specifications: { make: 'Aspee', model: 'BS-12', year: 2022, capacity: '12 m boom' } },
];

const reviewComments = {
  Tractor: [
    'Tractor was in excellent condition. Started well and handled all field work smoothly. Will rent again next season.',
    'Good tractor, fuel efficient. Owner was punctual and helpful. Completed my ploughing in half the time.',
    'Machine had minor issue with hydraulics initially but renter fixed it quickly. Overall good experience.',
    'Very powerful tractor. Covered 3 acres in a single day. Highly recommend to all farmers.',
    'Clean and well-maintained. The operator was experienced and completed the work without any delays.',
  ],
  Harvester: [
    'Harvester worked perfectly for paddy cutting. Saved 3 days of manual labor. Very happy with the service.',
    'Excellent machine for grain harvesting. Minimal wastage and fast throughput. Worth every rupee.',
    'Combine harvester arrived on time and the operator knew his job well. Smooth harvesting experience.',
    'Good condition harvester. Finished 5 acres of wheat in just one day. Will book again next season.',
    'Reliable machine. A bit old but still effective. The renter was cooperative throughout.',
  ],
  Plough: [
    'Rotary tiller did a great job on the hard clay soil. Soil preparation was done quickly and thoroughly.',
    'Excellent tillage work. Soil was well broken and ready for sowing the next day itself.',
    'MB Plough was heavy duty and handled our field perfectly. No mechanical issues during the session.',
    'Good depth tillage achieved. Equipment was clean and maintained. Operator was very professional.',
    'Soil came out perfectly after using this plough. My best field preparation experience so far.',
  ],
  Seeder: [
    'Seed drill worked with excellent precision. Uniform row spacing and good germination rate.',
    'Seeds were sown perfectly. Machine handled all types of seed sizes without any blockage.',
    'Very efficient seeder. Completed 4 acres in 3 hours. Saved a lot of time and seed cost too.',
    'Great machine for paddy sowing. Operator calibrated it correctly for our seed variety.',
    'Smooth operation throughout. Seed drill maintained consistent depth. Very satisfied.',
  ],
  Sprayer: [
    'Power sprayer covered all areas uniformly. Chemical usage was reduced compared to manual spraying.',
    'Good pressure and wide coverage. Completed pesticide spraying of 6 acres in one go.',
    'Boom sprayer gave excellent uniform coverage. No patches left. Crops look healthy now.',
    'Efficient sprayer. Operator knew the right nozzle settings for our crop. Very professional.',
    'Excellent machine for herbicide application. Fast and even coverage across the entire field.',
  ],
  Thresher: [
    'Thresher separated grain cleanly with minimal loss. Output was much better than manual threshing.',
    'Good machine. Handled ragi and paddy both without any issues. Highly recommended.',
    'Fast threshing operation. Completed 800 kg in one session. Clean grain output with no wastage.',
    'Thresher worked well. Operator maintained proper feeding speed to avoid jamming. Good experience.',
    'Reliable thresher. A bit noisy but highly effective. Got clean grain ready for storage same day.',
  ],
  Other: [
    'Equipment was in good condition and the renter was professional. Overall smooth experience.',
    'Good rental experience. Work was completed on time without any mechanical breakdowns.',
    'Satisfied with the service. Equipment performed as expected. Will use Farm Saarthi again.',
  ],
};

function getRandomComment(category) {
  const comments = reviewComments[category] || reviewComments['Other'];
  return comments[Math.floor(Math.random() * comments.length)];
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function pastDate(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(0, 0, 0, 0);
  return d;
}

const timeSlots = [
  { startTime: '07:00', endTime: '11:00', duration: 4 },
  { startTime: '08:00', endTime: '13:00', duration: 5 },
  { startTime: '09:00', endTime: '14:00', duration: 5 },
  { startTime: '06:00', endTime: '10:00', duration: 4 },
  { startTime: '10:00', endTime: '15:00', duration: 5 },
  { startTime: '07:00', endTime: '12:00', duration: 5 },
];

const seedDatabase = async () => {
  try {
    await connectDB();

    // Clear all existing data
    await User.deleteMany({ role: { $in: ['farmer', 'renter'] } });
    await Equipment.deleteMany({});
    await Booking.deleteMany({});
    await Payment.deleteMany({});
    await Review.deleteMany({});
    console.log('Existing data cleared');

    // ── Farmers ─────────────────────────────────────────────────────────────
    const farmerNames = ['Raju Gowda', 'Siddappa Naik', 'Manjunath B', 'Venkatesh M', 'Krishnappa R', 'Hanumanthappa'];
    const farmers = [];
    for (let i = 0; i < 6; i++) {
      const loc = mysoreLocations[i];
      const farmer = await User.create({
        name: farmerNames[i],
        phone: `900000000${i}`,
        role: 'farmer',
        location: { type: 'Point', coordinates: loc.coordinates, address: loc.address, city: loc.city, state: loc.state, pincode: loc.pincode },
        isVerified: true,
      });
      farmers.push(farmer);
    }
    console.log(`${farmers.length} farmers created`);

    // ── Renters + Equipment ──────────────────────────────────────────────────
    const renterNames = ['Agro Rentals Mysore', 'Krishna Farm Services', 'Gowda Machinery', 'Sri Laxmi Agro', 'Nandi Farm Equipments'];
    const renters = [];
    const allEquipment = [];

    for (let i = 0; i < 5; i++) {
      const loc = mysoreLocations[i + 6];
      const renter = await User.create({
        name: renterNames[i],
        phone: `910000000${i}`,
        role: 'renter',
        location: { type: 'Point', coordinates: loc.coordinates, address: loc.address, city: loc.city, state: loc.state, pincode: loc.pincode },
        isVerified: true,
      });
      renters.push(renter);

      for (let j = 0; j < 2; j++) {
        const idx = i * 2 + j;
        const ed = equipmentData[idx % equipmentData.length];
        const eloc = mysoreLocations[(i + 6 + idx) % mysoreLocations.length];
        const equipment = await Equipment.create({
          owner: renter._id,
          name: ed.name,
          description: ed.description,
          category: ed.category,
          photos: ed.photos,
          pricing: { perHour: 500 + (idx % 6) * 80, perKm: 20 + (idx % 5) * 4 },
          location: { type: 'Point', coordinates: eloc.coordinates, address: eloc.address, city: eloc.city, state: eloc.state },
          specifications: ed.specifications,
          availability: { isAvailable: true, schedule: [] },
          verificationStatus: 'verified',
        });
        renter.equipmentListed.push(equipment._id);
        allEquipment.push({ equipment, renter });
      }
      await renter.save();
    }
    console.log(`${renters.length} renters with ${allEquipment.length} equipment created`);

    // ── Bookings, Payments, Reviews ──────────────────────────────────────────
    // Each farmer gets:
    //   - 1 completed booking WITH review already done  → shows "✓ Reviewed"
    //   - 1 completed booking WITHOUT review            → shows "Write Review" button
    //   - 1 upcoming confirmed booking                  → shows "Cancel Booking"

    for (let fi = 0; fi < farmers.length; fi++) {
      const farmer = farmers[fi];
      const fc = farmer.location.coordinates;

      for (let b = 0; b < 2; b++) {
        const { equipment, renter } = allEquipment[(fi * 2 + b) % allEquipment.length];
        const ec = equipment.location.coordinates;
        const distance = parseFloat(calculateDistance(fc[1], fc[0], ec[1], ec[0]).toFixed(2));
        const slot = timeSlots[(fi + b) % timeSlots.length];
        const bookingDate = pastDate(15 + fi * 7 + b * 5);

        const totalHoursCost = equipment.pricing.perHour * slot.duration;
        const totalDistanceCost = equipment.pricing.perKm * distance;
        const totalCost = totalHoursCost + totalDistanceCost;
        const serviceCharge = parseFloat((totalCost * 0.1).toFixed(2));
        const remainingPayment = parseFloat((totalCost - serviceCharge).toFixed(2));

        const booking = await Booking.create({
          equipment: equipment._id,
          farmer: farmer._id,
          renter: renter._id,
          bookingDate,
          timeSlot: { startTime: slot.startTime, endTime: slot.endTime, duration: slot.duration },
          pickupLocation: { type: 'Point', coordinates: fc, address: farmer.location.address },
          distance,
          pricing: { hourlyRate: equipment.pricing.perHour, perKmRate: equipment.pricing.perKm, totalHoursCost, totalDistanceCost, totalCost, serviceCharge, remainingPayment },
          status: 'completed',
          paymentStatus: { advance: true, full: true, advancePaymentId: `pay_adv_${fi}_${b}`, fullPaymentId: `pay_full_${fi}_${b}` },
        });

        // Payments
        await Payment.create({ booking: booking._id, farmer: farmer._id, renter: renter._id, amount: serviceCharge, paymentType: 'advance', paymentMethod: 'razorpay', razorpay: { orderId: `order_adv_${fi}_${b}`, paymentId: `pay_adv_${fi}_${b}`, signature: 'seeded' }, status: 'completed', transactionDate: bookingDate });
        await Payment.create({ booking: booking._id, farmer: farmer._id, renter: renter._id, amount: remainingPayment, paymentType: 'full', paymentMethod: 'razorpay', razorpay: { orderId: `order_full_${fi}_${b}`, paymentId: `pay_full_${fi}_${b}`, signature: 'seeded' }, status: 'completed', transactionDate: bookingDate });

        // Update user stats
        await User.findByIdAndUpdate(farmer._id, { $push: { bookingHistory: booking._id }, $inc: { totalSpent: totalCost } });
        await User.findByIdAndUpdate(renter._id, { $inc: { totalEarnings: totalCost } });

        // Update equipment schedule
        equipment.availability.schedule.push({ date: bookingDate, slots: [{ startTime: slot.startTime, endTime: slot.endTime, isBooked: true, bookingId: booking._id }] });
        equipment.totalBookings += 1;
        await equipment.save();

        // b=0 → review submitted, b=1 → review pending (Write Review button will show)
        if (b === 0) {
          const rating = 3 + Math.floor(Math.random() * 3); // 3, 4, or 5
          const review = await Review.create({
            booking: booking._id,
            equipment: equipment._id,
            farmer: farmer._id,
            renter: renter._id,
            rating,
            comment: getRandomComment(equipment.category),
            isVerified: true,
          });
          booking.review = review._id;
          await booking.save();
        }
      }

      // Upcoming confirmed booking
      const { equipment: upEquip, renter: upRenter } = allEquipment[(fi + 3) % allEquipment.length];
      const uc = upEquip.location.coordinates;
      const upDistance = parseFloat(calculateDistance(fc[1], fc[0], uc[1], uc[0]).toFixed(2));
      const upSlot = timeSlots[(fi + 3) % timeSlots.length];
      const upDate = new Date();
      upDate.setDate(upDate.getDate() + 3 + fi);
      upDate.setHours(0, 0, 0, 0);
      const upTotal = upEquip.pricing.perHour * upSlot.duration + upEquip.pricing.perKm * upDistance;
      const upServiceCharge = parseFloat((upTotal * 0.1).toFixed(2));

      const upBooking = await Booking.create({
        equipment: upEquip._id,
        farmer: farmer._id,
        renter: upRenter._id,
        bookingDate: upDate,
        timeSlot: { startTime: upSlot.startTime, endTime: upSlot.endTime, duration: upSlot.duration },
        pickupLocation: { type: 'Point', coordinates: fc, address: farmer.location.address },
        distance: upDistance,
        pricing: { hourlyRate: upEquip.pricing.perHour, perKmRate: upEquip.pricing.perKm, totalHoursCost: upEquip.pricing.perHour * upSlot.duration, totalDistanceCost: upEquip.pricing.perKm * upDistance, totalCost: upTotal, serviceCharge: upServiceCharge, remainingPayment: parseFloat((upTotal - upServiceCharge).toFixed(2)) },
        status: 'confirmed',
        paymentStatus: { advance: true, advancePaymentId: `pay_up_${fi}` },
      });
      await User.findByIdAndUpdate(farmer._id, { $push: { bookingHistory: upBooking._id } });
    }

    // ── Recalculate ratings ──────────────────────────────────────────────────
    for (const { equipment } of allEquipment) {
      const revs = await Review.find({ equipment: equipment._id });
      if (revs.length > 0) {
        const avg = revs.reduce((s, r) => s + r.rating, 0) / revs.length;
        await Equipment.findByIdAndUpdate(equipment._id, { averageRating: parseFloat(avg.toFixed(1)), totalReviews: revs.length });
      }
    }
    for (const { renter } of allEquipment) {
      const revs = await Review.find({ renter: renter._id });
      if (revs.length > 0) {
        const avg = revs.reduce((s, r) => s + r.rating, 0) / revs.length;
        await User.findByIdAndUpdate(renter._id, { averageRating: parseFloat(avg.toFixed(1)), totalReviews: revs.length });
      }
    }

    // ── Admin ────────────────────────────────────────────────────────────────
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      await User.create({ name: 'Admin', phone: '9999999999', role: 'admin', location: { type: 'Point', coordinates: [76.6394, 12.2958], address: 'Admin Office, Mysore', city: 'Mysore', state: 'Karnataka', pincode: '570001' }, isVerified: true });
      console.log('Admin user created');
    }

    const totalBookings = await Booking.countDocuments();
    const totalReviews = await Review.countDocuments();
    const totalPayments = await Payment.countDocuments();

    console.log('\n Database seeded successfully!');
    console.log(`   Farmers   : ${farmers.length}  (phones: 9000000000 to 900000000${farmers.length - 1})`);
    console.log(`   Renters   : ${renters.length}  (phones: 9100000000 to 910000000${renters.length - 1})`);
    console.log(`   Equipment : ${allEquipment.length}`);
    console.log(`   Bookings  : ${totalBookings}`);
    console.log(`   Reviews   : ${totalReviews}`);
    console.log(`   Payments  : ${totalPayments}`);
    console.log(`   Admin     : 9999999999`);
    console.log('\nWhat each farmer sees in their dashboard:');
    console.log('   ✓ Completed booking #1  →  "✓ Reviewed" (review already submitted)');
    console.log('   ✓ Completed booking #2  →  "Write Review" button active');
    console.log('   ✓ Upcoming booking      →  "Cancel Booking" button active');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();