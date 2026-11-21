import { useState } from 'react';
import { call, day, fmt } from './client';

export default function Sharing({ data, finish, cancel }) {
  const [mode, setMode] = useState(data.partners.length ? 'org' : 'guest');
  const [target, setTarget] = useState(data.partners[0]?.id || '');
  const [email, setEmail] = useState('');
  const [ends, setEnds] = useState(data.partners.length ? '' : day(30));
  const [docs, setDocs] = useState([]);
  const [review, setReview] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [request] = useState(() => crypto.randomUUID());
  const label =
    mode === 'org' ? data.partners.find((p) => p.id === target)?.name : email;
  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!docs.length) {
      setError('Sélectionnez au moins une pièce.');
      return;
    }
    if (!review) {
      setReview(true);
      return;
    }
    setBusy(true);
    try {
      await call('share', {
        request,
        org: mode === 'org' ? target : null,
        email,
        ends,
        docs,
      });
      finish();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit}>
      <h2>{review ? 'Vérifier le partage' : 'Nouveau partage'}</h2>
      <fieldset disabled={busy}>
        {review ? (
          <>
            <strong>{label}</strong>
            <p>
              {mode === 'org'
                ? 'Les utilisateurs habilités de cet organisme pourront consulter et télécharger ces pièces.'
                : 'Un code envoyé à cette boîte e-mail sera demandé. Plusieurs personnes peuvent avoir accès à cette boîte.'}
            </p>
            <ul>
              {data.documents
                .filter((d) => docs.includes(d.id))
                .map((d) => (
                  <li key={d.id}>{d.title}</li>
                ))}
            </ul>
            <p>
              {ends ? 'Accès jusqu’au ' + fmt(ends) : 'Accès sans échéance'}
            </p>
            <p>
              Une invitation sera mise en file d’envoi. Le retrait du partage
              laisse aux destinataires les copies déjà téléchargées.
            </p>
          </>
        ) : (
          <>
            <label>
              Destinataire
              <select
                value={mode}
                onChange={(e) => {
                  setMode(e.target.value);
                  setEnds(e.target.value === 'guest' ? day(30) : '');
                }}
              >
                {data.partners.length > 0 && (
                  <option value="org">Un de mes OF</option>
                )}
                <option value="guest">Une adresse e-mail invitée</option>
              </select>
            </label>
            {mode === 'org' ? (
              <label>
                Organisme
                <select
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                >
                  {data.partners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <label>
                Adresse e-mail
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
            )}
            <label>
              Fin d’accès {mode === 'org' ? '(facultative)' : ''}
              <input
                type="date"
                required={mode === 'guest'}
                min={day()}
                value={ends}
                onChange={(e) => setEnds(e.target.value)}
              />
            </label>
            <button
              type="button"
              onClick={() => setDocs(data.documents.map((d) => d.id))}
            >
              Tous les documents actuellement présents
            </button>
            {data.documents.map((d) => (
              <label key={d.id}>
                <input
                  type="checkbox"
                  checked={docs.includes(d.id)}
                  onChange={(e) =>
                    setDocs(
                      e.target.checked
                        ? [...docs, d.id]
                        : docs.filter((id) => id !== d.id),
                    )
                  }
                />
                {d.title}
              </label>
            ))}
            <small>Les futurs ajouts resteront privés.</small>
          </>
        )}
        {error && <p role="alert">{error}</p>}
        <div className="dos-actions">
          <button>
            {busy
              ? 'Enregistrement…'
              : review
                ? 'Confirmer et inviter'
                : 'Vérifier le partage'}
          </button>
          <button
            type="button"
            onClick={() => (review ? setReview(false) : cancel())}
          >
            {review ? 'Modifier' : 'Annuler'}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
