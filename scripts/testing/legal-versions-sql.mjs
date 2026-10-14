import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { LEGAL_VERSIONS } from '../../src/constants/legal.js';
const db=new PGlite();
await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;
create table auth.users(id uuid primary key default gen_random_uuid(),raw_user_meta_data jsonb);`);
await db.exec(fs.readFileSync('supabase/migrations/20260829105836_legal_acceptances.sql','utf8'));
await db.exec(fs.readFileSync('supabase/migrations/20261005135703_personal_missions_privacy_version_compatibility.sql','utf8'));
await db.exec(fs.readFileSync('supabase/migrations/20261008061224_google_calendar_privacy_notice.sql','utf8'));
for(const version of ['2026-08-29','2026-10-05',LEGAL_VERSIONS.privacy]) {
 const meta={signup_intent:'trainer',terms_accepted:true,privacy_acknowledged:true,terms_version:LEGAL_VERSIONS.cgu,privacy_version:version};
 await db.query('insert into auth.users(raw_user_meta_data) values ($1)',[meta]);
}
const accepted=await db.query("select document_version from legal_acceptances where document_type='privacy_notice' order by document_version");
assert.deepEqual(accepted.rows.map(r=>r.document_version),['2026-08-29','2026-10-05','2026-10-08']);
for(const [ack,version] of [[false,LEGAL_VERSIONS.privacy],[true,'invented']]) await assert.rejects(()=>db.query('insert into auth.users(raw_user_meta_data) values ($1)',[{signup_intent:'trainer',terms_accepted:true,terms_version:LEGAL_VERSIONS.cgu,privacy_acknowledged:ack,privacy_version:version}]));
await db.close();console.log('PASS: current and cached privacy versions accepted and recorded; missing acknowledgement and unknown version refused.');
