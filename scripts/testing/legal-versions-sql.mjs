import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { LEGAL_VERSIONS } from '../../src/constants/legal.js';
const db=new PGlite();
await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;
create table auth.users(id uuid primary key default gen_random_uuid(), raw_user_meta_data jsonb, email text, email_confirmed_at timestamptz);
create table auth.sessions(id uuid, user_id uuid, not_after timestamptz);
create table public.trainers(id uuid primary key, user_id uuid, prenom text, nom text);
create table public.organizations(id uuid primary key, name text, status text);
create table public.organization_members(user_id uuid, organization_id uuid, status text, role text);
create table public.trainer_availability_contacts(trainer_id uuid, organization_id uuid, email text);
create table public.organization_trainers(trainer_id uuid, organization_id uuid);
create table public.platform_admins(user_id uuid);`);
await db.exec(fs.readFileSync('supabase/migrations/20260829105836_legal_acceptances.sql','utf8'));
await db.exec(fs.readFileSync('supabase/migrations/20261005135703_personal_missions_privacy_version_compatibility.sql','utf8'));
await db.exec(fs.readFileSync('supabase/migrations/20261008061224_google_calendar_privacy_notice.sql','utf8'));
await db.exec(fs.readFileSync('supabase/migrations/20261028071102_microsoft_calendar_privacy_notice.sql','utf8'));
await db.exec(fs.readFileSync('supabase/migrations/20261112073103_activity_privacy_notice.sql','utf8'));

// Exercise the upgrade with a trainer who already accepted the previous signup terms.
const existingTrainer = (await db.query(
  'insert into auth.users(raw_user_meta_data) values ($1) returning id',
  [{ signup_intent: 'trainer', terms_accepted: true, privacy_acknowledged: true,
     terms_version: '2026-08-29', privacy_version: '2026-11-12' }],
)).rows[0].id;
await db.query('insert into public.trainers(id, user_id) values (gen_random_uuid(), $1)', [existingTrainer]);
const signupReceipts = async () => (await db.query(
  'select id, document_type, document_version, accepted_at from public.legal_acceptances where user_id = $1 order by document_type',
  [existingTrainer],
)).rows;
const receiptsBeforeUpgrade = await signupReceipts();
assert.equal(receiptsBeforeUpgrade.length, 2);

for (const migration of [
  '20261118104552_professional_dossier.sql',
  '20261118111329_dossier_legal_notice.sql',
  '20261121173000_dossier_agreements.sql',
]) {
  await db.exec(fs.readFileSync(`supabase/migrations/${migration}`, 'utf8'));
}
assert.deepEqual(await signupReceipts(), receiptsBeforeUpgrade);
for(const version of ['2026-08-29','2026-10-05','2026-10-08','2026-10-28','2026-11-12','2026-11-18']) {
 const meta={signup_intent:'trainer',terms_accepted:true,privacy_acknowledged:true,terms_version:version==='2026-11-18'?LEGAL_VERSIONS.cgu:'2026-08-29',privacy_version:version};
 await db.query('insert into auth.users(raw_user_meta_data) values ($1)',[meta]);
}
const accepted=await db.query("select document_version from legal_acceptances where document_type='privacy_notice' and user_id <> $1 order by document_version", [existingTrainer]);
assert.deepEqual(accepted.rows.map(r=>r.document_version),['2026-08-29','2026-10-05','2026-10-08','2026-10-28','2026-11-12','2026-11-18']);
for(const [ack,version] of [[false,LEGAL_VERSIONS.privacy],[true,'invented']]) await assert.rejects(()=>db.query('insert into auth.users(raw_user_meta_data) values ($1)',[{signup_intent:'trainer',terms_accepted:true,terms_version:LEGAL_VERSIONS.cgu,privacy_acknowledged:ack,privacy_version:version}]));
// Signup terms and permission to deposit documents are independent for all accounts.
assert.equal((await db.query('select count(*)::int as total from dossier.agreement_acceptances')).rows[0].total, 0);
console.log('PASS: all three dossier migrations preserve previous signup receipts without granting dossier acceptance.');
await db.close();console.log('PASS: current and cached privacy versions accepted and recorded; missing acknowledgement and unknown version refused.');
