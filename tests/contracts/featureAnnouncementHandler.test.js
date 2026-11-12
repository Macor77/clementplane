import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { transformSync } from 'esbuild';
import { describe, expect, it, vi } from 'vitest';

const source = transformSync(
  readFileSync('supabase/functions/send-feature-announcement/index.ts', 'utf8'),
  { loader: 'ts', format: 'cjs' },
).code;

// Run the actual Edge handler. All persistence and delivery remain in memory.
function setup({ admin = true } = {}) {
  let handler;
  const recipient = { user_id: 'demo-user', email: 'demo@example.invalid', unsubscribe_token: 'a+b/c?= &token' };
  const fetch = vi.fn(async () => new Response('{}', { status: 201 }));
  const records = [];
  const userClient = {
    rpc: async (name) => ({ data: name === 'is_platform_admin' ? admin : {
      selected_total: 1, eligible: 1, unsubscribed_selected: 0, recipients: [recipient],
    } }),
    auth: { getUser: async () => ({ data: { user: { id: recipient.user_id, email: recipient.email } } }) },
  };
  const serviceClient = { from: (table) => {
    const query = {
      insert: (row) => { records.push({ table, row }); return query; },
      upsert: () => query, update: () => query, select: () => query, eq: () => query,
      single: async () => ({ data: { id: 'announcement-demo', unsubscribe_token: recipient.unsubscribe_token } }),
    };
    return query;
  } };
  runInNewContext(source, {
    require: (name) => {
      if (name !== 'https://esm.sh/@supabase/supabase-js@2') throw new Error(name);
      return { createClient: (url, key) => key === 'service' ? serviceClient : userClient };
    },
    Deno: {
      env: { get: (name) => name === 'SUPABASE_SERVICE_ROLE_KEY' ? 'service' : 'test-config' },
      serve: (callback) => { handler = callback; },
    },
    fetch, Response, URL,
  });
  return { fetch, records, recipient, call: (body) => handler(new Request('https://example.invalid/function', {
    method: 'POST', headers: { Authorization: 'Bearer fictitious', 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject: 'Nouveautés', message: 'Message fictif', audiences: ['trainers'], ...body }),
  })) };
}

describe('feature announcement canonical links', () => {
  for (const action of ['send', 'test']) {
    it.each([
      'https://clementplane-old-deployment.vercel.app',
      'https://untrusted.example.invalid',
      'http://localhost:5173',
      undefined,
    ])(`${action}: ignores client origin %s and preserves unsubscribe token`, async (appBaseUrl) => {
      const { call, fetch, recipient } = setup();
      const response = await call({ action, appBaseUrl });
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ ok: true, sent: 1, failed: 0 });
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch.mock.calls[0][0]).toBe('https://api.brevo.com/v3/smtp/email');
      const email = JSON.parse(fetch.mock.calls[0][1].body);
      const links = [...email.htmlContent.matchAll(/href="([^"]+)"/g)].map((match) => new URL(match[1]));
      expect(links.map((url) => url.origin)).toEqual(['https://app.clementplane.fr', 'https://app.clementplane.fr']);
      expect(links[0].pathname).toBe('/');
      expect(links[1].pathname).toBe('/desabonnement-nouveautes');
      expect(links[1].searchParams.get('token')).toBe(recipient.unsubscribe_token);
      expect(email.to).toEqual([{ email: recipient.email }]);
    });
  }
  it('keeps preview read-only', async () => {
    const { call, fetch, records } = setup();
    expect(await (await call({ action: 'preview' })).json()).toMatchObject({ ok: true, eligible: 1 });
    expect(fetch).not.toHaveBeenCalled();
    expect(records).toEqual([]);
  });
  it('rejects non-admin before preparing or sending any email', async () => {
    const { call, fetch, records } = setup({ admin: false });
    const response = await call({ action: 'send' });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ ok: false, error: 'ADMIN_REQUIRED' });
    expect(fetch).not.toHaveBeenCalled();
    expect(records).toEqual([]);
  });
});
