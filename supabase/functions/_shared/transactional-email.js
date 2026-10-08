const escapeHtml = (value) => String(value || '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

const decodeEntities = (value) => value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, key) => {
  if (key.startsWith('#')) {
    const code = key[1].toLowerCase() === 'x' ? parseInt(key.slice(2), 16) : Number(key.slice(1));
    return code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff)
      ? String.fromCodePoint(code) : entity;
  }
  const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', eacute: 'é', egrave: 'è', ecirc: 'ê', agrave: 'à', acirc: 'â', ccedil: 'ç', icirc: 'î', iuml: 'ï', ocirc: 'ô', ugrave: 'ù', ucirc: 'û', uuml: 'ü', ouml: 'ö', auml: 'ä', oelig: 'œ', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', ndash: '–', mdash: '—', hellip: '…', bull: '•', euro: '€' };
  const decoded = entities[key.toLowerCase()];
  return decoded && key[0] === key[0].toUpperCase() ? decoded.toUpperCase() : decoded || entity;
});

// Convert our generated email templates, preserving visible content and action URLs.
// This is a text formatter, not an HTML sanitizer for rendering untrusted input.
export const htmlToText = (html) => decodeEntities(String(html || '')
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/<(script|style|head)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
  .replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi, (_match, attributes, content) => {
    const href = attributes.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const url = href ? href[1] ?? href[2] ?? href[3] : '';
    return /^(https?:\/\/|mailto:)/i.test(decodeEntities(url)) ? `${content} (${url})` : content;
  })
  .replace(/\s*<\/t[dh]>\s*<t[dh]\b[^>]*>/gi, ' | ')
  .replace(/<br\s*\/?\s*>/gi, '\n')
  .replace(/<\/?(?:p|div|h[1-6]|tr|table|ul|ol|li|hr)\b[^>]*>/gi, '\n')
  .replace(/<[^>]*>/g, ''))
  .replace(/[\t\r ]+/g, ' ')
  .replace(/ *\n */g, '\n')
  .replace(/\n{3,}/g, '\n\n')
  .trim();

export const withTextAlternative = (payload) => ({
  ...payload,
  textContent: typeof payload.textContent === 'string' && payload.textContent.trim()
    ? payload.textContent : htmlToText(payload.htmlContent),
});

export const neutralizeActionLinks = (html) => String(html || '')
  .replace(/<(script|form)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
  .replace(/\s(?:href|action|formaction|onclick)=("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
  .replace(/https?:\/\/[^\s<"']+/gi, '[lien retiré]');

export const buildClaimInvitation = ({ recipientEmail, trainerFirstName, organizationName, appUrl, senderName, senderEmail }) => {
  const organization = organizationName || 'Votre organisme de formation partenaire';
  const signupUrl = `${appUrl}/inscription?invitation=trainer&email=${encodeURIComponent(recipientEmail)}`;
  const loginUrl = `${appUrl}/connexion`;
  const greeting = trainerFirstName ? `Bonjour ${escapeHtml(trainerFirstName)},` : 'Bonjour,';
  return withTextAlternative({
    sender: { name: senderName, email: senderEmail },
    to: [{ email: recipientEmail }],
    replyTo: { name: senderName, email: senderEmail },
    subject: `${organization} — invitation à votre espace formateur`,
    htmlContent: `<div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:#243447;max-width:600px;margin:0 auto;padding:24px;">
      <p>${greeting}</p>
      <p><strong>${escapeHtml(organization)}</strong> vous a ajouté à son réseau de formateurs sur Clementplane et vous invite à accéder à votre fiche.</p>
      <p>Votre espace vous permet de renseigner vos disponibilités et de retrouver vos propositions de missions.</p>
      <p><a href="${escapeHtml(signupUrl)}">Créer mon compte et accéder à ma fiche</a></p>
      <p>Vous avez déjà un compte ? <a href="${escapeHtml(loginUrl)}">Connectez-vous</a> avec cette adresse : ${escapeHtml(recipientEmail)}.</p>
      <p>L’inscription est facultative. ${escapeHtml(organization)} peut continuer à gérer votre fiche sans compte Clementplane.</p>
      <p style="font-size:13px;color:#64748b;">Clementplane<br>Invitation envoyée à la demande de ${escapeHtml(organization)}.</p>
    </div>`,
    tags: ['trainer_claim_invitation'],
  });
};
