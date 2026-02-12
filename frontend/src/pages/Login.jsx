import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../utils/helpers';

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, sendOTP } = useAuth();

  const [phone, setPhone] = useState('');
  const [otp, setOTP] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (phone.length !== 10) {
      showToast('Enter valid 10-digit phone number', 'error');
      return;
    }

    setLoading(true);
    try {
      await sendOTP(phone);
      setStep(2);
      showToast('OTP sent successfully!', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to send OTP', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      showToast('Enter valid 6-digit OTP', 'error');
      return;
    }

    setLoading(true);
    try {
      const user = await login(phone, otp);
      showToast('Login successful!', 'success');
      
      if (user.role === 'farmer') navigate('/farmer');
      else if (user.role === 'renter') navigate('/renter');
      else if (user.role === 'admin') navigate('/admin');
    } catch (error) {
      showToast(error.response?.data?.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-bold mb-6 text-center">
  <span className="bg-gradient-to-r from-emerald-500 to-blue-600 bg-clip-text text-transparent inline-block uppercase">
    {t('auth.login')}
  </span>
</h2>


        {step === 1 ? (
          <form onSubmit={handleSendOTP}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">{t('auth.phone')}</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-primary"
                placeholder="9876543210"
                maxLength={10}
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
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">{t('auth.otp')}</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOTP(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-primary"
                placeholder="123456"
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
                {loading ? t('common.loading') : t('auth.verify')}
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link to="/register" className="text-primary hover:underline">
            Don't have an account? Register
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;