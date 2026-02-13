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
      const coords = await getCurrentLocation();
      setFormData({
        ...formData,
        location: {
          ...formData.location,
          coordinates: [coords.longitude, coords.latitude]
        }
      });
      showToast('Location captured!', 'success');
    } catch (error) {
      showToast('Failed to get location. Please enter manually.', 'error');
    }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    
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
      // ✅ FIXED: Send with +91 prefix
      await sendOTP(`+91${formData.phone}`);
      setStep(2);
      showToast('OTP sent successfully!', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to send OTP', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
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
      // ✅ FIXED: Add +91 prefix to phone before sending
      const user = await register({
        ...formData,
        phone: `+91${formData.phone}`
      });
      
      showToast('Registration successful!', 'success');
      
      if (user.role === 'farmer') navigate('/farmer');
      else if (user.role === 'renter') navigate('/renter');
    } catch (error) {
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
          <form onSubmit={handleSendOTP}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">{t('auth.name')}</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-primary"
                placeholder="Your Name"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">{t('auth.phone')}</label>
              {/* ✅ FIXED: Added +91 prefix display */}
              <div className="flex">
                <span className="inline-flex items-center px-3 text-gray-700 bg-gray-200 border border-r-0 border-gray-300 rounded-l-lg font-semibold">
                  +91
                </span>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-r-lg focus:outline-none focus:border-primary"
                  placeholder="9876543210"
                  maxLength={10}
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Enter 10-digit mobile number</p>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">{t('auth.role')}</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-primary"
              >
                <option value="farmer">{t('auth.farmer')}</option>
                <option value="renter">{t('auth.renter')}</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleGetLocation}
              className="w-full mb-4 border border-primary text-primary py-3 rounded-lg font-semibold hover:bg-primary/10"
            >
              {t('auth.getLocation')}
            </button>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">{t('auth.address')}</label>
              <input
                type="text"
                value={formData.location.address}
                onChange={(e) => setFormData({
                  ...formData,
                  location: { ...formData.location, address: e.target.value }
                })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-primary"
                placeholder="Your Address"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark disabled:bg-gray-400"
            >
              {loading ? t('common.loading') : t('auth.sendOtp')}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            {/* ✅ FIXED: Show phone with +91 prefix */}
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Phone Number</label>
              <div className="flex">
                <span className="inline-flex items-center px-3 text-gray-700 bg-gray-100 border border-gray-300 rounded-l-lg font-semibold">
                  +91
                </span>
                <input
                  type="tel"
                  value={formData.phone}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-r-lg bg-gray-100 text-gray-600"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">{t('auth.otp')}</label>
              <input
                type="text"
                value={formData.otp}
                onChange={handleOTPChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-primary text-center text-2xl tracking-widest"
                placeholder="● ● ● ● ● ●"
                maxLength={6}
                required
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1 text-center">
                💡 Dev mode: Check backend terminal for OTP
              </p>
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/2 border border-primary text-primary py-3 rounded-lg font-semibold hover:bg-primary/10"
              >
                {t('common.back')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-1/2 bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark disabled:bg-gray-400"
              >
                {loading ? t('common.loading') : t('auth.register')}
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link to="/login" className="text-primary hover:underline">
            Already have an account? Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;