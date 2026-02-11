import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../utils/mockAPI.js';

export default function Login({ setUser }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Phone, 2: OTP
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const sendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/auth/send-otp', { phone });
      alert('OTP Sent! (Use 123456)');
      setStep(2);
    } catch {
      alert('Error sending OTP');
    }
    setLoading(false);
  };

  const verifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await API.post('/auth/login', { phone, otp });

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      setUser(data.user); // 🔥 CRITICAL FIX

      if (data.user.role === 'farmer') navigate('/farmer');
      else if (data.user.role === 'renter') navigate('/renter');
      else navigate('/admin');
    } catch {
      alert('Invalid OTP');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>

        {step === 1 ? (
          <form onSubmit={sendOTP}>
            <label className="block mb-2">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2 border rounded mb-4"
              required
            />
            <button className="w-full bg-green-600 text-white py-2 rounded">
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOTP}>
            <label className="block mb-2">Enter OTP</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full px-4 py-2 border rounded mb-4"
              maxLength="6"
              required
            />
            <button className="w-full bg-green-600 text-white py-2 rounded">
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full mt-2 text-blue-600"
            >
              Change Number
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link to="/register" className="text-blue-600 hover:underline">
            Don't have an account? Register
          </Link>
        </div>
      </div>
    </div>
  );
}
