import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import {
  getPublicMissionProposal,
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
            src="/brand/formaplane-logo.svg"
            alt="Formaplane"
            style={{ width: '220px', height: 'auto', display: 'block' }}
          />
        </div>

        <p style={styles.eyebrow}>PROPOSITION DE MISSION</p>
        <h1 style={styles.title}>{proposal.mission_title}</h1>
        <p style={styles.intro}>
          Bonjour {proposal.trainer_first_name || ''}, une mission de formation vous est proposée.
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
          <Detail
            label="Rémunération proposée"
            value={proposal.offered_fee == null ? null : `${proposal.offered_fee} €`}
          />
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
          <ResponseState proposal={proposal} expired={expired} />
        )}

        <p style={styles.footerNote}>
          Aucun compte Formaplane n’est nécessaire pour répondre à cette proposition.
        </p>
      </main>
    </div>
  );
}

function ResponseState({ proposal, expired }) {
  if (expired && proposal.status === 'proposition_envoyee') {
    return <div style={styles.expired}>Cette proposition a expiré. Contactez l’organisme de formation pour obtenir un nouveau lien.</div>;
  }

  if (proposal.status === 'accepte') {
    return <div style={styles.success}>Votre acceptation a bien été transmise à l’organisme de formation.</div>;
  }

  if (proposal.status === 'refuse') {
    return <div style={styles.refused}>Votre refus a bien été transmis à l’organisme de formation.</div>;
  }

  if (proposal.status === 'affecte') {
    return <div style={styles.success}>Vous êtes affecté à cette mission.</div>;
  }

  return <div style={styles.expired}>Cette proposition n’est plus ouverte à la réponse.</div>;
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
            src="/brand/formaplane-logo.svg"
            alt="Formaplane"
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
  expired: { padding: 16, background: '#fffaeb', color: '#b54708', borderRadius: 10, fontWeight: 700 },
  footerNote: { margin: '22px 0 0', textAlign: 'center', color: '#98a2b3', fontSize: 13 },
};
