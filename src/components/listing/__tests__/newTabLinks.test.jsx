import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
globalThis.React = React;
import { expect, test } from 'vitest';
import ListingTable from '../ListingTable';
import ListingHeader from '../ListingHeader';

test('trainer name, view and edit are native links; mutations remain buttons', () => {
  const html = renderToStaticMarkup(<MemoryRouter><ListingTable filteredFormateurs={[{ id: 'demo', prenom: 'Camille', nom: 'Démo' }]} distances={new Map()} sort={{}} renderList={() => ''} planningDate={new Date(2026,9,1)} planningAvailability={{}} /></MemoryRouter>);
  expect(html).toMatch(/<a[^>]*href="\/formateur\/view\/demo"[^>]*>Camille Démo<\/a>/);
  expect(html).toMatch(/<a[^>]*href="\/formateur\/view\/demo"[^>]*>Voir<\/a>/);
  expect(html).toMatch(/<a[^>]*href="\/formateur\/edit\/demo"[^>]*>Modifier<\/a>/);
  expect(html).toMatch(/<button[^>]*class="danger"[^>]*>Retirer<\/button>/);
});
test('list header navigation is exposed as native links', () => {
  const html = renderToStaticMarkup(<MemoryRouter><ListingHeader /></MemoryRouter>);
  for (const path of ['/formateurs/recherche', '/formateurs/import', '/formateur/new']) expect(html).toContain(`href="${path}"`);
});
