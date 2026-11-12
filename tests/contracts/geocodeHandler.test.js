import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { transformSync } from 'esbuild';
import { describe, expect, it, vi } from 'vitest';

const source = transformSync(
  readFileSync('supabase/functions/geocode/index.ts', 'utf8'),
  { loader: 'ts', format: 'cjs' },
).code;

// Exercise the deployed handler; only authentication and external HTTP are faked.
function setup({ status = 200, body, authenticated = true, fallback, networkError = false } = {}) {
  let handler;
  const fetch = vi.fn(async (url) => {
    if (new URL(url).hostname === 'geo.api.gouv.fr') {
      return new Response(JSON.stringify(fallback ?? []));
    }
    if (networkError) throw new Error('timeout');
    return new Response(JSON.stringify(body), { status });
  });
  runInNewContext(source, {
    require: (name) => {
      if (name !== 'https://esm.sh/@supabase/supabase-js@2') throw new Error(name);
      return { createClient: () => ({ auth: {
        getUser: async () => ({ data: { user: authenticated ? { id: 'test-user' } : null }, error: null }),
      } }) };
    },
    Deno: { env: { get: () => 'test-config' }, serve: (callback) => { handler = callback; } },
    fetch, Response, URL, AbortSignal,
    console: { error: vi.fn() },
  });
  return { fetch, call: (query = 'Paris, France') => handler(new Request('https://example.test/geocode', {
    method: 'POST',
    headers: { Authorization: 'Bearer test-token', 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })) };
}

const feature = {
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [2.347, 48.859] },
  properties: {
    label: 'Paris', city: 'Paris', postcode: '75001',
    context: '75, Paris, Île-de-France', score: 0.97,
  },
};

describe('géocodage IGN — contrat de la fonction déployée', () => {
  it('localise une ville et conserve le contrat latitude/longitude du client', async () => {
    const { call, fetch } = setup({ body: { type: 'FeatureCollection', features: [feature] } });
    const response = await call();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      latitude: 48.859, longitude: 2.347, displayName: 'Paris', city: 'Paris', postcode: '75001', department: 'Paris',
    });
    const url = new URL(fetch.mock.calls[0][0]);
    expect(url.origin).toBe('https://data.geopf.fr');
    expect(url.pathname).toBe('/geocodage/search');
    expect(url.searchParams.get('q')).toBe('Paris');
    expect(url.searchParams.get('index')).toBe('address');
  });
  it('retourne 404 pour un lieu introuvable', async () => {
    const { call } = setup({ body: { type: 'FeatureCollection', features: [] } });
    expect((await call()).status).toBe(404);
  });
  it('refuse une recherche limitée au pays', async () => {
    const { call, fetch } = setup();
    expect((await call('France')).status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });
  it.each([[null, null], [2, 91], [181, 48], ['', 48]])(
    'refuse des coordonnées fournisseur invalides : %s, %s', async (lon, lat) => {
      const { call } = setup({ body: { features: [{ ...feature, geometry: { type: 'Point', coordinates: [lon, lat] } }] } });
      expect((await call()).status).toBe(500);
    },
  );
  it('refuse un résultat de faible pertinence', async () => {
    const { call } = setup({ body: { features: [{ ...feature, properties: { ...feature.properties, score: 0.1 } }] } });
    expect((await call()).status).toBe(404);
  });
  it('signale une indisponibilité fournisseur au lieu de retourner 0, 0', async () => {
    const { call } = setup({ status: 503, body: {} });
    expect((await call()).status).toBe(500);
  });
  it('conserve le contrôle de session avant tout appel externe', async () => {
    const { call, fetch } = setup({ authenticated: false });
    expect((await call()).status).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
  });
});

const parisCommune = {
  nom: 'Paris', code: '75056', codesPostaux: ['75001', '75002'],
  centre: { type: 'Point', coordinates: [2.347, 48.8589] },
  departement: { code: '75', nom: 'Paris' },
};

describe('secours lors d’une panne IGN', () => {
  it.each([false, true])('localise 75002 Paris après erreur HTTP ou réseau (%s)', async (networkError) => {
    const { call } = setup({ status: 504, networkError, fallback: [parisCommune] });
    const response = await call('75002 Paris, France');
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      latitude: 48.8589, longitude: 2.347, city: 'Paris', postcode: '75002',
      displayName: 'Paris (75002) — centre de la commune',
    });
  });
  it('accepte une ville sans code postal uniquement si le nom exact est unique', async () => {
    const { call } = setup({ status: 504, fallback: [parisCommune] });
    expect((await call('Paris, France')).status).toBe(200);
  });
  it.each([
    ['75002 Lyon', [parisCommune]],
    ['75002', [parisCommune, { ...parisCommune, nom: 'Autre' }]],
    ['Paris', [parisCommune, { ...parisCommune, code: '99999' }]],
    ['10 rue Exemple 75002 Paris', [parisCommune]],
    ['75002 Paris', [{ ...parisCommune, centre: { type: 'Point', coordinates: [null, null] } }]],
    ['75002 Paris', []],
  ])('ne fabrique pas une localisation pour %s', async (query, fallback) => {
    const { call } = setup({ status: 504, fallback });
    expect((await call(query)).status).toBe(500);
  });
  it('ne remplace pas un lieu explicitement introuvable chez IGN', async () => {
    const { call } = setup({ body: { features: [] }, fallback: [parisCommune] });
    expect((await call('75002 Paris')).status).toBe(404);
  });
});
