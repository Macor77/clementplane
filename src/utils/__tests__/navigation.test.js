import { describe, expect, it } from 'vitest';
import { isOrganizationPath } from '../navigation';

describe('explicit organization routes for fresh tabs', () => {
  it.each(['/missions', '/missions/id', '/missions/edit/id', '/missions/new', '/listing', '/formateur/view/id', '/formateur/edit/id', '/formateur/new', '/formateurs/recherche', '/formateurs/import', '/planning', '/carte', '/parametres', '/decouvrir'])('recognizes %s', path => expect(isOrganizationPath(path)).toBe(true));
  it.each(['/', '/choisir-espace', '/formateur/espace', '/formateur/missions/id', '/formateur/profil', '/formateur/planning', '/admin', '/connexion', '/missions-unknown', '/formateur/view/'])('does not override %s', path => expect(isOrganizationPath(path)).toBe(false));
});
