export const distanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

export const buildDistanceMap = ({ formateurs, targetCoords, hasValidCoords }) => {
  const newMap = new Map();

  for (const formateur of formateurs) {
    if (hasValidCoords(formateur.latitude, formateur.longitude)) {
      const distance = distanceKm(
        Number(targetCoords.latitude),
        Number(targetCoords.longitude),
        Number(formateur.latitude),
        Number(formateur.longitude)
      );

      newMap.set(formateur, Number(distance.toFixed(2)));
    } else {
      newMap.set(formateur, "-");
    }
  }

  return newMap;
};