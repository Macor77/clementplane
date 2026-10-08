import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { htmlToText, withTextAlternative, neutralizeActionLinks, buildClaimInvitation } from '../../supabase/functions/_shared/transactional-email.js';

describe('transactional email readability and secure copies', () => {
  it('keeps paragraphs, French characters, table cells and actionable links in text', () => {
    const text = htmlToText('<style>hidden</style><!-- hidden --><p>Ch&eacute;hine &amp; Vincent &#233; &#x1F600;</p><table><tr><td>Formation</td><td>SST</td></tr></table><p><a href="https://app.clementplane.fr/mission?token=secret&amp;answer=yes">Répondre</a></p><script>hidden</script>');
    assert.ok(text.includes('Chéhine & Vincent é 😀'));
    assert.ok(text.includes('Formation | SST'));
    assert.ok(text.includes('Répondre (https://app.clementplane.fr/mission?token=secret&answer=yes)'));
    assert.ok(!text.includes('hidden'));
  });

  it('adds text without changing routing, tracking headers or existing explicit text', () => {
    const payload = { to: [{ email: 'recipient@example.com' }], headers: { 'X-Mailin-custom': 'formaplane_log_id:123' }, htmlContent: '<p>Bonjour</p>' };
    const result = withTextAlternative(payload);
    assert.equal(result.textContent, 'Bonjour');
    assert.deepEqual(result.headers, payload.headers);
    assert.deepEqual(result.to, payload.to);
    assert.equal(payload.textContent, undefined);
    assert.equal(withTextAlternative({ ...payload, textContent: 'Texte dédié' }).textContent, 'Texte dédié');
  });

  it('does not restore recipient action links or tokens in sender copies', () => {
    const original = '<p>Mission</p><a href="https://app.clementplane.fr/mission?token=secret">Accepter</a><p>https://app.clementplane.fr/mission?token=another-secret</p><form action="https://app.clementplane.fr/action">secret-form</form>';
    const copy = withTextAlternative({ htmlContent: neutralizeActionLinks(original) });
    assert.ok(copy.textContent.includes('Accepter'));
    assert.ok(!copy.textContent.includes('secret'));
    assert.ok(!copy.textContent.includes('https://'));
    assert.ok(!copy.htmlContent.includes('href='));
  });

  it('builds a concise invitation with matching text and functional account links', () => {
    const email = buildClaimInvitation({ recipientEmail: 'trainer+tag@example.com', trainerFirstName: '<Steven>', organizationName: 'Alter & Prévention', appUrl: 'https://app.clementplane.fr', senderName: 'Clementplane', senderEmail: 'contact@clementplane.fr' });
    assert.equal(email.to[0].email, 'trainer+tag@example.com');
    assert.ok(email.htmlContent.includes('&lt;Steven&gt;'));
    assert.ok(email.textContent.includes('Alter & Prévention'));
    assert.ok(email.textContent.includes('invitation=trainer&email=trainer%2Btag%40example.com'));
    assert.ok(email.textContent.includes('https://app.clementplane.fr/connexion'));
    assert.ok(email.textContent.includes('facultative'));
    assert.ok(!email.htmlContent.includes('gratuitement'));
    assert.ok(email.textContent.length < 1000);
  });

  it('applies the text alternative to all three Brevo sending paths', () => {
    const source = readFileSync(new URL('../../supabase/functions/send-transactional-email/index.ts', import.meta.url), 'utf8');
    const bodies = [...source.matchAll(/body: JSON\.stringify\(([^\n]+)\),/g)].map((match) => match[1]);
    assert.deepEqual(bodies, ['withTextAlternative(copyPayload)', 'withTextAlternative(payload)', 'withTextAlternative(emailPayload)']);
  });
});
