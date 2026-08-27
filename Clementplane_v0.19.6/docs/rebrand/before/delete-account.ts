import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const authorization = req.headers.get('Authorization');
    if (!authorization) return json({ success: false, message: 'Non authentifié.' }, 401);

    const url = Deno.env.get('SUPABASE_URL')!;
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const client = createClient(url, anon, {
      global: { headers: { Authorization: authorization } },
    });
    const { data: authData, error: authError } = await client.auth.getUser();
    if (authError || !authData.user) return json({ success: false, message: 'Session invalide.' }, 401);

    const body = await req.json().catch(() => ({}));
    if (body?.confirmation !== 'SUPPRIMER')
      return json({ success: false, message: 'Confirmation incorrecte.' }, 400);

    const { data: status, error: statusError } =
      await client.rpc('get_my_account_deletion_status');
    if (statusError) throw statusError;

    if (!status?.allowed) {
      const org = status.organization_name ? ` « ${status.organization_name} »` : '';
      const message = status.reason === 'last_active_owner'
        ? `Vous êtes le dernier propriétaire actif de l’organisme${org}. Transférez d’abord la propriété à un autre utilisateur ou contactez Formaplane.`
        : `Vous êtes le dernier utilisateur actif de l’organisme${org}. Ajoutez d’abord un autre utilisateur ou contactez Formaplane.`;
      return json({ success: false, code: status.reason, message }, 409);
    }

    const admin = createClient(url, service);
    const { error: deleteError } = await admin.auth.admin.deleteUser(authData.user.id);
    if (deleteError) throw deleteError;

    return json({ success: true });
  } catch (error) {
    console.error(error);
    return json({ success: false, message: 'Impossible de supprimer le compte pour le moment.' }, 500);
  }
});
