import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import {
  getPublicMissionProposal,
  notifyOrganizationOfMissionResponse,
  respondToMissionProposal,
} from '../services/proposalService';

export default function ProposalResponse() {
  const { token } = useParams();
  const [proposal, setProposal] = useState(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const data = await getPublicMissionProposal(token);
        if (!cancelled) {
          setProposal(data);
          setComment(data.response_comment || '');
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError?.message ||
              'Impossible de charger cette proposition.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const expired = useMemo(() => {
    if (!proposal?.expires_at) return false;
    return new Date(proposal.expires_at).getTime() < Date.now();
  }, [proposal]);

  const canRespond = proposal?.status === 'proposition_envoyee' && !expired;

  const submitResponse = async (response) => {
    setSubmitting(true);
    setError('');

    try {
      await respondToMissionProposal(token, response, comment);

      // La réponse métier est prioritaire : si la notification e-mail à l'OF
      // échoue, on ne remet jamais en cause l'acceptation/refus du formateur.
      await notifyOrganizationOfMissionResponse(token, response);

      const refreshed = await getPublicMissionProposal(token);
      setProposal(refreshed);
    } catch (submitError) {
      setError(
        submitError?.message ||
          'Impossible d’enregistrer votre réponse.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <PublicState message="Chargement de la proposition…" />;
  }

  if (error && !proposal) {
    return <PublicState message={error} error />;
  }

  return (
    <div style={styles.page}>
      <main style={styles.card}>
        <div style={styles.brand}>
          <img
            src="/brand/clementplane-logo.svg"
            alt="Clementplane"
            style={{ width: '220px', height: 'auto', display: 'block' }}
          />
        </div>

        <p style={styles.eyebrow}>PROPOSITION DE MISSION</p>

        <div style={styles.issuerCard}>
          <div style={styles.issuerIcon}>✓</div>
          <div>
            <div style={styles.issuerLabel}>Proposition émise par</div>
            <div style={styles.issuerName}>
              {proposal.organization_name || 'Organisme de formation'}
            </div>
            <div style={styles.issuerSubLabel}>Organisme de formation</div>
          </div>
        </div>

        <h1 style={styles.title}>{proposal.mission_title}</h1>
        <p style={styles.intro}>
          Bonjour {proposal.trainer_first_name || ''}, une mission de formation vous est proposée par{' '}
          <strong>{proposal.organization_name || 'un organisme de formation'}</strong>.
        </p>

        {error && <div style={styles.error}>{error}</div>}

        <section style={styles.details}>
          <Detail label="Formation" value={proposal.formation} />
          <Detail label="Client" value={proposal.client} />
          <Detail
            label="Lieu"
            value={[
              proposal.location,
              proposal.postal_code,
              proposal.city,
            ].filter(Boolean).join(' ')}
          />
          <Detail label="Dates et horaires" value={formatDates(proposal.dates)} multiline />
          <Detail label="Informations complémentaires" value={proposal.mission_notes} multiline />
        </section>

        {canRespond ? (
          <>
            <label style={styles.commentField}>
              <span style={styles.commentLabel}>Commentaire facultatif</span>
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={4}
                placeholder="Une précision à transmettre à l’organisme…"
                style={styles.textarea}
              />
            </label>

            <div style={styles.actions}>
              <button
                type="button"
                disabled={submitting}
                onClick={() => submitResponse('refuse')}
                style={{ ...styles.button, ...styles.refuseButton }}
              >
                {submitting ? 'Enregistrement…' : 'Refuser'}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => submitResponse('accepte')}
                style={{ ...styles.button, ...styles.acceptButton }}
              >
                {submitting ? 'Enregistrement…' : 'Accepter la mission'}
              </button>
            </div>
          </>
        ) : (
          <>
            <ResponseState proposal={proposal} expired={expired} />

            {['accepte', 'refuse'].includes(proposal.status) &&
            !proposal.trainer_has_account ? (
              <CreateTrainerAccountInvite />
            ) : null}
          </>
        )}

        <p style={styles.footerNote}>
          Aucun compte Clementplane n’est nécessaire pour répondre à cette proposition.
        </p>
      </main>
    </div>
  );
}

function CreateTrainerAccountInvite() {
  return (
    <aside style={styles.accountInvite}>
      <strong style={styles.accountInviteTitle}>
        Retrouvez vos missions dans votre espace Clementplane
      </strong>

      <p style={styles.accountInviteText}>
        Créez gratuitement votre compte formateur pour renseigner
        vos disponibilités une seule fois, les partager avec vos
        organismes partenaires et retrouver vos propositions et missions.
      </p>

      <Link
        to="/inscription?invitation=trainer"
        style={styles.accountInviteButton}
      >
        Créer mon espace formateur
      </Link>
    </aside>
  );
}

function ResponseState({ proposal, expired }) {
  if (proposal.status === 'accepte') {
    return (
      <div style={styles.success}>
        <strong>Votre acceptation a bien été transmise à l’organisme de formation.</strong>
        <div style={{ marginTop: 6, fontWeight: 500 }}>
          L’organisme doit maintenant confirmer votre affectation à cette mission.
        </div>
      </div>
    );
  }

  if (proposal.status === 'refuse') {
    return (
      <div style={styles.refused}>
        <strong>Votre refus a bien été transmis à l’organisme de formation.</strong>
      </div>
    );
  }

  if (proposal.status === 'affecte') {
    return (
      <div style={styles.success}>
        Vous êtes affecté à cette mission.
      </div>
    );
  }

  const specificMessage =
    expired && proposal.status === 'proposition_envoyee'
      ? 'La période de réponse associée à ce lien est terminée.'
      : proposal.status === 'mission_pourvue'
        ? 'La mission a déjà été pourvue et un autre formateur a été sélectionné.'
        : proposal.status === 'annule'
          ? 'La mission ou cette proposition a été annulée par l’organisme de formation.'
          : proposal.status === 'selectionne'
            ? 'Cette proposition a été retirée ou réinitialisée et n’est donc plus active.'
            : null;

  return (
    <div style={styles.closedWrapper}>
      <div style={styles.closedIntro}>
        <div style={styles.closedIcon}>◷</div>

        <div>
          <h2 style={styles.closedTitle}>
            Cette proposition n’est plus ouverte à la réponse
          </h2>

          <p style={styles.closedText}>
            Malheureusement, cette proposition n’est plus disponible.
            Cela peut arriver lorsque la mission a déjà été pourvue,
            lorsqu’elle a été annulée, lorsque la période de réponse est
            terminée ou lorsque la proposition a été retirée.
          </p>

          {specificMessage ? (
            <div style={styles.closedSpecific}>
              {specificMessage}
            </div>
          ) : null}
        </div>
      </div>

      <div style={styles.closedReasons}>
        <strong>Les raisons les plus fréquentes sont :</strong>
        <ul style={styles.closedList}>
          <li>la mission a déjà été pourvue ;</li>
          <li>la mission a été annulée par l’organisme de formation ;</li>
          <li>la période de réponse est terminée ;</li>
          <li>la proposition a été retirée ou réinitialisée.</li>
        </ul>
      </div>

      <div style={styles.contactCard}>
        <div style={styles.contactTitle}>
          Vous souhaitez plus d’informations ?
        </div>

        <p style={styles.contactText}>
          N’hésitez pas à prendre contact directement avec l’organisme
          de formation qui vous a adressé cette proposition.
        </p>

        <div style={styles.contactOrganization}>
          {proposal.organization_name || 'Organisme de formation'}
        </div>

        {proposal.organization_contact_name ? (
          <div style={styles.contactLine}>
            {proposal.organization_contact_name}
          </div>
        ) : null}

        {proposal.organization_contact_phone ? (
          <div style={styles.contactLine}>
            ☎ {proposal.organization_contact_phone}
          </div>
        ) : null}

        {proposal.organization_contact_email ? (
          <div style={styles.contactLine}>
            ✉ {proposal.organization_contact_email}
          </div>
        ) : null}

        {!proposal.organization_contact_phone &&
        !proposal.organization_contact_email ? (
          <div style={styles.contactLine}>
            Utilisez votre moyen de contact habituel avec cet organisme.
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Detail({ label, value, multiline = false }) {
  if (!value) return null;

  return (
    <div style={styles.detailRow}>
      <span style={styles.detailLabel}>{label}</span>
      <strong style={{ ...styles.detailValue, whiteSpace: multiline ? 'pre-line' : 'normal' }}>
        {value}
      </strong>
    </div>
  );
}

function PublicState({ message, error = false }) {
  return (
    <div style={styles.page}>
      <main style={styles.card}>
        <div style={styles.brand}>
          <img
            src="/brand/clementplane-logo.svg"
            alt="Clementplane"
            style={{ width: '220px', height: 'auto', display: 'block' }}
          />
        </div>
        <div style={error ? styles.error : styles.loading}>{message}</div>
      </main>
    </div>
  );
}

function formatDates(dates) {
  if (!Array.isArray(dates) || dates.length === 0) return 'Dates à confirmer';

  return dates.map((item) => {
    const date = new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(`${item.date}T12:00:00`));

    const hours = [item.heure_debut, item.heure_fin].filter(Boolean).join(' – ');
    return hours ? `${date} · ${hours}` : date;
  }).join('\n');
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'grid',
    placeItems: 'center',
    padding: '32px 18px',
    background: '#f5f7fb',
    color: '#172033',
  },
  card: {
    width: 'min(760px, 100%)',
    background: '#ffffff',
    borderRadius: 20,
    padding: '32px',
    boxShadow: '0 20px 60px rgba(31, 42, 68, 0.12)',
  },
  brand: { fontSize: 25, fontWeight: 800, marginBottom: 28 },
  brandAccent: { color: '#2563eb' },
  eyebrow: { margin: 0, color: '#2563eb', fontSize: 12, fontWeight: 800, letterSpacing: 1.4 },
  issuerCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    margin: '16px 0 24px',
    padding: '14px 16px',
    border: '1px solid #bfdbfe',
    borderRadius: 12,
    background: '#f8fbff',
  },
  issuerIcon: {
    display: 'grid',
    placeItems: 'center',
    width: 34,
    height: 34,
    borderRadius: 10,
    background: '#2563eb',
    color: '#fff',
    fontWeight: 900,
  },
  issuerLabel: {
    color: '#64748b',
    fontSize: 12,
  },
  issuerName: {
    marginTop: 1,
    color: '#0f2747',
    fontSize: 16,
    fontWeight: 850,
    textTransform: 'uppercase',
  },
  issuerSubLabel: {
    marginTop: 1,
    color: '#94a3b8',
    fontSize: 11,
  },
  title: { margin: '8px 0 10px', fontSize: 32, lineHeight: 1.15 },
  intro: { margin: '0 0 26px', color: '#667085', fontSize: 16 },
  details: { borderTop: '1px solid #eaecf0', borderBottom: '1px solid #eaecf0', padding: '10px 0', marginBottom: 24 },
  detailRow: { display: 'grid', gridTemplateColumns: '210px 1fr', gap: 20, padding: '13px 0' },
  detailLabel: { color: '#667085', fontSize: 14 },
  detailValue: { fontSize: 15, fontWeight: 650 },
  commentField: { display: 'grid', gap: 8, marginBottom: 18 },
  commentLabel: { fontSize: 14, fontWeight: 700 },
  textarea: { resize: 'vertical', border: '1px solid #d0d5dd', borderRadius: 10, padding: 12, font: 'inherit' },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: 12, flexWrap: 'wrap' },
  button: { border: 0, borderRadius: 10, padding: '12px 18px', fontWeight: 750, cursor: 'pointer' },
  refuseButton: { background: '#fff1f0', color: '#b42318' },
  acceptButton: { background: '#2563eb', color: '#ffffff' },
  error: { padding: 14, background: '#fef3f2', color: '#b42318', borderRadius: 10, marginBottom: 18 },
  loading: { padding: 14, color: '#475467' },
  success: { padding: 16, background: '#ecfdf3', color: '#067647', borderRadius: 10, fontWeight: 700 },
  refused: { padding: 16, background: '#fef3f2', color: '#b42318', borderRadius: 10, fontWeight: 700 },
  accountInvite: {
    marginTop: 16,
    padding: 16,
    border: '1px solid #bfdbfe',
    borderRadius: 12,
    background: '#f8fbff',
  },
  accountInviteTitle: {
    display: 'block',
    color: '#1d4ed8',
    fontSize: 14,
    lineHeight: 1.35,
  },
  accountInviteText: {
    margin: '6px 0 11px',
    color: '#52647d',
    fontSize: 12,
    lineHeight: 1.55,
    fontWeight: 500,
  },
  accountInviteButton: {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: 36,
    padding: '0 13px',
    borderRadius: 8,
    background: '#2563eb',
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 800,
    textDecoration: 'none',
  },
  expired: { padding: 16, background: '#fffaeb', color: '#b54708', borderRadius: 10, fontWeight: 700 },
  closedWrapper: {
    display: 'grid',
    gap: 14,
    marginTop: 4,
  },
  closedIntro: {
    display: 'grid',
    gridTemplateColumns: '52px 1fr',
    gap: 14,
    alignItems: 'start',
    padding: '18px',
    border: '1px solid #fed7aa',
    borderRadius: 14,
    background: '#fffaf0',
  },
  closedIcon: {
    display: 'grid',
    placeItems: 'center',
    width: 52,
    height: 52,
    borderRadius: 999,
    background: '#ffedd5',
    color: '#ea580c',
    fontSize: 26,
    fontWeight: 900,
  },
  closedTitle: {
    margin: 0,
    color: '#0f2747',
    fontSize: 20,
    lineHeight: 1.25,
  },
  closedText: {
    margin: '8px 0 0',
    color: '#64748b',
    fontSize: 13.5,
    lineHeight: 1.55,
  },
  closedSpecific: {
    marginTop: 10,
    padding: '8px 10px',
    borderRadius: 8,
    background: '#fff7ed',
    color: '#c2410c',
    fontSize: 12,
    fontWeight: 750,
  },
  closedReasons: {
    padding: '14px 16px',
    border: '1px solid #fed7aa',
    borderRadius: 12,
    background: '#fffdf8',
    color: '#475569',
    fontSize: 12.5,
    lineHeight: 1.55,
  },
  closedList: {
    margin: '8px 0 0 18px',
    padding: 0,
  },
  contactCard: {
    padding: '16px 18px',
    border: '1px solid #bfdbfe',
    borderRadius: 12,
    background: '#f8fbff',
  },
  contactTitle: {
    color: '#1d4ed8',
    fontSize: 14,
    fontWeight: 850,
  },
  contactText: {
    margin: '5px 0 10px',
    color: '#64748b',
    fontSize: 12.5,
    lineHeight: 1.5,
  },
  contactOrganization: {
    color: '#0f2747',
    fontSize: 14,
    fontWeight: 850,
    textTransform: 'uppercase',
  },
  contactLine: {
    marginTop: 4,
    color: '#475569',
    fontSize: 12.5,
  },
  footerNote: { margin: '22px 0 0', textAlign: 'center', color: '#98a2b3', fontSize: 13 },
};
