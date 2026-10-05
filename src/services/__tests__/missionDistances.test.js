import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/supabaseClient', () => ({ supabase: {} }));
vi.mock('../formateursService', () => ({ getFormateurs: vi.fn() }));
vi.mock('../availabilityService', () => ({ getAvailabilitiesForMonth: vi.fn() }));
vi.mock('../missionsService', () => ({ getTrainerMissionCommitments: vi.fn() }));
vi.mock('../geocodingService', async (importOriginal) => ({
  ...await importOriginal(),
  geocodeQuery: vi.fn(),
}));

import { hasValidCoords, geocodeQuery } from '../geocodingService';
import { buildDistanceMap, distanceKm } from '../distanceService';
import { getMissionRecommendations } from '../missionMatchingService';
import { getFormateurs } from '../formateursService';

const paris = { latitude: 48.8566, longitude: 2.3522 };
const lyon = { id: 'lyon', latitude: 45.764, longitude: 4.8357 };

describe('validation des coordonnées', () => {
  it.each([null, undefined, '', '  ', false, true, [], {}, NaN, Infinity])(
    'refuse une coordonnée absente ou non numérique : %j', (value) => {
      expect(hasValidCoords(value, 2)).toBe(false);
      expect(hasValidCoords(48, value)).toBe(false);
    },
  );
  it.each([[91, 2], [-91, 2], [48, 181], [48, -181]])(
    'refuse des coordonnées hors limites : %s, %s', (lat, lon) => {
      expect(hasValidCoords(lat, lon)).toBe(false);
    },
  );
  it('accepte les chaînes numériques et les coordonnées zéro explicites', () => {
    expect(hasValidCoords('48.8566', '2.3522')).toBe(true);
    expect(hasValidCoords(0, 0)).toBe(true);
    expect(hasValidCoords(-90, 180)).toBe(true);
  });
});

describe('distances des formateurs', () => {
  it('calcule environ 391 km à vol d’oiseau entre Paris et Lyon', () => {
    expect(distanceKm(48.8566, 2.3522, 45.764, 4.8357)).toBeCloseTo(391.5, 0);
  });
  it('ne transforme pas les coordonnées manquantes en position 0, 0', () => {
    const trainer = { id: 'missing', latitude: null, longitude: null };
    const distances = buildDistanceMap({ formateurs: [trainer, lyon], targetCoords: paris, hasValidCoords });
    expect(distances.get(trainer)).toBeNull();
    expect(distances.get('missing')).toBeNull();
    expect(distances.get('lyon')).toBeCloseTo(391.5, 0);
  });
  it('ne calcule aucune distance avec une destination invalide', () => {
    const distances = buildDistanceMap({ formateurs: [lyon], targetCoords: { latitude: null, longitude: null }, hasValidCoords });
    expect(distances.get('lyon')).toBeNull();
  });
});

describe('recherche de formateur depuis une mission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getFormateurs.mockResolvedValue([lyon, { id: 'missing', latitude: null, longitude: null }]);
    geocodeQuery.mockResolvedValue(null);
  });
  it('laisse les distances inconnues lorsque le lieu ne peut pas être localisé', async () => {
    const result = await getMissionRecommendations({ ville: 'Paris', latitude: null, longitude: null });
    expect(result.formateurs.map((trainer) => trainer.distance)).toEqual([null, null]);
    expect(result.recognizedPlace).toBeNull();
  });
  it('ne remplace pas la mission par 0, 0 quand le service de localisation échoue', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    geocodeQuery.mockRejectedValue(new Error('Erreur fournisseur : 403'));
    const result = await getMissionRecommendations({ ville: 'Paris', latitude: null, longitude: null });
    expect(result.formateurs.every((trainer) => trainer.distance === null)).toBe(true);
    expect(result.recognizedPlace).toBeNull();
  });
  it('classe le formateur localisé avant celui dont les coordonnées manquent', async () => {
    geocodeQuery.mockResolvedValue({ ...paris, displayName: 'Paris' });
    const result = await getMissionRecommendations({ ville: 'Paris' });
    expect(result.formateurs.map((trainer) => trainer.id)).toEqual(['lyon', 'missing']);
    expect(result.formateurs[0].distance).toBeCloseTo(391.5, 0);
    expect(result.formateurs[1].distance).toBeNull();
  });
  it('conserve le repli sur les coordonnées enregistrées valides', async () => {
    const result = await getMissionRecommendations({ ...paris, ville: 'Paris' });
    expect(result.formateurs[0].distance).toBeCloseTo(391.5, 0);
  });
  it('ne réutilise pas la mission si un autre lieu demandé est introuvable', async () => {
    const result = await getMissionRecommendations({ ...paris, ville: 'Paris' }, { locationQuery: 'Lieu inconnu' });
    expect(result.formateurs.every((trainer) => trainer.distance === null)).toBe(true);
  });
});
