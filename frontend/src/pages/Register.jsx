import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { getCurrentLocation, showToast } from '../utils/helpers';

const Register = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register, sendOTP } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    otp: '',
    role: 'farmer',
    location: {
      coordinates: [],
      address: '',
      city: 'Mysore',
      state: 'Karnataka',
      pincode: ''
    }
  });

  // Handle phone input - only digits, max 10
  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData({ ...formData, phone: value });
  };

  // Handle OTP input - only digits, max 6
  const handleOTPChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setFormData({ ...formData, otp: value });
  };

  const handleGetLocation = async () => {
    try {
      setLoading(true);
      const coords = await getCurrentLocation();
      setFormData({
        ...formData,
        location: {
          ...formData.location,
          coordinates: [coords.longitude, coords.latitude]
        }
      });
      showToast(' Location captured successfully!', 'success');
    } catch (error) {
      showToast('Failed to get location. Please enter manually.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async () => {
    if (!formData.name.trim()) {
      showToast('Please enter your name', 'error');
      return;
    }

    if (formData.phone.length !== 10) {
      showToast('Enter valid 10-digit phone number', 'error');
      return;
    }

    setLoading(true);
    try {
      console.log('Sending OTP to:', `+91${formData.phone}`);
      await sendOTP(`+91${formData.phone}`);
      setStep(2);
      showToast('OTP sent successfully! Check backend console.', 'success');
    } catch (error) {
      console.error('Send OTP error:', error);
      showToast(error.response?.data?.message || 'Failed to send OTP', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (formData.otp.length !== 6) {
      showToast('Enter valid 6-digit OTP', 'error');
      return;
    }

    if (!formData.location.address.trim()) {
      showToast('Please enter your address', 'error');
      return;
    }

    setLoading(true);
    try {
      console.log('Registering with data:', {
        ...formData,
        phone: `+91${formData.phone}`
      });
      
      const user = await register({
        ...formData,
        phone: `+91${formData.phone}`
      });
      
      showToast('Registration successful!', 'success');
      
      if (user.role === 'farmer') navigate('/farmer');
      else if (user.role === 'renter') navigate('/renter');
    } catch (error) {
      console.error('Registration error:', error);
      showToast(error.response?.data?.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-bold mb-6 text-center">
          <span className="bg-gradient-to-r from-emerald-500 to-blue-600 bg-clip-text text-transparent inline-block uppercase tracking-wide">
            {t('auth.register')}
          </span>
        </h2>

        {step === 1 ? (
          <div>
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">{t('auth.name')}</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Your Full Name"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">{t('auth.phone')}</label>
              <div className="flex">
                <span className="inline-flex items-center px-3 text-gray-700 bg-gray-200 border border-r-0 border-gray-300 rounded-l-lg font-semibold">
                  +91
                </span>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="9876543210"
                  maxLength={10}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">Enter 10-digit mobile number</p>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">{t('auth.role')}</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="farmer"> {t('auth.farmer')} </option>
                <option value="renter"> {t('auth.renter')} </option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleGetLocation}
              disabled={loading}
              className="w-full mb-4 border-2 border-emerald-500 text-emerald-600 py-3 px-4 rounded-lg font-semibold hover:bg-emerald-50 transition-all duration-200 disabled:opacity-50"
            >
               {t('auth.getLocation')}
            </button>

            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">{t('auth.address')}</label>
              <textarea
                value={formData.location.address}
                onChange={(e) => setFormData({
                  ...formData,
                  location: { ...formData.location, address: e.target.value }
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Your Full Address"
                rows="2"
              />
            </div>

            <button
              type="button"
              onClick={handleSendOTP}
              disabled={loading || !formData.name || formData.phone.length !== 10}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-emerald-600 hover:to-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </span>
              ) : (
                ' Send OTP'
              )}
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">Phone Number</label>
              <div className="flex">
                <span className="inline-flex items-center px-3 text-gray-700 bg-gray-100 border border-gray-300 rounded-l-lg font-semibold">
                  +91
                </span>
                <input
                  type="tel"
                  value={formData.phone}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-r-lg bg-gray-100 text-gray-600 font-medium"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">{t('auth.otp')}</label>
              <input
                type="text"
                value={formData.otp}
                onChange={handleOTPChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest font-bold"
                placeholder="● ● ● ● ● ●"
                maxLength={6}
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleRegister();
                  }
                }}
              />
              <p className="text-xs text-gray-500 mt-2 text-center">
                 <strong>Dev mode:</strong> Check backend terminal for OTP
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setFormData({ ...formData, otp: '' });
                }}
                className="w-1/2 border-2 border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-200"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleRegister}
                disabled={loading || formData.otp.length !== 6}
                className="w-1/2 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Registering...
                  </span>
                ) : (
                  '✓ Complete Registration'
                )}
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 text-center border-t pt-6">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-emerald-600 font-semibold hover:underline">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;