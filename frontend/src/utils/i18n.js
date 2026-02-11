import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Common
      welcome: 'Welcome to AgroRen',
      loading: 'Loading...',
      search: 'Search',
      cancel: 'Cancel',
      submit: 'Submit',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      back: 'Back',
      next: 'Next',
      confirm: 'Confirm',
      
      // Auth
      login: 'Login',
      register: 'Register',
      logout: 'Logout',
      email: 'Email',
      password: 'Password',
      name: 'Name',
      phone: 'Phone Number',
      role: 'Role',
      farmer: 'Farmer',
      renter: 'Equipment Owner',
      
      // Navigation
      home: 'Home',
      dashboard: 'Dashboard',
      equipment: 'Equipment',
      bookings: 'Bookings',
      notifications: 'Notifications',
      profile: 'Profile',
      
      // Equipment
      searchEquipment: 'Search Equipment',
      equipmentType: 'Equipment Type',
      pricePerDay: 'Price Per Day',
      viewDetails: 'View Details',
      bookNow: 'Book Now',
      addEquipment: 'Add Equipment',
      myEquipment: 'My Equipment',
      nearbyEquipment: 'Nearby Equipment',
      
      // Booking
      bookingDetails: 'Booking Details',
      startDate: 'Start Date',
      endDate: 'End Date',
      totalAmount: 'Total Amount',
      advancePayment: 'Advance Payment',
      payNow: 'Pay Now',
      cancelBooking: 'Cancel Booking',
      
      // Types
      tractor: 'Tractor',
      harvester: 'Harvester',
      plough: 'Plough',
      seeder: 'Seeder',
      sprayer: 'Sprayer',
      cultivator: 'Cultivator',
      thresher: 'Thresher',
      other: 'Other',
    },
  },
  kn: {
    translation: {
      // Common
      welcome: 'ಅಗ್ರೋರೆನ್‌ಗೆ ಸುಸ್ವಾಗತ',
      loading: 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...',
      search: 'ಹುಡುಕಿ',
      cancel: 'ರದ್ದುಗೊಳಿಸಿ',
      submit: 'ಸಲ್ಲಿಸಿ',
      save: 'ಉಳಿಸಿ',
      delete: 'ಅಳಿಸಿ',
      edit: 'ಸಂಪಾದಿಸಿ',
      back: 'ಹಿಂದೆ',
      next: 'ಮುಂದೆ',
      confirm: 'ಖಚಿತಪಡಿಸಿ',
      
      // Auth
      login: 'ಲಾಗಿನ್',
      register: 'ನೋಂದಣಿ',
      logout: 'ಲಾಗ್ ಔಟ್',
      email: 'ಇಮೇಲ್',
      password: 'ಪಾಸ್ವರ್ಡ್',
      name: 'ಹೆಸರು',
      phone: 'ಫೋನ್ ಸಂಖ್ಯೆ',
      role: 'ಪಾತ್ರ',
      farmer: 'ರೈತ',
      renter: 'ಉಪಕರಣ ಮಾಲೀಕ',
      
      // Navigation
      home: 'ಮುಖಪುಟ',
      dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
      equipment: 'ಉಪಕರಣಗಳು',
      bookings: 'ಬುಕ್ಕಿಂಗ್‌ಗಳು',
      notifications: 'ಅಧಿಸೂಚನೆಗಳು',
      profile: 'ಪ್ರೊಫೈಲ್',
      
      // Equipment
      searchEquipment: 'ಉಪಕರಣ ಹುಡುಕಿ',
      equipmentType: 'ಉಪಕರಣ ಪ್ರಕಾರ',
      pricePerDay: 'ದಿನಕ್ಕೆ ಬೆಲೆ',
      viewDetails: 'ವಿವರಗಳನ್ನು ನೋಡಿ',
      bookNow: 'ಈಗ ಬುಕ್ ಮಾಡಿ',
      addEquipment: 'ಉಪಕರಣ ಸೇರಿಸಿ',
      myEquipment: 'ನನ್ನ ಉಪಕರಣಗಳು',
      nearbyEquipment: 'ಹತ್ತಿರದ ಉಪಕರಣಗಳು',
      
      // Booking
      bookingDetails: 'ಬುಕ್ಕಿಂಗ್ ವಿವರಗಳು',
      startDate: 'ಪ್ರಾರಂಭ ದಿನಾಂಕ',
      endDate: 'ಕೊನೆಯ ದಿನಾಂಕ',
      totalAmount: 'ಒಟ್ಟು ಮೊತ್ತ',
      advancePayment: 'ಮುಂಗಡ ಪಾವತಿ',
      payNow: 'ಈಗ ಪಾವತಿಸಿ',
      cancelBooking: 'ಬುಕ್ಕಿಂಗ್ ರದ್ದುಗೊಳಿಸಿ',
      
      // Types
      tractor: 'ಟ್ರಾಕ್ಟರ್',
      harvester: 'ಹಾರ್ವೆಸ್ಟರ್',
      plough: 'ನೇಗಿಲು',
      seeder: 'ಬೀಜ ಯಂತ್ರ',
      sprayer: 'ಸಿಂಪಡಣೆ ಯಂತ್ರ',
      cultivator: 'ಕಲ್ಟಿವೇಟರ್',
      thresher: 'ಥ್ರೆಶರ್',
      other: 'ಇತರೆ',
    },
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
