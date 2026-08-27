export const distanceKm = (
  lat1,
  lon1,
  lat2,
  lon2,
) => {
  const R = 6371;

  const dLat =
    ((lat2 - lat1) * Math.PI) / 180;

  const dLon =
    ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(
      (lat1 * Math.PI) / 180,
    ) *
      Math.cos(
        (lat2 * Math.PI) / 180,
      ) *
      Math.sin(dLon / 2) ** 2;

  return (
    R *
    (2 *
      Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a),
      ))
  );
};

export const buildDistanceMap = ({
  formateurs,
  targetCoords,
  hasValidCoords,
}) => {
  const newMap = new Map();

  for (const formateur of formateurs) {
    if (
      hasValidCoords(
        formateur.latitude,
        formateur.longitude,
      )
    ) {
      const distance = distanceKm(
        Number(
          targetCoords.latitude,
        ),
        Number(
          targetCoords.longitude,
        ),
        Number(formateur.latitude),
        Number(formateur.longitude),
      );

      const roundedDistance =
        Number(distance.toFixed(2));

      /*
       * Compatibilité avec les deux usages actuels :
       * - le listing lit la Map avec l'objet formateur ;
       * - le moteur de missions lit la Map avec l'identifiant.
       */
      newMap.set(
        formateur,
        roundedDistance,
      );

      if (formateur.id) {
        newMap.set(
          formateur.id,
          roundedDistance,
        );
      }
    } else {
      newMap.set(formateur, null);

      if (formateur.id) {
        newMap.set(
          formateur.id,
          null,
        );
      }
    }
  }

  return newMap;
};
