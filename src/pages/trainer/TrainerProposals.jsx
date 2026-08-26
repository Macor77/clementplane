import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import { Link } from 'react-router-dom';

import {
  getMyMissionProposalHistory,
  getMyMissionProposals,
  getMyTrainerHistory,
  respondToMyMissionProposal,
} from '../../services/trainerProposalService';

const FILTERS = [
  { id: 'pending', label: 'À répondre' },
  { id: 'history', label: 'Historique' },
];

const HISTORY_STATUSES = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'refuse', label: 'Refusées' },
  { value: 'desiste', label: 'Désistements' },
  { value: 'mission_pourvue', label: 'Mission pourvue ailleurs' },
  { value: 'indisponible_affecte_ailleurs', label: 'Plus disponible' },
  { value: 'annule', label: 'Annulées' },
  { value: 'retire_par_of', label: 'Retirées par l’OF' },
];

function hasPendingRevalidation(proposal) {
  return proposal.pending_change?.response_status === 'pending';
}

function getProposalCategory(proposal) {
  if (
    proposal.status === 'proposition_envoyee' ||
    hasPendingRevalidation(proposal)
  ) {
    return 'pending';
  }

  if (
    proposal.status === 'accepte' ||
    proposal.status === 'affecte'
  ) {
    return 'missions';
  }

  return 'history';
}

function getStatusLabel(proposal) {
  if (hasPendingRevalidation(proposal)) {
    return 'Nouvelles conditions à valider';
  }

  const labels = {
    proposition_envoyee: 'À répondre',
    refuse: 'Refusée',
    indisponible_affecte_ailleurs:
      'Clôturée · mission confirmée ailleurs',
    annule: 'Annulée',
    mission_pourvue: 'Mission pourvue',
    desiste: 'Désistement',
    retire_par_of: 'Retirée par l’OF',
  };

  return labels[proposal.status] || proposal.status;
}

function getStatusClass(proposal) {
  if (hasPendingRevalidation(proposal)) {
    return 'pending';
  }

  const classes = {
    proposition_envoyee: 'pending',
    refuse: 'refused',
    indisponible_affecte_ailleurs: 'unavailable',
    annule: 'cancelled',
    mission_pourvue: 'cancelled',
    desiste: 'cancelled',
    retire_par_of: 'cancelled',
  };

  return classes[proposal.status] || 'cancelled';
}

