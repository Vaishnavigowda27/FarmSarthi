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
  // ~10-15 km ring
  {
    name: 'Srirampura',
    coordinates: [76.6945, 12.2906],
    address: 'Srirampura, Mysore',
    city: 'Mysore',
    state: 'Karnataka',
    pincode: '570008',
  },
  {
    name: 'Nazarbad',
    coordinates: [76.6578, 12.2964],
    address: 'Nazarbad, Mysore',
    city: 'Mysore',
    state: 'Karnataka',
    pincode: '570010',
  },
  {
    name: 'Hootagalli',
    coordinates: [76.5967, 12.3479],
    address: 'Hootagalli, Mysore',
    city: 'Mysore',
    state: 'Karnataka',
    pincode: '570018',
  },
  {
    name: 'Bogadi',
    coordinates: [76.5868, 12.3077],
    address: 'Bogadi, Mysore',
    city: 'Mysore',
    state: 'Karnataka',
    pincode: '570026',
  },
  {
    name: 'Kadakola',
    coordinates: [76.7604, 12.2136],
    address: 'Kadakola, Mysore (outskirts)',
    city: 'Mysore',
    state: 'Karnataka',
    pincode: '571311',
  },
  // ~20-25 km ring
  {
    name: 'Nanjangud Road',
    coordinates: [76.7002, 12.2118],
    address: 'Nanjangud Road, Mysore (towards Nanjangud)',
    city: 'Mysore',
    state: 'Karnataka',
    pincode: '570028',
  },
  {
    name: 'Varuna',
    coordinates: [76.5756, 12.1571],
    address: 'Varuna, Mysore (rural belt)',
    city: 'Mysore',
    state: 'Karnataka',
    pincode: '571311',
  },
  {
    name: 'T Narasipura Road',
    coordinates: [76.4837, 12.2662],
    address: 'T Narasipura Road, Mysore (outskirts)',
    city: 'Mysore',
    state: 'Karnataka',
    pincode: '570027',
  },
  {
    name: 'Belagola',
    coordinates: [76.7009, 12.3624],
    address: 'Belagola, Mysore (north side)',
    city: 'Mysore',
    state: 'Karnataka',
    pincode: '571606',
  },
];

const equipmentData = [
  {
    name: 'John Deere 5050D Tractor',
    description:
      'Powerful 50 HP tractor suitable for all farming operations including plowing, tilling, and transportation.',
    category: 'Tractor',
    photos: [{ url: '/uploads/images/tractor1.jpeg', publicId: 'tractor1' }],
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
    photos: [{ url: '/uploads/images/harvester1.jpeg', publicId: 'harvester1' }],
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
    photos: [{ url: '/uploads/images/tiller1.jpeg', publicId: 'tiller1' }],
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
    photos: [{ url: '/uploads/images/seeder1.jpeg', publicId: 'seeder1' }],
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
    photos: [{ url: '/uploads/images/sprayer1.jpeg', publicId: 'sprayer1' }],
    specifications: {
      make: 'Neptune',
      model: 'PS-400',
      year: 2023,
      capacity: '400 liters',
    },
  },
  {
    name: 'Swaraj 744 FE Tractor',
    description:
      'Popular 48 HP tractor for ploughing and transport. Good mileage and low maintenance.',
    category: 'Tractor',
    photos: [{ url: '/uploads/images/tractor3.jpeg', publicId: 'tractor3' }],
    specifications: {
      make: 'Swaraj',
      model: '744 FE',
      year: 2020,
      horsepower: 48,
      capacity: '1500 kg',
    },
  },
  {
    name: 'Mahindra 275 DI XP Plus',
    description:
      'Reliable 37 HP tractor for small and medium farms. Suitable for rotavator and trolley.',
    category: 'Tractor',
    photos: [{ url: '/uploads/images/tractor2.jpeg', publicId: 'tractor2' }],
    specifications: {
      make: 'Mahindra',
      model: '275 DI XP Plus',
      year: 2021,
      horsepower: 37,
      capacity: '1200 kg',
    },
  },
  {
    name: 'Thresher Machine',
    description:
      'High output thresher for paddy and ragi. Reduces manual effort and improves throughput.',
    category: 'Thresher',
    photos: [{ url: '/uploads/images/thresher1.jpeg', publicId: 'thresher1' }],
    specifications: {
      make: 'Local',
      model: 'TH-900',
      year: 2022,
      capacity: '900 kg/hour',
    },
  },
  {
    name: 'Reversible MB Plough',
    description:
      'Reversible mouldboard plough for deep tillage and soil turning. Ideal for field prep.',
    category: 'Plough',
    photos: [{ url: '/uploads/images/plougher1.jpeg', publicId: 'plougher1' }],
    specifications: {
      make: 'Fieldking',
      model: 'MB-2',
      year: 2023,
      capacity: '2 bottom',
    },
  },
  {
    name: 'Boom Sprayer',
    description:
      'Wide boom sprayer for uniform pesticide application over large areas.',
    category: 'Sprayer',
    photos: [{ url: '/uploads/images/sprayer2.jpeg', publicId: 'sprayer2' }],
    specifications: {
      make: 'Aspee',
      model: 'BS-12',
      year: 2022,
      capacity: '12 m boom',
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

    // Create farmers (spread across core Mysore areas)
    const farmers = [];
    for (let i = 0; i < 6; i++) {
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

    // Create renters with multiple equipment (owners have many listings)
    const renters = [];
    const renterCount = 5;
    const equipmentPerRenter = 2;

    for (let i = 0; i < renterCount; i++) {
      const location = mysoreLocations[i + 6];
      const renter = await User.create({
        name: `Agro Rentals ${i + 1}`,
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

      for (let j = 0; j < equipmentPerRenter; j++) {
        const idx = i * equipmentPerRenter + j;
        const equipData = equipmentData[idx] || equipmentData[idx % equipmentData.length];
        const equipLocation = mysoreLocations[(i + 6 + idx) % mysoreLocations.length];

        const equipment = await Equipment.create({
          owner: renter._id,
          name: equipData.name,
          description: equipData.description,
          category: equipData.category,
          photos:  equipData.photos,
          pricing: {
            perHour: 500 + (idx % 6) * 80,
            perKm: 20 + (idx % 5) * 4,
          },
          location: {
            type: 'Point',
            coordinates: equipLocation.coordinates,
            address: equipLocation.address,
            city: equipLocation.city,
            state: equipLocation.state,
          },
          specifications: equipData.specifications,
          availability: {
            isAvailable: true,
            schedule: [],
          },
          // Seed as verified so farmers can immediately test radius filters.
          verificationStatus: 'verified',
        });

        renter.equipmentListed.push(equipment._id);
      }
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
    console.log('\nSample Credentials (OTP via SMS / console in dev):');
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