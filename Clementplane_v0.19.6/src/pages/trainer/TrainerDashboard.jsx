import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import { Link } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';

import {
  getMyMissionProposals,
} from '../../services/trainerProposalService';

import {
  getMyTrainerAvailability,
} from '../../services/trainerAvailabilityService';


function pad(value) {
  return String(value).padStart(2, '0');
}


function toISODate(date) {
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join('-');
}


function addDays(date, count) {
  const next = new Date(date);

  next.setDate(
    next.getDate() + count,
  );

  return next;
}


function formatLongDate(dateValue) {
  if (!dateValue) {
    return '';
  }

  return new Intl.DateTimeFormat(
    'fr-FR',
    {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    },
  ).format(
    new Date(
      `${dateValue}T12:00:00`,
    ),
  );
}


function formatTime(value) {
  if (!value) {
    return '';
  }

  return value.slice(0, 5);
}


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


function hasCurrentOrFutureDate(proposal) {
  const today = new Date();
  const todayKey = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');

  const dates = Array.isArray(proposal?.dates)
    ? proposal.dates
    : [];

  if (dates.length === 0) {
    return true;
  }

  return dates.some(
    (item) =>
      item?.date &&
      item.date >= todayKey,
  );
}


function _isPastMission(proposal) {
  return !hasCurrentOrFutureDate(proposal);
}


function getNextConfirmedMission(
  proposals,
) {
  const today =
    toISODate(
      new Date(),
    );

  const candidates = [];

  for (
    const proposal of proposals
  ) {
    if (
      proposal.status !==
      'affecte'
    ) {
      continue;
    }

    const dates =
      Array.isArray(
        proposal.dates,
      )
        ? proposal.dates
        : [];

    for (
      const missionDate of dates
    ) {
      if (
        !missionDate?.date ||
        missionDate.date < today
      ) {
        continue;
      }

      candidates.push({
        ...proposal,
        missionDate,
      });
    }
  }

  candidates.sort(
    (first, second) => {
      const firstKey =
        `${first.missionDate.date} ${
          first.missionDate.heure_debut ||
          ''
        }`;

      const secondKey =
        `${second.missionDate.date} ${
          second.missionDate.heure_debut ||
          ''
        }`;

      return firstKey.localeCompare(
        secondKey,
      );
    },
  );

  return candidates[0] || null;
}


