import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';
const SENDER_EMAIL = 'contact@formaplane.fr';
const SENDER_NAME = 'Formaplane';
const APP_URL = 'https://app.formaplane.fr';

type EmailRequest = {
  type?: string;
  trainerId?: string;
  organizationId?: string;
  missionTrainerId?: string;
  missionId?: string;
  requestId?: string;
  contactId?: string;
  months?: string[];
  message?: string;
  copyToSender?: boolean;
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');


const formatMissionDate = (value: string) => {
  const [year, month, day] = String(value || '').split('-').map(Number);

  if (!year || !month || !day) {
    return String(value || '');
  }

  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Paris',
  }).format(new Date(Date.UTC(year, month - 1, day)));
};

const formatMissionTime = (value: string | null | undefined) => {
  if (!value) return '';

  return String(value).slice(0, 5);
};


const availabilityMonthLabel = (monthKey: string) => {
  const [year, month] = String(monthKey || '').split('-').map(Number);
  if (!year || !month) return String(monthKey || '');

  return new Intl.DateTimeFormat('fr-FR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Paris',
  }).format(new Date(Date.UTC(year, month - 1, 1)));
};

const availabilityShareDateLabel = () =>
  new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Paris',
  }).format(new Date());

const availabilityPad = (value: number) =>
  String(value).padStart(2, '0');

const availabilityIsoDay = (
  year: number,
  monthIndex: number,
  day: number,
) => `${year}-${availabilityPad(monthIndex + 1)}-${availabilityPad(day)}`;

const availabilitySharedState = ({
  day,
  declaredByDay,
  commitmentsByDay,
  recipientOrganizationId,
}: {
  day: string;
  declaredByDay: Record<string, string>;
  commitmentsByDay: Record<string, Array<Record<string, unknown>>>;
  recipientOrganizationId: string | null;
}) => {
  const declaredStatus = String(declaredByDay[day] || '');
  const commitments = commitmentsByDay[day] || [];

  const has = (status: string, sameOrganization?: boolean) =>
    commitments.some((item) => {
      if (String(item.status || '') !== status) return false;
      if (sameOrganization === undefined) return true;
      const same =
        Boolean(recipientOrganizationId) &&
        String(item.organization_id || '') === recipientOrganizationId;
      return sameOrganization ? same : !same;
    });

  if (recipientOrganizationId && has('mission', true)) {
    return {
      label: 'Mission avec votre organisme',
      tone: 'mission',
      otherOptionsCount: 0,
    };
  }

  if (has('mission')) {
    return {
      label: 'Indisponible',
      tone: 'unavailable',
      otherOptionsCount: 0,
    };
  }

  if (declaredStatus === 'indispo') {
    return {
      label: 'Indisponible',
      tone: 'unavailable',
      otherOptionsCount: 0,
    };
  }

  if (recipientOrganizationId && has('option', true)) {
    return {
      label: 'Option avec votre organisme',
      tone: 'option',
      otherOptionsCount: 0,
    };
  }

  const otherOptionsCount = commitments.filter((item) => {
    if (String(item.status || '') !== 'option') return false;
    if (!recipientOrganizationId) return true;
    return String(item.organization_id || '') !== recipientOrganizationId;
  }).length;

  if (declaredStatus === 'dispo') {
    return {
      label: 'Disponible',
      tone: 'available',
      otherOptionsCount,
    };
  }

  return {
    label: 'Non renseigné',
    tone: 'unknown',
    otherOptionsCount: 0,
  };
};