function formatDate(dateValue) {
  if (!dateValue) return '';

  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${dateValue}T12:00:00`));
}

function formatDateTime(value) {
  if (!value) return '';

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatDates(dates) {
  if (!Array.isArray(dates) || dates.length === 0) {
    return 'Dates à confirmer';
  }

  return [...dates]
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .map((item) => {
      const date = formatDate(item.date);
      const hours = [item.heure_debut, item.heure_fin]
        .filter(Boolean)
        .join(' – ');

      return hours ? `${date} · ${hours}` : date;
    })
    .join('\n');
}

function missionDateSet(proposal) {
  return new Set(
    (proposal.dates || [])
      .map((item) => item?.date)
      .filter(Boolean),
  );
}

function findOverlappingOptions(proposal, allProposals) {
  const proposalDates = missionDateSet(proposal);

  if (proposalDates.size === 0) return [];

  return allProposals
    .filter(
      (other) =>
        other.mission_formateur_id !== proposal.mission_formateur_id &&
        other.status === 'accepte',
    )
    .map((other) => {
      const overlappingDates = (other.dates || [])
        .map((item) => item?.date)
        .filter((day) => day && proposalDates.has(day));

      return { ...other, overlappingDates };
    })
    .filter((other) => other.overlappingDates.length > 0);
}

function historyActionLabel(item) {
  const labels = {
    selected: 'Formateur sélectionné',
    proposal_sent: 'Proposition envoyée',
    accepted:
      item.actor_type === 'organization'
        ? 'Acceptation enregistrée par l’OF'
        : 'Proposition acceptée',
    refused:
      item.actor_type === 'organization'
        ? 'Refus enregistré par l’OF'
        : 'Proposition refusée',
    assigned: 'Affectation confirmée',
    unassigned: 'Affectation retirée',
    reset: 'Suivi réinitialisé',
    unavailable_elsewhere:
      'Clôture automatique · mission confirmée ailleurs',
    mission_filled: 'Mission pourvue par un autre formateur',
    withdrawn: 'Désistement du formateur',
    cancelled: 'Suivi annulé',
    removed: 'Formateur retiré',
    status_changed: 'Statut modifié',
    change_requested: 'Nouvelles conditions proposées par l’OF',
    change_accepted: 'Nouvelles conditions acceptées',
    change_refused: 'Nouvelles conditions refusées',
    change_applied: 'Nouvelles conditions appliquées',
  };

  return labels[item.action] || 'Action enregistrée';
}

function historyActor(item) {
  const name =
    item.actor_display_name ||
    (item.actor_type === 'system' ? 'Clementplane' : 'Utilisateur');

  if (item.actor_type === 'trainer') {
    return `${name} · Formateur`;
  }

  if (item.actor_type === 'organization') {
    return [name, item.actor_organization_name]
      .filter(Boolean)
      .join(' · ');
  }

  return `${name} · Système`;
}

export default function TrainerProposals() {
  const [proposals, setProposals] = useState([]);
  const [history, setHistory] = useState([]);
  const [proposalHistory, setProposalHistory] = useState([]);
  const [activeFilter, setActiveFilter] = useState('pending');
  const [historyStatus, setHistoryStatus] = useState('all');
  const [historyFrom, setHistoryFrom] = useState('');
  const [historyTo, setHistoryTo] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [comments, setComments] = useState({});
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);
  const [error, setError] = useState('');

  const loadProposals = async () => {
    setLoading(true);
    setError('');

    try {
      const [
        rows,
        historyRows,
        archivedProposals,
      ] = await Promise.all([
        getMyMissionProposals(),
        getMyTrainerHistory(),
        getMyMissionProposalHistory(),
      ]);

      setProposals(rows);
      setHistory(historyRows);
      setProposalHistory(archivedProposals);
      setComments(
        Object.fromEntries(
          rows.map((proposal) => [
            proposal.mission_formateur_id,
            proposal.response_comment || '',
          ]),
        ),
      );
    } catch (loadError) {
      console.error(loadError);
      setError('Impossible de charger vos propositions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProposals();
  }, []);

  const historyByRelation = useMemo(() => {
    const map = new Map();

    for (const item of history) {
      if (!map.has(item.mission_formateur_id)) {
        map.set(item.mission_formateur_id, []);
      }

      map.get(item.mission_formateur_id).push(item);
    }

    return map;
  }, [history]);

  const counts = useMemo(
    () => ({
      pending: proposals.filter(
        (proposal) =>
          getProposalCategory(proposal) === 'pending',
      ).length,
      history: proposalHistory.length,
    }),
    [proposals, proposalHistory],
  );

  const filteredProposals = useMemo(() => {
    const source =
      activeFilter === 'history'
        ? proposalHistory
        : proposals.filter(
            (proposal) =>
              getProposalCategory(proposal) === 'pending',
          );

    return source.filter((proposal) => {
      if (activeFilter !== 'history') {
        return true;
      }

      if (
        historyStatus !== 'all' &&
        proposal.status !== historyStatus
      ) {
        return false;
      }

      const referenceDate =
        proposal.responded_at ||
        proposal.proposed_at;

      if (!referenceDate) {
        return true;
      }

      const day =
        String(referenceDate).slice(0, 10);

      if (historyFrom && day < historyFrom) {
        return false;
      }

      if (historyTo && day > historyTo) {
        return false;
      }

      return true;
    });
  }, [
    proposals,
    proposalHistory,
    activeFilter,
    historyStatus,
    historyFrom,
    historyTo,
  ]);

  const submitResponse = async (proposal, response) => {
    const id = proposal.mission_formateur_id;
    setSubmittingId(id);
    setError('');

    try {
      await respondToMyMissionProposal({
        missionFormateurId: id,
        response,
        comment: comments[id] || '',
      });

      await loadProposals();
      setExpandedId(null);
    } catch (submitError) {
      console.error(submitError);
      setError(
        submitError?.message ||
          'Impossible d’enregistrer votre réponse.',
      );
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="page-container trainer-proposals-page">
      <div className="page-heading">
        <div>
          <p className="page-eyebrow">MISSIONS</p>
          <h1>Mes propositions</h1>
          <p>
            Répondez aux nouvelles propositions et retrouvez ensuite une
            chronologie claire de ce qui s’est passé sur chaque proposition.
            Une proposition acceptée rejoint « Mes missions » comme option.
          </p>
        </div>
      </div>

      {error ? <div className="alert alert--error">{error}</div> : null}

      <div className="trainer-proposal-tabs">
        {FILTERS.map((filter) => (
          <button
            key={filter.id}
            type="button"
            className={
              activeFilter === filter.id
                ? 'trainer-proposal-tab trainer-proposal-tab--active'
                : 'trainer-proposal-tab'
            }
            onClick={() => setActiveFilter(filter.id)}
          >
            {filter.label}
            <span>{counts[filter.id]}</span>
          </button>
        ))}
      </div>

      {activeFilter === 'history' ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'end', marginBottom: 12, padding: 12, border: '1px solid #e4e7ec', borderRadius: 10, background: '#fff' }}>
          <label style={{ display: 'grid', gap: 4, color: '#475467', fontSize: 10 }}>Statut
            <select value={historyStatus} onChange={(event) => setHistoryStatus(event.target.value)} style={{ minHeight: 34, border: '1px solid #d0d5dd', borderRadius: 7, padding: '0 8px', background: '#fff' }}>
              {HISTORY_STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <label style={{ display: 'grid', gap: 4, color: '#475467', fontSize: 10 }}>Du
            <input type="date" value={historyFrom} onChange={(event) => setHistoryFrom(event.target.value)} style={{ minHeight: 32, border: '1px solid #d0d5dd', borderRadius: 7, padding: '0 8px' }} />
          </label>
          <label style={{ display: 'grid', gap: 4, color: '#475467', fontSize: 10 }}>Au
            <input type="date" value={historyTo} onChange={(event) => setHistoryTo(event.target.value)} style={{ minHeight: 32, border: '1px solid #d0d5dd', borderRadius: 7, padding: '0 8px' }} />
          </label>
          <div style={{ marginLeft: 'auto', color: '#667085', fontSize: 10 }}>Vous cherchez une proposition acceptée ? <Link to="/formateur/missions" style={{ color: '#2563eb', fontWeight: 750 }}>Voir Mes missions</Link></div>
        </div>
      ) : null}

      {loading ? (
        <div className="trainer-proposals-loading">
          Chargement de vos propositions…
        </div>
      ) : filteredProposals.length === 0 ? (
        <div className="trainer-proposals-empty">
          <strong>Aucune proposition</strong>
          <span>Rien à afficher dans cette catégorie pour le moment.</span>
        </div>
      ) : (
        <div className="trainer-proposal-list">
          {filteredProposals.map((proposal) => {
            const id = proposal.mission_formateur_id;
            const expanded = expandedId === id;
            const needsRevalidation = hasPendingRevalidation(proposal);
            const canRespond = proposal.status === 'proposition_envoyee';
            const place = [
              proposal.location,
              proposal.postal_code,
              proposal.city,
            ]
              .filter(Boolean)
              .join(' ');
            const overlapOptions = canRespond
              ? findOverlappingOptions(proposal, proposals)
              : [];
            const relationHistory = historyByRelation.get(id) || [];

            return (
              <article className="trainer-proposal-card" key={id}>
                <div className="trainer-proposal-card__summary">
                  <div className="trainer-proposal-card__main">
                    <div className="trainer-proposal-card__topline">
                      <span
                        className={`trainer-proposal-status trainer-proposal-status--${getStatusClass(
                          proposal,
                        )}`}
                      >
                        {getStatusLabel(proposal)}
                      </span>

                      {proposal.organization_name ? (
                        <strong style={{ color: '#344054', fontSize: 11 }}>
                          OF : {proposal.organization_name}
                        </strong>
                      ) : null}
                    </div>

                    <h2>{proposal.mission_title}</h2>

                    <div className="trainer-proposal-card__meta">
                      {proposal.organization_name ? (
                        <Link
                          to={`/formateur/missions/${proposal.mission_id}/organisme`}
                          style={{
                            color: '#2563eb',
                            fontWeight: 750,
                            textDecoration: 'none',
                          }}
                        >
                          Voir le contact de l’OF
                        </Link>
                      ) : null}
                      {proposal.formation ? <span>{proposal.formation}</span> : null}
                      {place ? <span>📍 {place}</span> : null}
                      <span className="trainer-proposal-card__dates">
                        {formatDates(proposal.dates)}
                      </span>
                    </div>
                  </div>

                  {needsRevalidation ? (
                    <Link
                      className="button button--primary"
                      to={`/formateur/missions/${proposal.mission_id}`}
                    >
                      Consulter la mission
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className="button button--soft"
                      onClick={() => setExpandedId(expanded ? null : id)}
                    >
                      {expanded ? 'Fermer' : 'Voir la proposition'}
                    </button>
                  )}
                </div>

                {needsRevalidation ? (
                  <div
                    style={{
                      margin: '0 20px 16px',
                      padding: '10px 12px',
                      border: '1px solid #fdba74',
                      borderRadius: 9,
                      background: '#fff7ed',
                      color: '#9a3412',
                      fontSize: 11,
                      lineHeight: 1.45,
                    }}
                  >
                    <strong>Votre réponse est attendue.</strong>{' '}
                    L’organisme a modifié les conditions de cette mission. Ouvrez la fiche pour comparer les changements avant d’accepter ou de refuser.
                  </div>
                ) : null}

                {expanded && !needsRevalidation ? (
                  <div className="trainer-proposal-detail">
                    {overlapOptions.length > 0 ? (
                      <div
                        style={{
                          marginBottom: 14,
                          padding: '11px 12px',
                          border: '1px solid #fcd34d',
                          borderRadius: 9,
                          background: '#fffbeb',
                          color: '#92400e',
                          fontSize: 11,
                          lineHeight: 1.45,
                        }}
                      >
                        <strong>
                          Vous avez déjà {overlapOptions.length} option
                          {overlapOptions.length > 1 ? 's' : ''} sur cette période.
                        </strong>
                        <div style={{ display: 'grid', gap: 5, marginTop: 7 }}>
                          {overlapOptions.map((option) => (
                            <div key={option.mission_formateur_id}>
                              {option.overlappingDates.map(formatDate).join(', ')} ·{' '}
                              {option.mission_title} ·{' '}
                              {option.organization_name || 'Organisme de formation'}
                            </div>
                          ))}
                        </div>
                        <p style={{ margin: '8px 0 0' }}>
                          Ces options ne sont pas encore des missions confirmées :
                          l’OF ne vous a pas encore affecté définitivement. Vous pouvez
                          accepter plusieurs options sur une même date. Dès qu’un OF
                          confirme une affectation, les options incompatibles sont
                          automatiquement clôturées comme « Plus disponible ».
                        </p>
                      </div>
                    ) : null}

                    <div className="trainer-proposal-detail__grid">
                      {proposal.organization_name ? (
                        <Detail
                          label="Organisme de formation"
                          value={proposal.organization_name}
                        />
                      ) : null}
                      {proposal.client ? (
                        <Detail label="Client" value={proposal.client} />
                      ) : null}
                      {place ? <Detail label="Lieu" value={place} /> : null}
                      <Detail
                        label="Dates et horaires"
                        value={formatDates(proposal.dates)}
                        multiline
                      />
                      {proposal.offered_fee != null ? (
                        <Detail
                          label="Rémunération proposée"
                          value={`${proposal.offered_fee} €`}
                        />
                      ) : null}
                      {proposal.mission_notes ? (
                        <Detail
                          label="Informations complémentaires"
                          value={proposal.mission_notes}
                          multiline
                        />
                      ) : null}
                    </div>

                    {canRespond ? (
                      <div className="trainer-proposal-response">
                        <label>
                          Commentaire facultatif
                          <textarea
                            rows={3}
                            value={comments[id] || ''}
                            onChange={(event) =>
                              setComments((current) => ({
                                ...current,
                                [id]: event.target.value,
                              }))
                            }
                            placeholder="Une précision à transmettre à l’organisme…"
                          />
                        </label>

                        <div className="trainer-proposal-response__actions">
                          <button
                            type="button"
                            className="trainer-proposal-refuse"
                            disabled={submittingId === id}
                            onClick={() => submitResponse(proposal, 'refuse')}
                          >
                            Refuser
                          </button>
                          <button
                            type="button"
                            className="button button--primary"
                            disabled={submittingId === id}
                            onClick={() => submitResponse(proposal, 'accepte')}
                          >
                            {submittingId === id
                              ? 'Enregistrement…'
                              : 'Accepter la mission'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ marginTop: 14 }}>
                        <h3 style={{ margin: '0 0 8px', fontSize: 12 }}>
                          Historique de cette proposition
                        </h3>
                        {relationHistory.length === 0 ? (
                          <div className={`trainer-proposal-result trainer-proposal-result--${getStatusClass(proposal)}`}>
                            {getStatusLabel(proposal)}
                          </div>
                        ) : (
                          <div style={{ display: 'grid', gap: 7 }}>
                            {relationHistory.map((item) => (
                              <div
                                key={item.id}
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns: '8px minmax(0,1fr)',
                                  gap: 8,
                                  paddingBottom: 7,
                                  borderBottom: '1px solid #f2f4f7',
                                }}
                              >
                                <span
                                  style={{
                                    width: 7,
                                    height: 7,
                                    marginTop: 5,
                                    borderRadius: 999,
                                    background: '#3b82f6',
                                  }}
                                />
                                <div style={{ display: 'grid', gap: 2 }}>
                                  <div
                                    style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      gap: 10,
                                      flexWrap: 'wrap',
                                      fontSize: 10,
                                    }}
                                  >
                                    <strong>{historyActionLabel(item)}</strong>
                                    <span style={{ color: '#667085' }}>
                                      {formatDateTime(item.created_at)}
                                    </span>
                                  </div>
                                  <span style={{ color: '#667085', fontSize: 10 }}>
                                    Par {historyActor(item)}
                                  </span>
                                  {item.details?.comment ? (
                                    <span style={{ color: '#475467', fontSize: 10 }}>
                                      Commentaire : {item.details.comment}
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Detail({ label, value, multiline = false }) {
  if (!value) return null;

  return (
    <div className="trainer-proposal-detail__row">
      <span>{label}</span>
      <strong style={{ whiteSpace: multiline ? 'pre-line' : 'normal' }}>
        {value}
      </strong>
    </div>
  );
}
