import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import {
  getPublicMissionChange,
  respondToPublicMissionChange,
} from '../services/missionChangePublicService';

export default function MissionChangeResponse() {
  const { token } = useParams();
  const [change, setChange] = useState(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getPublicMissionChange(token);
        if (!cancelled) {
          setChange(data);
          setComment(data.response_comment || '');
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError?.message || 'Impossible de charger les modifications.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const submit = async (response) => {
    setSubmitting(true);
    setError('');
    try {
      await respondToPublicMissionChange(token, response, comment);
      setChange(await getPublicMissionChange(token));
    } catch (submitError) {
      setError(submitError?.message || 'Impossible d’enregistrer votre réponse.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <State>Chargement des modifications…</State>;
  if (error && !change) return <State error>{error}</State>;
  if (!change) return <State error>Demande de validation introuvable.</State>;

  const unavailable =
    change.response_status === 'unavailable' ||
    change.relation_status === 'mission_pourvue';

  const pending =
    !unavailable &&
    change.response_status === 'pending' &&
    change.request_status === 'pending';

  const affected =
    change.previous_status === 'affecte';

  return (
    <main style={styles.page}>
      <section style={styles.shell}>
        <div style={styles.brand}>Clementplane</div>
        <p style={styles.eyebrow}>MODIFICATION DE MISSION</p>
        <h1 style={styles.title}>
          {affected ? 'Votre validation est requise' : 'De nouvelles conditions sont à valider'}
        </h1>
        <p style={styles.lead}>
          <strong>{change.organization_name}</strong> a modifié certaines conditions de la mission
          {' '}<strong>{change.mission_title || 'Mission de formation'}</strong>.
          Consultez uniquement les éléments qui ont changé puis indiquez si vous maintenez votre accord.
        </p>

        <MissionChangeDiff change={change} />

        {unavailable ? (
          <section style={styles.unavailable}>
            <strong>
              Cette mission n’est plus disponible.
            </strong>

            <span>
              Un autre formateur a depuis été affecté à cette mission.
              Vous n’avez plus besoin de répondre à cette demande de revalidation.
            </span>
          </section>
        ) : pending ? (
          <section style={styles.responseBox}>
            <label style={styles.label}>
              Commentaire facultatif à transmettre à l’OF
              <textarea
                rows={3}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Une précision sur votre décision…"
                style={styles.textarea}
              />
            </label>
            {error ? <p style={styles.error}>{error}</p> : null}
            <div style={styles.actions}>
              <button type="button" disabled={submitting} onClick={() => submit('refused')} style={styles.refuse}>
                Refuser les nouvelles conditions
              </button>
              <button type="button" disabled={submitting} onClick={() => submit('accepted')} style={styles.accept}>
                {submitting ? 'Enregistrement…' : 'Accepter les nouvelles conditions'}
              </button>
            </div>
          </section>
        ) : (
          <AfterResponse change={change} />
        )}

        <p style={styles.footer}>Vous pouvez répondre à cette demande sans créer de compte Clementplane.</p>
      </section>
    </main>
  );
}

function AfterResponse({ change }) {
  const accepted = change.response_status === 'accepted';
  return (
    <>
      <section style={accepted ? styles.success : styles.refused}>
        <strong>{accepted ? 'Votre validation a bien été enregistrée.' : 'Votre refus a bien été enregistré.'}</strong>
        <span>{accepted ? 'L’organisme de formation sait que vous maintenez votre accord sur les nouvelles conditions.' : 'L’organisme de formation a été informé que vous ne maintenez pas votre accord sur ces nouvelles conditions.'}</span>
      </section>

      <section style={styles.accountInvite}>
        <strong style={styles.accountTitle}>
          {change.trainer_has_account ? 'Retrouvez cette mission dans votre espace Clementplane' : 'Retrouvez vos missions dans votre espace Clementplane'}
        </strong>
        <p style={styles.accountText}>
          {change.trainer_has_account
            ? 'Connectez-vous pour retrouver vos missions, propositions et disponibilités.'
            : 'Créez gratuitement votre compte formateur pour renseigner vos disponibilités une seule fois, les partager avec vos organismes partenaires et retrouver vos propositions et missions.'}
        </p>
        <Link
          to={change.trainer_has_account ? '/connexion' : '/inscription?invitation=trainer'}
          style={styles.accountButton}
        >
          {change.trainer_has_account ? 'Accéder à mon espace Clementplane' : 'Créer mon espace formateur'}
        </Link>
      </section>
    </>
  );
}

function MissionChangeDiff({ change }) {
  const previous = change.previous_mission || {};
  const proposed = change.proposed_mission || {};
  const rows = [];
  const add = (label, before, after) => {
    const a = before == null ? '' : String(before);
    const b = after == null ? '' : String(after);
    if (a !== b) rows.push({ label, before: before || 'Non renseigné', after: after || 'Non renseigné' });
  };
  add('Formation', previous.formation, proposed.formation);
  add('Lieu / site', previous.lieu, proposed.lieu);
  add('Adresse', previous.adresse, proposed.adresse);
  add('Ville', [previous.code_postal, previous.ville].filter(Boolean).join(' '), [proposed.code_postal, proposed.ville].filter(Boolean).join(' '));
  if (JSON.stringify(change.previous_dates || []) !== JSON.stringify(change.proposed_dates || [])) {
    rows.push({ label: 'Dates et horaires', before: formatDates(change.previous_dates), after: formatDates(change.proposed_dates) });
  }
  return (
    <section style={styles.diffCard}>
      <h2 style={styles.diffTitle}>Ce qui change</h2>
      {rows.length ? rows.map((row) => (
        <div key={row.label} style={styles.diffRow}>
          <strong style={styles.diffLabel}>{row.label}</strong>
          <div style={styles.before}><span>Avant</span>{row.before}</div>
          <div style={styles.after}><span>Maintenant</span>{row.after}</div>
        </div>
      )) : <p style={styles.muted}>Aucune différence essentielle affichable.</p>}
      <p style={styles.feeNote}>Les éventuelles conditions tarifaires ne sont pas affichées dans cet e-mail ou cette page de revalidation.</p>
    </section>
  );
}

function formatDates(items = []) {
  if (!items.length) return 'Aucune date';
  return items.map((item) => {
    const date = new Date(`${item.date}T12:00:00`);
    const day = Number.isNaN(date.getTime()) ? item.date : new Intl.DateTimeFormat('fr-FR', { day:'2-digit', month:'long', year:'numeric' }).format(date);
    const start = item.heure_debut ? String(item.heure_debut).slice(0,5) : '';
    const end = item.heure_fin ? String(item.heure_fin).slice(0,5) : '';
    return `${day}${start || end ? ` · ${start}${start && end ? ' → ' : ''}${end}` : ''}`;
  }).join(' ; ');
}

function State({ children, error = false }) {
  return <div style={{...styles.state, ...(error ? {color:'#b42318'} : {})}}>{children}</div>;
}

const styles = {
  page:{minHeight:'100vh',padding:'32px 18px',background:'#f3f6fb',fontFamily:'Arial,Helvetica,sans-serif',color:'#0f2747'},
  shell:{maxWidth:680,margin:'0 auto',padding:30,border:'1px solid #dbe3ef',borderRadius:18,background:'#fff',boxSizing:'border-box'},
  brand:{marginBottom:24,fontSize:24,fontWeight:900},eyebrow:{margin:'0 0 8px',color:'#2563eb',fontSize:11,fontWeight:900,letterSpacing:'.1em'},
  title:{margin:'0 0 12px',fontSize:27,lineHeight:1.2},lead:{margin:'0 0 20px',color:'#5b6b82',fontSize:14,lineHeight:1.65},
  diffCard:{padding:17,border:'1px solid #dbe3ef',borderRadius:12,background:'#f8fafc'},diffTitle:{margin:'0 0 12px',fontSize:17},
  diffRow:{padding:'11px 0',borderBottom:'1px solid #e8edf4'},diffLabel:{display:'block',marginBottom:7,fontSize:13},before:{color:'#667085',fontSize:12,lineHeight:1.5},after:{marginTop:3,color:'#1d4ed8',fontSize:12,fontWeight:750,lineHeight:1.5},
  feeNote:{margin:'12px 0 0',color:'#98a2b3',fontSize:10,lineHeight:1.5},responseBox:{marginTop:16,padding:17,border:'1px solid #bfdbfe',borderRadius:12,background:'#f8fbff'},
  label:{display:'grid',gap:7,color:'#475467',fontSize:11,fontWeight:750},textarea:{width:'100%',boxSizing:'border-box',padding:10,border:'1px solid #cbd5e1',borderRadius:8,fontFamily:'inherit',resize:'vertical'},
  actions:{display:'flex',justifyContent:'flex-end',flexWrap:'wrap',gap:8,marginTop:13},refuse:{minHeight:38,padding:'0 12px',border:'1px solid #f97066',borderRadius:8,background:'#fff',color:'#b42318',fontWeight:800,cursor:'pointer'},accept:{minHeight:38,padding:'0 12px',border:'1px solid #2563eb',borderRadius:8,background:'#2563eb',color:'#fff',fontWeight:800,cursor:'pointer'},
  unavailable:{display:'grid',gap:5,marginTop:16,padding:15,border:'1px solid #fde68a',borderRadius:10,background:'#fffbeb',color:'#92400e',fontSize:12,lineHeight:1.55},
  success:{display:'grid',gap:5,marginTop:16,padding:15,borderRadius:10,background:'#ecfdf3',color:'#027a48',fontSize:12},refused:{display:'grid',gap:5,marginTop:16,padding:15,borderRadius:10,background:'#fef3f2',color:'#b42318',fontSize:12},
  accountInvite:{marginTop:16,padding:16,border:'1px solid #bfdbfe',borderRadius:12,background:'#f8fbff'},accountTitle:{display:'block',color:'#1d4ed8',fontSize:14},accountText:{margin:'6px 0 11px',color:'#52647d',fontSize:12,lineHeight:1.55},accountButton:{display:'inline-flex',alignItems:'center',minHeight:36,padding:'0 13px',borderRadius:8,background:'#2563eb',color:'#fff',fontSize:12,fontWeight:800,textDecoration:'none'},
  footer:{margin:'16px 0 0',color:'#98a2b3',fontSize:10,textAlign:'center'},error:{color:'#b42318',fontSize:11},muted:{color:'#667085',fontSize:12},state:{display:'grid',placeItems:'center',minHeight:'60vh',padding:24,color:'#667085'}
};
