import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');

describe('Correctifs pilote premiers utilisateurs', () => {
  it('traduit les erreurs Supabase de mot de passe compromis en message actionnable', () => {
    const source = read('src/utils/authErrorMessages.js');
    expect(source).toMatch(/known to be weak and easy to guess/i);
    expect(source).toMatch(/compromis|trop courant/i);
  });

  it('ne recharge pas tout le mois après une sauvegarde de disponibilité réussie', () => {
    const source = read('src/pages/trainer/TrainerAvailability.jsx');
    const handler = source.slice(source.indexOf('const handleStatusChange'), source.indexOf('const openNotes'));
    const tryBlock = handler.slice(handler.indexOf('try {'), handler.indexOf('} catch'));
    expect(tryBlock).not.toMatch(/await loadMonth\(\)/);
  });

  it('présente sur iOS une aide explicite sans promettre un téléchargement App Store', () => {
    const source = read('src/components/pwa/PwaManager.jsx');
    expect(source).toMatch(/pas disponible sur l.App Store/i);
    expect(source).toMatch(/Voir comment installer/);
    expect(source).toMatch(/if \(ios\)[\s\S]*setInstallHelpOpen\(true\)/);
  });

  it('affiche chargement, erreur ou état vide dans la page admin utilisateurs', () => {
    const source = read('src/pages/admin/AdminApp.jsx');
    const accounts = source.slice(source.indexOf('function Accounts()'), source.indexOf('function Communications()'));
    expect(accounts).toMatch(/Chargement des utilisateurs/);
    expect(accounts).toMatch(/Aucun utilisateur/);
    expect(accounts).toMatch(/Impossible de charger les utilisateurs/);
  });
});
