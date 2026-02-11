// Mock API - No backend needed for testing

const MOCK_OTP = "123456"; // Always accept this OTP

// Mock data storage (in-memory)
const mockData = {
  users: [
    {
      _id: '1',
      name: 'Ravi Kumar',
      phone: '+919876543210',
      role: 'farmer',
      latitude: 12.2958,
      longitude: 76.6394
    },
    {
      _id: '2',
      name: 'Ramesh Patil',
      phone: '+919876543211',
      role: 'renter',
      latitude: 12.3000,
      longitude: 76.6400
    },
    {
      _id: '3',
      name: 'Admin User',
      phone: '+919876543212',
      role: 'admin',
      latitude: 12.2958,
      longitude: 76.6394
    }
  ],
  equipments: [
    {
      _id: 'eq1',
      name: 'Tractor - Mahindra 575',
      description: 'Powerful tractor suitable for all farming needs',
      pricePerHour: 500,
      pricePerKm: 50,
      distance: 3,
      owner: { _id: '2', name: 'Ramesh Patil', phone: '+919876543211' },
      photos: []
    },
    {
      _id: 'eq2',
      name: 'Harvester - John Deere',
      description: 'Modern combine harvester for large farms',
      pricePerHour: 800,
      pricePerKm: 80,
      distance: 5,
      owner: { _id: '2', name: 'Ramesh Patil', phone: '+919876543211' },
      photos: []
    },
    {
      _id: 'eq3',
      name: 'Sprayer - STIHL',
      description: 'Efficient pesticide sprayer',
      pricePerHour: 300,
      pricePerKm: 30,
      distance: 7,
      owner: { _id: '2', name: 'Ramesh Patil', phone: '+919876543211' },
      photos: []
    },
    {
      _id: 'eq4',
      name: 'Plough - Modern Heavy Duty',
      description: 'Heavy duty plough for tough soil',
      pricePerHour: 400,
      pricePerKm: 40,
      distance: 9,
      owner: { _id: '2', name: 'Ramesh Patil', phone: '+919876543211' },
      photos: []
    }
  ],
  bookings: [
    {
      _id: 'b1',
      equipment: {
        _id: 'eq1',
        name: 'Tractor - Mahindra 575',
        pricePerHour: 500,
        owner: { name: 'Ramesh Patil' }
      },
      farmer: { _id: '1', name: 'Ravi Kumar', phone: '+919876543210' },
      startTime: new Date('2024-02-05T08:00:00'),
      hours: 4,
      totalAmount: 2000,
      advanceAmount: 1000,
      status: 'confirmed'
    },
    {
      _id: 'b2',
      equipment: {
        _id: 'eq2',
        name: 'Harvester - John Deere',
        pricePerHour: 800,
        owner: { name: 'Ramesh Patil' }
      },
      farmer: { _id: '1', name: 'Ravi Kumar', phone: '+919876543210' },
      startTime: new Date('2024-02-10T10:00:00'),
      hours: 6,
      totalAmount: 4800,
      advanceAmount: 1500,
      status: 'pending'
    }
  ]
};

