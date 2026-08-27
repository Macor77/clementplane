import {
  useCallback,
  useRef,
  useState,
} from 'react';

import {
  geocodeQuery,
  hasValidCoords,
} from '../services/geocodingService';

import { buildDistanceMap } from '../services/distanceService';

const cleanDepartment = (department) =>
  String(department ?? '')
    .replace(/^département\s+(de\s+|du\s+|des\s+|d['’])?/i, '')
    .trim();

const getFallbackCity = (displayName) =>
  String(displayName ?? '')
    .split(',')[0]
    .trim();

const extractPostcode = (...values) => {
  for (const value of values) {
    const match = String(value ?? '').match(/\b(?:0[1-9]|[1-8]\d|9[0-5]|2A|2B)\d{3}\b/i);
    if (match) return match[0].toUpperCase();
  }

  return '';
};

const buildRecognizedPlace = (target, query) => {
  const city =
    String(target.city ?? '').trim() ||
    getFallbackCity(target.displayName);

  const department = cleanDepartment(
    target.department
  );

  const postcode = extractPostcode(
    target.postcode,
    target.displayName,
    query
  );

  const locationParts = [
    city,
    department &&
    department.toLowerCase() !==
      city.toLowerCase()
      ? department
      : '',
  ].filter(Boolean);

  let label = locationParts.join(', ');

  if (postcode) {
    label = label
      ? `${label} (${postcode})`
      : postcode;
  }

  if (!label) {
    label = String(
      target.displayName ?? ''
    ).trim();
  }

  return {
    city,
    department,
    postcode,
    displayName: target.displayName,
    label,
  };
};

export default function useDistances({
  formateurs,
}) {
  const [lieu, setLieuState] = useState('');

  const [distances, setDistances] = useState(
    new Map()
  );

  const [
    recognizedPlace,
    setRecognizedPlace,
  ] = useState(null);

  const [
    distanceLoading,
    setDistanceLoading,
  ] = useState(false);

  const [
    distanceError,
    setDistanceError,
  ] = useState('');

  const requestIdRef = useRef(0);

  const setLieu = useCallback((value) => {
    requestIdRef.current += 1;

    setLieuState(value);
    setRecognizedPlace(null);
    setDistanceError('');
  }, []);

  const computeDistances = useCallback(
    async (place) => {
      const normalizedPlace = String(
        place ?? ''
      ).trim();

      if (!normalizedPlace) {
        requestIdRef.current += 1;

        setDistances(new Map());
        setRecognizedPlace(null);
        setDistanceLoading(false);
        setDistanceError('');

        return false;
      }

      const requestId =
        requestIdRef.current + 1;

      requestIdRef.current = requestId;

      setDistanceLoading(true);
      setDistanceError('');
      setRecognizedPlace(null);

      try {
        const target = await geocodeQuery(
          `${normalizedPlace}, France`
        );

        if (
          requestId !== requestIdRef.current
        ) {
          return false;
        }

        if (
          !target ||
          !hasValidCoords(
            target.latitude,
            target.longitude
          )
        ) {
          setDistances(new Map());
          setRecognizedPlace(null);

          setDistanceError(
            'Lieu introuvable. Essaie avec une ville et un code postal, par exemple : Chelles 77500.'
          );

          return false;
        }

        const newMap = buildDistanceMap({
          formateurs,
          targetCoords: target,
          hasValidCoords,
        });

        if (
          requestId !== requestIdRef.current
        ) {
          return false;
        }

        setDistances(new Map(newMap));

        setRecognizedPlace(
          buildRecognizedPlace(target, normalizedPlace)
        );

        setDistanceError('');

        return true;
      } catch (error) {
        console.error(
          'Erreur lors du calcul des distances :',
          error
        );

        if (
          requestId === requestIdRef.current
        ) {
          setDistances(new Map());
          setRecognizedPlace(null);

          setDistanceError(
            'Impossible de calculer les distances pour le moment.'
          );
        }

        return false;
      } finally {
        if (
          requestId === requestIdRef.current
        ) {
          setDistanceLoading(false);
        }
      }
    },
    [formateurs]
  );

  const clearDistances = useCallback(() => {
    requestIdRef.current += 1;

    setDistances(new Map());
    setRecognizedPlace(null);
    setDistanceLoading(false);
    setDistanceError('');
  }, []);

  return {
    lieu,
    setLieu,
    distances,
    setDistances,
    recognizedPlace,
    computeDistances,
    clearDistances,
    distanceLoading,
    distanceError,
  };
}