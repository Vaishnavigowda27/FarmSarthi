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
      showToast('Failed to get location', 'error');
    }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (formData.phone.length !== 10) {
      showToast('Enter valid 10-digit phone number', 'error');
      return;
    }

    setLoading(true);
    try {
      await sendOTP(formData.phone);
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

    if (formData.location.coordinates.length === 0) {
      showToast('Please get your location', 'error');
      return;
    }

    setLoading(true);
    try {
      const user = await register(formData);
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
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">{t('auth.phone')}</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-primary"
                maxLength={10}
                required
              />
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
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">{t('auth.otp')}</label>
              <input
                type="text"
                value={formData.otp}
                onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-primary"
                maxLength={6}
                required
              />
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