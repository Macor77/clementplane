import { useState } from "react";
import { geocodeQuery, hasValidCoords } from "../services/geocodingService";
import { buildDistanceMap } from "../services/distanceService";

export default function useDistances({ formateurs }) {
  const [lieu, setLieu] = useState("");
  const [distances, setDistances] = useState(new Map());

  const computeDistances = async (city) => {
    if (!city) {
      setDistances(new Map());
      return;
    }

    const target = await geocodeQuery(`${city}, France`);

    if (!target || !hasValidCoords(target.latitude, target.longitude)) {
      alert("Lieu de formation introuvable. Essaie avec 'Ville + code postal'.");
      return;
    }

    const newMap = buildDistanceMap({
      formateurs,
      targetCoords: target,
      hasValidCoords,
    });

    setDistances(new Map(newMap));
  };

  const clearDistances = () => {
    setDistances(new Map());
  };

  return {
    lieu,
    setLieu,
    distances,
    setDistances,
    computeDistances,
    clearDistances,
  };
}