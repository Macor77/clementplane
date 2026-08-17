import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  getMyMissionProposals,
  respondToMyMissionProposal,
} from '../../services/trainerProposalService';

const FILTERS = [
  {
    id: 'pending',
    label: 'À répondre',
  },
  {
    id: 'refused',
    label: 'Refusées',
  },
  {
    id: 'history',
    label: 'Historique',
  },
];

function isExpired(proposal) {
  if (!proposal?.expires_at) {
    return false;
  }

  return (
    new Date(
      proposal.expires_at,
    ).getTime() <
    Date.now()
  );
}

function getProposalCategory(proposal) {
  if (
    proposal.status ===
      'proposition_envoyee' &&
    !isExpired(proposal)
  ) {
    return 'pending';
  }

  if (
    proposal.status ===
    'refuse'
  ) {
    return 'refused';
  }

  /*
   * Les propositions acceptées et les missions
   * affectées appartiennent désormais à
   * "Mes missions" et ne sont plus affichées ici.
   */
  if (
    proposal.status === 'accepte' ||
    proposal.status === 'affecte'
  ) {
    return 'missions';
  }

  return 'history';
}

function getStatusLabel(proposal) {
  if (
    proposal.status ===
      'proposition_envoyee' &&
    isExpired(proposal)
  ) {
    return 'Expirée';
  }

  const labels = {
    proposition_envoyee:
      'À répondre',
    refuse:
      'Refusée',
    indisponible_affecte_ailleurs:
      'Indisponible',
    annule:
      'Annulée',
    mission_pourvue:
      'Mission pourvue',
    desiste:
      'Désistement',
  };

  return (
    labels[proposal.status] ||
    proposal.status
  );
}

function getStatusClass(proposal) {
  if (
    proposal.status ===
      'proposition_envoyee' &&
    isExpired(proposal)
  ) {
    return 'expired';
  }

  const classes = {
    proposition_envoyee:
      'pending',
    refuse:
      'refused',
    indisponible_affecte_ailleurs:
      'unavailable',
    annule:
      'cancelled',
    mission_pourvue:
      'cancelled',
    desiste:
      'cancelled',
  };

  return (
    classes[proposal.status] ||
    'cancelled'
  );
}

function formatDate(dateValue) {
  if (!dateValue) {
    return '';
  }

  return new Intl.DateTimeFormat(
    'fr-FR',
    {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    },
  ).format(
    new Date(
      `${dateValue}T12:00:00`,
    ),
  );
}

function formatDates(dates) {
  if (
    !Array.isArray(dates) ||
    dates.length === 0
  ) {
    return 'Dates à confirmer';
  }

  return dates
    .map((item) => {
      const date =
        formatDate(
          item.date,
        );

      const hours = [
        item.heure_debut,
        item.heure_fin,
      ]
        .filter(Boolean)
        .join(' – ');

      return hours
        ? `${date} · ${hours}`
        : date;
    })
    .join('\n');
}

