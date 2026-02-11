/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {Number} lat1 - Latitude of point 1
 * @param {Number} lon1 - Longitude of point 1
 * @param {Number} lat2 - Latitude of point 2
 * @param {Number} lon2 - Longitude of point 2
 * @returns {Number} Distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100; // Round to 2 decimal places
};

/**
 * Convert degrees to radians
 * @param {Number} degrees
 * @returns {Number} Radians
 */
const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Check if a point is within a certain radius of another point
 * @param {Number} lat1 - Latitude of point 1
 * @param {Number} lon1 - Longitude of point 1
 * @param {Number} lat2 - Latitude of point 2
 * @param {Number} lon2 - Longitude of point 2
 * @param {Number} radius - Radius in kilometers
 * @returns {Boolean} True if within radius
 */
export const isWithinRadius = (lat1, lon1, lat2, lon2, radius = 10) => {
  const distance = calculateDistance(lat1, lon1, lat2, lon2);
  return distance <= radius;
};

/**
 * Find nearby users within a radius
 * @param {Object} centerLocation - { coordinates: [lon, lat] }
 * @param {Array} users - Array of user objects with location
 * @param {Number} radius - Radius in kilometers
 * @returns {Array} Array of users within radius with distance
 */
export const findNearbyUsers = (centerLocation, users, radius = 10) => {
  const [centerLon, centerLat] = centerLocation.coordinates;

  return users
    .map((user) => {
      const [userLon, userLat] = user.location.coordinates;
      const distance = calculateDistance(centerLat, centerLon, userLat, userLon);

      return {
        user,
        distance,
      };
    })
    .filter((item) => item.distance <= radius)
    .sort((a, b) => a.distance - b.distance);
};

/**
 * Find nearby equipment within a radius
 * @param {Object} farmerLocation - { coordinates: [lon, lat] }
 * @param {Array} equipment - Array of equipment objects with location
 * @param {Number} radius - Radius in kilometers
 * @returns {Array} Array of equipment within radius with distance
 */
export const findNearbyEquipment = (farmerLocation, equipment, radius = 10) => {
  const [farmerLon, farmerLat] = farmerLocation.coordinates;

  return equipment
    .map((equip) => {
      const [equipLon, equipLat] = equip.location.coordinates;
      const distance = calculateDistance(farmerLat, farmerLon, equipLat, equipLon);

      return {
        ...equip.toObject(),
        distance,
      };
    })
    .filter((item) => item.distance <= radius)
    .sort((a, b) => a.distance - b.distance);
};