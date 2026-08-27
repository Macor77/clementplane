import { createClient } from '@supabase/supabase-js';
import { assertSafeE2EEnvironment } from '../../tests/e2e/support/environment.js';
import {
  E2E_ORG_EMAIL,
  E2E_TRAINER_EMAIL,
  E2E_ORG_SLUG,
  E2E_ORG_NAME,
  E2E_TRAINER_FIRST_NAME,
  E2E_TRAINER_LAST_NAME,
} from '../../tests/e2e/support/testData.js';

const url = process.env.E2E_SUPABASE_URL;
const allowReset = process.env.E2E_ALLOW_RESET;
const expectedProjectRef = process.env.E2E_PROJECT_REF;
const serviceRoleKey = process.env.E2E_SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.E2E_TEST_PASSWORD;

assertSafeE2EEnvironment({ url, allowReset, expectedProjectRef });
if (!serviceRoleKey) throw new Error('E2E_SUPABASE_SERVICE_ROLE_KEY manquante');
if (!password) throw new Error('E2E_TEST_PASSWORD manquant');

const admin = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });

async function requireOk(result, context) {
  if (result?.error) throw new Error(`${context}: ${result.error.message}`);
  return result?.data;
}

async function findAuthUser(email) {
  let page = 1;
  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;
    const found = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (found) return found;
    if (data.users.length < 100) break;
    page += 1;
  }
  return null;
}

async function ensureAuthUser(email, metadata) {
  let user = await findAuthUser(email);
  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: metadata });
    if (error) throw error;
    user = data.user;
  } else {
    const { data, error } = await admin.auth.admin.updateUserById(user.id, { password, email_confirm: true, user_metadata: metadata });
    if (error) throw error;
    user = data.user;
  }
  return user;
}

const orgUser = await ensureAuthUser(E2E_ORG_EMAIL, { first_name: 'E2E', last_name: 'OF' });
const trainerUser = await ensureAuthUser(E2E_TRAINER_EMAIL, { first_name: E2E_TRAINER_FIRST_NAME, last_name: E2E_TRAINER_LAST_NAME });

await requireOk(admin.from('profiles').upsert([
  { id: orgUser.id, first_name: 'E2E', last_name: 'OF', account_status: 'active' },
  { id: trainerUser.id, first_name: E2E_TRAINER_FIRST_NAME, last_name: E2E_TRAINER_LAST_NAME, account_status: 'active' },
], { onConflict: 'id' }), 'upsert profiles');

const existingOrg = await requireOk(admin.from('organizations').select('id').eq('slug', E2E_ORG_SLUG).maybeSingle(), 'lookup organization');
let organizationId = existingOrg?.id;
if (!organizationId) {
  const created = await requireOk(admin.from('organizations').insert({ name: E2E_ORG_NAME, slug: E2E_ORG_SLUG, status: 'active' }).select('id').single(), 'create organization');
  organizationId = created.id;
} else {
  await requireOk(admin.from('organizations').update({ name: E2E_ORG_NAME, status: 'active' }).eq('id', organizationId), 'update organization');
}

// Reset uniquement les missions appartenant à l'organisation E2E.
await requireOk(admin.from('missions').delete().eq('organization_id', organizationId), 'reset E2E missions');

await requireOk(admin.from('organization_members').upsert({
  organization_id: organizationId,
  user_id: orgUser.id,
  role: 'owner',
  status: 'active',
  joined_at: new Date().toISOString(),
}, { onConflict: 'organization_id,user_id' }), 'upsert organization membership');

const existingTrainer = await requireOk(admin.from('trainers').select('id').eq('email', E2E_TRAINER_EMAIL).maybeSingle(), 'lookup trainer');
let trainerId = existingTrainer?.id;
const trainerPayload = {
  prenom: E2E_TRAINER_FIRST_NAME,
  nom: E2E_TRAINER_LAST_NAME,
  email: E2E_TRAINER_EMAIL,
  user_id: trainerUser.id,
  ville: 'Chelles',
  code_postal: '77500',
  statut: 'Standard',
};
if (trainerId) {
  await requireOk(admin.from('trainers').update(trainerPayload).eq('id', trainerId), 'update trainer');
} else {
  const created = await requireOk(admin.from('trainers').insert(trainerPayload).select('id').single(), 'create trainer');
  trainerId = created.id;
}

// Référencement du formateur dans le réseau privé de l'OF, sans toucher aux autres OF.
await requireOk(admin.from('organization_trainers').upsert({ organization_id: organizationId, trainer_id: trainerId, statut: 'Standard', created_by_user_id: orgUser.id }, { onConflict: 'organization_id,trainer_id' }), 'upsert organization trainer');

console.log(JSON.stringify({ ok: true, organizationId, trainerId, orgUserId: orgUser.id, trainerUserId: trainerUser.id }, null, 2));
