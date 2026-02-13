import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { showToast } from '../utils/helpers';

const Checkout = () => {
  const { equipmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    bookingDate: '',
    startTime: '09:00',
    endTime: '17:00',
    distance: 5
  });

  const [pricing, setPricing] = useState({
    hoursCost: 0,
    distanceCost: 0,
    totalCost: 0,
    advancePayment: 0,
    remainingPayment: 0,
    hours: 0
  });

  useEffect(() => {
    loadEquipment();
  }, [equipmentId]);

  useEffect(() => {
    calculatePricing();
  }, [formData, equipment]);

  const loadEquipment = async () => {
    try {
      const response = await axios.get(`/api/equipment/${equipmentId}`);
      setEquipment(response.data.equipment);
    } catch (error) {
      showToast('Failed to load equipment', 'error');
      navigate('/equipment');
    } finally {
      setLoading(false);
    }
  };

  const calculatePricing = () => {
    if (!equipment) return;

    const hours = calculateHours();
    const distance = parseFloat(formData.distance) || 0;
    
    const hoursCost = hours * (equipment.pricePerHour || 0);
    const distanceCost = distance * (equipment.pricePerKm || 0);
    const totalCost = hoursCost + distanceCost;
    const advancePayment = Math.round(totalCost * 0.1);
    const remainingPayment = totalCost - advancePayment;

    setPricing({
      hours,
      hoursCost,
      distanceCost,
      totalCost,
      advancePayment,
      remainingPayment
    });
  };

  const calculateHours = () => {
    const [startH, startM] = formData.startTime.split(':').map(Number);
    const [endH, endM] = formData.endTime.split(':').map(Number);
    return ((endH * 60 + endM) - (startH * 60 + startM)) / 60;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.bookingDate) {
      showToast('Please select a date', 'error');
      return;
    }

    if (pricing.hours <= 0) {
      showToast('End time must be after start time', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.post('/api/booking/create', {
        equipmentId: equipmentId,
        date: formData.bookingDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        distance: formData.distance
      });

      const bookingId = response.data.bookingId;
      showToast('Booking created! Proceeding to payment...', 'success');
      
      navigate(`/payment/${bookingId}`);
    } catch (error) {
      showToast(error.response?.data?.message || 'Booking failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Equipment not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/equipment')}
              className="text-gray-600 hover:text-gray-800"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Confirm Booking</h1>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Equipment Details - Left Column */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
              <h2 className="text-lg font-bold mb-4 text-gray-800">Equipment Details</h2>
              
              <div className="h-40 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>

              <h3 className="font-bold text-xl mb-2 text-gray-800">{equipment.name}</h3>
              <p className="text-gray-600 text-sm mb-4">{equipment.description}</p>
              
              <div className="space-y-3 py-3 border-t border-gray-200">
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">Hourly Rate:</span>
                  <span className="font-bold text-blue-600">₹{equipment.pricePerHour}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">Per Kilometer:</span>
                  <span className="font-bold text-green-600">₹{equipment.pricePerKm}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">Owner:</span>
                  <span className="font-medium text-gray-800">{equipment.renterId?.name || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Form - Right Column */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold mb-6 text-gray-800">Booking Information</h2>
              
              <div className="space-y-5">
                {/* Date Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.bookingDate}
                    onChange={(e) => setFormData({ ...formData, bookingDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Time Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* Distance */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Distance (km) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.distance}
                    onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
                    min="1"
                    step="0.1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter distance in kilometers"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Approximate distance from equipment location to your farm</p>
                </div>

                {/* Pricing Summary */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Cost Breakdown
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Hours ({pricing.hours.toFixed(1)} hrs × ₹{equipment.pricePerHour}):</span>
                      <span className="font-semibold text-gray-800">₹{pricing.hoursCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Distance ({formData.distance} km × ₹{equipment.pricePerKm}):</span>
                      <span className="font-semibold text-gray-800">₹{pricing.distanceCost.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-blue-200 pt-3 flex justify-between">
                      <span className="font-bold text-gray-800">Total Cost:</span>
                      <span className="font-bold text-xl text-blue-600">₹{pricing.totalCost.toFixed(2)}</span>
                    </div>
                    <div className="bg-white rounded-lg p-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-green-700 font-medium">Advance Payment (10%):</span>
                        <span className="font-bold text-green-600">₹{pricing.advancePayment}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Remaining (90%):</span>
                        <span className="font-semibold text-gray-700">₹{pricing.remainingPayment.toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        *Remaining payment to be made after service completion
                      </p>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting || pricing.hours <= 0}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    `Proceed to Payment - ₹${pricing.advancePayment}`
                  )}
                </button>

                <p className="text-center text-xs text-gray-500">
                  By proceeding, you agree to our terms and conditions
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;