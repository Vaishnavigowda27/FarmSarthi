import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { getCurrentLocation, showToast } from '../utils/helpers';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '../firebase';

const Register = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const recaptchaVerifierRef = useRef(null);
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
      pincode: '',
    },
  });

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData({ ...formData, phone: value });
  };

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
          coordinates: [coords.longitude, coords.latitude],
        },
      });
      showToast('Location captured successfully!', 'success');
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
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }

      recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
      });

      await recaptchaVerifierRef.current.render();

      const result = await signInWithPhoneNumber(
        auth,
        `+91${formData.phone}`,
        recaptchaVerifierRef.current
      );

      setConfirmationResult(result);
      setStep(2);
      showToast('OTP sent successfully!', 'success');
    } catch (error) {
      console.error('Send OTP error:', error);
      showToast(error?.message || 'Failed to send OTP', 'error');
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
      if (!confirmationResult) {
        showToast('Please request OTP again', 'error');
        return;
      }

      const credential = await confirmationResult.confirm(formData.otp);
      const idToken = await credential.user.getIdToken();

      const user = await register({
        idToken,
        name: formData.name,
        role: formData.role,
        location: formData.location,
      });

      showToast('Registration successful!', 'success');

      if (user.role === 'farmer') navigate('/farmer');
      else if (user.role === 'renter') navigate('/renter');
    } catch (error) {
      console.error('Registration error:', error);
      showToast(error.response?.data?.message || error?.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        {/* Registration card — clean white, no background overlay */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 px-6 py-8 sm:px-10 sm:py-10">

          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-9 w-9 rounded-2xl bg-[#1B4332] flex items-center justify-center text-white text-sm font-bold">
                FS
              </div>
              <p className="text-sm font-semibold text-[#1B4332]">FarmSaarthi</p>
            </div>
            <p className="text-xs text-gray-500">Welcome to</p>
            <p className="text-xl font-bold text-[#1B4332]">
              FarmSaarthi <span className="text-[#2D6A4F]">Registration</span>
            </p>
          </div>

          {step === 1 ? (
            <div className="space-y-4">
              <p className="text-xs text-gray-500">
                Tell us a bit about yourself to get started.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1B4332]"
                    placeholder="Your full name"
                  />
                </div>
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
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      className="flex-1 px-3 py-2.5 text-sm bg-transparent outline-none"
                      placeholder="9876543210"
                      maxLength={10}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[1.2fr,0.8fr] gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Your Location
                  </label>
                  <input
                    type="text"
                    value={formData.location.address}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        location: {
                          ...formData.location,
                          address: e.target.value,
                        },
                      })
                    }
                    className="w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1B4332]"
                    placeholder="Village, Taluk, District"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-1 rounded-2xl bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-semibold text-xs py-2.5 transition disabled:bg-gray-300"
                  >
                    <span>📍</span>
                    Get Current Location
                  </button>
                </div>
              </div>

              {/* Role selection cards */}
              <div className="mt-2">
                <p className="text-xs font-medium text-gray-700 mb-2">
                  Select Your Role
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'farmer' })}
                    className={`rounded-2xl border-2 px-4 py-3 text-left text-xs font-medium transition ${
                      formData.role === 'farmer'
                        ? 'border-[#1B4332] bg-[#1B4332]/5 text-[#1B4332]'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">🚜</span>
                      <p className="font-semibold">I am a Farmer</p>
                    </div>
                    <p className="text-[11px] text-gray-500">
                      Find &amp; book equipment for your farm.
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'renter' })}
                    className={`rounded-2xl border-2 px-4 py-3 text-left text-xs font-medium transition ${
                      formData.role === 'renter'
                        ? 'border-[#1B4332] bg-[#1B4332]/5 text-[#1B4332]'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">🛠️</span>
                      <p className="font-semibold">I am an Equipment Owner</p>
                    </div>
                    <p className="text-[11px] text-gray-500">
                      List your machines &amp; track earnings.
                    </p>
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSendOTP}
                disabled={
                  loading ||
                  !formData.name ||
                  formData.phone.length !== 10 ||
                  !formData.location.address
                }
                className="w-full mt-2 bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-2xl py-3 text-sm font-semibold transition disabled:bg-gray-300"
              >
                {loading ? 'Sending OTP…' : 'Verify OTP'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-gray-500">
                Enter the 6‑digit OTP sent to your mobile number.
              </p>
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
                    value={formData.phone}
                    disabled
                    className="flex-1 px-3 py-2.5 text-sm bg-transparent text-gray-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {t('auth.otp')}
                </label>
                <input
                  type="text"
                  value={formData.otp}
                  onChange={handleOTPChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1B4332] text-center text-2xl tracking-[0.4em] font-semibold"
                  placeholder="••••••"
                  maxLength={6}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleRegister();
                    }
                  }}
                />
                <p className="text-[11px] text-gray-400 mt-1 text-center">
                  Enter the 6-digit code sent to your phone.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setFormData({ ...formData, otp: '' });
                    setConfirmationResult(null);
                  }}
                  className="w-1/3 border border-gray-200 text-xs font-semibold text-gray-700 rounded-2xl py-3 hover:bg-gray-50 transition"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleRegister}
                  disabled={loading || formData.otp.length !== 6}
                  className="flex-1 bg-[#1B4332] hover:bg-[#2D6A4F] text-white py-3 rounded-2xl text-sm font-semibold transition disabled:bg-gray-300"
                >
                  {loading ? 'Registering…' : 'Complete Registration'}
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 text-center border-t pt-4">
            <p className="text-xs text-gray-500">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-[#2D6A4F] font-semibold hover:underline"
              >
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
      <div id="recaptcha-container" />
    </div>
  );
};

export default Register;
