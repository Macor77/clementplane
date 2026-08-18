import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  getMyTrainerMissionById,
  getMyTrainerMissionHistory,
  withdrawFromMyMissionOption,
} from '../../services/trainerProposalService';

function formatDate(value) { if (!value) return ''; return new Intl.DateTimeFormat('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' }).format(new Date(`${value}T12:00:00`)); }
function statusLabel(status) { return ({ proposition_envoyee:'Proposition à traiter', accepte:'Acceptée · en attente de confirmation OF', affecte:'Mission confirmée', refuse:'Refusée', annule:'Annulée', indisponible_affecte_ailleurs:'Plus disponible · mission confirmée ailleurs', mission_pourvue:'Mission pourvue', desiste:'Désistement' })[status] || status; }

function historyActionLabel(item) {
  const labels = {
    selected:
      'Formateur sélectionné',
    proposal_sent:
      'Proposition envoyée',
    accepted:
      item.previous_status === 'affecte'
        ? 'Affectation retirée par l’organisme'
        : item.actor_type === 'organization'
          ? 'Acceptation enregistrée par l’organisme'
          : 'Proposition acceptée',
    refused:
      item.actor_type === 'organization'
        ? 'Refus enregistré par l’organisme'
        : 'Proposition refusée',
    assigned:
      'Affectation confirmée',
    reset:
      'Suivi réinitialisé',
    unavailable_elsewhere:
      'Plus disponible · mission confirmée ailleurs',
    withdrawn:
      'Désistement du formateur',
    mission_filled:
      'Mission pourvue par un autre formateur',
    cancelled:
      'Suivi annulé',
    removed:
      'Formateur retiré de la mission',
    status_changed:
      'Statut modifié',
  };

  return (
    labels[item.action] ||
    'Action enregistrée'
  );
}

function historyActorLabel(item) {
  const name =
    item.actor_display_name ||
    (
      item.actor_type === 'system'
        ? 'Formaplane'
        : 'Utilisateur'
    );

  if (
    item.actor_type === 'trainer'
  ) {
    return `${name} · Formateur`;
  }

  if (
    item.actor_type ===
    'organization'
  ) {
    return [
      name,
      item.actor_organization_name,
    ]
      .filter(Boolean)
      .join(' · ');
  }

  return `${name} · Système`;
}

function formatHistoryDate(value) {
  if (!value) {
    return '';
  }

  return new Intl.DateTimeFormat(
    'fr-FR',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
  ).format(
    new Date(value),
  );
}