export default function TrainerProposals() {
  const [
    proposals,
    setProposals,
  ] = useState([]);

  const [
    activeFilter,
    setActiveFilter,
  ] = useState('pending');

  const [
    expandedId,
    setExpandedId,
  ] = useState(null);

  const [
    comments,
    setComments,
  ] = useState({});

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    submittingId,
    setSubmittingId,
  ] = useState(null);

  const [
    error,
    setError,
  ] = useState('');

  const loadProposals =
    async () => {
      setLoading(true);
      setError('');

      try {
        const rows =
          await getMyMissionProposals();

        setProposals(rows);

        setComments(
          Object.fromEntries(
            rows.map(
              (proposal) => [
                proposal
                  .mission_formateur_id,
                proposal
                  .response_comment ||
                  '',
              ],
            ),
          ),
        );
      } catch (loadError) {
        console.error(loadError);

        setError(
          'Impossible de charger vos propositions.',
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadProposals();
  }, []);

  const counts =
    useMemo(() => {
      const result = {
        pending: 0,
        refused: 0,
        history: 0,
      };

      for (
        const proposal of proposals
      ) {
        const category =
          getProposalCategory(
            proposal,
          );

        if (
          Object.prototype.hasOwnProperty.call(
            result,
            category,
          )
        ) {
          result[category] += 1;
        }
      }

      return result;
    }, [proposals]);

  const filteredProposals =
    useMemo(
      () =>
        proposals.filter(
          (proposal) =>
            getProposalCategory(
              proposal,
            ) === activeFilter,
        ),
      [
        proposals,
        activeFilter,
      ],
    );

  const submitResponse =
    async (
      proposal,
      response,
    ) => {
      const id =
        proposal
          .mission_formateur_id;

      setSubmittingId(id);
      setError('');

      try {
        await respondToMyMissionProposal({
          missionFormateurId:
            id,
          response,
          comment:
            comments[id] ||
            '',
        });

        await loadProposals();

        setExpandedId(null);
      } catch (submitError) {
        console.error(
          submitError,
        );

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
          <p className="page-eyebrow">
            MISSIONS
          </p>

          <h1>
            Mes propositions
          </h1>

          <p>
            Retrouvez ici uniquement les
            propositions auxquelles vous
            devez répondre et l’historique
            de vos refus ou propositions
            terminées. Une proposition
            acceptée rejoint automatiquement
            « Mes missions ».
          </p>
        </div>
      </div>

      {error ? (
        <div className="alert alert--error">
          {error}
        </div>
      ) : null}

      <div className="trainer-proposal-tabs">
        {FILTERS.map(
          (filter) => (
            <button
              key={filter.id}
              type="button"
              className={
                activeFilter ===
                filter.id
                  ? 'trainer-proposal-tab trainer-proposal-tab--active'
                  : 'trainer-proposal-tab'
              }
              onClick={() =>
                setActiveFilter(
                  filter.id,
                )
              }
            >
              {filter.label}

              <span>
                {counts[
                  filter.id
                ]}
              </span>
            </button>
          ),
        )}
      </div>

      {loading ? (
        <div className="trainer-proposals-loading">
          Chargement de vos propositions…
        </div>
      ) : filteredProposals.length ===
        0 ? (
        <div className="trainer-proposals-empty">
          <strong>
            Aucune proposition
          </strong>

          <span>
            Rien à afficher dans cette
            catégorie pour le moment.
          </span>
        </div>
      ) : (
        <div className="trainer-proposal-list">
          {filteredProposals.map(
            (proposal) => {
              const id =
                proposal
                  .mission_formateur_id;

              const expanded =
                expandedId === id;

              const canRespond =
                proposal.status ===
                  'proposition_envoyee' &&
                !isExpired(
                  proposal,
                );

              const place = [
                proposal.location,
                proposal.postal_code,
                proposal.city,
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <article
                  className="trainer-proposal-card"
                  key={id}
                >
                  <div className="trainer-proposal-card__summary">
                    <div className="trainer-proposal-card__main">
                      <div className="trainer-proposal-card__topline">
                        <span
                          className={`trainer-proposal-status trainer-proposal-status--${getStatusClass(
                            proposal,
                          )}`}
                        >
                          {getStatusLabel(
                            proposal,
                          )}
                        </span>

                        {proposal
                          .proposed_at ? (
                          <span className="trainer-proposal-card__sent">
                            Reçue le{' '}
                            {new Date(
                              proposal
                                .proposed_at,
                            ).toLocaleDateString(
                              'fr-FR',
                            )}
                          </span>
                        ) : null}
                      </div>

                      <h2>
                        {
                          proposal
                            .mission_title
                        }
                      </h2>

                      <div className="trainer-proposal-card__meta">
                        {proposal
                          .formation ? (
                          <span>
                            {
                              proposal
                                .formation
                            }
                          </span>
                        ) : null}

                        {place ? (
                          <span>
                            📍 {place}
                          </span>
                        ) : null}

                        <span className="trainer-proposal-card__dates">
                          {formatDates(
                            proposal
                              .dates,
                          )}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="button button--soft"
                      onClick={() =>
                        setExpandedId(
                          expanded
                            ? null
                            : id,
                        )
                      }
                    >
                      {expanded
                        ? 'Fermer'
                        : 'Voir la proposition'}
                    </button>
                  </div>

                  {expanded ? (
                    <div className="trainer-proposal-detail">
                      <div className="trainer-proposal-detail__grid">
                        {proposal
                          .client ? (
                          <Detail
                            label="Client"
                            value={
                              proposal
                                .client
                            }
                          />
                        ) : null}

                        {place ? (
                          <Detail
                            label="Lieu"
                            value={place}
                          />
                        ) : null}

                        <Detail
                          label="Dates et horaires"
                          value={formatDates(
                            proposal
                              .dates,
                          )}
                          multiline
                        />

                        {proposal
                          .offered_fee !=
                        null ? (
                          <Detail
                            label="Rémunération proposée"
                            value={`${proposal.offered_fee} €`}
                          />
                        ) : null}


                        {proposal
                          .mission_notes ? (
                          <Detail
                            label="Informations complémentaires"
                            value={
                              proposal
                                .mission_notes
                            }
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
                              value={
                                comments[
                                  id
                                ] || ''
                              }
                              onChange={(
                                event,
                              ) =>
                                setComments(
                                  (
                                    current,
                                  ) => ({
                                    ...current,
                                    [id]:
                                      event
                                        .target
                                        .value,
                                  }),
                                )
                              }
                              placeholder="Une précision à transmettre à l’organisme…"
                            />
                          </label>

                          <div className="trainer-proposal-response__actions">
                            <button
                              type="button"
                              className="trainer-proposal-refuse"
                              disabled={
                                submittingId ===
                                id
                              }
                              onClick={() =>
                                submitResponse(
                                  proposal,
                                  'refuse',
                                )
                              }
                            >
                              Refuser
                            </button>

                            <button
                              type="button"
                              className="button button--primary"
                              disabled={
                                submittingId ===
                                id
                              }
                              onClick={() =>
                                submitResponse(
                                  proposal,
                                  'accepte',
                                )
                              }
                            >
                              {submittingId ===
                              id
                                ? 'Enregistrement…'
                                : 'Accepter la mission'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`trainer-proposal-result trainer-proposal-result--${getStatusClass(
                            proposal,
                          )}`}
                        >
                          {getStatusLabel(
                            proposal,
                          )}
                        </div>
                      )}
                    </div>
                  ) : null}
                </article>
              );
            },
          )}
        </div>
      )}
    </div>
  );
}

function Detail({
  label,
  value,
  multiline = false,
}) {
  if (!value) {
    return null;
  }

  return (
    <div className="trainer-proposal-detail__row">
      <span>
        {label}
      </span>

      <strong
        style={{
          whiteSpace:
            multiline
              ? 'pre-line'
              : 'normal',
        }}
      >
        {value}
      </strong>
    </div>
  );
}
