import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DocumentForm from './DocumentForm';
import DossierAgreement from './DossierAgreement';
import Sharing from './Sharing';
import Files from './Files';
import AccountFactor from './AccountFactor';
import { call, day, enabled, expiry, fmt, kinds } from './client';
import './dossier.css';

function AccessRow({ share, documents, done }) {
  const [end, setEnd] = useState(share.ends || '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [request, setRequest] = useState(() => crypto.randomUUID());
  async function update(action) {
    if (
      action === 'revoke' &&
      !window.confirm(
        'Retirer l’accès à ces pièces ? Les copies déjà téléchargées restent chez le destinataire.',
      )
    )
      return;
    setBusy(true);
    setError('');
    try {
      await call(action, { share: share.id, ends: end, request });
      setRequest(crypto.randomUUID());
      done(
        action === 'resend'
          ? 'Invitation enregistrée pour envoi.'
          : 'Accès mis à jour.',
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <li>
      <strong>{share.label}</strong>
      <small>
        {
          { active: 'Actif', expired: 'Expiré', revoked: 'Révoqué' }[
            share.state
          ]
        }{' '}
        · {share.ends ? 'Jusqu’au ' + fmt(share.ends) : 'Sans échéance'}
      </small>
      {share.mail_state && (
        <small>
          Invitation ·{' '}
          {
            {
              queued: 'en attente d’envoi',
              retry: 'nouvel essai prévu',
              sending: 'en cours de traitement',
              accepted: 'prise en charge par le service e-mail',
              failed: 'échec d’envoi',
              unknown: 'statut à vérifier',
              held: 'envoi suspendu',
              cancelled: 'envoi annulé',
            }[share.mail_state]
          }
        </small>
      )}
      <p>
        {documents
          .filter((d) => share.docs.includes(d.id))
          .map((d) => d.title)
          .join(', ') || 'Aucune pièce accessible'}
      </p>
      {share.state !== 'revoked' && (
        <details>
          <summary>Gérer cet accès</summary>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              update('renew');
            }}
          >
            <label>
              Fin d’accès
              <input
                type="date"
                required={Boolean(share.email)}
                min={day()}
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </label>
            <div className="dos-actions">
              <button disabled={busy}>Enregistrer la durée</button>
              {share.state === 'active' && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => update('resend')}
                >
                  Renvoyer l’invitation
                </button>
              )}
              <button
                type="button"
                disabled={busy}
                onClick={() => update('revoke')}
              >
                Révoquer
              </button>
            </div>
          </form>
          {share.email && (
            <small>
              Pour changer d’adresse, révoquez cette invitation et créez un
              nouveau partage.
            </small>
          )}
        </details>
      )}
      {error && <p role="alert">{error}</p>}
    </li>
  );
}

