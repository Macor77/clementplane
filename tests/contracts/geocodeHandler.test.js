import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { transformSync } from 'esbuild';
import { describe, expect, it, vi } from 'vitest';

const source = transformSync(
  readFileSync('supabase/functions/geocode/index.ts', 'utf8'),
  { loader: 'ts', format: 'cjs' },
).code;

// Exercise the deployed handler; only authentication and external HTTP are faked.
function setup({ status = 200, body, authenticated = true } = {}) {
  let handler;
  const fetch = vi.fn(async () => new Response(JSON.stringify(body), { status }));
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