export default function TrainerMissionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mission,setMission]=useState(null);
  const [history,setHistory]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [withdrawOpen,setWithdrawOpen]=useState(false);
  const [withdrawing,setWithdrawing]=useState(false);
  const [withdrawAvailability,setWithdrawAvailability]=useState({});
  const [withdrawComment,setWithdrawComment]=useState('');

  useEffect(()=>{
    let active=true;

    (async()=>{
      try {
        const [row, historyRows] =
          await Promise.all([
            getMyTrainerMissionById(id),
            getMyTrainerMissionHistory(id),
          ]);

        if(active) {
          setMission(row);
          setHistory(historyRows);
        }
      } catch(e) {
        console.error(e);

        if(active) {
          setError(
            e?.message ||
            'Impossible de charger cette mission.',
          );
        }
      } finally {
        if(active) {
          setLoading(false);
        }
      }
    })();

    return()=>{
      active=false;
    };
  },[id]);
  const openWithdraw = () => {
    const choices = {};

    for (const item of (mission?.dates || [])) {
      if (item?.date) {
        choices[item.date] = '';
      }
    }

    setWithdrawAvailability(choices);
    setWithdrawComment('');
    setWithdrawOpen(true);
  };

  const confirmWithdraw = async () => {
    if (!mission) {
      return;
    }

    setWithdrawing(true);
    setError('');

    try {
      await withdrawFromMyMissionOption({
        missionFormateurId:
          mission.mission_formateur_id,
        availabilityByDay:
          withdrawAvailability,
        comment:
          withdrawComment,
      });

      navigate('/formateur/missions', {
        replace: true,
      });
    } catch (withdrawError) {
      console.error(withdrawError);
      setError(
        withdrawError?.message ||
          'Impossible d’enregistrer votre désistement.',
      );
    } finally {
      setWithdrawing(false);
    }
  };

  if(loading) return <div style={styles.state}>Chargement de la mission…</div>;
  if(error || !mission) return <div style={styles.state}><strong>Mission inaccessible</strong><span>{error}</span><Link to="/formateur/missions">Retour à mes missions</Link></div>;
  const place=[mission.location,mission.postal_code,mission.city].filter(Boolean).join(' ');
  const dates=[...(Array.isArray(mission.dates)?mission.dates:[])].sort((a,b)=>(a.date||'').localeCompare(b.date||''));
  return <div style={styles.page}>
    <div style={styles.header}><div><Link to="/formateur/missions" style={styles.back}>← Mes missions</Link><h1 style={styles.title}>{mission.mission_title || 'Mission de formation'}</h1><p style={styles.subtitle}>{statusLabel(mission.status)}</p></div></div>
    <section style={styles.card}><h2 style={styles.cardTitle}>Informations de la mission</h2><div style={styles.grid}>
      {mission.formation ? <Info icon="🎓" label="Formation" value={mission.formation}/> : null}
      {mission.organization_name ? (
        <div style={styles.info}>
          <span style={styles.icon}>🏢</span>
          <div>
            <span style={styles.label}>Organisme de formation</span>
            <strong style={styles.value}>{mission.organization_name}</strong>
            <Link to={`/formateur/missions/${mission.mission_id}/organisme`} style={styles.contactLink}>Voir la fiche contact</Link>
          </div>
        </div>
      ) : null}
      {mission.client ? <Info icon="👥" label="Client" value={mission.client}/> : null}
      {place ? <Info icon="📍" label="Lieu" value={place}/> : null}
      {mission.offered_fee != null ? <Info icon="€" label="Rémunération" value={`${mission.offered_fee} €`}/> : null}
    </div></section>
    <section style={styles.card}><h2 style={styles.cardTitle}>Dates et horaires</h2>{dates.length ? <div style={styles.dateList}>{dates.map((item,index)=><div key={`${item.date}-${index}`} style={styles.dateRow}><strong>{formatDate(item.date)}</strong><span>{[item.heure_debut,item.heure_fin].filter(Boolean).join(' → ') || 'Horaires à confirmer'}</span></div>)}</div> : <span style={styles.muted}>Dates à confirmer.</span>}</section>
    {mission.mission_notes ? <section style={styles.card}><h2 style={styles.cardTitle}>Informations complémentaires</h2><p style={styles.notes}>{mission.mission_notes}</p></section> : null}
    {mission.response_comment ? <section style={styles.card}><h2 style={styles.cardTitle}>Votre réponse</h2><div style={styles.response}><span>Commentaire transmis à l’organisme de formation</span><p>{mission.response_comment}</p></div></section> : null}
    {mission.withdrawal_comment ? <section style={styles.card}><h2 style={styles.cardTitle}>Votre désistement</h2><div style={styles.response}><span>Commentaire transmis à l’organisme de formation</span><p>{mission.withdrawal_comment}</p></div></section> : null}

    {mission.status === 'accepte' ? (
      <section style={{...styles.card,...styles.withdrawCard}}>
        <div style={styles.withdrawHeading}>
          <div>
            <h2 style={styles.cardTitle}>Se désister de cette option</h2>
            <p style={styles.muted}>
              Tant que l’organisme ne vous a pas affecté définitivement,
              vous pouvez retirer votre option. Cette action sera enregistrée
              dans l’historique de la mission.
            </p>
          </div>

          <button
            type="button"
            onClick={openWithdraw}
            style={styles.withdrawButton}
          >
            Se désister
          </button>
        </div>
      </section>
    ) : null}

    <section style={styles.card}>
      <h2 style={styles.cardTitle}>
        Historique de cette mission
      </h2>

      <p style={styles.historyIntro}>
        Seules les actions qui vous concernent
        personnellement sont affichées ici.
      </p>

      {history.length === 0 ? (
        <p style={styles.muted}>
          Aucun événement enregistré pour le moment.
        </p>
      ) : (
        <div style={styles.historyList}>
          {history.map((item) => (
            <div
              key={item.id}
              style={styles.historyItem}
            >
              <span
                style={styles.historyDot}
                aria-hidden="true"
              />

              <div style={styles.historyContent}>
                <div style={styles.historyTopline}>
                  <strong>
                    {historyActionLabel(item)}
                  </strong>

                  <span>
                    {formatHistoryDate(
                      item.created_at,
                    )}
                  </span>
                </div>

                <span style={styles.historyActor}>
                  Par {historyActorLabel(item)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>

    <section style={{...styles.card,...styles.futureCard}}><h2 style={styles.cardTitle}>Échanges avec l’organisme</h2><p style={styles.muted}>Cet espace accueillera prochainement les échanges liés directement à cette mission.</p></section>

    {withdrawOpen ? (
      <div style={styles.modalBackdrop}>
        <div style={styles.modal}>
          <div style={styles.modalHeader}>
            <div>
              <p style={styles.modalEyebrow}>DÉSISTEMENT</p>
              <h2 style={styles.modalTitle}>Mettre à jour vos disponibilités ?</h2>
              <p style={styles.modalText}>
                Choisissez votre statut pour chacune des dates de cette mission.
                Sans modification, le statut « Neutre » sera appliqué automatiquement.
              </p>
            </div>
            <button type="button" onClick={()=>setWithdrawOpen(false)} style={styles.modalClose}>×</button>
          </div>

          <div style={styles.withdrawWarning}>
            <strong>Prévenez également l’organisme de formation.</strong>
            <span>
              Le désistement sera enregistré dans Formaplane, mais nous vous recommandons de prévenir clairement l’OF par téléphone, e-mail ou tout autre moyen habituel.
            </span>
          </div>

          <label style={styles.withdrawCommentField}>
            <span>Commentaire facultatif à transmettre à l’OF</span>
            <textarea
              rows={3}
              value={withdrawComment}
              onChange={(event)=>setWithdrawComment(event.target.value)}
              placeholder="Expliquez brièvement votre désistement si vous le souhaitez…"
              style={styles.withdrawTextarea}
            />
          </label>

          <div style={styles.withdrawDates}>
            {dates.map((item) => (
              <label key={item.date} style={styles.withdrawDateRow}>
                <strong>{formatDate(item.date)}</strong>
                <select
                  value={withdrawAvailability[item.date] ?? ''}
                  onChange={(event)=>setWithdrawAvailability((current)=>({
                    ...current,
                    [item.date]: event.target.value,
                  }))}
                  style={styles.withdrawSelect}
                >
                  <option value="">Neutre</option>
                  <option value="dispo">Disponible</option>
                  <option value="indispo">Indisponible</option>
                </select>
              </label>
            ))}
          </div>

          <div style={styles.modalActions}>
            <button type="button" onClick={()=>setWithdrawOpen(false)} disabled={withdrawing} style={styles.cancelButton}>Annuler</button>
            <button type="button" onClick={confirmWithdraw} disabled={withdrawing} style={styles.confirmWithdrawButton}>
              {withdrawing ? 'Enregistrement…' : 'Confirmer mon désistement'}
            </button>
          </div>
        </div>
      </div>
    ) : null}
  </div>;
}
function Info({icon,label,value}) { return <div style={styles.info}><span style={styles.icon}>{icon}</span><div><span style={styles.label}>{label}</span><strong style={styles.value}>{value}</strong></div></div>; }
const styles={ page:{width:'100%',maxWidth:1100,margin:'0 auto',paddingBottom:28}, header:{display:'flex',justifyContent:'space-between',marginBottom:14}, back:{color:'#3b82f6',fontSize:11,fontWeight:700,textDecoration:'none'}, title:{margin:'7px 0 3px',color:'#101828',fontSize:26}, subtitle:{margin:0,color:'#b54708',fontSize:11,fontWeight:700}, card:{marginBottom:10,padding:'15px 16px',border:'1px solid #e4e7ec',borderRadius:11,background:'#fff'}, cardTitle:{margin:'0 0 12px',fontSize:15,color:'#101828'}, grid:{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:8}, info:{display:'flex',gap:10,padding:'10px 11px',border:'1px solid #eef1f5',borderRadius:9,background:'#f9fafb'},icon:{fontSize:17},label:{display:'block',color:'#667085',fontSize:9,fontWeight:800,textTransform:'uppercase'},value:{display:'block',marginTop:2,color:'#344054',fontSize:12},contactLink:{display:'inline-block',marginTop:4,color:'#2563eb',fontSize:10,fontWeight:750,textDecoration:'none'},dateList:{display:'grid',gap:6},dateRow:{display:'flex',justifyContent:'space-between',gap:12,padding:'8px 10px',borderRadius:8,background:'#f9fafb',color:'#475467',fontSize:11},notes:{margin:0,whiteSpace:'pre-line',color:'#475467',fontSize:11,lineHeight:1.5},response:{padding:'10px 11px',borderLeft:'3px solid #3b82f6',background:'#eff6ff',color:'#475467',fontSize:10},withdrawCard:{borderColor:'#fed7aa',background:'#fffaf5'},withdrawHeading:{display:'flex',justifyContent:'space-between',gap:16,alignItems:'center'},withdrawButton:{flexShrink:0,minHeight:34,padding:'0 11px',border:'1px solid #fdba74',borderRadius:7,background:'#fff7ed',color:'#c2410c',fontWeight:750,cursor:'pointer'},modalBackdrop:{position:'fixed',inset:0,zIndex:1000,display:'grid',placeItems:'center',padding:20,background:'rgba(15,23,42,.48)'},modal:{width:'min(620px,100%)',maxHeight:'85vh',overflow:'auto',padding:18,borderRadius:12,background:'#fff',boxShadow:'0 24px 70px rgba(15,23,42,.25)'},modalHeader:{display:'flex',justifyContent:'space-between',gap:16,paddingBottom:12,borderBottom:'1px solid #e4e7ec'},modalEyebrow:{margin:0,color:'#f97316',fontSize:9,fontWeight:800,letterSpacing:'.08em'},modalTitle:{margin:'4px 0',fontSize:19,color:'#101828'},modalText:{margin:0,color:'#667085',fontSize:11,lineHeight:1.45},modalClose:{width:32,height:32,border:'1px solid #d0d5dd',borderRadius:7,background:'#fff',fontSize:20,cursor:'pointer'},withdrawWarning:{display:'grid',gap:3,marginTop:14,padding:'10px 11px',border:'1px solid #fed7aa',borderRadius:8,background:'#fff7ed',color:'#9a3412',fontSize:10,lineHeight:1.45},withdrawCommentField:{display:'grid',gap:6,paddingTop:12,color:'#475467',fontSize:10,fontWeight:700},withdrawTextarea:{width:'100%',boxSizing:'border-box',padding:'8px 9px',border:'1px solid #d0d5dd',borderRadius:7,fontFamily:'inherit',fontSize:11,resize:'vertical'},withdrawDates:{display:'grid',gap:8,padding:'14px 0'},withdrawDateRow:{display:'grid',gridTemplateColumns:'minmax(0,1fr) 160px',gap:12,alignItems:'center',padding:'9px 10px',border:'1px solid #e4e7ec',borderRadius:8,color:'#344054',fontSize:11},withdrawSelect:{minHeight:34,padding:'6px 8px',border:'1px solid #d0d5dd',borderRadius:7,background:'#fff'},modalActions:{display:'flex',justifyContent:'flex-end',gap:8,paddingTop:12,borderTop:'1px solid #e4e7ec'},cancelButton:{minHeight:36,padding:'0 12px',border:'1px solid #d0d5dd',borderRadius:7,background:'#fff',color:'#344054',fontWeight:700,cursor:'pointer'},confirmWithdrawButton:{minHeight:36,padding:'0 12px',border:'1px solid #ea580c',borderRadius:7,background:'#ea580c',color:'#fff',fontWeight:750,cursor:'pointer'},futureCard:{borderStyle:'dashed'},historyIntro:{margin:'-4px 0 12px',color:'#667085',fontSize:10},historyList:{display:'grid',gap:8},historyItem:{display:'grid',gridTemplateColumns:'9px minmax(0,1fr)',gap:9,alignItems:'start'},historyDot:{width:8,height:8,marginTop:5,borderRadius:999,background:'#3b82f6'},historyContent:{display:'grid',gap:3,paddingBottom:8,borderBottom:'1px solid #f2f4f7'},historyTopline:{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:8,color:'#344054',fontSize:10},historyActor:{color:'#667085',fontSize:10},muted:{margin:0,color:'#667085',fontSize:11},state:{display:'grid',gap:8,padding:24,color:'#667085'} };