export default function TrainerDashboard() {
  const {
    profile,
    trainerProfile,
  } = useAuth();

  const firstName =
    profile?.first_name ||
    trainerProfile?.prenom ||
    'Formateur';

  const [
    proposals,
    setProposals,
  ] = useState([]);

  const [
    availability,
    setAvailability,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState('');


  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setError('');

      try {
        const today =
          new Date();

        const availabilityEnd =
          addDays(
            today,
            30,
          );

        const [
          proposalRows,
          availabilityRows,
        ] =
          await Promise.all([
            getMyMissionProposals(),

            getMyTrainerAvailability({
              startDay:
                toISODate(
                  today,
                ),

              endDay:
                toISODate(
                  availabilityEnd,
                ),
            }),
          ]);

        if (!active) {
          return;
        }

        setProposals(
          proposalRows,
        );

        setAvailability(
          availabilityRows,
        );
      } catch (loadError) {
        console.error(
          loadError,
        );

        if (active) {
          setError(
            'Impossible de charger votre tableau de bord.',
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);


  const pendingProposals =
    useMemo(
      () =>
        proposals.filter(
          (proposal) =>
            proposal.status ===
              'proposition_envoyee' &&
            !isExpired(
              proposal,
            ) &&
            hasCurrentOrFutureDate(
              proposal,
            ),
        ),
      [proposals],
    );


  const acceptedOptions =
    useMemo(
      () =>
        proposals.filter(
          (proposal) =>
            proposal.status ===
              'accepte' &&
            hasCurrentOrFutureDate(
              proposal,
            ),
        ),
      [proposals],
    );


  const confirmedMissions =
    useMemo(
      () =>
        proposals.filter(
          (proposal) =>
            proposal.status ===
              'affecte' &&
            hasCurrentOrFutureDate(
              proposal,
            ),
        ),
      [proposals],
    );


  const nextMission =
    useMemo(
      () =>
        getNextConfirmedMission(
          proposals,
        ),
      [proposals],
    );


  const upcomingAvailability =
    useMemo(
      () =>
        availability
          .filter(
            (row) =>
              row.status === 'dispo' ||
              row.status === 'indispo',
          )
          .sort(
            (first, second) =>
              first.day.localeCompare(
                second.day,
              ),
          )
          .slice(0, 5),
      [availability],
    );


  if (loading) {
    return (
      <div className="page-container trainer-dashboard">
        <div className="trainer-dashboard-loading">
          Chargement de votre espace…
        </div>
      </div>
    );
  }


  return (
    <div className="page-container trainer-dashboard">

      <div className="page-heading">
        <div>
          <p className="page-eyebrow">
            ESPACE FORMATEUR
          </p>

          <h1>
            Bonjour {firstName}
          </h1>

          <p>
            Retrouvez vos propositions,
            disponibilités et prochaines
            missions.
          </p>
        </div>
      </div>


      {error ? (
        <div className="alert alert--error">
          {error}
        </div>
      ) : null}


      <div className="trainer-dashboard-stats">

        <Link
          to="/formateur/propositions"
          className="trainer-dashboard-stat trainer-dashboard-stat--primary"
        >
          <span>
            À répondre
          </span>

          <strong>
            {
              pendingProposals.length
            }
          </strong>

          <small>
            proposition
            {pendingProposals.length >
            1
              ? 's'
              : ''}
          </small>
        </Link>


        <Link
          to="/formateur/propositions"
          className="trainer-dashboard-stat"
        >
          <span>
            Options
          </span>

          <strong>
            {
              acceptedOptions.length
            }
          </strong>

          <small>
            en attente de
            confirmation
          </small>
        </Link>


        <Link
          to="/formateur/planning"
          className="trainer-dashboard-stat"
        >
          <span>
            Missions
          </span>

          <strong>
            {
              confirmedMissions.length
            }
          </strong>

          <small>
            confirmée
            {confirmedMissions.length >
            1
              ? 's'
              : ''}
          </small>
        </Link>

      </div>


      <div className="trainer-dashboard-main-grid">

        <section className="trainer-dashboard-next">

          <div className="trainer-dashboard-section-heading">

            <div>
              <p className="page-eyebrow">
                PROCHAINE MISSION
              </p>

              <h2>
                {nextMission
                  ? (
                      nextMission
                        .formation ||
                      nextMission
                        .mission_title
                    )
                  : 'Aucune mission confirmée'}
              </h2>
            </div>

            <Link
              className="button button--soft"
              to="/formateur/planning"
            >
              Mon planning
            </Link>

          </div>


          {nextMission ? (
            <div className="trainer-dashboard-next__content">

              <div className="trainer-dashboard-next__date">

                <span>
                  {formatLongDate(
                    nextMission
                      .missionDate
                      .date,
                  )}
                </span>

                <strong>
                  {[
                    formatTime(
                      nextMission
                        .missionDate
                        .heure_debut,
                    ),

                    formatTime(
                      nextMission
                        .missionDate
                        .heure_fin,
                    ),
                  ]
                    .filter(Boolean)
                    .join(' – ')}
                </strong>

              </div>


              <div className="trainer-dashboard-next__details">

                {nextMission.client ? (
                  <div>
                    <span>
                      Client
                    </span>

                    <strong>
                      {
                        nextMission.client
                      }
                    </strong>
                  </div>
                ) : null}


                {[
                  nextMission.location,
                  nextMission.postal_code,
                  nextMission.city,
                ]
                  .filter(Boolean)
                  .length > 0 ? (
                  <div>
                    <span>
                      Lieu
                    </span>

                    <strong>
                      {[
                        nextMission.location,
                        nextMission.postal_code,
                        nextMission.city,
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    </strong>
                  </div>
                ) : null}


                {nextMission.offered_fee !=
                null ? (
                  <div>
                    <span>
                      Rémunération
                    </span>

                    <strong>
                      {
                        nextMission
                          .offered_fee
                      }{' '}
                      €
                    </strong>
                  </div>
                ) : null}

              </div>

            </div>
          ) : (
            <div className="trainer-dashboard-empty-state">

              <strong>
                Votre prochaine mission
                apparaîtra ici.
              </strong>

              <span>
                Une mission devient
                confirmée lorsque
                l’organisme de formation
                vous affecte
                définitivement.
              </span>

            </div>
          )}

        </section>


        <section className="trainer-dashboard-availability">

          <div className="trainer-dashboard-section-heading">

            <div>
              <p className="page-eyebrow">
                DISPONIBILITÉS
              </p>

              <h2>
                Mes prochaines dates
              </h2>
            </div>

            <Link
              className="button button--soft"
              to="/formateur/disponibilites"
            >
              Modifier
            </Link>

          </div>


          {upcomingAvailability.length ===
          0 ? (
            <div className="trainer-dashboard-empty-state">

              <strong>
                Aucune disponibilité
                renseignée.
              </strong>

              <span>
                Indiquez vos prochaines
                disponibilités pour faciliter
                les propositions de mission.
              </span>

            </div>
          ) : (
            <div className="trainer-dashboard-availability-list">

              {upcomingAvailability.map(
                (item) => (
                  <div
                    className="trainer-dashboard-availability-row"
                    key={item.day}
                  >

                    <div>
                      <strong>
                        {formatLongDate(
                          item.day,
                        )}
                      </strong>
                    </div>

                    <span
                      className={`trainer-dashboard-availability-status trainer-dashboard-availability-status--${item.status}`}
                    >
                      {item.status ===
                      'dispo'
                        ? 'Disponible'
                        : 'Indisponible'}
                    </span>

                  </div>
                ),
              )}

            </div>
          )}

        </section>

      </div>


      <div className="trainer-dashboard-bottom">

        <article className="trainer-dashboard-panel">

          <div>
            <span className="trainer-dashboard-card__label">
              MON PROFIL
            </span>

            <h2>
              {
                trainerProfile?.prenom
              }{' '}
              {
                trainerProfile?.nom
              }
            </h2>

            <p>
              Vérifiez vos informations
              professionnelles, vos
              compétences et votre matériel.
            </p>
          </div>

          <Link
            className="button button--soft"
            to="/formateur/profil"
          >
            Voir mon profil
          </Link>

        </article>

      </div>

    </div>
  );
}