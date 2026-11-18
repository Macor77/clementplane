import { useEffect, useState } from 'react';
import { call, expiry } from './client';

export default function Files({ docs, access = {}, guest = false }) {
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview.url);
    },
    [preview],
  );
  async function open(doc, download, page = 1) {
    setError('');
    setBusy(true);
    setPreview(null);
    try {
      const { blob, pages } = await call(
        guest ? 'guest-file' : 'file',
        { ...access, doc: doc.id, version: doc.version_id, download, page },
        guest,
      );
      const url = URL.createObjectURL(blob);
      if (download) {
        const a = document.createElement('a');
        a.href = url;
        a.download =
          doc.title +
          '.' +
          ({
            'application/pdf': 'pdf',
            'image/jpeg': 'jpg',
            'image/png': 'png',
          }[blob.type] || 'bin');
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } else setPreview({ url, doc, pages, page });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <ul className="dos-list">
        {docs.map((d) => (
          <li key={d.version_id}>
            <strong>{d.title}</strong>
            <small>{expiry(d)}</small>
            <div className="dos-actions">
              <button disabled={busy} onClick={() => open(d, false)}>
                Consulter
              </button>
              <button disabled={busy} onClick={() => open(d, true)}>
                Télécharger
              </button>
            </div>
          </li>
        ))}
      </ul>
      {busy && <p role="status">Vérification de l’accès…</p>}
      {error && <p role="alert">{error}</p>}
      {preview && (
        <section>
          <button onClick={() => setPreview(null)}>Fermer l’aperçu</button>
          <img
            className="dos-preview"
            alt={preview.doc.title + ' · page ' + preview.page}
            src={preview.url}
          />
          {preview.pages > 1 && (
            <div className="dos-actions">
              <button
                disabled={busy || preview.page === 1}
                onClick={() => open(preview.doc, false, preview.page - 1)}
              >
                Page précédente
              </button>
              <span>
                Page {preview.page} sur {preview.pages}
              </span>
              <button
                disabled={busy || preview.page === preview.pages}
                onClick={() => open(preview.doc, false, preview.page + 1)}
              >
                Page suivante
              </button>
            </div>
          )}
        </section>
      )}
    </>
  );
}
