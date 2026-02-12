import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { getCurrentLocation, formatCurrency, showToast } from '../utils/helpers';

const Equipment = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState(null);

  useEffect(() => {
    loadEquipment();
  }, []);

  const loadEquipment = async () => {
    try {
      const coords = await getCurrentLocation();
      setLocation(coords);

      const response = await api.get('/equipment', {
        params: {
          latitude: coords.latitude,
          longitude: coords.longitude,
          radius: 10
        }
      });

      setEquipment(response.data.equipment || []);
    } catch (error) {
      console.error('Error loading equipment:', error);
      showToast('Failed to load equipment', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBook = (id) => {
    navigate(`/checkout/${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 gradient-primary bg-clip-text text-transparent">
            {t('equipment.title')}
          </h1>
          <p className="text-gray-600">
            {location && `Showing equipment within 10km of your location`}
          </p>
        </div>

        {equipment.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600 text-xl">No equipment found nearby</p>
            <p className="text-gray-500 mt-2">Try adjusting your location or check back later</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {equipment.map((item) => (
              <div key={item._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow">
                <div className="h-48 bg-gradient-secondary flex items-center justify-center">
                  <span className="text-white text-6xl">🚜</span>
                </div>

                <div className="p-6">
                  <h3 className="font-bold text-xl mb-2">{item.name}</h3>
                  <p className="text-gray-600 mb-2 line-clamp-2">{item.description}</p>
                  
                  <div className="flex items-center text-gray-600 mb-3">
                    <span className="text-sm">
                      {item.distance?.toFixed(1) || '0.0'} km {t('equipment.away')}
                    </span>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-600">Hourly Rate:</span>
                      <span className="font-semibold text-primary">
                        {formatCurrency(item.pricing?.perHour || 0)}{t('equipment.perHour')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Per KM:</span>
                      <span className="font-semibold text-secondary">
                        {formatCurrency(item.pricing?.perKm || 0)}{t('equipment.perKm')}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleBook(item._id)}
                    className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark"
                  >
                    {t('equipment.bookNow')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Equipment;