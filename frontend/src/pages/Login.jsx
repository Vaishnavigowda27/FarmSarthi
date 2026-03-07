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

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(value);
  };

  const handleOTPChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOTP(value);
  };

  const handleSendOTP = async () => {
    if (phone.length !== 10) {
      showToast('Enter valid 10-digit phone number', 'error');
      return;
    }

    setLoading(true);
    try {
      await sendOTP(`+91${phone}`);
      setStep(2);
      showToast('OTP sent successfully! Check backend console.', 'success');
    } catch (error) {
      console.error('Send OTP error:', error);
      showToast(error.response?.data?.message || 'Failed to send OTP', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (otp.length !== 6) {
      showToast('Enter valid 6-digit OTP', 'error');
      return;
    }

    setLoading(true);
    try {
      const user = await login(`+91${phone}`, otp);
      showToast('Login successful!', 'success');

      if (user.role === 'farmer') navigate('/farmer');
      else if (user.role === 'renter') navigate('/renter');
      else if (user.role === 'admin') navigate('/admin');
    } catch (error) {
      console.error('Login error:', error);
      showToast(error.response?.data?.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Login card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 px-6 py-8 sm:px-8 sm:py-10">

          {/* Branding inside card */}
          <div className="flex items-center gap-2 mb-6">
            <div className="h-9 w-9 rounded-2xl bg-[#1B4332] flex items-center justify-center text-white text-sm font-bold">
              FS
            </div>
            <div>
              <p className="text-base font-bold text-[#1B4332]">FarmSaarthi</p>
              <p className="text-[11px] text-gray-500">Connecting Farmers &amp; Equipment</p>
            </div>
          </div>

          <h1 className="text-xl font-bold text-[#1B4332] mb-1">Welcome back</h1>
          <p className="text-xs text-gray-500 mb-6">
            Login using your mobile number for easy access.
          </p>

          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Mobile Number
                </label>
                <div className="flex items-stretch rounded-2xl border border-gray-200 bg-gray-50 overflow-hidden">
                  <span className="px-3 flex items-center text-xs font-semibold text-gray-700 border-r border-gray-200">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    className="flex-1 px-3 py-3 text-sm bg-transparent outline-none"
                    placeholder="9876543210"
                    maxLength={10}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSendOTP();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={loading || phone.length !== 10}
                    className="px-4 text-xs font-semibold bg-[#2D6A4F] text-white disabled:bg-gray-300"
                  >
                    {loading ? 'Sending…' : 'Get OTP'}
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  We&apos;ll send a 6‑digit code to verify your number.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSendOTP}
                disabled={loading || phone.length !== 10}
                className="w-full mt-2 bg-[#1B4332] hover:bg-[#2D6A4F] text-white py-3 rounded-2xl text-sm font-semibold transition disabled:bg-gray-300"
              >
                {loading ? 'Sending OTP…' : 'Login Securely'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Mobile Number
                </label>
                <div className="flex rounded-2xl border border-gray-200 bg-gray-50 overflow-hidden">
                  <span className="px-3 flex items-center text-xs font-semibold text-gray-700 border-r border-gray-200">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    disabled
                    className="flex-1 px-3 py-3 text-sm bg-transparent text-gray-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {t('auth.otp')}
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={handleOTPChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1B4332] text-center text-2xl tracking-[0.4em] font-semibold"
                  placeholder="••••••"
                  maxLength={6}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleLogin();
                    }
                  }}
                />
                <p className="text-[11px] text-gray-400 mt-1 text-center">
                  Dev mode: check backend terminal for the OTP.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setOTP('');
                  }}
                  className="w-1/3 border border-gray-200 text-xs font-semibold text-gray-700 rounded-2xl py-3 hover:bg-gray-50 transition"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleLogin}
                  disabled={loading || otp.length !== 6}
                  className="flex-1 bg-[#1B4332] hover:bg-[#2D6A4F] text-white py-3 rounded-2xl text-sm font-semibold transition disabled:bg-gray-300"
                >
                  {loading ? 'Verifying…' : 'Login Securely'}
                </button>
              </div>

              <button
                type="button"
                onClick={handleSendOTP}
                disabled={loading}
                className="w-full text-[11px] text-[#2D6A4F] font-medium hover:underline disabled:text-gray-400"
              >
                Didn&apos;t receive OTP? Resend
              </button>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between text-[11px] text-gray-400">
            <label className="inline-flex items-center gap-1">
              <input type="checkbox" className="rounded border-gray-300" />
              <span>Remember me</span>
            </label>
            <span>Need help? Contact support.</span>
          </div>

          <div className="mt-6 text-center border-t pt-4">
            <p className="text-xs text-gray-500">
              Don&apos;t have an account?{' '}
              <Link
                to="/register"
                className="text-[#2D6A4F] font-semibold hover:underline"
              >
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
