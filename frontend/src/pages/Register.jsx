import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/mockAPI.js';

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Details, 2: OTP, 3: Role
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    latitude: '',
    longitude: '',
    otp: '',
    role: ''
  });
  const [error, setError] = useState('');

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          alert('✅ Location captured!');
        },
        () => alert('❌ Unable to get location')
      );
    } else {
      alert('❌ Geolocation not supported');
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      await API.post('/auth/send-otp', { phone: formData.phone });
      alert('OTP sent: 123456');
      setStep(2);
    } catch (err) {
      setError('Failed to send OTP');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      await API.post('/auth/verify-otp', { phone: formData.phone, otp: formData.otp });
      setStep(3);
    } catch (err) {
      setError('Invalid OTP. Use: 123456');
    }
  };

  const handleRegister = async (role) => {
    try {
      const { data } = await API.post('/auth/register', {
        name: formData.name,
        phone: formData.phone,
        latitude: formData.latitude,
        longitude: formData.longitude,
        role: role
      });
      
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);
      
      window.location.href = '/' + role;
      
    } catch (err) {
      setError('Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-green-600">Register</h2>

        {/* Progress */}
        <div className="flex justify-between mb-6">
          <div className={`flex-1 text-center ${step >= 1 ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 mx-auto rounded-full ${step >= 1 ? 'bg-green-600' : 'bg-gray-300'} text-white flex items-center justify-center font-bold`}>1</div>
            <p className="text-xs mt-1">Details</p>
          </div>
          <div className={`flex-1 text-center ${step >= 2 ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 mx-auto rounded-full ${step >= 2 ? 'bg-green-600' : 'bg-gray-300'} text-white flex items-center justify-center font-bold`}>2</div>
            <p className="text-xs mt-1">Verify</p>
          </div>
          <div className={`flex-1 text-center ${step >= 3 ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 mx-auto rounded-full ${step >= 3 ? 'bg-green-600' : 'bg-gray-300'} text-white flex items-center justify-center font-bold`}>3</div>
            <p className="text-xs mt-1">Role</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        {/* Step 1: Basic Details */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="+91 1234567890"
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Location</label>
              <button
                type="button"
                onClick={getLocation}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                {formData.latitude ? '✅ Location Captured' : '📍 Get My Location'}
              </button>
              {formData.latitude && (
                <p className="text-xs text-gray-500 mt-1">
                  Lat: {formData.latitude.toFixed(4)}, Lng: {formData.longitude.toFixed(4)}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={!formData.latitude}
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
            >
              Send OTP
            </button>
          </form>
        )}

        {/* Step 2: OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Enter OTP</label>
              <input
                type="text"
                value={formData.otp}
                onChange={(e) => setFormData({...formData, otp: e.target.value})}
                placeholder="123456"
                maxLength="6"
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
              <p className="text-sm text-gray-500 mt-2">Sent to {formData.phone}</p>
            </div>
            <button
              type="submit"
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
            >
              Verify OTP
            </button>
          </form>
        )}

        {/* Step 3: Role Selection */}
        {step === 3 && (
          <div className="space-y-3">
            <p className="text-gray-700 mb-4 font-medium">Select your role:</p>
            
            <button
              onClick={() => handleRegister('farmer')}
              className="w-full p-4 border-2 border-gray-300 rounded-lg hover:border-green-600 hover:bg-green-50 text-left"
            >
              <p className="font-semibold text-lg">🌾 Farmer</p>
              <p className="text-sm text-gray-600">I want to rent equipment for my farm</p>
            </button>
            
            <button
              onClick={() => handleRegister('renter')}
              className="w-full p-4 border-2 border-gray-300 rounded-lg hover:border-blue-600 hover:bg-blue-50 text-left"
            >
              <p className="font-semibold text-lg">🚜 Equipment Renter</p>
              <p className="text-sm text-gray-600">I have equipment to rent out</p>
            </button>
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            Already have account?{' '}
            <a href="/login" className="text-blue-600 hover:underline font-semibold">
              Login
            </a>
          </p>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded text-sm">
          <p className="font-bold text-blue-900">Test OTP: <strong>123456</strong></p>
        </div>
      </div>
    </div>
  );
}