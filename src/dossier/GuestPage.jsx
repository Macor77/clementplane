import { useState } from 'react';
import Files from './Files';
import { call, enabled } from './client';
import './dossier.css';

const link = location.hash.slice(1);
history.replaceState(null,'',location.pathname);
export default function Guest() {
  const [code, setCode] = useState('');
  const [session, setSession] = useState('');
  const [docs, setDocs] = useState([]);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function act(check) {
    setBusy(true); setError('');
    try {
      if (!check) { await call('request-code',{ link },true); setSent(true); }
      else {
        const { session: ticket } = await call('verify-code',{ link, code },true);
        setDocs(await call('guest-list',{ session: ticket },true)); setSession(ticket); setCode('');
      }
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  return <article className="dos dos-guest"><header><img width="150" src="/brand/clementplane-logo-light.svg" alt="Clementplane" /></header>
    <h1>Dossier professionnel partagé</h1>{!enabled || !link ? <p>Ouvrez l’invitation reçue par e-mail.</p> : session ?
    <><Files docs={docs} access={{session}} guest /><button onClick={() => {setSession('');setDocs([]);setSent(false);}}>Fermer le dossier</button></> :
    <><p>Demandez un code à l’adresse invitée pour consulter les pièces sélectionnées par le formateur.</p>
    <button disabled={busy} onClick={() => act(false)}>{sent ? 'Renvoyer un code' : 'Demander mon code'}</button>
    {sent && <form onSubmit={e => {e.preventDefault();act(true);}}><p role="status">Demande de code enregistrée. Validité de 10 minutes.</p>
    <label>Code reçu par e-mail<input value={code} onChange={e => setCode(e.target.value)} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{8}" required /></label>
    <button disabled={busy}>Ouvrir le dossier</button></form>}</>}{error && <p role="alert">{error}</p>}</article>;
}
