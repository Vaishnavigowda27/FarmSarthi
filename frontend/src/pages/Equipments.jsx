import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { showToast } from '../utils/helpers';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useTranslation } from 'react-i18next';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');

/* ---------- Star display ---------- */
const StarRating = ({ rating = 0, count, size = 'sm' }) => {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';

  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} className={`${iconSize} ${i <= full ? 'text-amber-400' : half && i === full + 1 ? 'text-amber-300' : 'text-gray-300'}`}
          fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      {count !== undefined && (
        <span className="text-[10px] text-gray-500 ml-0.5">({count})</span>
      )}
    </span>
  );
};

/* ---------- Reviews panel ---------- */
const ReviewsPanel = ({ equipmentId, onClose }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`/api/reviews/equipment/${equipmentId}`);
        setReviews(data.reviews || []);
      } catch {
        showToast('Failed to load reviews', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [equipmentId]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-900">{t('equipmentPage.reviews', 'Reviews')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-lg leading-none">&times;</button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-farm-primary border-t-transparent" />
            </div>
          ) : reviews.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-10">
              {t('equipmentPage.noReviews', 'No reviews yet.')}
            </p>
          ) : (
            reviews.map((r) => (
              <div key={r._id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-800">{r.reviewer?.name || 'Anonymous'}</span>
                  <span className="text-[10px] text-gray-400">
                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}
                  </span>
                </div>
                <StarRating rating={r.rating} size="sm" />
                {r.comment && (
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">{r.comment}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

/* ---------- Main component ---------- */
const Equipment = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [equipment, setEquipment] = useState([]);
  const [ratingsMap, setRatingsMap] = useState({});   // { [equipmentId]: { avg, count } }
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [radius, setRadius] = useState('10');
  const [selectedImage, setSelectedImage] = useState(null);
  const [reviewsFor, setReviewsFor] = useState(null);  // equipmentId currently showing reviews

  const userLat = user?.location?.coordinates?.[1] || 12.2958;
  const userLng = user?.location?.coordinates?.[0] || 76.6394;

  /* Fetch equipment list */
  const loadEquipment = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/equipment', {
        params: { latitude: userLat, longitude: userLng, radius, isAvailable: true, verifiedOnly: true },
      });
      const items = data.equipment || [];
      setEquipment(items);
      // After list loads, fetch ratings in parallel
      fetchAllRatings(items);
    } catch (error) {
      console.error('Error loading equipment:', error);
      showToast('Failed to load equipment', 'error');
    } finally {
      setLoading(false);
    }
  }, [userLat, userLng, radius]);

  /* Batch-fetch ratings for all equipment items */
  const fetchAllRatings = async (items) => {
    if (!items.length) return;
    const results = await Promise.allSettled(
      items.map((item) =>
        axios.get(`/api/reviews/equipment/${item._id}`).then((r) => {
          const reviews = r.data.reviews || [];
          const count = reviews.length;
          const avg = count
            ? reviews.reduce((sum, rv) => sum + (rv.rating || 0), 0) / count
            : 0;
          return { id: item._id, avg, count };
        })
      )
    );
    const map = {};
    results.forEach((res) => {
      if (res.status === 'fulfilled') {
        map[res.value.id] = { avg: res.value.avg, count: res.value.count };
      }
    });
    setRatingsMap(map);
  };

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (user.role !== 'farmer') { navigate('/'); return; }
    loadEquipment();
  }, [user, navigate, loadEquipment]);

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
          <p className="text-sm text-gray-600">{t('equipmentPage.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search / filter bar */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex flex-col lg:flex-row lg:items-end gap-4">
          <div className="flex-1">
            <p className="text-xs text-gray-500 mb-1">{t('equipmentPage.welcomeBack')} {user?.name}</p>
            <h1 className="text-xl font-bold text-gray-900 mb-3">{t('equipmentPage.findNearby')}</h1>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder={t('equipmentPage.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 pl-11 pr-4 py-2.5 text-sm outline-none"
                />
                <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={radius}
                  onChange={(e) => setRadius(e.target.value)}
                  className="rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium outline-none"
                >
                  <option value="5">{t('equipmentPage.within5')}</option>
                  <option value="10">{t('equipmentPage.within10')}</option>
                  <option value="25">{t('equipmentPage.within25')}</option>
                  <option value="50">{t('equipmentPage.within50')}</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {filteredEquipment.length === 0 ? (
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
          <svg className="w-14 h-14 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm font-semibold text-gray-800">{t('equipmentPage.noEquipment')}</p>
          <p className="text-xs text-gray-500 mt-1">{t('equipmentPage.noEquipmentHint')}</p>
        </section>
      ) : (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Equipment cards */}
          <div className="lg:col-span-2 space-y-3">
            {filteredEquipment.map((item) => {
              const rating = ratingsMap[item._id];
              return (
                <div key={item._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col sm:flex-row">
                  {/* Thumbnail */}
                  <div
                    className={`sm:w-56 h-40 sm:h-auto bg-farm-primary/15 flex items-center justify-center overflow-hidden ${item.photos?.[0]?.url ? 'cursor-pointer' : ''}`}
                    onClick={() => { if (item.photos?.[0]?.url) setSelectedImage(`${BASE_URL}${item.photos[0].url}`); }}
                  >
                    {item.photos?.[0]?.url ? (
                      <img src={`${BASE_URL}${item.photos[0].url}`} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl">🚜</span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm sm:text-base font-semibold text-gray-900">{item.name}</h3>
                        <p className="text-xs text-[#2D6A4F] font-medium mt-0.5">{item.owner?.name || 'Unknown Owner'}</p>

                        {/* ── Rating row ── */}
                        <div className="flex items-center gap-2 mt-1">
                          {rating ? (
                            <>
                              <StarRating rating={rating.avg} count={rating.count} size="sm" />
                              <button
                                onClick={() => setReviewsFor(item._id)}
                                className="text-[10px] text-farm-primary hover:underline"
                              >
                                {t('equipmentPage.seeReviews', 'See reviews')}
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] text-gray-400">
                              {t('equipmentPage.noRatingsYet', 'No ratings yet')}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{item.description}</p>
                      </div>
                      <span className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 whitespace-nowrap">
                        {(item.distance ?? 0).toFixed(1)} km
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs mt-1">
                      <div className="space-x-3">
                        <span className="font-semibold text-farm-primary">₹{item.pricing?.perHour ?? item.pricePerHour ?? 0}/hr</span>
                        <span className="text-gray-500">₹{item.pricing?.perKm ?? item.pricePerKm ?? 0}/km</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.totalUnits > 1 && (
                          <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            item.availableUnits > 0 ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {item.availableUnits > 0
                              ? `${item.availableUnits}/${item.totalUnits} ${t('equipmentPage.unitsFreeToday')}`
                              : t('equipmentPage.fullyBooked')}
                          </span>
                        )}
                        {item.isActive ? (
                          <span className="inline-flex items-center text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            {t('equipmentPage.available')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[11px] font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                            {t('equipmentPage.notAvailable')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => navigate(`/checkout/${item._id}`)}
                        disabled={!item.isActive}
                        className="px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold bg-farm-primary text-white disabled:bg-gray-300"
                      >
                        {item.isActive ? t('equipmentPage.bookNow') : t('equipmentPage.unavailable')}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Map */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col">
            <h2 className="text-sm font-bold text-gray-900 mb-1">{t('equipmentPage.mapView')}</h2>
            <p className="text-[11px] text-gray-500 mb-3">{t('equipmentPage.mapSubtitle')}</p>
            <div className="flex-1 rounded-2xl overflow-hidden min-h-[300px]">
              <MapContainer center={[userLat, userLng]} zoom={12} style={{ height: '100%', minHeight: '300px', width: '100%' }}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                <Marker position={[userLat, userLng]} icon={userIcon}>
                  <Popup>{t('equipmentPage.yourLocation')}</Popup>
                </Marker>
                {filteredEquipment.map((item) => {
                  const lat = item.location?.coordinates?.[1];
                  const lng = item.location?.coordinates?.[0];
                  if (!lat || !lng) return null;
                  const rating = ratingsMap[item._id];
                  return (
                    <Marker key={item._id} position={[lat, lng]}>
                      <Popup>
                        <p className="font-semibold text-xs">{item.name}</p>
                        <p className="text-xs text-gray-500">
                          ₹{item.pricing?.perHour}/hr &middot; {(item.distance ?? 0).toFixed(1)} km away
                        </p>
                        {rating && (
                          <p className="text-xs text-amber-600 mt-0.5">
                            ★ {rating.avg.toFixed(1)} ({rating.count} reviews)
                          </p>
                        )}
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
            <img src={selectedImage} alt="Equipment" className="w-full h-full object-contain" />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-3 right-3 bg-black/60 text-white rounded-full px-3 py-1 text-sm font-semibold hover:bg-black/80"
            >
              {t('equipmentPage.close')}
            </button>
          </div>
        </div>
      )}

      {/* Reviews panel */}
      {reviewsFor && (
        <ReviewsPanel equipmentId={reviewsFor} onClose={() => setReviewsFor(null)} />
      )}
    </div>
  );
};

export default Equipment;