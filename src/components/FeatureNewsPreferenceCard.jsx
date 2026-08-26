import { useEffect, useState } from 'react';
import {
  getMyFeatureNewsPreference,
  setMyFeatureNewsSubscription,
} from '../services/featureNewsPreferenceService';

function formatDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(new Date(value));
}

export default function FeatureNewsPreferenceCard({ trainer = false }) {
  const [preference, setPreference] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [confirmResubscribe, setConfirmResubscribe] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    getMyFeatureNewsPreference()
      .then(setPreference)
      .catch((e) => setError(e?.message || 'Impossible de charger cette préférence.'))
      .finally(() => setLoading(false));
  }, []);

  const update = async (subscribed) => {
    setBusy(true); setError(''); setMessage('');
    try {
      const next = await setMyFeatureNewsSubscription(subscribed);
      setPreference(next);
      setConfirmResubscribe(false);
      setMessage(subscribed
        ? 'Vous recevrez à nouveau les e-mails de nouveautés Clementplane.'
        : 'Vous ne recevrez plus les e-mails de nouveautés Clementplane.');
    } catch (e) {
      setError(e?.message || 'Impossible de modifier cette préférence.');
    } finally { setBusy(false); }
  };

  const cardStyle = trainer ? { marginTop: 20 } : {
    borderTop: '1px solid #e5e7eb', paddingTop: 24, marginTop: 28,
  };

  return (
    <div className={trainer ? 'panel-card trainer-settings-card' : undefined} style={cardStyle}>
      <h2 style={{ marginTop: 0, fontSize: trainer ? undefined : 20 }}>E-mails de nouveautés Clementplane</h2>
      {loading ? <p>Chargement…</p> : preference ? (
        <>
          <p style={{ color: '#64748b', lineHeight: 1.55 }}>
            Ces e-mails présentent les nouvelles fonctionnalités et mises à jour de Clementplane. Cette préférence n’affecte pas les e-mails nécessaires à votre activité (propositions de mission, affectations, modifications de mission…).
          </p>
          <div style={{ padding: '14px 16px', borderRadius: 12, background: preference.subscribed ? '#f0fdf4' : '#fff7ed', border: `1px solid ${preference.subscribed ? '#bbf7d0' : '#fed7aa'}` }}>
            <strong>{preference.subscribed ? 'E-mails de nouveautés activés' : 'E-mails de nouveautés désactivés'}</strong>
            {!preference.subscribed && preference.unsubscribed_at ? (
              <div style={{ marginTop: 5, color: '#64748b', fontSize: 14 }}>
                Vous vous êtes désabonné(e) de cette liste le {formatDate(preference.unsubscribed_at)}.
              </div>
            ) : null}
          </div>
          {message ? <div style={{ color: '#15803d', fontWeight: 700, marginTop: 12 }}>{message}</div> : null}
          {error ? <div style={{ color: '#b42318', fontWeight: 700, marginTop: 12 }}>{error}</div> : null}
          <div style={{ marginTop: 14 }}>
            {preference.subscribed ? (
              <button className={trainer ? 'button button--soft' : undefined} type="button" disabled={busy} onClick={() => update(false)} style={trainer ? undefined : { border: '1px solid #cbd5e1', background: '#fff', borderRadius: 10, padding: '10px 14px', fontWeight: 700, cursor: 'pointer' }}>
                Ne plus recevoir les nouveautés
              </button>
            ) : (
              <button className={trainer ? 'button button--soft' : undefined} type="button" disabled={busy} onClick={() => setConfirmResubscribe(true)} style={trainer ? undefined : { border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8', borderRadius: 10, padding: '10px 14px', fontWeight: 700, cursor: 'pointer' }}>
                Recevoir à nouveau les nouveautés
              </button>
            )}
          </div>
          {confirmResubscribe ? (
            <div style={{ marginTop: 16, padding: 16, border: '1px solid #fbbf24', background: '#fffbeb', borderRadius: 12 }}>
              <strong>Confirmer votre réabonnement ?</strong>
              <p style={{ margin: '8px 0 14px', lineHeight: 1.5 }}>
                Vous aviez choisi de ne plus recevoir les e-mails de nouveautés Clementplane{preference.unsubscribed_at ? ` le ${formatDate(preference.unsubscribed_at)}` : ''}. Êtes-vous certain(e) de vouloir les recevoir à nouveau ?
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button className={trainer ? 'button button--soft' : undefined} type="button" onClick={() => setConfirmResubscribe(false)} disabled={busy} style={trainer ? undefined : { border: '1px solid #cbd5e1', background: '#fff', borderRadius: 9, padding: '9px 12px', fontWeight: 700 }}>Annuler</button>
                <button className={trainer ? 'button' : undefined} type="button" onClick={() => update(true)} disabled={busy} style={trainer ? undefined : { border: 0, background: '#2563eb', color: '#fff', borderRadius: 9, padding: '9px 12px', fontWeight: 700 }}>
                  {busy ? 'Confirmation…' : 'Oui, me réabonner'}
                </button>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
      {!loading && error && !preference ? <div style={{ color: '#b42318', fontWeight: 700 }}>{error}</div> : null}
    </div>
  );
}
