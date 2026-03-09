import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Equipment from './models/Equipment.js';
import connectDB from './config/db.js';

dotenv.config();

// Mysore, Karnataka coordinates
const mysoreLocations = [
  {
    name: 'Mysore Palace Area',
    coordinates: [76.6547, 12.3051],
    address: 'Near Mysore Palace, Mysore',
    city: 'Mysore',
    state: 'Karnataka',
    pincode: '570001',
  },
  {
    name: 'Chamundi Hills',
    coordinates: [76.6727, 12.2724],
    address: 'Chamundi Hills Road, Mysore',
    city: 'Mysore',
    state: 'Karnataka',
    pincode: '570008',
  },
  {
    name: 'Hebbal',
    coordinates: [76.6411, 12.3375],
    address: 'Hebbal, Mysore',
    city: 'Mysore',
    state: 'Karnataka',
    pincode: '570016',
  },
  {
    name: 'Vijayanagar',
    coordinates: [76.6194, 12.2958],
    address: 'Vijayanagar, Mysore',
    city: 'Mysore',
    state: 'Karnataka',
    pincode: '570017',
  },
  {
    name: 'Jayalakshmipuram',
    coordinates: [76.6294, 12.3258],
    address: 'Jayalakshmipuram, Mysore',
    city: 'Mysore',
    state: 'Karnataka',
    pincode: '570012',
  },
  {
    name: 'Gokulam',
    coordinates: [76.6161, 12.2847],
    address: 'Gokulam, Mysore',
    city: 'Mysore',
    state: 'Karnataka',
    pincode: '570002',
  },
  {
    name: 'Bannimantap',
    coordinates: [76.6811, 12.2958],
    address: 'Bannimantap, Mysore',
    city: 'Mysore',
    state: 'Karnataka',
    pincode: '570015',
  },
  {
    name: 'Kuvempunagar',
    coordinates: [76.6028, 12.3411],
    address: 'Kuvempunagar, Mysore',
    city: 'Mysore',
    state: 'Karnataka',
    pincode: '570023',
  },
];

const equipmentData = [
  {
    name: 'John Deere 5050D Tractor',
    description:
      'Powerful 50 HP tractor suitable for all farming operations including plowing, tilling, and transportation.',
    category: 'Tractor',
    specifications: {
      make: 'John Deere',
      model: '5050D',
      year: 2022,
      horsepower: 50,
      capacity: '1500 kg',
    },
  },
  {
    name: 'Mini Combine Harvester',
    description:
      'Efficient harvester for wheat, paddy, and other grain crops. Saves time and labor.',
    category: 'Harvester',
    specifications: {
      make: 'VST',
      model: 'Shakti',
      year: 2021,
      horsepower: 20,
      capacity: '1 acre/hour',
    },
  },
  {
    name: 'Rotary Tiller',
    description:
      'Heavy-duty rotary tiller for soil preparation. Breaks soil clods and mixes crop residue.',
    category: 'Plough',
    specifications: {
      make: 'Mahindra',
      model: 'RT-180',
      year: 2023,
      capacity: '1.8 m width',
    },
  },
  {
    name: 'Seed Drill Machine',
    description:
      'Precision seeding equipment for uniform seed distribution and optimal germination.',
    category: 'Seeder',
    specifications: {
      make: 'Fieldking',
      model: 'SD-9',
      year: 2022,
      capacity: '9 rows',
    },
  },
  {
    name: 'Power Sprayer',
    description:
      'High-pressure sprayer for pesticides and fertilizers. Covers large areas efficiently.',
    category: 'Sprayer',
    specifications: {
      make: 'Neptune',
      model: 'PS-400',
      year: 2023,
      capacity: '400 liters',
    },
  },
];

const seedDatabase = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany({ role: { $in: ['farmer', 'renter'] } });
    await Equipment.deleteMany({});

    console.log('Existing data cleared');

    // Create farmers
    const farmers = [];
    for (let i = 0; i < 4; i++) {
      const location = mysoreLocations[i];
      const farmer = await User.create({
        name: `Farmer ${i + 1}`,
        phone: `900000000${i}`,
        role: 'farmer',
        location: {
          type: 'Point',
          coordinates: location.coordinates,
          address: location.address,
          city: location.city,
          state: location.state,
          pincode: location.pincode,
        },
        isVerified: true,
      });
      farmers.push(farmer);
    }

    console.log(`${farmers.length} farmers created`);

    // Create renters with equipment
    const renters = [];
    for (let i = 0; i < 4; i++) {
      const location = mysoreLocations[i + 4];
      const renter = await User.create({
        name: `Renter ${i + 1}`,
        phone: `910000000${i}`,
        role: 'renter',
        location: {
          type: 'Point',
          coordinates: location.coordinates,
          address: location.address,
          city: location.city,
          state: location.state,
          pincode: location.pincode,
        },
        isVerified: true,
      });
      renters.push(renter);

      // Create equipment for each renter
      const equipData = equipmentData[i] || equipmentData[0];
      const equipment = await Equipment.create({
        owner: renter._id,
        name: equipData.name,
        description: equipData.description,
        category: equipData.category,
        pricing: {
          perHour: 500 + i * 100,
          perKm: 20 + i * 5,
        },
        location: {
          type: 'Point',
          coordinates: location.coordinates,
          address: location.address,
          city: location.city,
          state: location.state,
        },
        specifications: equipData.specifications,
        availability: {
          isAvailable: true,
          schedule: [],
        },
        verificationStatus: 'verified',
      });

      renter.equipmentListed.push(equipment._id);
      await renter.save();
    }

    console.log(`${renters.length} renters with equipment created`);

    // Create admin user if not exists
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      await User.create({
        name: 'Admin',
        phone: '9999999999',
        role: 'admin',
        location: {
          type: 'Point',
          coordinates: [76.6394, 12.2958],
          address: 'Admin Office, Mysore',
          city: 'Mysore',
          state: 'Karnataka',
          pincode: '570001',
        },
        isVerified: true,
      });
      console.log('Admin user created');
    }

    console.log('✅ Database seeded successfully with Mysore locations!');
    console.log('\nSample Credentials (OTP verified via Firebase):');
    console.log('Farmer: Phone - 9000000000');
    console.log('Renter: Phone - 9100000000');
    console.log('Admin: Phone - 9999999999');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();