import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { getCurrentLocation, formatCurrency, showToast } from '../utils/helpers';

const Checkout = () => {
  const { equipmentId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    bookingDate: '',
    startTime: '09:00',
    endTime: '17:00',
    pickupLocation: {
      coordinates: [],
      address: ''
    }
  });

  const [pricing, setPricing] = useState({
    hoursCost: 0,
    distanceCost: 0,
    totalCost: 0,
    advancePayment: 0,
    remainingPayment: 0
  });

  useEffect(() => {
    loadEquipment();
    getLocation();
  }, [equipmentId]);

  useEffect(() => {
    calculatePricing();
  }, [formData, equipment]);

  const loadEquipment = async () => {
    try {
      const response = await api.get(`/equipment/${equipmentId}`);
      setEquipment(response.data.equipment);
    } catch (error) {
      showToast('Failed to load equipment', 'error');
      navigate('/equipment');
    } finally {
      setLoading(false);
    }
  };

  const getLocation = async () => {
    try {
      const coords = await getCurrentLocation();
      setFormData(prev => ({
        ...prev,
        pickupLocation: {
          ...prev.pickupLocation,
          coordinates: [coords.longitude, coords.latitude]
        }
      }));
    } catch (error) {
      console.error('Location error:', error);
    }
  };

  const calculatePricing = () => {
    if (!equipment) return;

    const hours = calculateHours();
    const distance = 5; // Default 5km for demo
    
    const hoursCost = hours * (equipment.pricing?.perHour || 0);
    const distanceCost = distance * (equipment.pricing?.perKm || 0);
    const totalCost = hoursCost + distanceCost;
    const advancePayment = totalCost * 0.1;
    const remainingPayment = totalCost - advancePayment;

    setPricing({
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

    if (formData.pickupLocation.coordinates.length === 0) {
      showToast('Please enter pickup location', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post('/bookings', {
        equipment: equipmentId,
        bookingDate: formData.bookingDate,
        timeSlot: {
          startTime: formData.startTime,
          endTime: formData.endTime
        },
        pickupLocation: formData.pickupLocation
      });

      const bookingId = response.data.booking._id;
      showToast('Booking created! Proceeding to payment...', 'success');
      
      // Redirect to payment
      navigate(`/payment/${bookingId}`);
    } catch (error) {
      showToast(error.response?.data?.message || 'Booking failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Equipment not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8 gradient-primary bg-clip-text text-transparent">
          {t('booking.confirm')}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Equipment Details */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Equipment Details</h2>
            <div className="h-48 bg-gradient-secondary rounded-lg flex items-center justify-center mb-4">
              <span className="text-white text-6xl">🚜</span>
            </div>
            <h3 className="font-bold text-xl mb-2">{equipment.name}</h3>
            <p className="text-gray-600 mb-4">{equipment.description}</p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Per Hour:</span>
                <span className="font-semibold">{formatCurrency(equipment.pricing?.perHour || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Per KM:</span>
                <span className="font-semibold">{formatCurrency(equipment.pricing?.perKm || 0)}</span>
              </div>
            </div>
          </div>

          {/* Booking Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Booking Details</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">{t('booking.selectDate')}</label>
                <input
                  type="date"
                  value={formData.bookingDate}
                  onChange={(e) => setFormData({ ...formData, bookingDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Start Time</label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2">End Time</label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 mb-2">{t('booking.location')}</label>
                <input
                  type="text"
                  value={formData.pickupLocation.address}
                  onChange={(e) => setFormData({
                    ...formData,
                    pickupLocation: { ...formData.pickupLocation, address: e.target.value }
                  })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-primary"
                  placeholder="Enter pickup address"
                  required
                />
              </div>

              {/* Pricing Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold mb-3">Pricing Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Hours Cost ({calculateHours()}hrs):</span>
                    <span>{formatCurrency(pricing.hoursCost)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Distance Cost (5km):</span>
                    <span>{formatCurrency(pricing.distanceCost)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Total:</span>
                    <span className="text-primary">{formatCurrency(pricing.totalCost)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Advance Payment (10%):</span>
                    <span className="font-semibold">{formatCurrency(pricing.advancePayment)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Remaining:</span>
                    <span>{formatCurrency(pricing.remainingPayment)}</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark disabled:bg-gray-400"
              >
                {submitting ? 'Processing...' : t('booking.pay')}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;