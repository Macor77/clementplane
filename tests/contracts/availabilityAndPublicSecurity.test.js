import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const reservation = read('supabase/migrations/20260821090000_fix_availability_share_reservation.sql');
const unsubscribe = read('supabase/migrations/20260825083000_feature_news_subscription_management.sql');
const publicContact = read('supabase/functions/submit-public-contact/index.ts');
const monitoring = read('supabase/migrations/20260825101500_sprint18_error_monitoring.sql');

describe('Contrats — partage des disponibilités', () => {
  it('conserve un cooldown serveur de 20 jours', () => expect(reservation).toMatch(/interval '20 days'/));
  it('verrouille atomiquement le couple formateur + e-mail', () => expect(reservation).toMatch(/pg_advisory_xact_lock[\s\S]*trainer_id[\s\S]*recipient_email/));
  it('un pending récent bloque aussi un double envoi', () => expect(reservation).toMatch(/status = 'pending'[\s\S]*interval '15 minutes'/));
  it('normalise l’e-mail destinataire indépendamment du contact', () => expect(reservation).toMatch(/lower\(btrim\(coalesce\(v_contact\.email/));
  it('la réservation est inaccessible à anon', () => expect(reservation).toMatch(/revoke all[\s\S]*reserve_my_availability_share[\s\S]*from anon/));
});

describe('Contrats — parcours publics', () => {
  it('le désabonnement nouveautés est le seul RPC public explicitement exposé ici', () => expect(unsubscribe).toMatch(/grant execute on function public\.unsubscribe_feature_news\(uuid\) to anon, authenticated/));
  it('le formulaire public possède un honeypot', () => expect(publicContact).toMatch(/if \(website\)[\s\S]*success: true/));
  it('le formulaire public applique un rate limit', () => expect(publicContact).toMatch(/15 \* 60 \* 1000[\s\S]*maxRequests = 4/));
});

describe('Contrats — surveillance', () => {
  it('client_error est explicitement autorisé mais seulement pour un utilisateur authentifié', () => {
    expect(monitoring).toMatch(/auth\.uid\(\) is null[\s\S]*AUTH_REQUIRED/);
    expect(monitoring).toMatch(/'client_error'/);
    expect(monitoring).toMatch(/grant execute[\s\S]*to authenticated/);
  });
});