// Mock API object
const mockAPI = {
  // Auth endpoints
  post: async (url, data) => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

    // Send OTP
    if (url === '/auth/send-otp') {
      console.log('📱 Mock OTP sent:', MOCK_OTP);
      alert(`Mock OTP: ${MOCK_OTP}\n(Use this to login/register)`);
      return { data: { message: 'OTP sent' } };
    }

    // Verify OTP for registration
    if (url === '/auth/verify-otp') {
      if (data.otp === MOCK_OTP) {
        return { data: { message: 'OTP verified' } };
      }
      throw { response: { data: { message: 'Invalid OTP' } } };
    }

    // Login
    if (url === '/auth/login') {
      if (data.otp === MOCK_OTP) {
        const user = mockData.users.find(u => u.phone === data.phone);
        if (user) {
          return {
            data: {
              token: 'mock-jwt-token-' + user._id,
              user: user
            }
          };
        }
        throw { response: { data: { message: 'User not found. Please register first.' } } };
      }
      throw { response: { data: { message: 'Invalid OTP. Use: ' + MOCK_OTP } } };
    }

    // Register
    if (url === '/auth/register') {
      const newUser = {
        _id: Date.now().toString(),
        name: data.name,
        phone: data.phone,
        role: data.role,
        latitude: data.latitude,
        longitude: data.longitude
      };
      mockData.users.push(newUser);
      return {
        data: {
          token: 'mock-jwt-token-' + newUser._id,
          user: newUser
        }
      };
    }

    // Add equipment
    if (url === '/equipments') {
      const newEquipment = {
        _id: 'eq' + Date.now(),
        ...data,
        owner: JSON.parse(localStorage.getItem('user')),
        distance: 0
      };
      mockData.equipments.push(newEquipment);
      return { data: newEquipment };
    }

    // Create booking
    if (url === '/bookings') {
      const equipment = mockData.equipments.find(e => e._id === data.equipmentId);
      const user = JSON.parse(localStorage.getItem('user'));
      const totalAmount = equipment.pricePerHour * data.hours;
      const advanceAmount = Math.round(totalAmount * 0.10); // 10% advance
      
      const newBooking = {
        _id: 'b' + Date.now(),
        equipment: {
          _id: equipment._id,
          name: equipment.name,
          pricePerHour: equipment.pricePerHour,
          owner: equipment.owner
        },
        farmer: user,
        startTime: data.startTime,
        hours: data.hours,
        totalAmount: totalAmount,
        advanceAmount: advanceAmount,
        status: 'pending'
      };
      mockData.bookings.push(newBooking);
      return { data: { booking: newBooking } };
    }

    // Create payment order
    if (url === '/payments/create-order') {
      return {
        data: {
          orderId: 'order_mock_' + Date.now(),
          amount: 100000 // 1000 rupees in paise
        }
      };
    }

    // Verify payment
    if (url === '/payments/verify') {
      const booking = mockData.bookings.find(b => b._id === data.bookingId);
      if (booking) {
        booking.status = 'confirmed';
      }
      return { data: { message: 'Payment verified' } };
    }

    throw { response: { data: { message: 'Mock API: Endpoint not found' } } };
  },

  // Get endpoints
  get: async (url) => {
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay

    // Get nearby equipment
    if (url === '/equipments/nearby') {
      return { data: mockData.equipments };
    }

    // Get my equipment (renter)
    if (url === '/equipments/my-equipments') {
      const user = JSON.parse(localStorage.getItem('user'));
      return { data: mockData.equipments.filter(e => e.owner._id === user._id) };
    }

    // Get farmer bookings
    if (url === '/bookings/my-bookings') {
      const user = JSON.parse(localStorage.getItem('user'));
      return { data: mockData.bookings.filter(b => b.farmer._id === user._id) };
    }

    // Get renter bookings
    if (url === '/bookings/renter-bookings') {
      const user = JSON.parse(localStorage.getItem('user'));
      return { data: mockData.bookings.filter(b => b.equipment.owner._id === user._id) };
    }

    // Get single booking
    if (url.startsWith('/bookings/')) {
      const bookingId = url.split('/')[2];
      const booking = mockData.bookings.find(b => b._id === bookingId);
      return { data: booking };
    }

    // Farmer dashboard stats
    if (url === '/farmer/dashboard') {
      const user = JSON.parse(localStorage.getItem('user'));
      const userBookings = mockData.bookings.filter(b => b.farmer._id === user._id);
      return {
        data: {
          stats: {
            activeBookings: userBookings.filter(b => b.status === 'confirmed').length,
            completedBookings: userBookings.filter(b => b.status === 'completed').length,
            totalSpent: userBookings.reduce((sum, b) => sum + b.advanceAmount, 0)
          },
          recentBookings: userBookings.slice(0, 5)
        }
      };
    }

    // Admin endpoints
    if (url === '/admin/stats') {
      return {
        data: {
          users: mockData.users.length,
          equipments: mockData.equipments.length,
          bookings: mockData.bookings.length,
          conflicts: 0
        }
      };
    }

    if (url === '/admin/users') {
      return { data: mockData.users };
    }

    if (url === '/admin/equipments') {
      return { data: mockData.equipments };
    }

    if (url === '/admin/conflicts') {
      return { data: [] };
    }

    throw { response: { data: { message: 'Mock API: Endpoint not found' } } };
  }
};

export default mockAPI;