export function Dossier() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState(null);
  const [history, setHistory] = useState(null);
  const [revision, reload] = useState(0);
  const refresh = useCallback(() => reload((n) => n + 1), []);
  useEffect(() => {
    let live = true;
    call('overview')
      .then((v) => {
        if (live) {
          setData(v);
          setError('');
        }
      })
      .catch((e) => {
        if (live) setError(e.message);
      });
    return () => {
      live = false;
    };
  }, [revision]);
  function done(message) {
    setForm(null);
    setHistory(null);
    setNotice(message);
    refresh();
  }
  function recipients(doc) {
    return data.shares.filter(
      (s) => s.state === 'active' && s.docs.includes(doc?.id),
    );
  }
  async function inspect(doc) {
    try {
      setHistory({ id: doc.id, rows: await call('history', { doc: doc.id }) });
    } catch (err) {
      setError(err.message);
    }
  }
  async function remove(doc) {
    if (
      !window.confirm(
        'Supprimer définitivement cette pièce et toutes ses versions du dossier ? Tous les accès futurs à cette pièce seront retirés. Les copies déjà téléchargées restent chez les destinataires.',
      )
    )
      return;
    try {
      await call('delete', { doc: doc.id, previous: doc.version_id });
      done('Document supprimé.');
    } catch (err) {
      setError(err.message);
    }
  }
  return (
    <article className="dos">
      <h1>Mon dossier professionnel</h1>
      {error && (
        <div role="alert">
          {error} <button onClick={refresh}>Actualiser la liste</button>
        </div>
      )}
      {error.includes('Second facteur requis') && (
        <AccountFactor onVerified={refresh} />
      )}
      {notice && <p role="status">{notice}</p>}
      {!data && !error && <p role="status">Chargement du dossier…</p>}
      {data &&
        (form?.mode === 'share' ? (
          <Sharing
            data={data}
            finish={() =>
              done('Partage activé. Invitation enregistrée pour envoi.')
            }
            cancel={() => setForm(null)}
          />
        ) : form && form.mode !== 'edit' && !data.agreement?.accepted_at ? (
          <DossierAgreement
            agreement={data.agreement}
            onAccepted={(agreement) => setData((current) => ({ ...current, agreement }))}
            cancel={() => setForm(null)}
          />
        ) : form ? (
          <DocumentForm
            mode={form.mode}
            doc={form.doc}
            recipients={recipients(form.doc)}
            finish={done}
            cancel={() => setForm(null)}
          />
        ) : (
          <>
            {data.agreement?.accepted_at && (
              <DossierAgreement agreement={data.agreement} />
            )}
            {data.reminders.length > 0 && (
              <section>
                <h2>Rappels d’échéance</h2>
                <ul>
                  {data.reminders.map((r) => (
                    <li key={r.version_id + r.days_before + r.expiry}>
                      {r.title} · échéance le {fmt(r.expiry)} · rappel J−
                      {r.days_before}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <section>
              <header>
                <h2>Mes documents</h2>
                <button
                  onClick={() => {
                    setNotice('');
                    setForm({ mode: 'new' });
                  }}
                >
                  Déposer un document
                </button>
              </header>
              {!data.documents.length && (
                <p>
                  Vous pouvez conserver ici les pièces de votre choix. Chaque
                  dépôt est privé.
                </p>
              )}
              <ul className="dos-list">
                {data.documents.map((d) => (
                  <li key={d.id}>
                    <small>{kinds[d.kind]}</small>
                    <h3>{d.title}</h3>
                    <p>
                      {expiry(d)} ·{' '}
                      {recipients(d).length
                        ? 'Partagé avec ' +
                          recipients(d)
                            .map((s) => s.label)
                            .join(', ')
                        : 'Privé'}
                    </p>
                    <details>
                      <summary>Gérer le document</summary>
                      {d.issued && <p>Émis le {fmt(d.issued)}</p>}
                      {d.note && <p>Note personnelle · {d.note}</p>}
                      <Files docs={[d]} />
                      <div className="dos-actions">
                        <button
                          onClick={() => setForm({ mode: 'edit', doc: d })}
                        >
                          Modifier les informations
                        </button>
                        <button
                          onClick={() => setForm({ mode: 'replace', doc: d })}
                        >
                          Remplacer ce document
                        </button>
                        <button onClick={() => inspect(d)}>
                          Historique privé
                        </button>
                        <button onClick={() => remove(d)}>Supprimer</button>
                      </div>
                      {history?.id === d.id &&
                        (history.rows.length ? (
                          <Files
                            docs={history.rows.map((v) => ({ ...v, id: d.id }))}
                          />
                        ) : (
                          <p>Aucune ancienne version.</p>
                        ))}
                    </details>
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <header>
                <h2>Mes partages</h2>
                <button
                  disabled={!data.documents.length}
                  onClick={() => {
                    setNotice('');
                    setForm({ mode: 'share' });
                  }}
                >
                  Nouveau partage
                </button>
              </header>
              {!data.shares.length && <p>Aucun destinataire.</p>}
              <ul className="dos-list">
                {data.shares.map((s) => (
                  <AccessRow
                    key={s.id + (s.ends || '') + s.state}
                    share={s}
                    documents={data.documents}
                    done={done}
                  />
                ))}
              </ul>
            </section>
          </>
        ))}
    </article>
  );
}

function OrgInbox({ org }) {
  const [shares, setShares] = useState([]);
  const [selection, setSelection] = useState(null);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [revision, reload] = useState(0);
  useEffect(() => {
    let live = true;
    call('inbox', { org })
      .then((v) => {
        if (live) {
          setError('');
          setShares(v);
          setLoaded(true);
        }
      })
      .catch((e) => {
        if (live) setError(e.message);
      });
    return () => {
      live = false;
    };
  }, [org, revision]);
  async function open(share) {
    setSelection(null);
    setError('');
    try {
      setSelection({ share, docs: await call('contents', { org, share }) });
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <article className="dos">
      <h1>Dossiers reçus</h1>
      {error && <p role="alert">{error}</p>}
      {error.includes('Second facteur requis') && (
        <AccountFactor onVerified={() => reload((n) => n + 1)} />
      )}
      {!shares.length && loaded && (
        <p>Aucun dossier partagé avec votre organisme.</p>
      )}
      <ul className="dos-list">
        {shares.map((s) => (
          <li key={s.id}>
            <strong>{s.trainer}</strong>
            <small>
              {s.count} pièce(s) ·{' '}
              {s.ends ? 'jusqu’au ' + fmt(s.ends) : 'sans échéance'}
            </small>
            <button onClick={() => open(s.id)}>Voir les documents</button>
          </li>
        ))}
      </ul>
      {selection && (
        <Files
          key={selection.share}
          docs={selection.docs}
          access={{ org, share: selection.share }}
        />
      )}
    </article>
  );
}
export function OrganizationDossiers() {
  const { currentOrganization, organizationRole } = useAuth();
  if (
    !enabled ||
    !currentOrganization ||
    !['owner', 'admin', 'manager'].includes(organizationRole)
  )
    return <p>Accès indisponible.</p>;
  return <OrgInbox key={currentOrganization.id} org={currentOrganization.id} />;
}
