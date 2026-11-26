import { useEffect, useState } from 'react';
import { call } from './client';
import agreementText from '../../docs/sprints/v1.8.0/ANNEXE_DOSSIER_PROFESSIONNEL.md?raw';

function AgreementText() {
  return agreementText.trim().split(/\n\s*\n/).map((block) => {
    if (block.startsWith('## ')) return <h3 key={block}>{block.slice(3)}</h3>;
    if (block.startsWith('# ')) return <h2 key={block}>{block.slice(2)}</h2>;
    if (block.startsWith('- ')) {
      return <ul key={block}>{block.split('\n').map((line) => {
        const content = line.slice(2);
        return <li key={line}>{content.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
          part.startsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : part
        )}</li>;
      })}</ul>;
    }
    return <p key={block}>{block}</p>;
  });
}

async function textFingerprint() {
  const bytes = new TextEncoder().encode(agreementText);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash), (n) => n.toString(16).padStart(2, '0')).join('');
}

export default function DossierAgreement({ agreement, onAccepted, cancel }) {
  const [fingerprint, setFingerprint] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const acceptedAt = agreement?.accepted_at;
  const matches = Boolean(fingerprint && fingerprint === agreement?.sha256);

  useEffect(() => {
    let active = true;
    textFingerprint().then((hash) => {
      if (active) setFingerprint(hash);
    }).catch(() => {
      if (active) setError('La vérification du texte a échoué. Actualisez la page.');
    });
    return () => { active = false; };
  }, []);

  async function accept() {
    setBusy(true);
    setError('');
    try {
      const receipt = await call('accept-agreement', { accepted: true, sha256: fingerprint });
      if (!receipt?.accepted_at || receipt.sha256 !== fingerprint) throw Error('L’accord reste à confirmer. Réessayez.');
      onAccepted(receipt);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <section>
      {acceptedAt ? <p>Annexe acceptée le {new Date(acceptedAt).toLocaleDateString('fr-FR')}.</p> : <h2>Accord pour le dépôt de documents</h2>}
      {matches && <>
        {!acceptedAt && <p>Votre accord sera enregistré avec la date et la version du texte. Vous pourrez ensuite choisir votre fichier.</p>}
        <details>
          <summary>Lire l’annexe de traitement des données</summary>
          <AgreementText />
        </details>
      </>}
      {!agreement?.sha256 && <p role="status">Le dépôt sera disponible après la publication des conditions du dossier.</p>}
      {agreement?.sha256 && fingerprint && !matches && <p role="alert">La version de l’annexe a changé. Actualisez la page.</p>}
      {error && <p role="alert">{error}</p>}
      {!acceptedAt && <div className="dos-actions">
        {matches && <button type="button" disabled={busy} onClick={accept}>{busy ? 'Enregistrement…' : 'J’accepte l’annexe du dossier professionnel'}</button>}
        <button type="button" disabled={busy} onClick={cancel}>Annuler</button>
      </div>}
    </section>
  );
}
