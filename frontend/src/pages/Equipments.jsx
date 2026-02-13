import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { showToast } from '../utils/helpers';

const Equipment = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadEquipment();
  }, [user, navigate]);

  const loadEquipment = async () => {
    try {
      setLoading(true);
      
      // Get user's location for proximity search
      const userLat = user.location?.coordinates?.[1] || 12.2958;
      const userLng = user.location?.coordinates?.[0] || 76.6394;
      
      const response = await axios.get('/api/equipment/search', {
        params: {
          lat: userLat,
          lng: userLng,
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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredEquipment = equipment.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading equipment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/farmer')}
              className="text-gray-600 hover:text-gray-800"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Browse Equipment</h1>
          </div>
          <div className="flex gap-4 items-center">
            <span className="text-gray-700">{user?.name}</span>
            <button 
              onClick={handleLogout} 
              className="text-gray-600 hover:text-gray-800"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-xl">
            <input
              type="text"
              placeholder="Search equipment by name or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Showing equipment within 10km of your location
          </p>
        </div>

        {/* Equipment Grid */}
        {filteredEquipment.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-600 text-xl font-medium">No equipment found</p>
            <p className="text-gray-500 mt-2">Try adjusting your search or check back later</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEquipment.map((item) => (
              <div key={item._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200">
                {/* Equipment Image Placeholder */}
                <div className="h-48 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <svg className="w-24 h-24 text-white opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>

                <div className="p-5">
                  {/* Title & Description */}
                  <h3 className="font-bold text-lg mb-2 text-gray-800">{item.name}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{item.description}</p>
                  
                  {/* Distance Badge */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center text-gray-600 text-sm bg-gray-100 px-3 py-1 rounded-full">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {item.distance?.toFixed(1) || '0.0'} km away
                    </div>
                    
                    {item.averageRating > 0 && (
                      <div className="flex items-center text-sm bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full">
                        <svg className="w-4 h-4 mr-1 fill-current" viewBox="0 0 20 20">
                          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                        </svg>
                        {item.averageRating.toFixed(1)}
                      </div>
                    )}
                  </div>

                  {/* Pricing */}
                  <div className="space-y-2 mb-4 bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Hourly Rate:</span>
                      <span className="font-bold text-blue-600">₹{item.pricePerHour}/hr</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Per Kilometer:</span>
                      <span className="font-bold text-green-600">₹{item.pricePerKm}/km</span>
                    </div>
                  </div>

                  {/* Availability Status */}
                  <div className="mb-4">
                    {item.isActive ? (
                      <span className="inline-flex items-center text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                        Available
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">
                        <span className="w-2 h-2 bg-gray-500 rounded-full mr-1"></span>
                        Not Available
                      </span>
                    )}
                  </div>

                  {/* Book Button */}
                  <button
                    onClick={() => navigate(`/checkout/${item._id}`)}
                    disabled={!item.isActive}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {item.isActive ? 'Book Now' : 'Currently Unavailable'}
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