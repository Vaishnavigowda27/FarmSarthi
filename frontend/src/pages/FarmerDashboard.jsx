import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/mockAPI.js'; // Using mock API

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
  const [loading, setLoading] = useState(false);

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          alert('Location captured!');
        },
        () => alert('Unable to get location')
      );
    }
  };

  const sendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/auth/send-otp', { phone: formData.phone });
      alert('OTP Sent!');
      setStep(2);
    } catch (error) {
      alert('Error sending OTP');
    }
    setLoading(false);
  };

  const verifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/auth/verify-otp', { phone: formData.phone, otp: formData.otp });
      setStep(3);
    } catch (error) {
      alert('Invalid OTP');
    }
    setLoading(false);
  };

  const completeRegistration = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await API.post('/auth/register', formData);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      if (data.user.role === 'farmer') navigate('/farmer');
      else navigate('/renter');
    } catch (error) {
      alert('Registration failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Register</h2>
        
        {/* Step Indicator */}
        <div className="flex justify-between mb-6">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-green-600 text-white' : 'bg-gray-300'}`}>1</div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-green-600 text-white' : 'bg-gray-300'}`}>2</div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-green-600 text-white' : 'bg-gray-300'}`}>3</div>
        </div>

        {/* Step 1: Basic Details */}
        {step === 1 && (
          <form onSubmit={sendOTP} className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-2">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Phone Number</label>
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
              <label className="block text-gray-700 mb-2">Location</label>
              <button
                type="button"
                onClick={getLocation}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                {formData.latitude ? '✓ Location Captured' : 'Get My Location'}
              </button>
              {formData.latitude && (
                <p className="text-xs text-gray-500 mt-1">
                  Lat: {formData.latitude.toFixed(4)}, Lng: {formData.longitude.toFixed(4)}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={loading || !formData.latitude}
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        )}

        {/* Step 2: OTP */}
        {step === 2 && (
          <form onSubmit={verifyOTP} className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-2">Enter OTP</label>
              <input
                type="text"
                value={formData.otp}
                onChange={(e) => setFormData({...formData, otp: e.target.value})}
                placeholder="123456"
                maxLength="6"
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </form>
        )}

        {/* Step 3: Role Selection */}
        {step === 3 && (
          <form onSubmit={completeRegistration} className="space-y-4">
            <label className="block text-gray-700 mb-2">Select Role</label>
            
            <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="role"
                value="farmer"
                checked={formData.role === 'farmer'}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                className="mr-3"
                required
              />
              <div>
                <p className="font-semibold">Farmer</p>
                <p className="text-sm text-gray-500">I want to rent equipment</p>
              </div>
            </label>

            <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="role"
                value="renter"
                checked={formData.role === 'renter'}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                className="mr-3"
                required
              />
              <div>
                <p className="font-semibold">Equipment Renter</p>
                <p className="text-sm text-gray-500">I have equipment to rent</p>
              </div>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
            >
              {loading ? 'Creating Account...' : 'Complete Registration'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <a href="/login" className="text-blue-600 hover:underline">
            Already have account? Login
          </a>
        </div>
      </div>
    </div>
  );
}