import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { showToast } from '../utils/helpers';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icon (Leaflet bug with bundlers)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');

const Equipment = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [radius, setRadius] = useState('10');
  const [selectedImage, setSelectedImage] = useState(null);

  const userLat = user?.location?.coordinates?.[1] || 12.2958;
  const userLng = user?.location?.coordinates?.[0] || 76.6394;

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'farmer') {
      navigate('/');
      return;
    }
    loadEquipment();
  }, [user, navigate, radius]);

  const loadEquipment = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/equipment', {
        params: {
          latitude: userLat,
          longitude: userLng,
          radius: radius,
          isAvailable: true,
          verifiedOnly: true,
        },
      });
      setEquipment(response.data.equipment || []);
    } catch (error) {
      console.error('Error loading equipment:', error);
      showToast('Failed to load equipment', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredEquipment = equipment.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-farm-primary border-t-transparent mx-auto mb-3" />
          <p className="text-sm text-gray-600">Loading equipment near you…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome + search + filter */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex flex-col lg:flex-row lg:items-end gap-4">
          <div className="flex-1">
            <p className="text-xs text-gray-500 mb-1">
              Welcome back, {user?.name}
            </p>
            <h1 className="text-xl font-bold text-gray-900 mb-3">
              Find equipment near your farm
            </h1>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search equipment (Tractor, Harvester, Sprayer…)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 pl-11 pr-4 py-2.5 text-sm outline-none"
                />
                <svg
                  className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={radius}
                  onChange={(e) => setRadius(e.target.value)}
                  className="rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium outline-none"
                >
                  <option value="5">Within 5 km</option>
                  <option value="10">Within 10 km</option>
                  <option value="25">Within 25 km</option>
                  <option value="50">Within 50 km</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* List + map */}
      {filteredEquipment.length === 0 ? (
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
          <svg
            className="w-14 h-14 text-gray-300 mx-auto mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm font-semibold text-gray-800">
            No equipment found nearby
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Try increasing the distance filter or adjusting your search.
          </p>
        </section>
      ) : (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Equipment list */}
          <div className="lg:col-span-2 space-y-3">
            {filteredEquipment.map((item) => (
              <div
                key={item._id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col sm:flex-row"
              >
                {/* Image */}
                <div
                  className={`sm:w-56 h-40 sm:h-auto bg-farm-primary/15 flex items-center justify-center overflow-hidden ${
                    item.photos?.[0]?.url ? 'cursor-pointer' : ''
                  }`}
                  onClick={() => {
                    if (item.photos?.[0]?.url) {
                      setSelectedImage(`${BASE_URL}${item.photos[0].url}`);
                    }
                  }}
                >
                  {item.photos?.[0]?.url ? (
                    <img
                      src={`${BASE_URL}${item.photos[0].url}`}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl">🚜</span>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                        {item.name}
                      </h3>
                      <p className="text-xs text-[#2D6A4F] font-medium mt-0.5">
   {item.owner?.name || 'Unknown Owner'}
</p>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                        {item.description}
                      </p>
                    </div>
                    <span className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 whitespace-nowrap">
                      {(item.distance ?? 0).toFixed(1)} km
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs mt-1">
                    <div className="space-x-3">
                      <span className="font-semibold text-farm-primary">
                        ₹{item.pricing?.perHour ?? item.pricePerHour ?? 0}/hr
                      </span>
                      <span className="text-gray-500">
                        ₹{item.pricing?.perKm ?? item.pricePerKm ?? 0}/km
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Available units badge */}
                      {item.totalUnits > 1 && (
                        <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          item.availableUnits > 0
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-red-50 text-red-600'
                        }`}>
                          {item.availableUnits}/{item.totalUnits} units free
                        </span>
                      )}
                      {item.isActive && item.availableUnits !== 0 ? (
                        <span className="inline-flex items-center text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          ● Available
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[11px] font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                          ○ Not available
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => navigate(`/checkout/${item._id}`)}
                      disabled={!item.isActive || item.availableUnits === 0}
                      className="px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold bg-farm-primary text-white disabled:bg-gray-300"
                    >
                      {!item.isActive ? 'Unavailable' : item.availableUnits === 0 ? 'All Units Booked Today' : 'Book Now (2% Service Charge)'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Map card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col">
            <h2 className="text-sm font-bold text-gray-900 mb-1">Map View</h2>
            <p className="text-[11px] text-gray-500 mb-3">
              Equipment locations near you.
            </p>
            <div className="flex-1 rounded-2xl overflow-hidden min-h-[300px]">
              <MapContainer
                center={[userLat, userLng]}
                zoom={12}
                style={{ height: '100%', minHeight: '300px', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />

                {/* Your location */}
                <Marker position={[userLat, userLng]}  icon={userIcon}>
                  <Popup>📍 Your location</Popup>
                </Marker>

                {/* Equipment markers */}
                {filteredEquipment.map((item) => {
                  const lat = item.location?.coordinates?.[1];
                  const lng = item.location?.coordinates?.[0];
                  if (!lat || !lng) return null;
                  return (
                    <Marker key={item._id} position={[lat, lng]}>
                      <Popup>
                        <p className="font-semibold text-xs">{item.name}</p>
                        <p className="text-xs text-gray-500">
                          ₹{item.pricing?.perHour}/hr &middot;{' '}
                          {(item.distance ?? 0).toFixed(1)} km away
                        </p>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>
          </div>
        </section>
      )}

      {/* Image lightbox */}
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

export default Equipment;