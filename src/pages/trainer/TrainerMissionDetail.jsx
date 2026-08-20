import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  getMyPendingMissionChange,
  getMyTrainerMissionById,
  getMyTrainerMissionHistory,
  respondToMyMissionChange,
  withdrawFromMyMissionOption,
} from '../../services/trainerProposalService';
import { useAuth } from '../../context/AuthContext';

function formatDate(value) { if (!value) return ''; return new Intl.DateTimeFormat('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' }).format(new Date(`${value}T12:00:00`)); }
function statusLabel(status) { return ({ proposition_envoyee:'Proposition à traiter', accepte:'Acceptée · en attente de confirmation OF', affecte:'Mission confirmée', refuse:'Refusée', annule:'Annulée', indisponible_affecte_ailleurs:'Plus disponible · mission confirmée ailleurs', mission_pourvue:'Mission pourvue', desiste:'Désistement' })[status] || status; }

function statusColor(status) {
  if (status === 'affecte') return '#2563eb';
  if (status === 'accepte') return '#b54708';
  if (['refuse', 'annule', 'desiste'].includes(status)) return '#b42318';
  return '#667085';
}

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
    change_requested:
      'Nouvelles conditions proposées par l’OF',
    change_accepted:
      'Nouvelles conditions acceptées',
    change_refused:
      'Nouvelles conditions refusées',
    change_applied:
      'Nouvelles conditions appliquées',
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
  const location = useLocation();

  const {
    trainerProfile,
    displayName,
    signOut,
  } = useAuth();

  const expectedTrainerId =
    new URLSearchParams(location.search).get('trainer') || '';

  const wrongTrainerAccount = Boolean(
    expectedTrainerId &&
    trainerProfile?.id &&
    trainerProfile.id !== expectedTrainerId,
  );
  const [mission,setMission]=useState(null);
  const [history,setHistory]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [withdrawOpen,setWithdrawOpen]=useState(false);
  const [withdrawing,setWithdrawing]=useState(false);
  const [withdrawAvailability,setWithdrawAvailability]=useState({});
  const [withdrawComment,setWithdrawComment]=useState('');
  const [pendingChange,setPendingChange]=useState(null);
  const [changeComment,setChangeComment]=useState('');
  const [changeSubmitting,setChangeSubmitting]=useState(false);
  const [historyOpen,setHistoryOpen]=useState(false);
  const [switchingAccount,setSwitchingAccount]=useState(false);

  useEffect(()=>{
    let active=true;

    if (wrongTrainerAccount) {
      setLoading(false);
      return () => {
        active = false;
      };
    }

    (async()=>{
      try {
        const [
          row,
          historyRows,
          pendingChangeRow,
        ] = await Promise.all([
          getMyTrainerMissionById(id),
          getMyTrainerMissionHistory(id),
          getMyPendingMissionChange(id),
        ]);

        if(active) {
          setMission(row);
          setHistory(historyRows);
          setPendingChange(pendingChangeRow);
          setChangeComment(
            pendingChangeRow?.response_comment || '',
          );
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
  },[id, wrongTrainerAccount]);

  const respondToChange = async (response) => {
    if (!pendingChange) {
      return;
    }

    setChangeSubmitting(true);
    setError('');

    try {
      await respondToMyMissionChange({
        requestId: pendingChange.request_id,
        response,
        comment: changeComment,
      });

      const [
        missionRow,
        historyRows,
        pendingChangeRow,
      ] = await Promise.all([
        getMyTrainerMissionById(id),
        getMyTrainerMissionHistory(id),
        getMyPendingMissionChange(id),
      ]);

      setMission(missionRow);
      setHistory(historyRows);
      setPendingChange(pendingChangeRow);
    } catch (changeError) {
      console.error(changeError);
      setError(
        changeError?.message ||
          'Impossible d’enregistrer votre réponse aux nouvelles conditions.',
      );
    } finally {
      setChangeSubmitting(false);
    }
  };

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

  const switchTrainerAccount = async () => {
    if (switchingAccount) {
      return;
    }

    setSwitchingAccount(true);

    const returnTo =
      `${location.pathname}${location.search}`;

    try {
      await signOut();

      navigate(
        '/connexion',
        {
          replace: true,
          state: {
            from: returnTo,
          },
        },
      );
    } catch (switchError) {
      console.error(
        'Impossible de changer de compte formateur',
        switchError,
      );

      setSwitchingAccount(false);
    }
  };

  if (wrongTrainerAccount) {
    return (
      <div style={styles.accountMismatchPage}>
        <section style={styles.accountMismatchCard}>
          <p style={styles.accountMismatchEyebrow}>
            COMPTE FORMATEUR
          </p>

          <h1 style={styles.accountMismatchTitle}>
            Cette mission est destinée à un autre compte
          </h1>

          <p style={styles.accountMismatchText}>
            Vous êtes actuellement connecté
            {displayName ? (
              <>
                {' '}en tant que <strong>{displayName}</strong>
              </>
            ) : null}
            . La confirmation contenue dans cet e-mail a été
            adressée à un autre compte formateur.
          </p>

          <p style={styles.accountMismatchText}>
            Pour consulter la bonne mission et votre planning,
            connectez-vous avec le compte auquel l’e-mail de
            confirmation a été envoyé.
          </p>

          <div style={styles.accountMismatchActions}>
            <button
              type="button"
              onClick={switchTrainerAccount}
              disabled={switchingAccount}
              style={styles.accountMismatchPrimary}
            >
              {switchingAccount
                ? 'Déconnexion…'
                : 'Se connecter avec un autre compte'}
            </button>

            <Link
              to="/formateur/espace"
              style={styles.accountMismatchSecondary}
            >
              Rester dans mon espace
            </Link>
          </div>
        </section>
      </div>
    );
  }

  if(loading) return <div style={styles.state}>Chargement de la mission…</div>;
  if(error || !mission) return <div style={styles.state}><strong>Mission inaccessible</strong><span>{error}</span><Link to="/formateur/missions">Retour à mes missions</Link></div>;
  const place=[mission.location,mission.postal_code,mission.city].filter(Boolean).join(' ');
  const dates=[...(Array.isArray(mission.dates)?mission.dates:[])].sort((a,b)=>(a.date||'').localeCompare(b.date||''));
  return <div style={styles.page}>
    <div style={styles.header}><div><Link to="/formateur/missions" style={styles.back}>← Mes missions</Link><h1 style={styles.title}>{mission.mission_title || 'Mission de formation'}</h1><p style={{...styles.subtitle,color:statusColor(mission.status)}}>{statusLabel(mission.status)}</p></div></div>
    {mission.status === 'affecte' ? (
      <section style={styles.coordinationNotice}>
        <div style={styles.coordinationIcon} aria-hidden="true">
          i
        </div>

        <div>
          <h2 style={styles.coordinationTitle}>
            Modalités administratives et organisationnelles
          </h2>

          <p style={styles.coordinationText}>
            Formaplane confirme la planification de cette mission.
            Pour préparer concrètement votre intervention, rapprochez-vous
            directement de <strong>{mission.organization_name || 'l’organisme de formation'}</strong>.
          </p>

          <p style={styles.coordinationText}>
            Les modalités logistiques, organisationnelles et administratives
            (accès au site, horaires pratiques, matériel ou supports,
            documents, convention ou contrat et autres éléments utiles)
            sont convenues directement entre vous et l’organisme de formation,
            en dehors de Formaplane.
          </p>

          {mission.organization_name ? (
            <Link
              to={`/formateur/missions/${mission.mission_id}/organisme`}
              style={styles.coordinationLink}
            >
              Voir les coordonnées de l’organisme
            </Link>
          ) : null}
        </div>
      </section>
    ) : null}

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
    {pendingChange ? (
      <section style={{...styles.card,...styles.changeCard}}>
        <div style={styles.changeHeader}>
          <div>
            <p style={styles.changeEyebrow}>MODIFICATION À VALIDER</p>
            <h2 style={styles.cardTitle}>L’OF propose de nouvelles conditions</h2>
            <p style={styles.muted}>
              Vos conditions actuelles restent valables tant que vous n’avez pas accepté cette modification.
            </p>
          </div>
          <span style={styles.changeStatus}>
            {pendingChange.response_status === 'pending'
              ? 'Votre réponse est attendue'
              : pendingChange.response_status === 'accepted'
                ? 'Acceptée'
                : 'Refusée'}
          </span>
        </div>

        <MissionChangeDiff change={pendingChange} />

        {pendingChange.response_status === 'pending' ? (
          <>
            <label style={styles.withdrawCommentField}>
              <span>Commentaire facultatif à transmettre à l’OF</span>
              <textarea
                rows={3}
                value={changeComment}
                onChange={(event)=>setChangeComment(event.target.value)}
                placeholder="Une précision sur votre décision…"
                style={styles.withdrawTextarea}
              />
            </label>

            <div style={styles.changeActions}>
              <button
                type="button"
                onClick={()=>respondToChange('refused')}
                disabled={changeSubmitting}
                style={styles.changeRefuseButton}
              >
                Refuser les nouvelles conditions
              </button>
              <button
                type="button"
                onClick={()=>respondToChange('accepted')}
                disabled={changeSubmitting}
                style={styles.changeAcceptButton}
              >
                {changeSubmitting ? 'Enregistrement…' : 'Accepter les nouvelles conditions'}
              </button>
            </div>
          </>
        ) : null}
      </section>
    ) : null}

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

    <section style={{...styles.card,...styles.historyCard}}>
      <button
        type="button"
        onClick={() => setHistoryOpen((current) => !current)}
        style={styles.historyToggle}
        aria-expanded={historyOpen}
      >
        <span style={styles.historyToggleTitle}>
          Historique de cette mission
          <span style={styles.historyCount}>
            {history.length} {history.length > 1 ? 'actions' : 'action'}
          </span>
        </span>

        <span
          style={{
            ...styles.historyChevron,
            transform: historyOpen
              ? 'rotate(180deg)'
              : 'rotate(0deg)',
          }}
          aria-hidden="true"
        >
         ⌄
        </span>
      </button>

      {historyOpen ? (
        <div style={styles.historyBody}>
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

                    {item.details?.comment ? (
                      <span style={styles.historyComment}>
                        Commentaire : « {item.details.comment} »
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
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

function MissionChangeDiff({ change }) {
  const previous = change?.previous_mission || {};
  const proposed = change?.proposed_mission || {};
  const rows = [];

  const add = (label, before, after, formatter = (value) => value || 'Non renseigné') => {
    const normalizedBefore = before == null ? '' : String(before);
    const normalizedAfter = after == null ? '' : String(after);

    if (normalizedBefore !== normalizedAfter) {
      rows.push({
        label,
        before: formatter(before),
        after: formatter(after),
      });
    }
  };

  add('Formation', previous.formation, proposed.formation);
  add('Lieu / site', previous.lieu, proposed.lieu);
  add('Adresse', previous.adresse, proposed.adresse);
  add(
    'Ville',
    [previous.code_postal, previous.ville].filter(Boolean).join(' '),
    [proposed.code_postal, proposed.ville].filter(Boolean).join(' '),
  );
  add(
    'Rémunération',
    previous.cout_formateur,
    proposed.cout_formateur,
    (value) => value == null || value === '' ? 'Non renseignée' : `${value} €`,
  );

  const previousDates = JSON.stringify(change?.previous_dates || []);
  const proposedDates = JSON.stringify(change?.proposed_dates || []);

  if (previousDates !== proposedDates) {
    rows.push({
      label: 'Dates et horaires',
      before: formatChangeDates(change?.previous_dates || []),
      after: formatChangeDates(change?.proposed_dates || []),
    });
  }

  return (
    <div style={styles.changeDiffList}>
      {rows.length === 0 ? (
        <span style={styles.muted}>Aucune différence essentielle détectée.</span>
      ) : rows.map((row) => (
        <div key={row.label} style={styles.changeDiffRow}>
          <strong>{row.label}</strong>
          <div style={styles.changeBefore}>Avant : {row.before}</div>
          <div style={styles.changeAfter}>Proposé : {row.after}</div>
        </div>
      ))}
    </div>
  );
}

function formatChangeDates(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return 'Aucune date';
  }

  return items
    .map((item) => {
      const day = formatDate(item.date);
      const hours = [item.heure_debut, item.heure_fin]
        .filter(Boolean)
        .map((value) => String(value).slice(0, 5))
        .join(' → ');

      return hours ? `${day} · ${hours}` : day;
    })
    .join(' ; ');
}

function Info({icon,label,value}) { return <div style={styles.info}><span style={styles.icon}>{icon}</span><div><span style={styles.label}>{label}</span><strong style={styles.value}>{value}</strong></div></div>; }
const styles={ page:{width:'100%',maxWidth:1100,margin:'0 auto',paddingBottom:28}, header:{display:'flex',justifyContent:'space-between',marginBottom:14}, back:{color:'#3b82f6',fontSize:11,fontWeight:700,textDecoration:'none'}, title:{margin:'7px 0 3px',color:'#101828',fontSize:26}, subtitle:{margin:0,color:'#b54708',fontSize:11,fontWeight:700}, card:{marginBottom:10,padding:'15px 16px',border:'1px solid #e4e7ec',borderRadius:11,background:'#fff'}, cardTitle:{margin:'0 0 12px',fontSize:15,color:'#101828'}, grid:{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:8}, info:{display:'flex',gap:10,padding:'10px 11px',border:'1px solid #eef1f5',borderRadius:9,background:'#f9fafb'},icon:{fontSize:17},label:{display:'block',color:'#667085',fontSize:9,fontWeight:800,textTransform:'uppercase'},value:{display:'block',marginTop:2,color:'#344054',fontSize:12},contactLink:{display:'inline-block',marginTop:4,color:'#2563eb',fontSize:10,fontWeight:750,textDecoration:'none'},dateList:{display:'grid',gap:6},dateRow:{display:'flex',justifyContent:'space-between',gap:12,padding:'8px 10px',borderRadius:8,background:'#f9fafb',color:'#475467',fontSize:11},notes:{margin:0,whiteSpace:'pre-line',color:'#475467',fontSize:11,lineHeight:1.5},response:{padding:'10px 11px',borderLeft:'3px solid #3b82f6',background:'#eff6ff',color:'#475467',fontSize:10},withdrawCard:{borderColor:'#fed7aa',background:'#fffaf5'},withdrawHeading:{display:'flex',justifyContent:'space-between',gap:16,alignItems:'center'},withdrawButton:{flexShrink:0,minHeight:34,padding:'0 11px',border:'1px solid #fdba74',borderRadius:7,background:'#fff7ed',color:'#c2410c',fontWeight:750,cursor:'pointer'},modalBackdrop:{position:'fixed',inset:0,zIndex:1000,display:'grid',placeItems:'center',padding:20,background:'rgba(15,23,42,.48)'},modal:{width:'min(620px,100%)',maxHeight:'85vh',overflow:'auto',padding:18,borderRadius:12,background:'#fff',boxShadow:'0 24px 70px rgba(15,23,42,.25)'},modalHeader:{display:'flex',justifyContent:'space-between',gap:16,paddingBottom:12,borderBottom:'1px solid #e4e7ec'},modalEyebrow:{margin:0,color:'#f97316',fontSize:9,fontWeight:800,letterSpacing:'.08em'},modalTitle:{margin:'4px 0',fontSize:19,color:'#101828'},modalText:{margin:0,color:'#667085',fontSize:11,lineHeight:1.45},modalClose:{width:32,height:32,border:'1px solid #d0d5dd',borderRadius:7,background:'#fff',fontSize:20,cursor:'pointer'},withdrawWarning:{display:'grid',gap:3,marginTop:14,padding:'10px 11px',border:'1px solid #fed7aa',borderRadius:8,background:'#fff7ed',color:'#9a3412',fontSize:10,lineHeight:1.45},withdrawCommentField:{display:'grid',gap:6,paddingTop:12,color:'#475467',fontSize:10,fontWeight:700},withdrawTextarea:{width:'100%',boxSizing:'border-box',padding:'8px 9px',border:'1px solid #d0d5dd',borderRadius:7,fontFamily:'inherit',fontSize:11,resize:'vertical'},withdrawDates:{display:'grid',gap:8,padding:'14px 0'},withdrawDateRow:{display:'grid',gridTemplateColumns:'minmax(0,1fr) 160px',gap:12,alignItems:'center',padding:'9px 10px',border:'1px solid #e4e7ec',borderRadius:8,color:'#344054',fontSize:11},withdrawSelect:{minHeight:34,padding:'6px 8px',border:'1px solid #d0d5dd',borderRadius:7,background:'#fff'},modalActions:{display:'flex',justifyContent:'flex-end',gap:8,paddingTop:12,borderTop:'1px solid #e4e7ec'},cancelButton:{minHeight:36,padding:'0 12px',border:'1px solid #d0d5dd',borderRadius:7,background:'#fff',color:'#344054',fontWeight:700,cursor:'pointer'},confirmWithdrawButton:{minHeight:36,padding:'0 12px',border:'1px solid #ea580c',borderRadius:7,background:'#ea580c',color:'#fff',fontWeight:750,cursor:'pointer'},changeCard:{borderColor:'#fdb022',background:'#fffcf5'},changeHeader:{display:'flex',justifyContent:'space-between',gap:14,alignItems:'start',marginBottom:12},changeEyebrow:{margin:'0 0 4px',color:'#b54708',fontSize:9,fontWeight:800,letterSpacing:'.08em'},changeStatus:{padding:'5px 8px',borderRadius:999,background:'#fff7ed',color:'#b54708',fontSize:9,fontWeight:800},changeDiffList:{display:'grid',gap:7,marginTop:10},changeDiffRow:{padding:'9px 10px',border:'1px solid #fedf89',borderRadius:8,background:'#fff',fontSize:10},changeBefore:{marginTop:4,color:'#667085'},changeAfter:{marginTop:2,color:'#9a3412',fontWeight:700},changeActions:{display:'flex',justifyContent:'flex-end',gap:8,marginTop:12},changeRefuseButton:{minHeight:36,padding:'0 12px',border:'1px solid #f97066',borderRadius:7,background:'#fff',color:'#b42318',fontWeight:750,cursor:'pointer'},changeAcceptButton:{minHeight:36,padding:'0 12px',border:'1px solid #2563eb',borderRadius:7,background:'#2563eb',color:'#fff',fontWeight:750,cursor:'pointer'},futureCard:{borderStyle:'dashed'},historyIntro:{margin:'-4px 0 12px',color:'#667085',fontSize:10},historyList:{display:'grid',gap:8},historyItem:{display:'grid',gridTemplateColumns:'9px minmax(0,1fr)',gap:9,alignItems:'start'},historyDot:{width:8,height:8,marginTop:5,borderRadius:999,background:'#3b82f6'},historyContent:{display:'grid',gap:3,paddingBottom:8,borderBottom:'1px solid #f2f4f7'},historyTopline:{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:8,color:'#344054',fontSize:10},historyActor:{color:'#667085',fontSize:10},historyComment:{color:'#475467',fontSize:10,fontStyle:'italic'},
historyCard:{padding:'0',overflow:'hidden'},
historyToggle:{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,padding:'15px 16px',border:0,background:'transparent',color:'#101828',cursor:'pointer',fontFamily:'inherit'},
historyToggleTitle:{display:'flex',alignItems:'center',flexWrap:'wrap',gap:8,fontSize:15,fontWeight:700,textAlign:'left'},
historyCount:{display:'inline-flex',alignItems:'center',minHeight:22,padding:'0 8px',borderRadius:999,background:'#f2f4f7',color:'#667085',fontSize:9,fontWeight:800},
historyChevron:{display:'inline-flex',alignItems:'center',justifyContent:'center',width:24,height:24,color:'#2563eb',fontSize:20,fontWeight:800,transition:'transform .18s ease'},
historyBody:{padding:'0 16px 15px'},
coordinationNotice:{display:'grid',gridTemplateColumns:'28px minmax(0,1fr)',gap:12,marginBottom:10,padding:'14px 15px',border:'1px solid #bfdbfe',borderRadius:11,background:'#eff6ff'},
coordinationIcon:{display:'grid',placeItems:'center',width:24,height:24,borderRadius:999,background:'#3b82f6',color:'#fff',fontSize:13,fontWeight:900},
coordinationTitle:{margin:'0 0 6px',color:'#1d4ed8',fontSize:13},
coordinationText:{margin:'0 0 6px',color:'#475467',fontSize:10.5,lineHeight:1.55},
coordinationLink:{display:'inline-block',marginTop:2,color:'#2563eb',fontSize:10,fontWeight:800,textDecoration:'none'},
accountMismatchPage:{display:'grid',placeItems:'center',minHeight:'calc(100vh - 80px)',padding:24},
accountMismatchCard:{width:'min(560px,100%)',boxSizing:'border-box',padding:24,border:'1px solid #bfdbfe',borderRadius:14,background:'#fff',boxShadow:'0 18px 50px rgba(15,23,42,.08)'},
accountMismatchEyebrow:{margin:'0 0 7px',color:'#2563eb',fontSize:10,fontWeight:900,letterSpacing:'.08em'},
accountMismatchTitle:{margin:'0 0 10px',color:'#101828',fontSize:22,lineHeight:1.25},
accountMismatchText:{margin:'0 0 10px',color:'#667085',fontSize:12,lineHeight:1.6},
accountMismatchActions:{display:'flex',flexWrap:'wrap',gap:8,marginTop:18},
accountMismatchPrimary:{minHeight:38,padding:'0 13px',border:'1px solid #2563eb',borderRadius:7,background:'#2563eb',color:'#fff',fontWeight:800,cursor:'pointer'},
accountMismatchSecondary:{display:'inline-flex',alignItems:'center',minHeight:36,padding:'0 13px',border:'1px solid #d0d5dd',borderRadius:7,background:'#fff',color:'#344054',fontWeight:750,textDecoration:'none'},
muted:{margin:0,color:'#667085',fontSize:11},state:{display:'grid',gap:8,padding:24,color:'#667085'} };
