import { useState } from 'react';
import { call, encodeFile, kinds, UploadUnconfirmedError } from './client';

export default function DocumentForm({
  mode,
  doc,
  recipients,
  finish,
  cancel,
}) {
  const [draft, setDraft] = useState(() => ({
    kind: doc?.kind || 'cv',
    title: doc?.title || 'CV',
    issued: doc?.issued || '',
    expiry: doc?.expiry || '',
    expiry_mode: doc?.expiry_mode || 'unknown',
    note: doc?.note || '',
  }));
  const [ids] = useState(() => ({
    doc: doc?.id || crypto.randomUUID(),
    request: crypto.randomUUID(),
  }));
  const [file, setFile] = useState(null);
  const [notify, setNotify] = useState(false);
  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState(false);
  const [pendingUpload, setPendingUpload] = useState(null);
  const [error, setError] = useState('');
  const set = (key, value) => setDraft((old) => ({ ...old, [key]: value }));
  async function save(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    let upload = pendingUpload;
    try {
      const payload = {
        ...draft,
        ...ids,
        expiry: draft.expiry_mode === 'dated' ? draft.expiry : null,
        previous: doc?.version_id,
      };
      let status;
      if (mode === 'edit') await call('edit', payload);
      else {
        upload ??= {
          ...payload,
          file: await encodeFile(file),
          recipients: recipients.map((r) => r.id),
          notify: notify ? selected : [],
        };
        status = await call('upload', upload);
      }
      finish(
        status?.notifications_limited
          ? 'Document remplacé. La limite d’envoi a été atteinte pour ' +
              status.notifications_limited +
              ' destinataire(s).'
          : upload?.notify.length && status?.notifications_limited == null
            ? 'Document enregistré. L’envoi des notifications choisies reste à vérifier.'
            : 'Document enregistré.',
      );
    } catch (err) {
      if (err instanceof UploadUnconfirmedError) setPendingUpload(upload);
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={save}>
      <h2>
        {mode === 'edit'
          ? 'Modifier les informations'
          : mode === 'replace'
            ? 'Remplacer ce document'
            : 'Déposer un document'}
      </h2>
      {mode === 'new' && <p>Ce dépôt est privé. Vous choisirez ensuite les pièces et les destinataires à partager. <a href="/confidentialite" target="_blank" rel="noopener noreferrer">Utilisation de vos données</a></p>}
      <fieldset disabled={busy || Boolean(pendingUpload)}>
        {mode !== 'edit' && (
          <>
            <label>
              Fichier PDF, JPEG ou PNG · 5 Mio maximum
              <input
                type="file"
                accept="application/pdf,image/jpeg,image/png"
                onChange={(e) => setFile(e.target.files[0])}
              />
            </label>
            <label className="dos-photo">
              Prendre une photo
              <input
                type="file"
                accept="image/jpeg,image/png"
                capture="environment"
                onChange={(e) => setFile(e.target.files[0])}
              />
            </label>
            {file && <small>Fichier choisi · {file.name}</small>}
          </>
        )}
        <label>
          Type
          <select
            value={draft.kind}
            onChange={(e) =>
              setDraft({
                ...draft,
                kind: e.target.value,
                title: kinds[e.target.value],
              })
            }
          >
            {Object.entries(kinds).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label>
          Intitulé
          <input
            required
            maxLength={140}
            value={draft.title}
            onChange={(e) => set('title', e.target.value)}
          />
        </label>
        <label>
          Date d’émission (facultative)
          <input
            type="date"
            value={draft.issued}
            onChange={(e) => set('issued', e.target.value)}
          />
        </label>
        <label>
          Échéance
          <select
            value={draft.expiry_mode}
            onChange={(e) => set('expiry_mode', e.target.value)}
          >
            <option value="unknown">À renseigner</option>
            <option value="none">Sans date d’expiration</option>
            <option value="dated">Date d’expiration</option>
          </select>
        </label>
        {draft.expiry_mode === 'dated' && (
          <label>
            Date d’expiration
            <input
              required
              type="date"
              value={draft.expiry}
              onChange={(e) => set('expiry', e.target.value)}
            />
          </label>
        )}
        <label>
          Note personnelle · visible uniquement par vous
          <textarea
            maxLength={2000}
            value={draft.note}
            onChange={(e) => set('note', e.target.value)}
          />
        </label>
        {mode === 'replace' && (
          <>
            <p>
              La nouvelle version sera accessible à{' '}
              {recipients.map((r) => r.label).join(', ') || 'vous uniquement'}.
              L’ancienne sera conservée 30 jours dans votre historique privé.
            </p>
            {recipients.length > 0 && (
              <label>
                <input
                  type="checkbox"
                  checked={notify}
                  onChange={(e) => setNotify(e.target.checked)}
                />{' '}
                Informer les OF concernés par e-mail
              </label>
            )}
            {notify &&
              recipients.map((r) => (
                <label key={r.id}>
                  <input
                    type="checkbox"
                    checked={selected.includes(r.id)}
                    onChange={(e) =>
                      setSelected(
                        e.target.checked
                          ? [...selected, r.id]
                          : selected.filter((id) => id !== r.id),
                      )
                    }
                  />
                  {r.label}
                </label>
              ))}
          </>
        )}
      </fieldset>
      {error && <p role="alert">{error}</p>}
      <div className="dos-actions">
        <button disabled={busy}>
          {busy
            ? 'Enregistrement…'
            : pendingUpload
              ? 'Réessayer le même dépôt'
              : mode === 'replace'
                ? 'Confirmer le remplacement'
                : 'Enregistrer'}
        </button>
        <button type="button" disabled={busy} onClick={pendingUpload ? () => finish('') : cancel}>
          {pendingUpload ? 'Revenir au dossier' : 'Annuler'}
        </button>
      </div>
    </form>
  );
}