const buildAvailabilityMonthHtml = ({
  monthKey,
  declaredByDay,
  commitmentsByDay,
  recipientOrganizationId,
}: {
  monthKey: string;
  declaredByDay: Record<string, string>;
  commitmentsByDay: Record<string, Array<Record<string, unknown>>>;
  recipientOrganizationId: string | null;
}) => {
  const [year, monthNumber] = monthKey.split('-').map(Number);
  const monthIndex = monthNumber - 1;
  const first = new Date(Date.UTC(year, monthIndex, 1));
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const leading = (first.getUTCDay() + 6) % 7;

  const cells: string[] = [];

  for (let index = 0; index < leading; index += 1) {
    cells.push('<td style="width:14.285%;padding:3px;"></td>');
  }

  const palette: Record<string, { bg: string; border: string; color: string }> = {
    available: { bg: '#f0fdf4', border: '#86efac', color: '#15803d' },
    unavailable: { bg: '#fef2f2', border: '#fecaca', color: '#b42318' },
    option: { bg: '#fffbeb', border: '#fde68a', color: '#a16207' },
    mission: { bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8' },
    unknown: { bg: '#f8fafc', border: '#e2e8f0', color: '#64748b' },
  };

  for (let dayNumber = 1; dayNumber <= daysInMonth; dayNumber += 1) {
    const day = availabilityIsoDay(year, monthIndex, dayNumber);
    const state = availabilitySharedState({
      day,
      declaredByDay,
      commitmentsByDay,
      recipientOrganizationId,
    });

    const colors = palette[state.tone] || palette.unknown;
    const warning =
      state.otherOptionsCount > 0
        ? `<div style="margin-top:4px;font-size:9px;line-height:1.2;color:#854d0e;font-weight:700;">
            ⚠️ ${state.otherOptionsCount === 1
              ? "1 autre organisme s'est positionné"
              : `${state.otherOptionsCount} autres organismes se sont positionnés`}
          </div>`
        : '';

    cells.push(`
      <td style="width:14.285%;padding:3px;vertical-align:top;">
        <div style="min-height:58px;border:1px solid ${colors.border};border-radius:8px;padding:6px;background:${colors.bg};box-sizing:border-box;">
          <div style="font-size:11px;font-weight:800;color:#475569;">${dayNumber}</div>
          <div style="margin-top:6px;font-size:10px;line-height:1.2;font-weight:800;color:${colors.color};">
            ${escapeHtml(state.label)}
          </div>
          ${warning}
        </div>
      </td>
    `);
  }

  while (cells.length % 7 !== 0) {
    cells.push('<td style="width:14.285%;padding:3px;"></td>');
  }

  const rows: string[] = [];
  for (let index = 0; index < cells.length; index += 7) {
    rows.push(`<tr>${cells.slice(index, index + 7).join('')}</tr>`);
  }

  return `
    <div style="margin-top:20px;border:1px solid #dbe3ef;border-radius:12px;padding:14px;background:#ffffff;">
      <div style="margin-bottom:10px;font-size:16px;font-weight:800;color:#0f2747;text-transform:capitalize;">
        ${escapeHtml(availabilityMonthLabel(monthKey))}
      </div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;table-layout:fixed;">
        <tr>
          ${['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map((label) =>
            `<td style="padding:3px;text-align:center;font-size:9px;font-weight:800;color:#64748b;">${label}</td>`
          ).join('')}
        </tr>
        ${rows.join('')}
      </table>
    </div>
  `;
};

const buildTrainerAvailabilityShareEmail = ({
  recipientEmail,
  contactName,
  organizationName,
  trainerName,
  trainerEmail,
  months,
  declaredByDay,
  commitmentsByDay,
  recipientOrganizationId,
  organizationRegistered,
  trainerReferenced,
  registeredCtaUrl,
  signupUrl,
  trainerMessage,
}: {
  recipientEmail: string;
  contactName: string;
  organizationName: string;
  trainerName: string;
  trainerEmail: string;
  months: string[];
  declaredByDay: Record<string, string>;
  commitmentsByDay: Record<string, Array<Record<string, unknown>>>;
  recipientOrganizationId: string | null;
  organizationRegistered: boolean;
  trainerReferenced: boolean;
  registeredCtaUrl: string;
  signupUrl: string;
  trainerMessage: string;
}) => {
  const safeTrainerName = escapeHtml(trainerName);
  const safeOrganizationName = escapeHtml(organizationName);
  const safeContactName = escapeHtml(contactName);
  const safeRegisteredCtaUrl = escapeHtml(registeredCtaUrl);
  const safeSignupUrl = escapeHtml(signupUrl);
  const safeTrainerMessage = escapeHtml(trainerMessage || '');
  const communicatedAt = escapeHtml(availabilityShareDateLabel());

  const calendars = months.map((monthKey) =>
    buildAvailabilityMonthHtml({
      monthKey,
      declaredByDay,
      commitmentsByDay,
      recipientOrganizationId,
    })
  ).join('');

  const monthSubject = months
    .map((monthKey) => availabilityMonthLabel(monthKey))
    .join(', ');

  let ctaHtml = '';

  if (organizationRegistered) {
    const label = trainerReferenced
      ? `Voir la fiche de ${safeTrainerName} sur Formaplane`
      : `Retrouver ${safeTrainerName} et l’ajouter à mon réseau`;

    ctaHtml = `
      <a
        href="${safeRegisteredCtaUrl}"
        style="display:block;text-align:center;background:#2563eb;color:#ffffff;text-decoration:none;font-size:14px;font-weight:800;padding:13px 16px;border-radius:10px;margin-top:20px;"
      >
        ${label}
      </a>
    `;
  } else {
    ctaHtml = `
      <div style="margin-top:22px;padding:16px;border:1px solid #dbeafe;border-radius:10px;background:#f8fbff;">
        <div style="font-size:14px;font-weight:800;color:#1d4ed8;margin-bottom:6px;">
          Simplifiez vos échanges avec vos formateurs
        </div>
        <div style="font-size:12px;line-height:1.55;color:#64748b;">
          Formaplane permet aux organismes de retrouver leurs formateurs, consulter les disponibilités qu’ils partagent et gérer plus facilement propositions et missions.
        </div>
        <a
          href="${safeSignupUrl}"
          style="display:block;text-align:center;background:#2563eb;color:#ffffff;text-decoration:none;font-size:14px;font-weight:800;padding:12px 16px;border-radius:10px;margin-top:13px;"
        >
          Découvrir Formaplane et créer mon compte
        </a>
      </div>
    `;
  }

  return {
    sender: {
      name: SENDER_NAME,
      email: SENDER_EMAIL,
    },
    to: [{ email: recipientEmail }],
    replyTo: trainerEmail
      ? {
          name: trainerName || SENDER_NAME,
          email: trainerEmail,
        }
      : {
          name: SENDER_NAME,
          email: SENDER_EMAIL,
        },
    subject: `${trainerName} partage ses disponibilités — ${monthSubject}`,
    htmlContent: `
      <div style="margin:0;padding:30px 16px;background:#f3f6fb;font-family:Arial,Helvetica,sans-serif;color:#0f2747;">
        <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #dbe3ef;border-radius:18px;padding:28px;box-sizing:border-box;">
          <div style="font-size:22px;font-weight:800;margin-bottom:24px;color:#0f2747;">Formaplane</div>

          <div style="font-size:11px;font-weight:800;letter-spacing:1.4px;color:#2563eb;text-transform:uppercase;margin-bottom:8px;">
            Disponibilités formateur
          </div>

          <h1 style="margin:0 0 12px;font-size:23px;line-height:1.25;color:#0f2747;">
            ${safeTrainerName} partage ses disponibilités
          </h1>

          <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#5b6b82;">
            ${safeContactName ? `${safeContactName}, ` : ''}${safeTrainerName} vous transmet ses disponibilités pour les mois sélectionnés.
          </p>

          <p style="margin:0;font-size:12px;line-height:1.55;color:#64748b;">
            Organisme destinataire : <strong>${safeOrganizationName}</strong>
          </p>

          <div style="margin-top:16px;padding:11px 13px;border-radius:10px;background:#f8fafc;border:1px solid #e2e8f0;font-size:11px;line-height:1.5;color:#64748b;">
            <strong>Disponibilités communiquées le ${communicatedAt}.</strong>
            Elles peuvent évoluer : rapprochez-vous directement du formateur pour les confirmer.
          </div>

          ${
            safeTrainerMessage
              ? `
                <div style="margin-top:16px;padding:14px 16px;border-radius:10px;background:#fff;border:1px solid #dbe3ef;">
                  <div style="font-size:11px;font-weight:800;letter-spacing:.6px;text-transform:uppercase;color:#64748b;margin-bottom:2px;line-height:1.2;">
                    Message de ${safeTrainerName}
                  </div>
                  <div style="font-size:13px;line-height:1.5;color:#334155;white-space:pre-line;margin-top:0;">
                    ${safeTrainerMessage}
                  </div>
                </div>
              `
              : ''
          }

          ${calendars}

          <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:17px;font-size:10px;font-weight:700;">
            <span style="color:#15803d;">● Disponible</span>
            <span style="color:#a16207;">● Option avec votre organisme</span>
            <span style="color:#1d4ed8;">● Mission avec votre organisme</span>
            <span style="color:#b42318;">● Indisponible</span>
            <span style="color:#64748b;">● Non renseigné</span>
          </div>

          ${ctaHtml}

          <div style="margin-top:24px;padding-top:16px;border-top:1px solid #dbe3ef;font-size:10px;line-height:1.5;color:#94a3b8;">
            Formaplane transmet les informations renseignées par le formateur. Pour confirmer une disponibilité, contactez directement ${safeTrainerName}.
          </div>
        </div>
      </div>
    `,
  };
};


const buildMissionProposalEmail = ({
  recipientEmail,
  trainerFirstName,
  organizationName,
  proposalUrl,
  trainerHomeUrl,
  signupUrl,
  trainerHasAccount,
  isReminder,
  missionTitle,
  formation,
  client,
  location,
  dates,
}: {
  recipientEmail: string;
  trainerFirstName: string;
  organizationName: string;
  proposalUrl: string;
  trainerHomeUrl: string;
  signupUrl: string;
  trainerHasAccount: boolean;
  isReminder: boolean;
  missionTitle: string;
  formation: string;
  client: string;
  location: string;
  dates: Array<{
    date?: string;
    heure_debut?: string | null;
    heure_fin?: string | null;
  }>;
}) => {
  const safeTrainerFirstName = escapeHtml(
    trainerFirstName || 'Bonjour',
  );
  const safeOrganizationName = escapeHtml(organizationName);
  const safeMissionTitle = escapeHtml(
    missionTitle || formation || 'Mission de formation',
  );
  const safeFormation = escapeHtml(formation || 'Non renseignée');
  const safeClient = escapeHtml(client || 'Non renseigné');
  const safeLocation = escapeHtml(location || 'Non renseigné');
  const safeProposalUrl = escapeHtml(proposalUrl);
  const safeTrainerHomeUrl = escapeHtml(trainerHomeUrl);
  const safeSignupUrl = escapeHtml(signupUrl);

  const dateRows = (dates || [])
    .map((item) => {
      const day = escapeHtml(formatMissionDate(item.date || ''));
      const start = escapeHtml(formatMissionTime(item.heure_debut));
      const end = escapeHtml(formatMissionTime(item.heure_fin));
      const hours =
        start && end
          ? `${start} – ${end}`
          : start || end || '';

      return `
        <div style="padding:7px 0;border-bottom:1px solid #edf1f5;">
          <strong style="color:#0f2747;">${day}</strong>
          ${hours ? `<span style="color:#64748b;"> · ${hours}</span>` : ''}
        </div>
      `;
    })
    .join('');


  return {
    sender: {
      name: SENDER_NAME,
      email: SENDER_EMAIL,
    },
    to: [{ email: recipientEmail }],
    replyTo: {
      name: SENDER_NAME,
      email: SENDER_EMAIL,
    },
    subject: isReminder
      ? `Relance — ${organizationName} vous propose une mission de formation`
      : `${organizationName} vous propose une mission de formation`,
    htmlContent: `
      <div style="margin:0;padding:40px 20px;background-color:#f3f6fb;font-family:Arial,Helvetica,sans-serif;color:#0f2747;">
        <div style="max-width:600px;margin:0 auto;background-color:#ffffff;border:1px solid #dbe3ef;border-radius:18px;padding:36px;box-sizing:border-box;">
          <div style="font-size:24px;font-weight:800;margin-bottom:28px;color:#0f2747;">Formaplane</div>

          <div style="font-size:12px;font-weight:800;letter-spacing:1.5px;color:#2563eb;text-transform:uppercase;margin-bottom:10px;">
            ${isReminder ? 'Relance — proposition de mission' : 'Proposition de mission'}
          </div>

          <h1 style="margin:0 0 14px 0;font-size:25px;line-height:1.25;color:#0f2747;">
            ${safeTrainerFirstName}, ${isReminder ? `${safeOrganizationName} vous rappelle une proposition de mission` : `${safeOrganizationName} vous propose une mission`}
          </h1>

          <p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;color:#5b6b82;">
            ${isReminder
              ? 'Cette mission vous a déjà été proposée. Vous pouvez toujours consulter les informations ci-dessous et répondre en quelques instants.'
              : 'Consultez les informations ci-dessous puis ouvrez la proposition pour répondre directement depuis Formaplane.'}
          </p>

          <div style="border:1px solid #dbe3ef;border-radius:12px;padding:18px;margin-bottom:20px;background:#f8fafc;">
            <div style="font-size:18px;font-weight:800;color:#0f2747;margin-bottom:12px;">
              ${safeMissionTitle}
            </div>

            <div style="font-size:14px;line-height:1.7;color:#475569;">
              <div><strong>Formation :</strong> ${safeFormation}</div>
              <div><strong>Client :</strong> ${safeClient}</div>
              <div><strong>Lieu :</strong> ${safeLocation}</div>
            </div>

            ${
              dateRows
                ? `<div style="margin-top:12px;font-size:13px;line-height:1.5;">${dateRows}</div>`
                : ''
            }
          </div>

          <a
            href="${safeProposalUrl}"
            style="display:block;text-align:center;background:#2563eb;color:#ffffff;text-decoration:none;font-size:15px;font-weight:800;padding:14px 18px;border-radius:10px;"
          >
            Consulter la mission et répondre
          </a>

          <p style="margin:18px 0 0 0;font-size:13px;line-height:1.55;color:#64748b;">
            Depuis cette page, vous pourrez accepter ou refuser la proposition et, si besoin, ajouter un commentaire.
          </p>

          ${
            trainerHasAccount
              ? `
                <div style="margin-top:18px;padding-top:16px;border-top:1px solid #edf1f5;font-size:12px;line-height:1.55;color:#64748b;">
                  Vous utilisez déjà Formaplane ? Retrouvez également vos disponibilités et vos missions depuis votre espace formateur.
                  <div style="margin-top:7px;">
                    <a href="${safeTrainerHomeUrl}" style="color:#2563eb;text-decoration:none;font-weight:700;">
                      Accéder à mon espace Formaplane
                    </a>
                  </div>
                </div>
              `
              : `
                <div style="margin-top:20px;padding:15px 16px;border:1px solid #dbeafe;border-radius:10px;background:#f8fbff;font-size:12px;line-height:1.55;color:#64748b;">
                  <div style="margin-bottom:4px;color:#1d4ed8;font-size:13px;font-weight:800;">
                    Simplifiez aussi la gestion de vos disponibilités
                  </div>
                  Renseignez vos disponibilités une seule fois dans Formaplane et partagez-les en temps réel avec vos organismes de formation partenaires.
                  <div style="margin-top:8px;">
                    <a href="${safeSignupUrl}" style="color:#2563eb;text-decoration:none;font-weight:800;">
                      Découvrir Formaplane →
                    </a>
                  </div>
                </div>
              `
          }

          <div style="margin-top:26px;padding-top:18px;border-top:1px solid #dbe3ef;font-size:11px;line-height:1.5;color:#94a3b8;">
            Formaplane<br />
            Facilitez vos disponibilités, propositions et missions avec vos organismes partenaires.
          </div>
        </div>
      </div>
    `,
  };
};


const buildMissionAssignmentConfirmationEmail = ({
  recipientEmail,
  trainerFirstName,
  organizationName,
  organizationContactName,
  organizationContactEmail,
  organizationContactPhone,
  trainerHasAccount,
  trainerMissionUrl,
  missionTitle,
  formation,
  client,
  location,
  dates,
}: {
  recipientEmail: string;
  trainerFirstName: string;
  organizationName: string;
  organizationContactName: string;
  organizationContactEmail: string;
  organizationContactPhone: string;
  trainerHasAccount: boolean;
  trainerMissionUrl: string;
  missionTitle: string;
  formation: string;
  client: string;
  location: string;
  dates: Array<{
    date?: string;
    heure_debut?: string | null;
    heure_fin?: string | null;
  }>;
}) => {
  const safeTrainerFirstName = escapeHtml(
    trainerFirstName || 'Bonjour',
  );
  const safeOrganizationName = escapeHtml(organizationName);
  const safeContactName = escapeHtml(organizationContactName);
  const safeContactEmail = escapeHtml(organizationContactEmail);
  const safeContactPhone = escapeHtml(organizationContactPhone);
  const safeTrainerMissionUrl = escapeHtml(trainerMissionUrl);
  const safeMissionTitle = escapeHtml(
    missionTitle || formation || 'Mission de formation',
  );
  const safeFormation = escapeHtml(formation || 'Non renseignée');
  const safeClient = escapeHtml(client || 'Non renseigné');
  const safeLocation = escapeHtml(location || 'Non renseigné');

  const dateRows = (dates || [])
    .map((item) => {
      const day = escapeHtml(formatMissionDate(item.date || ''));
      const start = escapeHtml(formatMissionTime(item.heure_debut));
      const end = escapeHtml(formatMissionTime(item.heure_fin));
      const hours =
        start && end
          ? `${start} – ${end}`
          : start || end || '';

      return `
        <div style="padding:7px 0;border-bottom:1px solid #edf1f5;">
          <strong style="color:#0f2747;">${day}</strong>
          ${hours ? `<span style="color:#64748b;"> · ${hours}</span>` : ''}
        </div>
      `;
    })
    .join('');

  const contactLines = [
    safeContactName
      ? `<div><strong>Contact :</strong> ${safeContactName}</div>`
      : '',
    safeContactEmail
      ? `<div><strong>E-mail :</strong> ${safeContactEmail}</div>`
      : '',
    safeContactPhone
      ? `<div><strong>Téléphone :</strong> ${safeContactPhone}</div>`
      : '',
  ]
    .filter(Boolean)
    .join('');

  return {
    sender: {
      name: SENDER_NAME,
      email: SENDER_EMAIL,
    },
    to: [{ email: recipientEmail }],
    replyTo: organizationContactEmail
      ? {
          name: organizationContactName || organizationName,
          email: organizationContactEmail,
        }
      : {
          name: SENDER_NAME,
          email: SENDER_EMAIL,
        },
    subject: `${organizationName} confirme votre affectation à une mission`,
    htmlContent: `
      <div style="margin:0;padding:40px 20px;background-color:#f3f6fb;font-family:Arial,Helvetica,sans-serif;color:#0f2747;">
        <div style="max-width:600px;margin:0 auto;background-color:#ffffff;border:1px solid #dbe3ef;border-radius:18px;padding:36px;box-sizing:border-box;">
          <div style="font-size:24px;font-weight:800;margin-bottom:28px;color:#0f2747;">Formaplane</div>

          <div style="font-size:12px;font-weight:800;letter-spacing:1.5px;color:#15803d;text-transform:uppercase;margin-bottom:10px;">
            Mission confirmée
          </div>

          <h1 style="margin:0 0 14px 0;font-size:25px;line-height:1.25;color:#0f2747;">
            ${safeTrainerFirstName}, votre affectation est confirmée
          </h1>

          <p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;color:#5b6b82;">
            ${safeOrganizationName} vous confirme officiellement sur la mission ci-dessous.
          </p>

          <div style="border:1px solid #dbe3ef;border-radius:12px;padding:18px;margin-bottom:18px;background:#f8fafc;">
            <div style="font-size:18px;font-weight:800;color:#0f2747;margin-bottom:12px;">
              ${safeMissionTitle}
            </div>

            <div style="font-size:14px;line-height:1.7;color:#475569;">
              <div><strong>Formation :</strong> ${safeFormation}</div>
              <div><strong>Client :</strong> ${safeClient}</div>
              <div><strong>Lieu :</strong> ${safeLocation}</div>
            </div>

            ${
              dateRows
                ? `<div style="margin-top:12px;font-size:13px;line-height:1.5;">${dateRows}</div>`
                : ''
            }
          </div>

          <div style="margin-bottom:18px;padding:16px 17px;border:1px solid #bfdbfe;border-radius:12px;background:#eff6ff;">
            <div style="font-size:14px;font-weight:800;color:#1d4ed8;margin-bottom:6px;">
              À présent, rapprochez-vous directement de l’organisme de formation
            </div>

            <div style="font-size:13px;line-height:1.6;color:#475569;">
              Formaplane confirme la planification et votre affectation à cette mission.
              Pour préparer concrètement l’intervention, il est important de vous rapprocher directement de
              <strong> ${safeOrganizationName}</strong> afin de convenir ensemble des modalités
              <strong> logistiques, organisationnelles et administratives</strong> :
              accès au site, horaires pratiques, matériel ou supports nécessaires, documents,
              convention ou contrat, éléments administratifs et toute autre information utile.
            </div>

            <div style="margin-top:9px;font-size:13px;line-height:1.6;color:#475569;">
              Ces échanges ainsi que la gestion du dossier se font directement entre vous et l’organisme de formation,
              en dehors de Formaplane.
            </div>
          </div>

          ${
            contactLines
              ? `
                <div style="margin-bottom:20px;padding:14px 16px;border:1px solid #e2e8f0;border-radius:10px;background:#ffffff;font-size:13px;line-height:1.65;color:#475569;">
                  <div style="margin-bottom:5px;font-size:12px;font-weight:800;color:#64748b;text-transform:uppercase;">
                    Votre contact chez ${safeOrganizationName}
                  </div>
                  ${contactLines}
                </div>
              `
              : ''
          }

          ${
            trainerHasAccount
              ? `
                <a
                  href="${safeTrainerMissionUrl}"
                  style="display:block;text-align:center;background:#2563eb;color:#ffffff;text-decoration:none;font-size:15px;font-weight:800;padding:14px 18px;border-radius:10px;"
                >
                  Voir ma mission dans Formaplane
                </a>

                <p style="margin:12px 0 0;font-size:12px;line-height:1.55;color:#64748b;text-align:center;">
                  Vous retrouverez également cette mission dans votre espace formateur.
                </p>
              `
              : ''
          }

          <div style="margin-top:26px;padding-top:18px;border-top:1px solid #dbe3ef;font-size:11px;line-height:1.5;color:#94a3b8;">
            Formaplane<br />
            La mission est planifiée dans Formaplane ; sa préparation opérationnelle se poursuit directement avec votre organisme partenaire.
          </div>
        </div>
      </div>
    `,
  };
};

const buildMissionChangeRevalidationEmail = ({
  recipientEmail,
  trainerFirstName,
  organizationName,
  missionTitle,
  responseUrl,
  previousStatus,
  previousMission,
  proposedMission,
  previousDates,
  proposedDates,
}: {
  recipientEmail: string;
  trainerFirstName: string;
  organizationName: string;
  missionTitle: string;
  responseUrl: string;
  previousStatus: string;
  previousMission: Record<string, unknown>;
  proposedMission: Record<string, unknown>;
  previousDates: Array<Record<string, unknown>>;
  proposedDates: Array<Record<string, unknown>>;
}) => {
  const affected = previousStatus === 'affecte';
  const rows: Array<{ label: string; before: string; after: string }> = [];
  const add = (label: string, before: unknown, after: unknown) => {
    const a = before == null ? '' : String(before);
    const b = after == null ? '' : String(after);
    if (a !== b) rows.push({ label, before: a || 'Non renseigné', after: b || 'Non renseigné' });
  };
  add('Formation', previousMission?.formation, proposedMission?.formation);
  add('Lieu / site', previousMission?.lieu, proposedMission?.lieu);
  add('Adresse', previousMission?.adresse, proposedMission?.adresse);
  add(
    'Ville',
    [previousMission?.code_postal, previousMission?.ville].filter(Boolean).join(' '),
    [proposedMission?.code_postal, proposedMission?.ville].filter(Boolean).join(' '),
  );

  const datesText = (items: Array<Record<string, unknown>>) =>
    (items || []).map((item) => {
      const day = formatMissionDate(String(item.date || ''));
      const start = formatMissionTime(String(item.heure_debut || ''));
      const end = formatMissionTime(String(item.heure_fin || ''));
      return `${day}${start || end ? ` · ${start}${start && end ? ' – ' : ''}${end}` : ''}`;
    }).join(' ; ') || 'Aucune date';

  if (JSON.stringify(previousDates || []) !== JSON.stringify(proposedDates || [])) {
    rows.push({ label: 'Dates et horaires', before: datesText(previousDates), after: datesText(proposedDates) });
  }

  const diffRows = rows.map((row) => `
    <div style="padding:12px 0;border-bottom:1px solid #e8edf4;">
      <div style="font-size:13px;font-weight:800;color:#0f2747;margin-bottom:5px;">${escapeHtml(row.label)}</div>
      <div style="font-size:12px;color:#64748b;line-height:1.5;"><strong>Avant :</strong> ${escapeHtml(row.before)}</div>
      <div style="font-size:12px;color:#1d4ed8;font-weight:700;line-height:1.5;"><strong>Maintenant :</strong> ${escapeHtml(row.after)}</div>
    </div>
  `).join('');

  return {
    sender: { name: SENDER_NAME, email: SENDER_EMAIL },
    to: [{ email: recipientEmail }],
    replyTo: { name: SENDER_NAME, email: SENDER_EMAIL },
    subject: affected
      ? 'Votre validation est requise — Une mission confirmée a été modifiée'
      : 'Votre validation est requise — Une proposition de mission a été modifiée',
    htmlContent: `
      <div style="margin:0;padding:40px 20px;background:#f3f6fb;font-family:Arial,Helvetica,sans-serif;color:#0f2747;">
        <div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #dbe3ef;border-radius:18px;padding:36px;box-sizing:border-box;">
          <div style="font-size:24px;font-weight:800;margin-bottom:28px;">Formaplane</div>
          <div style="font-size:12px;font-weight:800;letter-spacing:1.5px;color:#2563eb;text-transform:uppercase;margin-bottom:10px;">Modification de mission</div>
          <h1 style="margin:0 0 14px;font-size:25px;line-height:1.25;">${escapeHtml(trainerFirstName || 'Bonjour')}, votre validation est requise</h1>
          <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#5b6b82;">
            <strong>${escapeHtml(organizationName)}</strong> a modifié certaines conditions de ${affected ? 'la mission qui vous avait été confirmée' : 'la mission que vous aviez acceptée'} : <strong>${escapeHtml(missionTitle)}</strong>.
          </p>
          <div style="border:1px solid #dbe3ef;border-radius:12px;padding:16px;background:#f8fafc;margin-bottom:20px;">
            <div style="font-size:16px;font-weight:800;margin-bottom:4px;">Ce qui change</div>
            ${diffRows || '<div style="font-size:13px;color:#64748b;">Consultez Formaplane pour voir les nouvelles conditions.</div>'}
          </div>
          <p style="margin:0 0 20px;font-size:13px;line-height:1.6;color:#64748b;">Les éventuelles conditions tarifaires ne sont pas affichées dans cet e-mail. Consultez les modifications puis confirmez si vous maintenez votre accord.</p>
          <a href="${escapeHtml(responseUrl)}" style="display:inline-block;padding:13px 20px;border-radius:9px;background:#2563eb;color:#fff;font-size:14px;font-weight:800;text-decoration:none;">Consulter les modifications et répondre</a>
          <p style="margin:24px 0 0;font-size:11px;line-height:1.55;color:#94a3b8;">Vous pouvez répondre à cette demande même si vous ne possédez pas encore de compte Formaplane.</p>
        </div>
      </div>
    `,
  };
};

const buildInfrastructureTestEmail = (recipientEmail: string) => ({
  sender: { name: SENDER_NAME, email: SENDER_EMAIL },
  to: [{ email: recipientEmail }],
  replyTo: { name: SENDER_NAME, email: SENDER_EMAIL },
  subject: 'Test technique Formaplane',
  htmlContent: `
    <div style="margin:0;padding:40px 20px;background-color:#f3f6fb;font-family:Arial,Helvetica,sans-serif;color:#0f2747;">
      <div style="max-width:560px;margin:0 auto;background-color:#ffffff;border:1px solid #dbe3ef;border-radius:18px;padding:40px;box-sizing:border-box;">
        <div style="font-size:24px;font-weight:800;margin-bottom:32px;color:#0f2747;">Formaplane</div>
        <div style="font-size:12px;font-weight:800;letter-spacing:1.5px;color:#2563eb;text-transform:uppercase;margin-bottom:12px;">Test technique</div>
        <h1 style="margin:0 0 16px 0;font-size:28px;line-height:1.2;color:#0f2747;">Le moteur d'e-mails fonctionne</h1>
        <p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;color:#5b6b82;">Cet e-mail a été envoyé depuis Formaplane via notre moteur transactionnel centralisé.</p>
        <p style="margin:0;font-size:16px;line-height:1.6;color:#5b6b82;">Aucune action n'est nécessaire.</p>
        <div style="margin-top:32px;padding-top:22px;border-top:1px solid #e5eaf1;font-size:12px;line-height:1.6;color:#94a0b2;">Formaplane<br>Gérez vos formateurs, leurs disponibilités et vos missions simplement.</div>
      </div>
    </div>
  `,
  tags: ['infrastructure_test'],
});

const buildTrainerClaimInvitationEmail = ({
  recipientEmail,
  trainerFirstName,
  organizationName,
}: {
  recipientEmail: string;
  trainerFirstName: string;
  organizationName: string;
}) => {
  const signupUrl = `${APP_URL}/inscription?invitation=trainer&email=${encodeURIComponent(recipientEmail)}`;
  const loginUrl = `${APP_URL}/connexion`;
  const safeFirstName = escapeHtml(trainerFirstName || 'Bonjour');
  const safeOrganizationName = escapeHtml(organizationName || 'Un organisme de formation partenaire');

  return {
    sender: { name: SENDER_NAME, email: SENDER_EMAIL },
    to: [{ email: recipientEmail }],
    replyTo: { name: SENDER_NAME, email: SENDER_EMAIL },
    subject: `${organizationName} vous invite à rejoindre Formaplane`,
    htmlContent: `
      <div style="margin:0;padding:40px 20px;background-color:#f3f6fb;font-family:Arial,Helvetica,sans-serif;color:#0f2747;">
        <div style="max-width:600px;margin:0 auto;background-color:#ffffff;border:1px solid #dbe3ef;border-radius:18px;padding:40px;box-sizing:border-box;">
          <div style="font-size:24px;font-weight:800;margin-bottom:32px;color:#0f2747;">Formaplane</div>
          <div style="font-size:12px;font-weight:800;letter-spacing:1.5px;color:#2563eb;text-transform:uppercase;margin-bottom:12px;">Invitation formateur</div>
          <h1 style="margin:0 0 16px 0;font-size:28px;line-height:1.25;color:#0f2747;">${safeFirstName}, ${safeOrganizationName} vous invite à rejoindre Formaplane</h1>
          <p style="margin:0 0 16px 0;font-size:16px;line-height:1.65;color:#5b6b82;">${safeOrganizationName} vous a ajouté à son réseau de formateurs sur Formaplane.</p>
          <p style="margin:0 0 16px 0;font-size:16px;line-height:1.65;color:#5b6b82;">En créant gratuitement votre espace et en revendiquant votre fiche, vous pourrez <strong style="color:#334155;">renseigner vos disponibilités une seule fois et les partager en direct avec tous vos organismes de formation partenaires</strong>, retrouver vos propositions de missions et faciliter vos échanges avec eux.</p>
          <p style="margin:0 0 28px 0;font-size:14px;line-height:1.6;color:#7b8798;">Votre inscription reste facultative : ${safeOrganizationName} peut continuer à gérer votre fiche même sans compte Formaplane.</p>
          <a href="${signupUrl}" style="display:block;background-color:#2563eb;color:#ffffff;text-decoration:none;text-align:center;font-size:16px;font-weight:700;padding:15px 24px;border-radius:10px;">Créer mon compte et revendiquer ma fiche</a>
          <p style="margin:22px 0 0;font-size:14px;line-height:1.6;color:#64748b;text-align:center;">Vous avez déjà un compte Formaplane ? <a href="${loginUrl}" style="color:#2563eb;font-weight:700;">Connectez-vous</a> avec cette adresse e-mail : Formaplane vous proposera automatiquement la fiche correspondante.</p>
          <div style="margin-top:32px;padding-top:22px;border-top:1px solid #e5eaf1;font-size:12px;line-height:1.6;color:#94a0b2;">Formaplane<br>Facilitez vos disponibilités, propositions et missions avec vos organismes partenaires.</div>
        </div>
      </div>
    `,
    tags: ['trainer_claim_invitation'],
  };
};


const buildMissionCancellationEmail = ({
  recipientEmail,
  trainerFirstName,
  organizationName,
  missionTitle,
  formation,
  client,
  location,
  dates,
  trainerHasAccount,
}: {
  recipientEmail: string;
  trainerFirstName: string;
  organizationName: string;
  missionTitle: string;
  formation: string;
  client: string;
  location: string;
  dates: Array<{ date?: string; heure_debut?: string | null; heure_fin?: string | null }>;
  trainerHasAccount: boolean;
}) => {
  const rows = (dates || []).map((item) => {
    const day = escapeHtml(formatMissionDate(item.date || ''));
    const start = escapeHtml(formatMissionTime(item.heure_debut));
    const end = escapeHtml(formatMissionTime(item.heure_fin));
    return `<div style="padding:7px 0;border-bottom:1px solid #edf1f5;"><strong>${day}</strong>${start || end ? ` · ${start}${start && end ? ' – ' : ''}${end}` : ''}</div>`;
  }).join('');

  return {
    sender: { name: SENDER_NAME, email: SENDER_EMAIL },
    to: [{ email: recipientEmail }],
    replyTo: { name: SENDER_NAME, email: SENDER_EMAIL },
    subject: `Mission annulée — ${missionTitle || formation || 'Mission de formation'}`,
    htmlContent: `
      <div style="font-family:Arial,sans-serif;background:#f6f8fb;padding:28px;color:#0f2747;">
        <div style="max-width:640px;margin:auto;background:white;border-radius:14px;padding:28px;border:1px solid #e5eaf0;">
          <div style="font-size:20px;font-weight:800;margin-bottom:18px;">Formaplane</div>
          <h1 style="font-size:22px;margin:0 0 12px;color:#b42318;">Cette mission a été annulée</h1>
          <p>Bonjour ${escapeHtml(trainerFirstName || '')},</p>
          <p><strong>${escapeHtml(organizationName)}</strong> vous informe que la mission ci-dessous est annulée. Aucune action n’est attendue de votre part.</p>
          <div style="background:#f8fafc;border-radius:10px;padding:16px;margin:18px 0;">
            <strong>${escapeHtml(missionTitle || formation || 'Mission de formation')}</strong>
            <div style="margin-top:8px;">Formation : ${escapeHtml(formation || 'Non renseignée')}</div>
            <div>Client : ${escapeHtml(client || 'Non renseigné')}</div>
            <div>Lieu : ${escapeHtml(location || 'Non renseigné')}</div>
            <div style="margin-top:8px;">${rows}</div>
          </div>
          ${
            trainerHasAccount
              ? `
                <div style="margin:18px 0;padding:16px;border:1px solid #bfdbfe;border-radius:10px;background:#eff6ff;">
                  <div style="font-size:14px;font-weight:800;color:#1d4ed8;margin-bottom:6px;">
                    Vos disponibilités ont été mises à jour
                  </div>
                  <div style="font-size:13px;line-height:1.55;color:#475569;margin-bottom:12px;">
                    Les dates de cette mission ont été automatiquement remises en
                    <strong> Disponible </strong>
                    dans votre espace Formaplane.
                    Si votre disponibilité a changé, pensez à la modifier.
                  </div>
                  <a
                    href="${APP_URL}/formateur/disponibilites"
                    style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-size:13px;font-weight:800;padding:11px 15px;border-radius:8px;"
                  >
                    Vérifier mes disponibilités
                  </a>
                </div>
              `
              : ''
          }

          <p style="font-size:13px;color:#64748b;">
            Si des dispositions avaient déjà été prises avec l’organisme,
            rapprochez-vous directement de lui pour les éventuelles suites
            administratives, logistiques ou contractuelles.
          </p>
        </div>
      </div>
    `,
  };
};

const buildMissionWithdrawalOfEmail = ({
  recipientEmail,
  recipientFirstName,
  trainerName,
  missionTitle,
  comment,
  missionUrl,
  wasAssigned,
}: {
  recipientEmail: string;
  recipientFirstName: string;
  trainerName: string;
  missionTitle: string;
  comment: string;
  missionUrl: string;
  wasAssigned: boolean;
}) => ({
  sender: { name: SENDER_NAME, email: SENDER_EMAIL },
  to: [{ email: recipientEmail }],
  replyTo: { name: SENDER_NAME, email: SENDER_EMAIL },
  subject: `Désistement formateur — ${missionTitle}`,
  htmlContent: `
    <div style="font-family:Arial,sans-serif;background:#f6f8fb;padding:28px;color:#0f2747;">
      <div style="max-width:640px;margin:auto;background:white;border-radius:14px;padding:28px;border:1px solid #e5eaf0;">
        <div style="font-size:20px;font-weight:800;margin-bottom:18px;">Formaplane</div>
        <h1 style="font-size:22px;margin:0 0 12px;">Un formateur s’est désisté</h1>
        <p>Bonjour ${escapeHtml(recipientFirstName || '')},</p>
        <p>
          <strong>${escapeHtml(trainerName)}</strong>
          ${
            wasAssigned
              ? `s’est désisté de la mission <strong>${escapeHtml(missionTitle)}</strong> sur laquelle il était affecté. La mission est désormais à réaffecter.`
              : `s’est désisté de l’option qu’il avait acceptée pour la mission <strong>${escapeHtml(missionTitle)}</strong>.`
          }
        </p>
        ${comment ? `<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:14px;margin:18px 0;"><strong>Commentaire du formateur</strong><div style="margin-top:6px;">${escapeHtml(comment)}</div></div>` : ''}
        <a href="${escapeHtml(missionUrl)}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:8px;">Voir la mission dans Formaplane</a>
      </div>
    </div>
  `,
});


const buildMissionUnassignmentEmail = ({
  recipientEmail,
  trainerFirstName,
  organizationName,
  missionTitle,
  formation,
  client,
  location,
  dates,
  missionUrl,
}: {
  recipientEmail: string;
  trainerFirstName: string;
  organizationName: string;
  missionTitle: string;
  formation: string;
  client: string;
  location: string;
  dates: Array<{
    date?: string;
    heure_debut?: string | null;
    heure_fin?: string | null;
  }>;
  missionUrl: string;
}) => {
  const rows = (dates || [])
    .map((item) => {
      const day = escapeHtml(
        formatMissionDate(
          item.date || '',
        ),
      );
      const start = escapeHtml(
        formatMissionTime(
          item.heure_debut,
        ),
      );
      const end = escapeHtml(
        formatMissionTime(
          item.heure_fin,
        ),
      );

      return `
        <div style="padding:7px 0;border-bottom:1px solid #edf1f5;">
          <strong>${day}</strong>
          ${
            start || end
              ? ` · ${start}${start && end ? ' – ' : ''}${end}`
              : ''
          }
        </div>
      `;
    })
    .join('');

  return {
    sender: {
      name: SENDER_NAME,
      email: SENDER_EMAIL,
    },
    to: [
      {
        email: recipientEmail,
      },
    ],
    replyTo: {
      name: SENDER_NAME,
      email: SENDER_EMAIL,
    },
    subject:
      `Votre affectation a été retirée — ${missionTitle}`,
    htmlContent: `
      <div style="font-family:Arial,sans-serif;background:#f6f8fb;padding:28px;color:#0f2747;">
        <div style="max-width:640px;margin:auto;background:white;border-radius:14px;padding:28px;border:1px solid #e5eaf0;">
          <div style="font-size:20px;font-weight:800;margin-bottom:18px;">
            Formaplane
          </div>

          <div style="font-size:11px;font-weight:800;letter-spacing:1.4px;text-transform:uppercase;color:#b45309;margin-bottom:8px;">
            AFFECTATION MODIFIÉE
          </div>

          <h1 style="font-size:22px;margin:0 0 12px;">
            Votre affectation n’est plus confirmée
          </h1>

          <p>
            Bonjour ${escapeHtml(trainerFirstName || '')},
          </p>

          <p style="line-height:1.6;color:#475569;">
            <strong>${escapeHtml(organizationName)}</strong>
            a retiré votre affectation à la mission ci-dessous.
            La mission n’est donc plus confirmée pour vous.
          </p>

          <div style="background:#f8fafc;border-radius:10px;padding:16px;margin:18px 0;">
            <strong>
              ${escapeHtml(missionTitle || formation || 'Mission de formation')}
            </strong>

            <div style="margin-top:8px;">
              Formation :
              ${escapeHtml(formation || 'Non renseignée')}
            </div>

            <div>
              Client :
              ${escapeHtml(client || 'Non renseigné')}
            </div>

            <div>
              Lieu :
              ${escapeHtml(location || 'Non renseigné')}
            </div>

            <div style="margin-top:8px;">
              ${rows}
            </div>
          </div>

          <div style="margin:18px 0;padding:15px;border:1px solid #fde68a;border-radius:10px;background:#fffbeb;color:#854d0e;font-size:13px;line-height:1.55;">
            Votre réponse précédente reste enregistrée dans Formaplane,
            mais vous n’êtes plus le formateur officiellement affecté à cette mission.
            Si nécessaire, rapprochez-vous directement de l’organisme de formation.
          </div>

          ${
            missionUrl
              ? `
                <a
                  href="${escapeHtml(missionUrl)}"
                  style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:8px;"
                >
                  Voir la mission dans Formaplane
                </a>
              `
              : ''
          }
        </div>
      </div>
    `,
  };
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ success: false, message: 'Méthode non autorisée.' }, 405);
  }

  let logId: string | null = null;

  try {
    const authorization = req.headers.get('Authorization');

    if (!authorization) {
      return jsonResponse({ success: false, message: 'Non authentifié.' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const brevoApiKey = Deno.env.get('BREVO_API_KEY');

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey || !brevoApiKey) {
      console.error('Configuration serveur incomplète pour send-transactional-email.');
      return jsonResponse({ success: false, message: "Le service d'e-mail n'est pas correctement configuré." }, 500);
    }

    const authenticatedClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authorization } },
    });

    const { data: authData, error: authError } = await authenticatedClient.auth.getUser();

    if (authError || !authData.user) {
      return jsonResponse({ success: false, message: 'Session invalide.' }, 401);
    }

    const body: EmailRequest = await req.json().catch(() => ({}));
    const admin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const sendLoggedEmail = async (
      payload: Record<string, unknown>,
      logData: Record<string, unknown>,
    ) => {
      const { data: log, error: insertError } = await admin
        .from('email_logs')
        .insert(logData)
        .select('id')
        .single();

      if (insertError || !log?.id) {
        throw new Error('EMAIL_LOG_FAILED');
      }

      payload.headers = {
        ...((payload.headers as Record<string, string> | undefined) || {}),
        'X-Mailin-custom': `formaplane_log_id:${log.id}`,
      };

      const response = await fetch(BREVO_ENDPOINT, {
        method: 'POST',
        headers: { accept: 'application/json', 'api-key': brevoApiKey, 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const raw = await response.text();
      let provider: Record<string, unknown> = {};
      try { provider = raw ? JSON.parse(raw) : {}; } catch { provider = {}; }

      if (!response.ok) {
        const message = typeof provider.message === 'string' ? provider.message.slice(0, 1000) : `Brevo ${response.status}`;
        await admin.from('email_logs').update({ status:'failed', error_message:message, failed_at:new Date().toISOString() }).eq('id', log.id);
        throw new Error('BREVO_REJECTED');
      }

      const providerMessageId = typeof provider.messageId === 'string' ? provider.messageId : null;
      await admin.from('email_logs').update({ status:'sent', provider_message_id:providerMessageId, sent_at:new Date().toISOString(), error_message:null }).eq('id', log.id);
      return { logId: log.id, providerMessageId };
    };

    let emailPayload: Record<string, unknown>;
    let logPayload: Record<string, unknown>;
    let precreatedLogId: string | null = null;

    if (body.type === 'infrastructure_test') {
      const recipientEmail = String(authData.user.email || '').trim().toLowerCase();

      if (!recipientEmail) {
        return jsonResponse({ success: false, message: "Aucune adresse e-mail n'est associée à ce compte." }, 400);
      }

      emailPayload = buildInfrastructureTestEmail(recipientEmail);
      logPayload = {
        email_type: 'infrastructure_test',
        provider: 'brevo',
        recipient_email: recipientEmail,
        recipient_user_id: authData.user.id,
        requested_by_user_id: authData.user.id,
        status: 'pending',
        metadata: { source: 'settings_email_test' },
      };
    } else if (body.type === 'trainer_availability_share') {
      const contactId = String(body.contactId || '').trim();
      const requestedMonths = Array.isArray(body.months)
        ? body.months.map((value) => String(value || '').trim())
        : [];

      const months = [...new Set(requestedMonths)]
        .filter((value) => /^\d{4}-(0[1-9]|1[0-2])$/.test(value))
        .sort();

      const trainerMessage =
        String(body.message || '')
          .trim()
          .slice(0, 1500);

      const copyToSender = Boolean(body.copyToSender);

      if (!contactId || months.length === 0 || months.length > 6) {
        return jsonResponse(
          {
            success: false,
            message: 'Contact et mois de partage obligatoires.',
          },
          400,
        );
      }

      const { data: trainer, error: trainerError } = await admin
        .from('trainers')
        .select('id, prenom, nom, email, user_id')
        .eq('user_id', authData.user.id)
        .maybeSingle();

      if (trainerError || !trainer) {
        return jsonResponse(
          {
            success: false,
            message: 'Profil formateur introuvable.',
          },
          403,
        );
      }

      const { data: contact, error: contactError } = await admin
        .from('trainer_availability_contacts')
        .select('id, trainer_id, organization_id, organization_name, contact_name, email')
        .eq('id', contactId)
        .eq('trainer_id', trainer.id)
        .maybeSingle();

      if (contactError || !contact) {
        return jsonResponse(
          {
            success: false,
            message: "Ce contact n'appartient pas à votre carnet.",
          },
          403,
        );
      }

      const recipientEmail = String(contact.email || '').trim().toLowerCase();

      if (!recipientEmail) {
        return jsonResponse(
          {
            success: false,
            message: "Ce contact n'a pas d'adresse e-mail valide.",
          },
          400,
        );
      }

      const firstMonth = months[0];
      const lastMonth = months[months.length - 1];
      const [firstYear, firstMonthNumber] = firstMonth.split('-').map(Number);
      const [lastYear, lastMonthNumber] = lastMonth.split('-').map(Number);

      const startDay = `${firstYear}-${availabilityPad(firstMonthNumber)}-01`;
      const lastDate = new Date(Date.UTC(lastYear, lastMonthNumber, 0));
      const endDay = `${lastYear}-${availabilityPad(lastMonthNumber)}-${availabilityPad(lastDate.getUTCDate())}`;

      const [
        availabilityResult,
        commitmentsResult,
      ] = await Promise.all([
        authenticatedClient.rpc(
          'get_my_trainer_availability',
          {
            p_start_day: startDay,
            p_end_day: endDay,
          },
        ),
        authenticatedClient.rpc(
          'get_my_trainer_commitments_with_mission',
          {
            p_start_day: startDay,
            p_end_day: endDay,
          },
        ),
      ]);

      if (availabilityResult.error || commitmentsResult.error) {
        console.error(
          'Impossible de préparer les disponibilités :',
          availabilityResult.error,
          commitmentsResult.error,
        );

        return jsonResponse(
          {
            success: false,
            message: "Impossible de préparer vos disponibilités pour l'envoi.",
          },
          500,
        );
      }

      const declaredByDay: Record<string, string> = {};
      for (const row of availabilityResult.data || []) {
        declaredByDay[String(row.day || '')] = String(row.status || '');
      }

      const commitmentsByDay: Record<string, Array<Record<string, unknown>>> = {};
      for (const row of commitmentsResult.data || []) {
        const day = String(row.day || '');
        if (!day) continue;
        if (!commitmentsByDay[day]) commitmentsByDay[day] = [];
        commitmentsByDay[day].push({
          status: String(row.status || ''),
          organization_id: row.organization_id || null,
          mission_id: row.mission_id || null,
          mission_formateur_id: row.mission_formateur_id || null,
        });
      }

      const recipientOrganizationId = contact.organization_id
        ? String(contact.organization_id)
        : null;

      let trainerReferenced = false;

      if (recipientOrganizationId) {
        const { data: relation } = await admin
          .from('organization_trainers')
          .select('id')
          .eq('organization_id', recipientOrganizationId)
          .eq('trainer_id', trainer.id)
          .maybeSingle();

        trainerReferenced = Boolean(relation);
      }

      const trainerName =
        [trainer.prenom, trainer.nom]
          .filter(Boolean)
          .join(' ')
          .trim() ||
        'Votre formateur';

      const trainerEmail =
        String(trainer.email || authData.user.email || '')
          .trim()
          .toLowerCase();

      const searchValue =
        trainerEmail ||
        trainerName;

      const registeredCtaUrl =
        recipientOrganizationId && trainerReferenced
          ? `${APP_URL}/formateur/view/${trainer.id}?space=organization`
          : `${APP_URL}/formateurs/recherche?q=${encodeURIComponent(searchValue)}&space=organization`;

      emailPayload = buildTrainerAvailabilityShareEmail({
        recipientEmail,
        contactName: String(contact.contact_name || '').trim(),
        organizationName: String(contact.organization_name || '').trim(),
        trainerName,
        trainerEmail,
        months,
        declaredByDay,
        commitmentsByDay,
        recipientOrganizationId,
        organizationRegistered: Boolean(recipientOrganizationId),
        trainerReferenced,
        registeredCtaUrl,
        signupUrl: `${APP_URL}/inscription-organisme`,
        trainerMessage,
      });

      if (copyToSender) {
        const senderCopyEmail = String(authData.user.email || '').trim().toLowerCase();
        if (senderCopyEmail && senderCopyEmail !== recipientEmail) {
          emailPayload.cc = [{ email: senderCopyEmail, name: trainerName }];
        }
      }

      // Le journal pending est réservé atomiquement en base. La RPC sérialise
      // les appels pour un même couple formateur + e-mail et impose 20 jours.
      const { data: reservationRows, error: reservationError } =
        await authenticatedClient.rpc('reserve_my_availability_share', {
          p_contact_id: contact.id,
          p_months: months,
          p_trainer_message: trainerMessage,
          p_copy_to_sender: copyToSender,
        });

      if (reservationError) {
        console.error('Réservation du partage impossible :', reservationError);
        return jsonResponse(
          { success: false, message: "Impossible de vérifier le délai avant l'envoi." },
          500,
        );
      }

      const reservation = Array.isArray(reservationRows)
        ? reservationRows[0]
        : reservationRows;

      if (!reservation?.success || !reservation?.email_log_id) {
        return jsonResponse(
          {
            success: false,
            code: 'AVAILABILITY_SHARE_COOLDOWN',
            nextShareAt: reservation?.next_share_at || null,
            message: reservation?.next_share_at
              ? `Un partage a déjà été envoyé à ce contact. Un nouvel envoi sera possible à partir du ${new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' }).format(new Date(reservation.next_share_at))}.`
              : 'Un partage a déjà été envoyé récemment à ce contact.',
          },
          429,
        );
      }

      precreatedLogId = String(reservation.email_log_id);

      logPayload = {
        email_type: 'trainer_availability_share',
        provider: 'brevo',
        recipient_email: recipientEmail,
        recipient_user_id: null,
        requested_by_user_id: authData.user.id,
        organization_id: recipientOrganizationId,
        related_entity_type: 'trainer_availability_contact',
        related_entity_id: contact.id,
        status: 'pending',
        metadata: {
          source: 'trainer_availability_share',
          trainer_id: trainer.id,
          trainer_name: trainerName,
          contact_id: contact.id,
          organization_name: contact.organization_name,
          months,
          organization_registered: Boolean(recipientOrganizationId),
          trainer_referenced: trainerReferenced,
          trainer_message: trainerMessage || null,
          copy_to_sender: copyToSender,
        },
      };

      // Complète le journal déjà créé par la réservation atomique avec les
      // informations calculées par l'Edge Function.
      const { error: reservationLogUpdateError } = await admin
        .from('email_logs')
        .update({
          organization_id: recipientOrganizationId,
          metadata: logPayload.metadata,
        })
        .eq('id', precreatedLogId);

      if (reservationLogUpdateError) {
        console.error('Mise à jour du journal réservé impossible :', reservationLogUpdateError);
        await admin.from('email_logs').update({
          status: 'failed',
          error_message: 'Impossible de finaliser le journal du partage.',
          failed_at: new Date().toISOString(),
        }).eq('id', precreatedLogId);
        return jsonResponse(
          { success: false, message: "L'envoi a été bloqué car son journal n'a pas pu être finalisé." },
          500,
        );
      }
    } else if (body.type === 'trainer_claim_invitation') {
      const trainerId = String(body.trainerId || '').trim();
      const organizationId = String(body.organizationId || '').trim();

      if (!trainerId || !organizationId) {
        return jsonResponse({ success: false, message: 'Organisation et formateur obligatoires.' }, 400);
      }

      const { data: membership, error: membershipError } = await admin
        .from('organization_members')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('user_id', authData.user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (membershipError || !membership) {
        return jsonResponse({ success: false, message: "Vous n'avez pas accès à cet organisme." }, 403);
      }

      const [{ data: relation, error: relationError }, { data: trainer, error: trainerError }, { data: organization, error: organizationError }] = await Promise.all([
        admin.from('organization_trainers').select('id').eq('organization_id', organizationId).eq('trainer_id', trainerId).maybeSingle(),
        admin.from('trainers').select('id, prenom, nom, email, user_id').eq('id', trainerId).maybeSingle(),
        admin.from('organizations').select('id, name, legal_name').eq('id', organizationId).maybeSingle(),
      ]);

      if (relationError || !relation) {
        return jsonResponse({ success: false, message: "Ce formateur n'appartient pas au réseau de votre organisme." }, 403);
      }

      if (trainerError || !trainer) {
        return jsonResponse({ success: false, message: 'Fiche formateur introuvable.' }, 404);
      }

      if (organizationError || !organization) {
        return jsonResponse({ success: false, message: 'Organisme introuvable.' }, 404);
      }

      if (trainer.user_id) {
        return jsonResponse({ success: false, message: 'Cette fiche est déjà revendiquée par le formateur.' }, 409);
      }

      const recipientEmail = String(trainer.email || '').trim().toLowerCase();

      if (!recipientEmail) {
        return jsonResponse({ success: false, message: "Ajoutez une adresse e-mail à la fiche avant de l'inviter." }, 400);
      }

      const organizationName = String(organization.name || organization.legal_name || 'Un organisme de formation partenaire').trim();

      emailPayload = buildTrainerClaimInvitationEmail({
        recipientEmail,
        trainerFirstName: String(trainer.prenom || '').trim(),
        organizationName,
      });

      logPayload = {
        email_type: 'trainer_claim_invitation',
        provider: 'brevo',
        recipient_email: recipientEmail,
        recipient_user_id: null,
        requested_by_user_id: authData.user.id,
        organization_id: organizationId,
        related_entity_type: 'trainer',
        related_entity_id: trainerId,
        status: 'pending',
        metadata: {
          source: 'trainer_claim_invitation',
          trainer_name: [trainer.prenom, trainer.nom].filter(Boolean).join(' '),
          organization_name: organizationName,
        },
      };
    } else if (
      body.type === 'mission_proposal' ||
      body.type === 'mission_proposal_reminder'
    ) {
      const missionTrainerId = String(
        body.missionTrainerId || '',
      ).trim();

      if (!missionTrainerId) {
        return jsonResponse(
          {
            success: false,
            message: 'La proposition de mission est obligatoire.',
          },
          400,
        );
      }

      const { data: missionTrainer, error: missionTrainerError } =
        await admin
          .from('mission_formateurs')
          .select(`
            id,
            mission_id,
            formateur_id,
            statut,
            proposal_token,
            proposal_expires_at
          `)
          .eq('id', missionTrainerId)
          .maybeSingle();

      if (missionTrainerError || !missionTrainer) {
        return jsonResponse(
          {
            success: false,
            message: 'Proposition de mission introuvable.',
          },
          404,
        );
      }

      if (
        missionTrainer.statut !== 'proposition_envoyee' ||
        !missionTrainer.proposal_token
      ) {
        return jsonResponse(
          {
            success: false,
            message:
              "Préparez d'abord la proposition avant de l'envoyer par e-mail.",
          },
          409,
        );
      }

      const [
        { data: mission, error: missionError },
        { data: trainer, error: trainerError },
        { data: dates, error: datesError },
      ] = await Promise.all([
        admin
          .from('missions')
          .select(`
            id,
            organization_id,
            intitule,
            formation,
            client,
            lieu,
            adresse,
            code_postal,
            ville,
            cout_formateur
          `)
          .eq('id', missionTrainer.mission_id)
          .maybeSingle(),

        admin
          .from('trainers')
          .select('id, prenom, nom, email, user_id')
          .eq('id', missionTrainer.formateur_id)
          .maybeSingle(),

        admin
          .from('mission_dates')
          .select('date, heure_debut, heure_fin')
          .eq('mission_id', missionTrainer.mission_id)
          .order('date', { ascending: true })
          .order('heure_debut', { ascending: true }),
      ]);

      if (missionError || !mission) {
        return jsonResponse(
          {
            success: false,
            message: 'Mission introuvable.',
          },
          404,
        );
      }

      const organizationId = String(
        mission.organization_id || '',
      ).trim();

      if (!organizationId) {
        return jsonResponse(
          {
            success: false,
            message: "La mission n'est rattachée à aucun organisme.",
          },
          409,
        );
      }

      const { data: membership, error: membershipError } =
        await admin
          .from('organization_members')
          .select('id')
          .eq('organization_id', organizationId)
          .eq('user_id', authData.user.id)
          .eq('status', 'active')
          .maybeSingle();

      if (membershipError || !membership) {
        return jsonResponse(
          {
            success: false,
            message: "Vous n'avez pas accès à cette mission.",
          },
          403,
        );
      }

      if (trainerError || !trainer) {
        return jsonResponse(
          {
            success: false,
            message: 'Fiche formateur introuvable.',
          },
          404,
        );
      }

      if (datesError) {
        return jsonResponse(
          {
            success: false,
            message: "Impossible de charger les dates de la mission.",
          },
          500,
        );
      }

      const { data: organization, error: organizationError } =
        await admin
          .from('organizations')
          .select('id, name, legal_name')
          .eq('id', organizationId)
          .maybeSingle();

      if (organizationError || !organization) {
        return jsonResponse(
          {
            success: false,
            message: 'Organisme introuvable.',
          },
          404,
        );
      }

      const recipientEmail = String(
        trainer.email || '',
      )
        .trim()
        .toLowerCase();

      if (!recipientEmail) {
        return jsonResponse(
          {
            success: false,
            message:
              "Ajoutez une adresse e-mail à la fiche du formateur avant d'envoyer la proposition.",
          },
          400,
        );
      }

      const organizationName = String(
        organization.name ||
          organization.legal_name ||
          'Un organisme de formation partenaire',
      ).trim();

      const location = [
        mission.adresse,
        [mission.code_postal, mission.ville]
          .filter(Boolean)
          .join(' '),
      ]
        .filter(Boolean)
        .join(' — ') || mission.lieu || '';

      const proposalUrl =
        `${APP_URL}/proposition/${missionTrainer.proposal_token}`;
      const trainerHomeUrl = `${APP_URL}/trainer`;
      const signupUrl = `${APP_URL}/signup`;

      emailPayload = buildMissionProposalEmail({
        recipientEmail,
        trainerFirstName: String(
          trainer.prenom || '',
        ).trim(),
        organizationName,
        proposalUrl,
        trainerHomeUrl,
        signupUrl,
        trainerHasAccount: Boolean(trainer.user_id),
        isReminder: body.type === 'mission_proposal_reminder',
        missionTitle: String(
          mission.intitule ||
            mission.formation ||
            'Mission de formation',
        ).trim(),
        formation: String(
          mission.formation || '',
        ).trim(),
        client: String(
          mission.client || '',
        ).trim(),
        location,
        dates: Array.isArray(dates) ? dates : [],
      });

      logPayload = {
        email_type:
          body.type === 'mission_proposal_reminder'
            ? 'mission_proposal_reminder'
            : 'mission_proposal',
        provider: 'brevo',
        recipient_email: recipientEmail,
        recipient_user_id: trainer.user_id || null,
        requested_by_user_id: authData.user.id,
        organization_id: organizationId,
        related_entity_type: 'mission_formateur',
        related_entity_id: missionTrainerId,
        status: 'pending',
        metadata: {
          source:
            body.type === 'mission_proposal_reminder'
              ? 'mission_proposal_reminder'
              : 'mission_proposal',
          mission_id: mission.id,
          trainer_id: trainer.id,
          trainer_name: [trainer.prenom, trainer.nom]
            .filter(Boolean)
            .join(' '),
          organization_name: organizationName,
          proposal_expires_at:
            missionTrainer.proposal_expires_at || null,
        },
      };
    } else if (body.type === 'mission_change_revalidation') {
      const requestId = String(body.requestId || '').trim();
      if (!requestId) return jsonResponse({ success:false, message:'La demande de revalidation est obligatoire.' }, 400);

      const { data: request, error: requestError } = await admin
        .from('mission_change_requests')
        .select('id, mission_id, organization_id, status, previous_mission, proposed_mission, previous_dates, proposed_dates')
        .eq('id', requestId)
        .maybeSingle();
      if (requestError || !request) return jsonResponse({ success:false, message:'Demande de revalidation introuvable.' }, 404);

      const { data: membership } = await admin.from('organization_members').select('id')
        .eq('organization_id', request.organization_id).eq('user_id', authData.user.id).eq('status','active').maybeSingle();
      if (!membership) return jsonResponse({ success:false, message:"Vous n'avez pas accès à cette mission." }, 403);

      const [{ data: mission }, { data: organization }, { data: targets, error: targetsError }] = await Promise.all([
        admin.from('missions').select('id, intitule, formation').eq('id', request.mission_id).maybeSingle(),
        admin.from('organizations').select('id, name, legal_name').eq('id', request.organization_id).maybeSingle(),
        admin.from('mission_change_request_trainers').select('id, trainer_id, previous_status, response_status, public_response_token').eq('change_request_id', requestId).eq('response_status','pending'),
      ]);
      if (!mission || !organization || targetsError) return jsonResponse({ success:false, message:'Impossible de préparer les notifications.' }, 500);

      const organizationName = String(organization.name || organization.legal_name || 'Organisme de formation');
      const missionTitle = String(mission.intitule || mission.formation || 'Mission de formation');
      const results = [];

      for (const target of targets || []) {
        const { data: trainer } = await admin.from('trainers').select('id, prenom, nom, email, user_id').eq('id', target.trainer_id).maybeSingle();
        const recipientEmail = String(trainer?.email || '').trim().toLowerCase();
        if (!trainer || !recipientEmail) {
          results.push({ trainerId: target.trainer_id, success:false, reason:'missing_email' });
          continue;
        }

        const token = target.public_response_token || crypto.randomUUID();
        if (!target.public_response_token) {
          const { error: tokenError } = await admin.from('mission_change_request_trainers')
            .update({ public_response_token:token, public_link_created_at:new Date().toISOString() }).eq('id', target.id);
          if (tokenError) {
            results.push({ trainerId:trainer.id, success:false, reason:'token_failed' });
            continue;
          }
        }

        const responseUrl = `${APP_URL}/revalidation/${token}`;
        const payload = buildMissionChangeRevalidationEmail({
          recipientEmail,
          trainerFirstName:String(trainer.prenom || ''),
          organizationName,
          missionTitle,
          responseUrl,
          previousStatus:String(target.previous_status || ''),
          previousMission:(request.previous_mission || {}) as Record<string, unknown>,
          proposedMission:(request.proposed_mission || {}) as Record<string, unknown>,
          previousDates:(request.previous_dates || []) as Array<Record<string, unknown>>,
          proposedDates:(request.proposed_dates || []) as Array<Record<string, unknown>>,
        });
        try {
          const sent = await sendLoggedEmail(payload, {
            email_type:'mission_change_revalidation', provider:'brevo', recipient_email:recipientEmail,
            recipient_user_id:trainer.user_id || null, requested_by_user_id:authData.user.id,
            organization_id:request.organization_id, related_entity_type:'mission_change_request', related_entity_id:request.id,
            status:'pending', metadata:{ source:'mission_change_revalidation', mission_id:request.mission_id, trainer_id:trainer.id, trainer_name:[trainer.prenom,trainer.nom].filter(Boolean).join(' '), previous_status:target.previous_status },
          });
          results.push({ trainerId:trainer.id, success:true, ...sent });
        } catch (sendError) {
          console.error('Échec notification revalidation :', sendError);
          results.push({ trainerId:trainer.id, success:false, reason:'send_failed' });
        }
      }

      const sentCount = results.filter((item) => item.success).length;
      const failedCount = results.length - sentCount;
      return jsonResponse({ success: sentCount > 0 || results.length === 0, sentCount, failedCount, results });
    } else if (body.type === 'mission_cancellation') {
      const missionId = String(body.missionId || '').trim();
      if (!missionId) return jsonResponse({ success:false, message:'Mission obligatoire.' },400);

      const { data: mission } = await admin.from('missions')
        .select('id, organization_id, intitule, formation, client, lieu, adresse, code_postal, ville, statut')
        .eq('id', missionId).maybeSingle();
      if (!mission || mission.statut !== 'annulee') {
        return jsonResponse({ success:false, message:"La mission doit être annulée avant l'envoi." },409);
      }

      const { data: membership } = await admin.from('organization_members')
        .select('id').eq('organization_id', mission.organization_id)
        .eq('user_id', authData.user.id).eq('status','active').maybeSingle();
      if (!membership) return jsonResponse({ success:false, message:'Accès refusé.' },403);

      const [{ data: organization }, { data: dates }, { data: targets }] = await Promise.all([
        admin.from('organizations').select('name, legal_name').eq('id',mission.organization_id).maybeSingle(),
        admin.from('mission_dates').select('date, heure_debut, heure_fin').eq('mission_id',missionId).order('date'),
        admin.from('mission_formateurs').select('id, formateur_id, statut, trainer:trainers(id, prenom, nom, email, user_id)').eq('mission_id',missionId).eq('statut','annule'),
      ]);

      const results = [];
      for (const target of (targets || [])) {
        const trainer = Array.isArray(target.trainer) ? target.trainer[0] : target.trainer;
        const recipientEmail = String(trainer?.email || '').trim().toLowerCase();
        if (!recipientEmail) {
          results.push({ trainerId: target.formateur_id, success:false, reason:'missing_email' });
          continue;
        }

        const existing = await admin.from('email_logs').select('id')
          .eq('email_type','mission_cancellation')
          .eq('related_entity_type','mission_formateur')
          .eq('related_entity_id',target.id)
          .in('status',['pending','sent','delivered']).maybeSingle();
        if (existing.data?.id) {
          results.push({ trainerId: target.formateur_id, success:true, duplicate:true });
          continue;
        }

        const location = [mission.adresse, [mission.code_postal,mission.ville].filter(Boolean).join(' ')].filter(Boolean).join(' — ') || mission.lieu || '';
        const payload = buildMissionCancellationEmail({
          recipientEmail,
          trainerFirstName:String(trainer?.prenom || ''),
          organizationName:String(organization?.name || organization?.legal_name || 'Votre organisme de formation'),
          missionTitle:String(mission.intitule || mission.formation || 'Mission de formation'),
          formation:String(mission.formation || ''),
          client:String(mission.client || ''),
          location,
          dates:dates || [],
          trainerHasAccount: Boolean(trainer?.user_id),
        });

        const sent = await sendLoggedEmail(payload, {
          email_type:'mission_cancellation', provider:'brevo',
          recipient_email:recipientEmail, recipient_user_id:trainer?.user_id || null,
          requested_by_user_id:authData.user.id, organization_id:mission.organization_id,
          related_entity_type:'mission_formateur', related_entity_id:target.id,
          status:'pending', metadata:{ source:'mission_cancellation', mission_id:missionId, trainer_id:target.formateur_id },
        });
        results.push({ trainerId:target.formateur_id, success:Boolean(sent?.success) });
      }

      const sentCount = results.filter((item)=>item.success).length;
      return jsonResponse({ success:true, sentCount, failedCount:results.length-sentCount, results });

    } else if (body.type === 'mission_withdrawal_notification') {
      const missionTrainerId = String(body.missionTrainerId || '').trim();
      if (!missionTrainerId) return jsonResponse({ success:false, message:'Option obligatoire.' },400);

      const { data: target } = await admin.from('mission_formateurs')
        .select('id, mission_id, formateur_id, statut, withdrawal_comment, trainer:trainers(id, prenom, nom, user_id)')
        .eq('id',missionTrainerId).maybeSingle();
      const trainer = Array.isArray(target?.trainer) ? target.trainer[0] : target?.trainer;
      if (!target || target.statut !== 'desiste' || trainer?.user_id !== authData.user.id) {
        return jsonResponse({ success:false, message:'Désistement introuvable ou accès refusé.' },403);
      }

      const { data: mission } = await admin.from('missions')
        .select('id, organization_id, intitule, formation').eq('id',target.mission_id).maybeSingle();
      if (!mission) return jsonResponse({ success:false, message:'Mission introuvable.' },404);

      const { data: members } = await admin.from('organization_members')
        .select('user_id, role, joined_at, created_at').eq('organization_id',mission.organization_id).eq('status','active');

      const ordered = [...(members || [])].sort((a,b) => {
        const rank=(r:string)=>r==='owner'?0:r==='admin'?1:2;
        return rank(String(a.role||''))-rank(String(b.role||'')) ||
          new Date(a.joined_at||a.created_at||0).getTime()-new Date(b.joined_at||b.created_at||0).getTime();
      });

      let recipientEmail=''; let recipientUserId=''; let recipientFirstName='';
      for (const member of ordered) {
        const [{ data:userResult }, { data:profile }] = await Promise.all([
          admin.auth.admin.getUserById(String(member.user_id)),
          admin.from('profiles').select('first_name').eq('id',member.user_id).maybeSingle(),
        ]);
        const email=String(userResult?.user?.email||'').trim().toLowerCase();
        if (email) { recipientEmail=email; recipientUserId=String(member.user_id); recipientFirstName=String(profile?.first_name||''); break; }
      }
      if (!recipientEmail) return jsonResponse({ success:false, message:'Aucun destinataire OF trouvé.' },409);

      const existing = await admin.from('email_logs').select('id')
        .eq('email_type','mission_withdrawal_notification')
        .eq('related_entity_type','mission_formateur').eq('related_entity_id',target.id)
        .in('status',['pending','sent','delivered']).maybeSingle();
      if (existing.data?.id) return jsonResponse({ success:true, duplicate:true, recipientEmail });

      const { data: withdrawalHistory } = await admin
        .from('mission_trainer_history')
        .select('previous_status, created_at')
        .eq('mission_formateur_id', target.id)
        .eq('action', 'withdrawn')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const wasAssigned =
        withdrawalHistory?.previous_status === 'affecte';

      const payload=buildMissionWithdrawalOfEmail({
        recipientEmail, recipientFirstName,
        trainerName:[trainer?.prenom,trainer?.nom].filter(Boolean).join(' ') || 'Le formateur',
        missionTitle:String(mission.intitule || mission.formation || 'Mission de formation'),
        comment:String(target.withdrawal_comment || ''),
        missionUrl:`${APP_URL}/missions/${mission.id}?space=organization`,
        wasAssigned,
      });

      const sent=await sendLoggedEmail(payload,{
        email_type:'mission_withdrawal_notification', provider:'brevo',
        recipient_email:recipientEmail, recipient_user_id:recipientUserId,
        requested_by_user_id:authData.user.id, organization_id:mission.organization_id,
        related_entity_type:'mission_formateur', related_entity_id:target.id,
        status:'pending', metadata:{ source:'mission_withdrawal_notification', mission_id:mission.id, trainer_id:target.formateur_id },
      });
      return jsonResponse({ success:Boolean(sent?.success), recipientEmail });

    } else if (
      body.type === 'mission_unassignment_notification'
    ) {
      const missionId =
        String(body.missionId || '').trim();

      const trainerId =
        String(body.trainerId || '').trim();

      if (!missionId || !trainerId) {
        return jsonResponse(
          {
            success: false,
            message:
              'La mission et le formateur sont obligatoires.',
          },
          400,
        );
      }

      const [
        { data: mission, error: missionError },
        { data: target, error: targetError },
        { data: dates, error: datesError },
      ] = await Promise.all([
        admin
          .from('missions')
          .select(`
            id,
            organization_id,
            intitule,
            formation,
            client,
            lieu,
            adresse,
            code_postal,
            ville
          `)
          .eq('id', missionId)
          .maybeSingle(),

        admin
          .from('mission_formateurs')
          .select(`
            id,
            formateur_id,
            statut,
            trainer:trainers(
              id,
              prenom,
              nom,
              email,
              user_id
            )
          `)
          .eq('mission_id', missionId)
          .eq('formateur_id', trainerId)
          .maybeSingle(),

        admin
          .from('mission_dates')
          .select(
            'date, heure_debut, heure_fin',
          )
          .eq('mission_id', missionId)
          .order('date', {
            ascending: true,
          }),
      ]);

      if (
        missionError ||
        !mission ||
        targetError ||
        !target
      ) {
        return jsonResponse(
          {
            success: false,
            message:
              'Mission ou formateur introuvable.',
          },
          404,
        );
      }

      if (datesError) {
        return jsonResponse(
          {
            success: false,
            message:
              'Impossible de charger les dates de la mission.',
          },
          500,
        );
      }

      const {
        data: membership,
      } = await admin
        .from('organization_members')
        .select('id')
        .eq(
          'organization_id',
          mission.organization_id,
        )
        .eq(
          'user_id',
          authData.user.id,
        )
        .eq('status', 'active')
        .maybeSingle();

      if (!membership) {
        return jsonResponse(
          {
            success: false,
            message: 'Accès refusé.',
          },
          403,
        );
      }

      if (target.statut !== 'accepte') {
        return jsonResponse(
          {
            success: false,
            message:
              "La désaffectation doit être enregistrée avant l'envoi.",
          },
          409,
        );
      }

      const trainer =
        Array.isArray(target.trainer)
          ? target.trainer[0]
          : target.trainer;

      const recipientEmail =
        String(
          trainer?.email || '',
        )
          .trim()
          .toLowerCase();

      if (!recipientEmail) {
        return jsonResponse(
          {
            success: false,
            message:
              "Aucune adresse e-mail n'est renseignée pour ce formateur.",
          },
          409,
        );
      }

      const {
        data: organization,
      } = await admin
        .from('organizations')
        .select('name, legal_name')
        .eq(
          'id',
          mission.organization_id,
        )
        .maybeSingle();

      const existing =
        await admin
          .from('email_logs')
          .select('id')
          .eq(
            'email_type',
            'mission_unassignment_notification',
          )
          .eq(
            'related_entity_type',
            'mission_formateur',
          )
          .eq(
            'related_entity_id',
            target.id,
          )
          .in(
            'status',
            [
              'pending',
              'sent',
              'delivered',
            ],
          )
          .order(
            'created_at',
            {
              ascending: false,
            },
          )
          .limit(1);

      if (
        Array.isArray(existing.data) &&
        existing.data.length > 0
      ) {
        return jsonResponse({
          success: true,
          duplicate: true,
          recipientEmail,
        });
      }

      const location =
        [
          mission.adresse,
          [
            mission.code_postal,
            mission.ville,
          ]
            .filter(Boolean)
            .join(' '),
        ]
          .filter(Boolean)
          .join(' — ') ||
        mission.lieu ||
        '';

      const missionTitle =
        String(
          mission.intitule ||
          mission.formation ||
          'Mission de formation',
        );

      const trainerHasAccount =
        Boolean(trainer?.user_id);

      const payload =
        buildMissionUnassignmentEmail({
          recipientEmail,
          trainerFirstName:
            String(
              trainer?.prenom || '',
            ),
          organizationName:
            String(
              organization?.name ||
              organization?.legal_name ||
              'Votre organisme de formation',
            ),
          missionTitle,
          formation:
            String(
              mission.formation || '',
            ),
          client:
            String(
              mission.client || '',
            ),
          location,
          dates:
            dates || [],
          missionUrl:
            trainerHasAccount
              ? `${APP_URL}/formateur/missions/${mission.id}?trainer=${trainer.id}`
              : '',
        });

      const sent =
        await sendLoggedEmail(
          payload,
          {
            email_type:
              'mission_unassignment_notification',
            provider: 'brevo',
            recipient_email:
              recipientEmail,
            recipient_user_id:
              trainer?.user_id || null,
            requested_by_user_id:
              authData.user.id,
            organization_id:
              mission.organization_id,
            related_entity_type:
              'mission_formateur',
            related_entity_id:
              target.id,
            status: 'pending',
            metadata: {
              source:
                'mission_unassignment_notification',
              mission_id:
                mission.id,
              trainer_id:
                target.formateur_id,
            },
          },
        );

      return jsonResponse({
        success:
          Boolean(sent?.success),
        recipientEmail,
      });

    } else if (body.type === 'mission_assignment_confirmation') {
      const missionId = String(
        body.missionId || '',
      ).trim();
      const trainerId = String(
        body.trainerId || '',
      ).trim();

      if (!missionId || !trainerId) {
        return jsonResponse(
          {
            success: false,
            message:
              'La mission et le formateur sont obligatoires.',
          },
          400,
        );
      }

      const { data: missionTrainer, error: missionTrainerError } =
        await admin
          .from('mission_formateurs')
          .select(`
            id,
            mission_id,
            formateur_id,
            statut,
            affecte_le
          `)
          .eq('mission_id', missionId)
          .eq('formateur_id', trainerId)
          .maybeSingle();

      if (missionTrainerError || !missionTrainer) {
        return jsonResponse(
          {
            success: false,
            message: 'Affectation introuvable.',
          },
          404,
        );
      }

      if (
        missionTrainer.statut !== 'affecte' ||
        !missionTrainer.affecte_le
      ) {
        return jsonResponse(
          {
            success: false,
            message:
              "Le formateur doit être affecté avant l'envoi de la confirmation.",
          },
          409,
        );
      }

      const [
        { data: mission, error: missionError },
        { data: trainer, error: trainerError },
        { data: dates, error: datesError },
      ] = await Promise.all([
        admin
          .from('missions')
          .select(`
            id,
            organization_id,
            intitule,
            formation,
            client,
            lieu,
            adresse,
            code_postal,
            ville
          `)
          .eq('id', missionId)
          .maybeSingle(),

        admin
          .from('trainers')
          .select('id, prenom, nom, email, user_id')
          .eq('id', trainerId)
          .maybeSingle(),

        admin
          .from('mission_dates')
          .select('date, heure_debut, heure_fin')
          .eq('mission_id', missionId)
          .order('date', { ascending: true })
          .order('heure_debut', { ascending: true }),
      ]);

      if (missionError || !mission) {
        return jsonResponse(
          {
            success: false,
            message: 'Mission introuvable.',
          },
          404,
        );
      }

      if (trainerError || !trainer) {
        return jsonResponse(
          {
            success: false,
            message: 'Fiche formateur introuvable.',
          },
          404,
        );
      }

      if (datesError) {
        return jsonResponse(
          {
            success: false,
            message:
              "Impossible de charger les dates de la mission.",
          },
          500,
        );
      }

      const organizationId = String(
        mission.organization_id || '',
      ).trim();

      const { data: membership, error: membershipError } =
        await admin
          .from('organization_members')
          .select('id')
          .eq('organization_id', organizationId)
          .eq('user_id', authData.user.id)
          .eq('status', 'active')
          .maybeSingle();

      if (membershipError || !membership) {
        return jsonResponse(
          {
            success: false,
            message: "Vous n'avez pas accès à cette mission.",
          },
          403,
        );
      }

      const { data: organization, error: organizationError } =
        await admin
          .from('organizations')
          .select('id, name, legal_name')
          .eq('id', organizationId)
          .maybeSingle();

      if (organizationError || !organization) {
        return jsonResponse(
          {
            success: false,
            message: 'Organisme introuvable.',
          },
          404,
        );
      }

      const recipientEmail = String(
        trainer.email || '',
      )
        .trim()
        .toLowerCase();

      if (!recipientEmail) {
        return jsonResponse(
          {
            success: false,
            message:
              "Ajoutez une adresse e-mail à la fiche du formateur pour lui envoyer la confirmation.",
          },
          400,
        );
      }

      const assignmentAt = String(
        missionTrainer.affecte_le,
      );

      const { data: existingLogs, error: existingLogsError } =
        await admin
          .from('email_logs')
          .select('id, status, metadata')
          .eq(
            'email_type',
            'mission_assignment_confirmation',
          )
          .eq(
            'related_entity_type',
            'mission_formateur',
          )
          .eq(
            'related_entity_id',
            missionTrainer.id,
          )
          .in(
            'status',
            ['pending', 'sent', 'delivered'],
          )
          .order('created_at', { ascending: false })
          .limit(20);

      if (existingLogsError) {
        return jsonResponse(
          {
            success: false,
            message:
              "Impossible de vérifier l'historique des confirmations.",
          },
          500,
        );
      }

      const duplicateLog = (
        Array.isArray(existingLogs)
          ? existingLogs
          : []
      ).find((item) => {
        const metadata =
          item?.metadata &&
          typeof item.metadata === 'object'
            ? item.metadata
            : {};

        return (
          String(metadata?.assignment_at || '') ===
          assignmentAt
        );
      });

      if (duplicateLog) {
        return jsonResponse({
          success: true,
          duplicate: true,
          logId: duplicateLog.id,
          recipientEmail,
        });
      }

      const organizationName = String(
        organization.name ||
          organization.legal_name ||
          'Votre organisme de formation partenaire',
      ).trim();

      const { data: senderProfile } = await admin
        .from('profiles')
        .select('first_name, last_name, phone')
        .eq('id', authData.user.id)
        .maybeSingle();

      const organizationContactName = [
        senderProfile?.first_name,
        senderProfile?.last_name,
      ]
        .filter(Boolean)
        .join(' ')
        .trim();

      const organizationContactEmail = String(
        authData.user.email || '',
      )
        .trim()
        .toLowerCase();

      const organizationContactPhone = String(
        senderProfile?.phone || '',
      ).trim();

      const location = [
        mission.adresse,
        [mission.code_postal, mission.ville]
          .filter(Boolean)
          .join(' '),
      ]
        .filter(Boolean)
        .join(' — ') || mission.lieu || '';

      const trainerMissionUrl =
        `${APP_URL}/formateur/missions/${mission.id}?trainer=${trainer.id}`;

      emailPayload =
        buildMissionAssignmentConfirmationEmail({
          recipientEmail,
          trainerFirstName: String(
            trainer.prenom || '',
          ).trim(),
          organizationName,
          organizationContactName,
          organizationContactEmail,
          organizationContactPhone,
          trainerHasAccount: Boolean(
            trainer.user_id,
          ),
          trainerMissionUrl,
          missionTitle: String(
            mission.intitule ||
              mission.formation ||
              'Mission de formation',
          ).trim(),
          formation: String(
            mission.formation || '',
          ).trim(),
          client: String(
            mission.client || '',
          ).trim(),
          location,
          dates: Array.isArray(dates)
            ? dates
            : [],
        });

      logPayload = {
        email_type:
          'mission_assignment_confirmation',
        provider: 'brevo',
        recipient_email: recipientEmail,
        recipient_user_id:
          trainer.user_id || null,
        requested_by_user_id:
          authData.user.id,
        organization_id: organizationId,
        related_entity_type:
          'mission_formateur',
        related_entity_id:
          missionTrainer.id,
        status: 'pending',
        metadata: {
          source:
            'mission_assignment_confirmation',
          mission_id: mission.id,
          trainer_id: trainer.id,
          trainer_name: [
            trainer.prenom,
            trainer.nom,
          ]
            .filter(Boolean)
            .join(' '),
          organization_name:
            organizationName,
          assignment_at: assignmentAt,
        },
      };
    } else {
      return jsonResponse({ success: false, message: "Ce type d'e-mail n'est pas autorisé." }, 400);
    }

    if (precreatedLogId) {
      logId = precreatedLogId;
    } else {
      const { data: log, error: logError } = await admin
        .from('email_logs')
        .insert(logPayload)
        .select('id')
        .single();

      if (logError || !log?.id) {
        console.error('Impossible de créer le journal e-mail :', logError);
        return jsonResponse({ success: false, message: "L'envoi a été bloqué car son journal n'a pas pu être créé." }, 500);
      }

      logId = log.id;
    }

    // Permet au webhook Brevo de rattacher sans ambiguïté l'événement
    // (délivré, bounce, etc.) au journal Formaplane correspondant.
    emailPayload.headers = {
      ...((emailPayload.headers as Record<string, string> | undefined) || {}),
      'X-Mailin-custom': `formaplane_log_id:${logId}`,
    };

    const brevoResponse = await fetch(BREVO_ENDPOINT, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': brevoApiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    const rawProviderResponse = await brevoResponse.text();
    let providerResponse: Record<string, unknown> = {};

    if (rawProviderResponse) {
      try {
        providerResponse = JSON.parse(rawProviderResponse);
      } catch {
        providerResponse = {};
      }
    }

    if (!brevoResponse.ok) {
      const providerMessage =
        typeof providerResponse.message === 'string'
          ? providerResponse.message
          : `Brevo a répondu avec le statut ${brevoResponse.status}.`;
      const safeErrorMessage = providerMessage.slice(0, 1000);

      await admin.from('email_logs').update({
        status: 'failed',
        error_message: safeErrorMessage,
        failed_at: new Date().toISOString(),
      }).eq('id', logId);

      console.error('Erreur Brevo :', brevoResponse.status, safeErrorMessage);
      return jsonResponse({ success: false, logId, message: "Brevo n'a pas accepté l'e-mail." }, 502);
    }

    const providerMessageId =
      typeof providerResponse.messageId === 'string'
        ? providerResponse.messageId
        : null;

    const { error: updateLogError } = await admin.from('email_logs').update({
      status: 'sent',
      provider_message_id: providerMessageId,
      sent_at: new Date().toISOString(),
      error_message: null,
    }).eq('id', logId);

    if (updateLogError) {
      console.error("E-mail envoyé mais journal non finalisé :", updateLogError);
      return jsonResponse({
        success: true,
        logId,
        providerMessageId,
        warning: "L'e-mail a été envoyé, mais le journal n'a pas pu être finalisé.",
      });
    }

    return jsonResponse({
      success: true,
      logId,
      providerMessageId,
      recipientEmail:
        typeof logPayload.recipient_email === 'string'
          ? logPayload.recipient_email
          : null,
    });
  } catch (error) {
    console.error('Erreur send-transactional-email :', error);
    return jsonResponse({ success: false, logId, message: "Impossible d'envoyer l'e-mail pour le moment." }, 500);
  }
});
