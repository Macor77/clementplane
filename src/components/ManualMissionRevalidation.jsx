import { useState } from 'react';
import { confirmMissionChangeForOrganization } from '../services/missionsService';

export default function ManualMissionRevalidation({ requestId, trainer, onConfirmed }) {
  const [open, setOpen] = useState(false);
  const [channel, setChannel] = useState('');
  const [note, setNote] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault();
    if (busy || !confirmed || !channel) return;
    setBusy(true); setError('');
    try {
      await confirmMissionChangeForOrganization({ requestId, trainerId: trainer.trainer_id, channel, note });
    } catch (failure) {
      setError(failure.message); setBusy(false); return;
    }
    await onConfirmed();
  }
  if (!open) return <button type="button" className="button button--soft" onClick={() => setOpen(true)}>Confirmer l’accord du formateur</button>;
  return (
    <form onSubmit={submit} aria-label={`Accord de ${trainer.trainer_name || 'ce formateur'}`} style={{display:'grid',gap:10,width:'100%',fontSize:12}}>
      <strong>Accord de {trainer.trainer_name || 'ce formateur'}</strong>
      <p style={{margin:0}}>Enregistrez son accord sur les nouvelles conditions. Aucun e-mail ne sera envoyé.</p>
      <label>Moyen de réception de l’accord
        <select required value={channel} onChange={e => setChannel(e.target.value)} disabled={busy} style={{width:'100%',minHeight:44}}>
          <option value="">Choisir…</option><option value="sms">SMS</option><option value="whatsapp">WhatsApp</option>
          <option value="phone">Téléphone</option><option value="email">E-mail</option><option value="other">Autre</option>
        </select>
      </label>
      <label>{channel === 'other' ? 'Précisez le moyen de contact' : 'Commentaire facultatif'}
        <textarea value={note} onChange={e => setNote(e.target.value)} required={channel === 'other'} maxLength={2000} disabled={busy} rows={2} style={{width:'100%',boxSizing:'border-box'}} />
      </label>
      <label style={{display:'flex',gap:8,alignItems:'start'}}>
        <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} disabled={busy} />
        J’ai obtenu l’accord du formateur sur les nouvelles conditions.
      </label>
      {error && <p role="alert" style={{color:'#b42318',margin:0}}>{error}</p>}
      <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
        <button type="button" className="button button--soft" disabled={busy} onClick={() => setOpen(false)}>Annuler</button>
        <button type="submit" className="button button--primary" disabled={busy || !confirmed || !channel || (channel === 'other' && !note.trim())}>
          {busy ? 'Enregistrement…' : 'Enregistrer l’accord'}
        </button>
      </div>
    </form>
  );
}
