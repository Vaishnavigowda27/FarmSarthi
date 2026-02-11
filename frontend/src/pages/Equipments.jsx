import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/mockAPI.js'; // Using mock API

export default function Equipments() {
  const navigate = useNavigate();
  const [equipments, setEquipments] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingHours, setBookingHours] = useState(1);

  useEffect(() => {
    fetchEquipments();
  }, []);

  const fetchEquipments = async () => {
    try {
      const { data } = await API.get('/equipments/nearby');
      setEquipments(data);
    } catch (error) {
      console.error('Error fetching equipments');
    }
  };

  const handleBooking = async () => {
    if (!selectedEquipment || !bookingDate) {
      alert('Please select equipment and date');
      return;
    }

    try {
      const { data } = await API.post('/bookings', {
        equipmentId: selectedEquipment._id,
        startTime: new Date(bookingDate),
        hours: bookingHours
      });
      
      // Redirect to payment
      navigate(`/payment/${data.booking._id}`);
    } catch (error) {
      alert('Booking failed: ' + error.response?.data?.message);
    }
  };

  const filteredEquipments = equipments.filter(eq => 
    eq.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-green-600">Available Equipment</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search equipment..."
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Equipment Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredEquipments.map(eq => (
            <div key={eq._id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition">
              {/* Equipment Image Placeholder */}
              <div className="h-48 bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center">
                <span className="text-white text-6xl">🚜</span>
              </div>
              
              <div className="p-4">
                <h3 className="text-xl font-semibold mb-2">{eq.name}</h3>
                <p className="text-gray-600 text-sm mb-3">{eq.description}</p>
                
                <div className="space-y-1 mb-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Price per hour:</span>
                    <span className="font-semibold text-green-600">₹{eq.pricePerHour}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Price per km:</span>
                    <span className="font-semibold">₹{eq.pricePerKm}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Distance:</span>
                    <span className="font-semibold text-blue-600">{eq.distance || '5'}km</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedEquipment(eq)}
                  className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                >
                  Book Now
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredEquipments.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No equipment found</p>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {selectedEquipment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Book {selectedEquipment.name}</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">Select Date & Time</label>
                <input
                  type="datetime-local"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Number of Hours</label>
                <input
                  type="number"
                  value={bookingHours}
                  onChange={(e) => setBookingHours(e.target.value)}
                  min="1"
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>

              <div className="bg-gray-50 p-4 rounded">
                <div className="flex justify-between mb-2">
                  <span>Hourly Rate:</span>
                  <span>₹{selectedEquipment.pricePerHour} × {bookingHours}hrs</span>
                </div>
                <div className="flex justify-between mb-2 border-t pt-2">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold">₹{selectedEquipment.pricePerHour * bookingHours}</span>
                </div>
                <div className="flex justify-between text-green-600 font-bold">
                  <span>Advance (10%):</span>
                  <span>₹{Math.round(selectedEquipment.pricePerHour * bookingHours * 0.10)}</span>
                </div>
                <div className="flex justify-between text-gray-600 text-sm mt-1">
                  <span>Remaining (Pay offline):</span>
                  <span>₹{Math.round(selectedEquipment.pricePerHour * bookingHours * 0.90)}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedEquipment(null)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBooking}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                >
                  Proceed to Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}