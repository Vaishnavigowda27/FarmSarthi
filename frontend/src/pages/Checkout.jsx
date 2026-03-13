import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { showToast } from '../utils/helpers';

// Generate 24hr time options (00:00 to 24:00)
const TIME_OPTIONS = Array.from({ length: 25 }, (_, i) =>
  i < 24 ? `${String(i).padStart(2, '0')}:00` : '24:00'
);

const Checkout = () => {
  const { equipmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [equipment, setEquipment] = useState(null);
  const [moreFromOwner, setMoreFromOwner] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [availableSlots, setAvailableSlots] = useState({ slots: [], availableRanges: [] });

  const [formData, setFormData] = useState({
    bookingDate: '',
    startTime: '06:00',
    endTime: '10:00',
    distance: 5,
  });

  const [pricing, setPricing] = useState({
    hoursCost: 0,
    distanceCost: 0,
    totalCost: 0,
    serviceCharge: 0,
    remainingPayment: 0,
    hours: 0,
  });

  useEffect(() => {
    loadEquipment();
  }, [equipmentId]);

  useEffect(() => {
    calculatePricing();
  }, [formData, equipment]);

  // Fetch available slots when date is selected
  useEffect(() => {
    if (!equipmentId || !formData.bookingDate) {
      setAvailableSlots({ slots: [], availableRanges: [] });
      return;
    }
    const fetchAvailability = async () => {
      try {
        const res = await axios.get(`/api/equipment/${equipmentId}/availability`, {
          params: { date: formData.bookingDate },
        });
        setAvailableSlots({
          slots: res.data.slots || [],
          availableRanges: res.data.availableRanges || [],
        });
      } catch {
        setAvailableSlots({ slots: [], availableRanges: [] });
      }
    };
    fetchAvailability();
  }, [equipmentId, formData.bookingDate]);

  const loadEquipment = async () => {
    try {
      const response = await axios.get(`/api/equipment/${equipmentId}`);
      const eq = response.data.equipment;
      setEquipment(eq);

      // Fetch more equipment from same owner
      const ownerId = eq?.owner?._id;
      if (ownerId) {
        const moreRes = await axios.get('/api/equipment', {
          params: {
            owner: ownerId,
            isAvailable: true,
          },
        });
        const list = moreRes.data.equipment || [];
        setMoreFromOwner(list.filter((e) => e._id !== eq._id));
      } else {
        setMoreFromOwner([]);
      }
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
    const perHour = equipment.pricing?.perHour ?? equipment.pricePerHour ?? 0;
    const perKm = equipment.pricing?.perKm ?? equipment.pricePerKm ?? 0;

    const hoursCost = hours * perHour;
    const distanceCost = distance * perKm;
    const totalCost = hoursCost + distanceCost;
    const serviceCharge = Math.round(totalCost * 0.02);
    const remainingPayment = totalCost - serviceCharge;

    setPricing({
      hours,
      hoursCost,
      distanceCost,
      totalCost,
      serviceCharge,
      remainingPayment,
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
      const pickupCoords = user?.location?.coordinates || [76.6394, 12.2958];
      const response = await axios.post('/api/bookings', {
        equipmentId,
        bookingDate: formData.bookingDate,
        timeSlot: {
          startTime: formData.startTime,
          endTime: formData.endTime,
        },
        pickupLocation: {
          coordinates: pickupCoords,
          address: user?.location?.address || 'Farm location',
        },
      });

      const bookingId = response.data.booking?._id;
      if (!bookingId) {
        showToast('Booking failed - no booking ID returned', 'error');
        return;
      }
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
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-farm-primary border-t-transparent mx-auto mb-3" />
          <p className="text-sm text-gray-600">Loading booking details…</p>
        </div>
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-gray-600">Equipment not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/equipment')}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          ← Back to Search
        </button>
        <h1 className="text-lg sm:text-xl font-bold text-gray-900">
          Secure Checkout
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order summary & price breakdown */}
        <section className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
            <h2 className="text-sm font-bold text-gray-900">Order Summary</h2>
            <div className="flex gap-3">
              <div
                className={`h-20 w-28 rounded-2xl bg-farm-primary/15 flex items-center justify-center overflow-hidden ${
                  equipment.photos?.[0]?.url ? 'cursor-pointer' : ''
                }`}
                onClick={() => {
                  if (equipment.photos?.[0]?.url) {
                    const baseUrl = (
                      import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
                    ).replace(/\/api$/, '');
                    setSelectedImage(`${baseUrl}${equipment.photos[0].url}`);
                  }
                }}
              >
                {equipment.photos?.[0]?.url ? (
                  <img
                    src={`${
                      (import.meta.env.VITE_API_URL ||
                        'http://localhost:5000/api'
                      ).replace(/\/api$/, '')}${equipment.photos[0].url}`}
                    alt={equipment.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl">🚜</span>
                )}
              </div>
              <div className="flex-1 text-xs space-y-1">
                <p className="font-semibold text-gray-900">
                  {equipment.name}
                </p>
                <p className="text-gray-500">
                  Date:{' '}
                  {formData.bookingDate
                    ? new Date(formData.bookingDate).toLocaleDateString()
                    : 'Not selected'}
                </p>
                <p className="text-gray-500">
                  Slot: {formData.startTime} – {formData.endTime} (
                  {pricing.hours.toFixed(1)} hrs)
                </p>
                <p className="text-gray-500">
                  Distance: {formData.distance} km
                </p>
              </div>
            </div>

            {moreFromOwner.length > 0 && (
              <div className="pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-900">
                    More from {equipment?.owner?.name || 'this owner'}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/equipment')}
                    className="text-[11px] text-farm-primary font-semibold hover:underline"
                  >
                    View all
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {moreFromOwner.slice(0, 4).map((item) => {
                    const baseUrl = (
                      import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
                    ).replace(/\/api$/, '');
                    return (
                      <button
                        key={item._id}
                        type="button"
                        onClick={() => navigate(`/checkout/${item._id}`)}
                        className="flex items-center gap-3 rounded-2xl border border-gray-100 hover:border-farm-primary/50 bg-white p-2 text-left"
                      >
                        <div className="h-12 w-16 rounded-xl bg-farm-primary/15 overflow-hidden flex items-center justify-center flex-shrink-0">
                          {item.photos?.[0]?.url ? (
                            <img
                              src={`${baseUrl}${item.photos[0].url}`}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xl">🚜</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-900 line-clamp-1">
                            {item.name}
                          </p>
                          <p className="text-[11px] text-gray-500">
                            ₹{item.pricing?.perHour ?? 0}/hr • ₹{item.pricing?.perKm ?? 0}/km
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">
                  Hourly cost ({pricing.hours.toFixed(1)} × ₹
                  {equipment.pricing?.perHour ?? equipment.pricePerHour ?? 0})
                </span>
                <span className="font-semibold text-gray-900">
                  ₹{pricing.hoursCost.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">
                  Distance cost ({formData.distance} km × ₹
                  {equipment.pricing?.perKm ?? equipment.pricePerKm ?? 0})
                </span>
                <span className="font-semibold text-gray-900">
                  ₹{pricing.distanceCost.toFixed(2)}
                </span>
              </div>
              <div className="border-top border-gray-200 pt-2 flex justify-between">
                <span className="font-semibold text-gray-900">Estimated total</span>
                <span className="font-bold text-gray-900">
                  ₹{pricing.totalCost.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="rounded-2xl bg-farm-light/15 border border-farm-light/40 p-3">
                <p className="text-gray-700 font-semibold mb-1">
                  2% Service Charge (non‑refundable)
                </p>
                <p className="text-2xl font-bold text-farm-primary">
                  ₹{pricing.serviceCharge}
                </p>
                <p className="text-[11px] text-gray-600 mt-1">
                  Non‑refundable platform service charge collected online to confirm your booking.
                </p>
              </div>
              <div className="rounded-2xl bg-gray-100 border border-gray-200 p-3">
                <p className="text-gray-700 font-semibold mb-1">
                  Balance to Pay After Work
                </p>
                <p className="text-2xl font-bold text-gray-800">
                  ₹{pricing.remainingPayment.toFixed(2)}
                </p>
                <p className="text-[11px] text-gray-600 mt-1">
                  Pay this amount directly to the owner once the job is completed.
                </p>
              </div>
            </div>
          </div>

          {/* Booking info form */}
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4"
          >
            <h2 className="text-sm font-bold text-gray-900">Booking Details</h2>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.bookingDate}
                  onChange={(e) =>
                    setFormData({ ...formData, bookingDate: e.target.value })
                  }
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full rounded-2xl border border-gray-300 px-3 py-2 outline-none text-sm"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">
                    Start Time (24hr)
                  </label>
                  <select
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData({ ...formData, startTime: e.target.value })
                    }
                    className="w-full rounded-2xl border border-gray-300 px-3 py-2 outline-none text-sm"
                    required
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">
                    End Time (24hr)
                  </label>
                  <select
                    value={formData.endTime}
                    onChange={(e) =>
                      setFormData({ ...formData, endTime: e.target.value })
                    }
                    className="w-full rounded-2xl border border-gray-300 px-3 py-2 outline-none text-sm"
                    required
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
              {formData.bookingDate && availableSlots.availableRanges?.length > 0 && (
                <p className="text-[11px] text-gray-600">
                  Available: {availableSlots.availableRanges.map((r) => `${r.startTime}-${r.endTime}`).join(', ')}
                </p>
              )}
              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  Distance from equipment to your farm (km)
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.1"
                  value={formData.distance}
                  onChange={(e) =>
                    setFormData({ ...formData, distance: e.target.value })
                  }
                  className="w-full rounded-2xl border border-gray-300 px-3 py-2 outline-none text-sm"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || pricing.hours <= 0}
              className="w-full bg-farm-primary text-white rounded-2xl py-3 text-sm font-semibold disabled:bg-gray-400"
            >
              {submitting
                ? 'Creating booking…'
                : `Pay ₹${pricing.serviceCharge} Service Charge & Continue`}
            </button>
            <p className="text-[11px] text-gray-500 text-center">
              By continuing, you agree to FarmSaarthi’s terms and cancellation
              policy.
            </p>
          </form>
        </section>

        {/* Payment method / QR */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
          <h2 className="text-sm font-bold text-gray-900">Payment Method</h2>
          <div className="rounded-2xl border border-gray-200 p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-800">
                Pay with UPI App
              </span>
              <span className="text-[11px] text-gray-500">
                UPI • QR Code
              </span>
            </div>
            <div className="flex items-center justify-center">
              <div className="h-32 w-32 rounded-xl border border-dashed border-gray-400 flex items-center justify-center bg-gray-50">
                <div className="h-20 w-20 bg-gray-200" />
              </div>
            </div>
            <p className="text-[11px] text-gray-600 text-center">
              Scan this QR with your UPI app to pay ₹{pricing.serviceCharge}.
            </p>
            <button
              type="button"
              className="w-full rounded-2xl bg-gray-900 text-white py-2.5 text-sm font-semibold"
            >
              I have paid with UPI
            </button>
            <div className="mt-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-[11px] text-amber-800">
              <strong>Note:</strong> The 2% service charge is non‑refundable in case of cancellation.
            </div>
          </div>
        </section>
      </div>

      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 px-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-black rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage}
              alt="Equipment"
              className="w-full h-full object-contain"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-3 right-3 bg-black/60 text-white rounded-full px-3 py-1 text-sm font-semibold hover:bg-black/80"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;

