import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Link,
  useNavigate,
} from 'react-router-dom';

import {
  deleteMission,
  getMissions,
} from '../services/missionsService';

const VIEW_FILTERS = [
  { id: 'upcoming', label: 'À venir' },
  { id: 'past', label: 'Passées' },
  { id: 'all', label: 'Toutes' },
];

const STATUS_FILTERS = [
  { id: 'all', label: 'Tous les statuts' },
  { id: 'to_fill', label: 'À pourvoir' },
  {
    id: 'trainer_available',
    label: 'Formateur disponible',
  },
  { id: 'assigned', label: 'Affectée' },
  { id: 'completed', label: 'Réalisée' },
  { id: 'cancelled', label: 'Annulée' },
  { id: 'archived', label: 'Archivée' },
];

const PERIOD_FILTERS = [
  { id: 'all', label: 'Toutes les dates' },
  { id: 'current_month', label: 'Ce mois-ci' },
  { id: 'next_month', label: 'Mois prochain' },
  {
    id: 'next_3_months',
    label: '3 prochains mois',
  },
  { id: 'current_year', label: 'Cette année' },
  {
    id: 'custom',
    label: 'Période personnalisée',
  },
];

export default function Missions() {
  const navigate = useNavigate();

  const [missions, setMissions] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [search, setSearch] =
    useState('');

  const [status, setStatus] =
    useState('all');

  const [view, setView] =
    useState('upcoming');

  const [period, setPeriod] =
    useState('all');

  const [customStart, setCustomStart] =
    useState('');

  const [customEnd, setCustomEnd] =
    useState('');

  const loadMissions =
    useCallback(async () => {
      setLoading(true);
      setError('');

      try {
        const data =
          await getMissions();

        setMissions(data);
      } catch (loadError) {
        console.error(
          'Erreur chargement missions :',
          loadError,
        );

        setError(
          loadError?.message ||
            'Impossible de charger les missions.',
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    loadMissions();
  }, [loadMissions]);

  const viewCounts = useMemo(() => {
    const result = {
      upcoming: 0,
      past: 0,
      all: missions.length,
    };

    for (const mission of missions) {
      const temporalState =
        getMissionTemporalState(
          mission,
        );

      if (temporalState === 'upcoming') {
        result.upcoming += 1;
      }

      if (temporalState === 'past') {
        result.past += 1;
      }
    }

    return result;
  }, [missions]);

  const filteredMissions = useMemo(
    () => {
      const rows =
        missions.filter(
          (mission) => {
            const searchText =
              normalize(
                [
                  mission.code_interne,
                  mission.intitule,
                  mission.formation,
                  mission.client,
                  mission.lieu,
                  mission.ville,
                  mission.code_postal,
                ].join(' '),
              );

            const matchesSearch =
              normalize(search)
                .split(/\s+/)
                .filter(Boolean)
                .every((term) =>
                  searchText.includes(term),
                );

            const businessState =
              getMissionBusinessState(
                mission,
              );

            const matchesStatus =
              status === 'all' ||
              businessState.id ===
                status;

            const temporalState =
              getMissionTemporalState(
                mission,
              );

            const matchesView =
              view === 'all' ||
              temporalState === view;

            const matchesPeriod =
              missionMatchesPeriod({
                mission,
                period,
                customStart,
                customEnd,
              });

            return (
              matchesSearch &&
              matchesStatus &&
              matchesView &&
              matchesPeriod
            );
          },
        );

      return [...rows].sort(
        (first, second) =>
          compareMissions(
            first,
            second,
            view,
          ),
      );
    },
    [
      missions,
      search,
      status,
      view,
      period,
      customStart,
      customEnd,
    ],
  );

  const groupedMissions =
    useMemo(
      () =>
        groupMissionsByMonth(
          filteredMissions,
          view,
        ),
      [
        filteredMissions,
        view,
      ],
    );

  const handleDelete = async (
    event,
    mission,
  ) => {
    event.stopPropagation();

    const label =
      getMissionReference(mission);

    const confirmed = window.confirm(
      `Supprimer définitivement « ${label} » ?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteMission(
        mission.id,
      );

      await loadMissions();
    } catch (deleteError) {
      setError(
        deleteError?.message ||
          'Impossible de supprimer la mission.',
      );
    }
  };

  return (
    <div className="of-missions-page" style={styles.page}>
      <header className="of-missions-header" style={styles.header}>
        <div>
          <div style={styles.eyebrow}>
            MISSIONS
          </div>

          <h1 style={styles.title}>
            Missions
          </h1>

          <p style={styles.subtitle}>
            Suivez vos missions dans
            l’ordre chronologique et
            identifiez immédiatement les
            actions à réaliser.
          </p>
        </div>

        <Link
          to="/missions/new"
          style={styles.primaryLink}
        >
          + Créer une mission
        </Link>
      </header>

      <div className="of-missions-tabs" style={styles.viewTabs}>
        {VIEW_FILTERS.map(
          (item) => {
            const active =
              view === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  setView(item.id)
                }
                style={{
                  ...styles.viewTab,
                  ...(active
                    ? styles.viewTabActive
                    : {}),
                }}
              >
                <span>{item.label}</span>

                <strong
                  style={{
                    ...styles.viewCount,
                    ...(active
                      ? styles.viewCountActive
                      : {}),
                  }}
                >
                  {viewCounts[item.id]}
                </strong>
              </button>
            );
          },
        )}
      </div>

      <section className="of-missions-toolbar" style={styles.toolbar}>
        <input
          type="search"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder="Rechercher une référence, un client, une formation ou une ville"
          style={styles.searchInput}
        />

        <select
          value={status}
          onChange={(event) =>
            setStatus(event.target.value)
          }
          style={styles.select}
        >
          {STATUS_FILTERS.map(
            (item) => (
              <option
                key={item.id}
                value={item.id}
              >
                {item.label}
              </option>
            ),
          )}
        </select>

        <select
          value={period}
          onChange={(event) =>
            setPeriod(event.target.value)
          }
          style={styles.select}
        >
          {PERIOD_FILTERS.map(
            (item) => (
              <option
                key={item.id}
                value={item.id}
              >
                {item.label}
              </option>
            ),
          )}
        </select>

        <strong style={styles.count}>
          {filteredMissions.length}{' '}
          mission
          {filteredMissions.length > 1
            ? 's'
            : ''}
        </strong>

        {period === 'custom' ? (
          <div
            style={
              styles.customPeriod
            }
          >
            <label
              style={
                styles.dateFilterLabel
              }
            >
              Du
              <input
                type="date"
                value={customStart}
                onChange={(event) =>
                  setCustomStart(
                    event.target.value,
                  )
                }
                style={
                  styles.dateInput
                }
              />
            </label>

            <label
              style={
                styles.dateFilterLabel
              }
            >
              Au
              <input
                type="date"
                value={customEnd}
                onChange={(event) =>
                  setCustomEnd(
                    event.target.value,
                  )
                }
                style={
                  styles.dateInput
                }
              />
            </label>
          </div>
        ) : null}
      </section>

      {error ? (
        <div style={styles.error}>
          {error}
        </div>
      ) : null}

      {loading ? (
        <div style={styles.stateCard}>
          Chargement des missions…
        </div>
      ) : filteredMissions.length ===
        0 ? (
        <div style={styles.stateCard}>
          Aucune mission ne correspond à
          ces critères.
        </div>
      ) : (
        <div
          style={
            styles.timeline
          }
        >
          {groupedMissions.map(
            (group) => (
              <section
                key={group.key}
                style={
                  styles.monthGroup
                }
              >
                <div
                  style={
                    styles.monthHeader
                  }
                >
                  <strong>
                    {group.label}
                  </strong>

                  <span>
                    {group.items.length}{' '}
                    mission
                    {group.items.length >
                    1
                      ? 's'
                      : ''}
                  </span>
                </div>

                <div
                  style={
                    styles.rows
                  }
                >
                  {group.items.map(
                    (mission) => (
                      <MissionRow
                        key={
                          mission.id
                        }
                        mission={
                          mission
                        }
                        onOpen={() =>
                          navigate(
                            `/missions/${mission.id}`,
                          )
                        }
                        onDelete={
                          handleDelete
                        }
                      />
                    ),
                  )}
                </div>
              </section>
            ),
          )}
        </div>
      )}
    </div>
  );
}

function MissionRow({
  mission,
  onOpen,
}) {
  const state =
    getMissionBusinessState(
      mission,
    );

  const action =
    getMissionActionState(
      mission,
      state,
    );

  const affectedTrainer =
    getAffectedTrainer(
      mission.mission_formateurs,
    );

  return (
    <article
      className="of-mission-row"
      onClick={onOpen}
      style={styles.row}
    >
      <div style={styles.dateColumn}>
        <strong>
          {formatMissionDateRange(
            mission.mission_dates,
          )}
        </strong>
      </div>

      <div
        style={
          styles.referenceColumn
        }
      >
        <span
          style={
            styles.fieldLabel
          }
        >
          Référence mission
        </span>

        <strong
          style={
            styles.referenceValue
          }
        >
          {getMissionReference(
            mission,
          )}
        </strong>

        <span
          style={
            styles.formationValue
          }
        >
          {mission.formation ||
            'Formation non renseignée'}
        </span>
      </div>

      <div
        style={
          styles.clientColumn
        }
      >
        <span
          style={
            styles.fieldLabel
          }
        >
          Client
        </span>

        <strong>
          {mission.client ||
            'Non renseigné'}
        </strong>

        <span
          style={
            styles.location
          }
        >
          📍 {formatLocation(mission)}
        </span>
      </div>

      <div
        style={
          styles.statusColumn
        }
      >
        <MissionBusinessBadge
          state={state}
        />

        {affectedTrainer ? (
          <span
            style={
              styles.trainerLine
            }
          >
            {[
              affectedTrainer.prenom,
              affectedTrainer.nom,
            ]
              .filter(Boolean)
              .join(' ')}
          </span>
        ) : null}

        {action ? (
          <div
            style={{
              ...styles.actionMessage,
              ...(action.tone ===
              'warning'
                ? styles.actionWarning
                : action.tone ===
                    'waiting'
                  ? styles.actionWaiting
                  : styles.actionNeutral),
            }}
          >
            {action.label}
          </div>
        ) : null}
      </div>

      <div
        style={
          styles.rowActions
        }
      >
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onOpen();
          }}
          style={styles.openButton}
        >
          Ouvrir
        </button>


      </div>
    </article>
  );
}

function MissionBusinessBadge({
  state,
}) {
  return (
    <span
      style={{
        ...styles.badge,
        background:
          state.background,
        color: state.color,
      }}
    >
      {state.label}
    </span>
  );
}

function getMissionBusinessState(
  mission,
) {
  if (
    mission.statut === 'annulee'
  ) {
    return {
      id: 'cancelled',
      label: 'Annulée',
      background: '#fef3f2',
      color: '#b42318',
    };
  }

  if (
    mission.statut === 'archivee'
  ) {
    return {
      id: 'archived',
      label: 'Archivée',
      background: '#f2f4f7',
      color: '#475467',
    };
  }

  const relations =
    mission.mission_formateurs ||
    [];

  const affectedRelation =
    relations.find(
      (item) =>
        item.statut === 'affecte',
    ) || null;

  const hasAffected = Boolean(affectedRelation);

  const affectedTrainerPendingRevalidation =
    (mission.pending_change?.trainer_responses || []).some(
      (item) =>
        item.response_status === 'pending' &&
        item.previous_status === 'affecte' &&
        (!affectedRelation ||
          item.trainer_id === affectedRelation.formateur_id),
    );

  if (affectedTrainerPendingRevalidation) {
    return {
      id: 'revalidation',
      label: 'Revalidation en attente',
      background: '#fff7ed',
      color: '#c2410c',
    };
  }

  const hasAccepted =
    relations.some(
      (item) =>
        item.statut === 'accepte',
    );


  const isPast =
    getMissionTemporalState(
      mission,
    ) === 'past';

  if (hasAffected && isPast) {
    return {
      id: 'completed',
      label: 'Réalisée',
      background: '#f4f3ff',
      color: '#5925dc',
    };
  }

  if (hasAffected) {
    return {
      id: 'assigned',
      label: 'Affectée',
      background: '#eff8ff',
      color: '#175cd3',
    };
  }

  if (mission.pending_change) {
    return {
      id: 'revalidation',
      label: 'Revalidation en attente',
      background: '#fff7ed',
      color: '#c2410c',
    };
  }

  if (hasAccepted) {
    return {
      id: 'trainer_available',
      label: 'Formateur disponible',
      background: '#fff7ed',
      color: '#c2410c',
    };
  }

  return {
    id: 'to_fill',
    label: 'À pourvoir',
    background: '#fff6ed',
    color: '#c4320a',
  };
}

function getMissionActionState(
  mission,
  state,
) {
  if (state.id === 'revalidation') {
    const pending = (mission.pending_change?.trainer_responses || []).filter(
      (item) => item.response_status === 'pending',
    );
    const names = pending.map((item) => item.trainer_name).filter(Boolean);
    return {
      label: names.length === 1
        ? `${names[0]} doit valider les nouvelles conditions.`
        : `${pending.length} formateurs doivent valider les nouvelles conditions.`,
      tone: 'warning',
    };
  }

  if (
    state.id ===
    'trainer_available'
  ) {
    const accepted =
      (
        mission.mission_formateurs ||
        []
      ).filter(
        (item) =>
          item.statut ===
          'accepte',
      );

    const names =
      accepted
        .map(
          (item) =>
            [
              item.trainer?.prenom,
              item.trainer?.nom,
            ]
              .filter(Boolean)
              .join(' '),
        )
        .filter(Boolean);

    const prefix =
      names.length === 1
        ? `${names[0]} a accepté. `
        : names.length > 1
          ? `${names.length} formateurs ont accepté. `
          : '';

    return {
      label:
        `${prefix}Affectation à confirmer.`,
      tone: 'warning',
    };
  }

  if (
    state.id !== 'to_fill'
  ) {
    return null;
  }

  const relations =
    mission.mission_formateurs ||
    [];

  const pending =
    relations.filter(
      (item) =>
        item.statut ===
        'proposition_envoyee' &&
        !isProposalExpired(
          item,
        ),
    ).length;

  if (pending > 0) {
    return {
      label:
        pending === 1
          ? '1 réponse attendue.'
          : `${pending} réponses attendues.`,
      tone: 'waiting',
    };
  }

  const refused =
    relations.filter(
      (item) =>
        item.statut === 'refuse',
    ).length;

  const hasSentProposal =
    relations.some(
      (item) =>
        [
          'proposition_envoyee',
          'refuse',
          'indisponible_affecte_ailleurs',
        ].includes(
          item.statut,
        ),
    );

  if (
    hasSentProposal &&
    refused > 0
  ) {
    return {
      label:
        'Toutes refusées · À reproposer.',
      tone: 'warning',
    };
  }

  return {
    label: 'À proposer.',
    tone: 'warning',
  };
}

function isProposalExpired(
  relation,
) {
  if (
    !relation?.proposal_expires_at
  ) {
    return false;
  }

  return (
    new Date(
      relation.proposal_expires_at,
    ).getTime() <
    Date.now()
  );
}

function getAffectedTrainer(
  missionFormateurs = [],
) {
  return (
    missionFormateurs.find(
      (item) =>
        item.statut === 'affecte',
    )?.trainer || null
  );
}

function getMissionReference(
  mission,
) {
  return (
    mission.code_interne ||
    mission.intitule ||
    mission.formation ||
    'Mission sans référence'
  );
}

function formatLocation(mission) {
  return [
    mission.lieu,
    [
      mission.code_postal,
      mission.ville,
    ]
      .filter(Boolean)
      .join(' '),
  ]
    .filter(Boolean)
    .join(' — ') ||
    'Lieu non renseigné';
}

function formatMissionDateRange(
  dates = [],
) {
  const sorted =
    [...dates]
      .filter(
        (item) =>
          item?.date,
      )
      .sort(
        (first, second) =>
          first.date.localeCompare(
            second.date,
          ),
      );

  if (sorted.length === 0) {
    return 'Date non renseignée';
  }

  const first =
    formatLongDate(
      sorted[0].date,
    );

  const last =
    formatLongDate(
      sorted[
        sorted.length - 1
      ].date,
    );

  const count =
    sorted.length;

  return `${first} → ${last} · ${count} ${
    count > 1
      ? 'journées'
      : 'journée'
  }`;
}

function formatLongDate(value) {
  return new Intl.DateTimeFormat(
    'fr-FR',
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    },
  ).format(
    new Date(
      `${value}T12:00:00`,
    ),
  );
}

function getMissionTemporalState(
  mission,
) {
  const dates =
    Array.isArray(
      mission?.mission_dates,
    )
      ? mission.mission_dates
      : [];

  if (dates.length === 0) {
    return 'upcoming';
  }

  const today =
    toISODate(
      new Date(),
    );

  return dates.some(
    (item) =>
      item?.date &&
      item.date >= today,
  )
    ? 'upcoming'
    : 'past';
}

function getFirstMissionDate(
  mission,
) {
  const dates =
    [...(
      mission?.mission_dates ||
      []
    )]
      .filter(
        (item) =>
          item?.date,
      )
      .sort(
        (a, b) =>
          a.date.localeCompare(
            b.date,
          ),
      );

  return dates[0]?.date || '';
}

function getLastMissionDate(
  mission,
) {
  const dates =
    [...(
      mission?.mission_dates ||
      []
    )]
      .filter(
        (item) =>
          item?.date,
      )
      .sort(
        (a, b) =>
          a.date.localeCompare(
            b.date,
          ),
      );

  return (
    dates[
      dates.length - 1
    ]?.date || ''
  );
}

function compareMissions(
  first,
  second,
  view,
) {
  if (view === 'past') {
    return getLastMissionDate(
      second,
    ).localeCompare(
      getLastMissionDate(
        first,
      ),
    );
  }

  if (view === 'upcoming') {
    return getFirstMissionDate(
      first,
    ).localeCompare(
      getFirstMissionDate(
        second,
      ),
    );
  }

  const firstState =
    getMissionTemporalState(
      first,
    );

  const secondState =
    getMissionTemporalState(
      second,
    );

  if (
    firstState !== secondState
  ) {
    return firstState ===
      'upcoming'
      ? -1
      : 1;
  }

  return firstState === 'upcoming'
    ? getFirstMissionDate(
        first,
      ).localeCompare(
        getFirstMissionDate(
          second,
        ),
      )
    : getLastMissionDate(
        second,
      ).localeCompare(
        getLastMissionDate(
          first,
        ),
      );
}

function groupMissionsByMonth(
  missions,
  view,
) {
  const groups = new Map();

  for (const mission of missions) {
    const referenceDate =
      view === 'past'
        ? getLastMissionDate(
            mission,
          )
        : getFirstMissionDate(
            mission,
          );

    const key =
      referenceDate
        ? referenceDate.slice(
            0,
            7,
          )
        : 'sans-date';

    if (!groups.has(key)) {
      groups.set(key, []);
    }

    groups.get(key).push(
      mission,
    );
  }

  return [
    ...groups.entries(),
  ].map(([key, items]) => ({
    key,
    items,
    label:
      key === 'sans-date'
        ? 'Sans date'
        : formatMonthLabel(
            key,
          ),
  }));
}

function formatMonthLabel(
  monthKey,
) {
  const [year, month] =
    monthKey
      .split('-')
      .map(Number);

  return new Intl.DateTimeFormat(
    'fr-FR',
    {
      month: 'long',
      year: 'numeric',
    },
  )
    .format(
      new Date(
        year,
        month - 1,
        1,
      ),
    )
    .toUpperCase();
}

function missionMatchesPeriod({
  mission,
  period,
  customStart,
  customEnd,
}) {
  if (period === 'all') {
    return true;
  }

  const first =
    getFirstMissionDate(
      mission,
    );

  const last =
    getLastMissionDate(
      mission,
    );

  if (!first || !last) {
    return false;
  }

  const today =
    new Date();

  let start = '';
  let end = '';

  if (
    period === 'current_month'
  ) {
    start =
      firstDayOfMonth(today);
    end =
      lastDayOfMonth(today);
  }

  if (
    period === 'next_month'
  ) {
    const next =
      new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        1,
      );

    start =
      firstDayOfMonth(next);
    end =
      lastDayOfMonth(next);
  }

  if (
    period === 'next_3_months'
  ) {
    start =
      toISODate(today);

    end =
      toISODate(
        new Date(
          today.getFullYear(),
          today.getMonth() + 3,
          today.getDate(),
        ),
      );
  }

  if (
    period === 'current_year'
  ) {
    start =
      `${today.getFullYear()}-01-01`;
    end =
      `${today.getFullYear()}-12-31`;
  }

  if (period === 'custom') {
    start =
      customStart || '';
    end =
      customEnd || '';

    if (!start && !end) {
      return true;
    }
  }

  if (start && last < start) {
    return false;
  }

  if (end && first > end) {
    return false;
  }

  return true;
}

function firstDayOfMonth(
  date,
) {
  return toISODate(
    new Date(
      date.getFullYear(),
      date.getMonth(),
      1,
    ),
  );
}

function lastDayOfMonth(
  date,
) {
  return toISODate(
    new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0,
    ),
  );
}

function toISODate(date) {
  const pad = (value) =>
    String(value).padStart(
      2,
      '0',
    );

  return [
    date.getFullYear(),
    pad(
      date.getMonth() + 1,
    ),
    pad(
      date.getDate(),
    ),
  ].join('-');
}

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      '',
    )
    .trim()
    .toLowerCase();
}

const styles = {
  page: {
    maxWidth: 1500,
    margin: '0 auto',
    padding: '8px 0 40px',
  },

  header: {
    display: 'flex',
    justifyContent:
      'space-between',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 18,
  },

  eyebrow: {
    marginBottom: 5,
    color: '#2563eb',
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.1em',
  },

  title: {
    margin: 0,
    color: '#101828',
    fontSize: 30,
  },

  subtitle: {
    margin: '5px 0 0',
    color: '#667085',
    fontSize: 14,
  },

  primaryLink: {
    display: 'inline-flex',
    minHeight: 40,
    alignItems: 'center',
    padding: '0 15px',
    borderRadius: 8,
    background: '#175cd3',
    color: '#ffffff',
    fontWeight: 700,
    textDecoration: 'none',
  },

  viewTabs: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },

  viewTab: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    minHeight: 38,
    padding: '0 13px',
    border: '1px solid #d0d5dd',
    borderRadius: 999,
    background: '#ffffff',
    color: '#475467',
    fontFamily: 'inherit',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
  },

  viewTabActive: {
    borderColor: '#bfdbfe',
    background: '#eff6ff',
    color: '#1d4ed8',
  },

  viewCount: {
    minWidth: 22,
    padding: '2px 7px',
    borderRadius: 999,
    background: '#f2f4f7',
    color: '#667085',
    fontSize: 11,
    textAlign: 'center',
  },

  viewCountActive: {
    background: '#dbeafe',
    color: '#1d4ed8',
  },

  toolbar: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
    padding: 14,
    border: '1px solid #e4e7ec',
    borderRadius: 12,
    background: '#ffffff',
  },

  searchInput: {
    flex: '1 1 360px',
    minHeight: 40,
    padding: '8px 11px',
    border: '1px solid #d0d5dd',
    borderRadius: 8,
    fontFamily: 'inherit',
  },

  select: {
    minHeight: 40,
    padding: '8px 11px',
    border: '1px solid #d0d5dd',
    borderRadius: 8,
    background: '#ffffff',
  },

  count: {
    marginLeft: 'auto',
    color: '#475467',
    fontSize: 13,
  },

  customPeriod: {
    flex: '1 0 100%',
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 4,
  },

  dateFilterLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    color: '#475467',
    fontSize: 12,
    fontWeight: 700,
  },

  dateInput: {
    minHeight: 36,
    padding: '6px 9px',
    border: '1px solid #d0d5dd',
    borderRadius: 7,
    fontFamily: 'inherit',
  },

  timeline: {
    display: 'grid',
    gap: 24,
  },

  monthGroup: {
    display: 'grid',
    gap: 8,
  },

  monthHeader: {
    display: 'flex',
    justifyContent:
      'space-between',
    alignItems: 'center',
    padding: '0 2px 8px',
    borderBottom: '1px solid #dbe2ea',
    color: '#667085',
    fontSize: 11,
    letterSpacing: '0.04em',
  },

  rows: {
    display: 'grid',
    gap: 7,
  },

  row: {
    display: 'grid',
    gridTemplateColumns:
      'minmax(210px, 1.15fr) minmax(180px, 1fr) minmax(180px, 1fr) minmax(230px, 1.2fr) auto',
    alignItems: 'center',
    gap: 16,
    minHeight: 92,
    padding: '13px 15px',
    border: '1px solid #e4e7ec',
    borderRadius: 10,
    background: '#ffffff',
    boxShadow:
      '0 1px 4px rgba(16, 24, 40, 0.035)',
    cursor: 'pointer',
  },

  dateColumn: {
    minWidth: 0,
    color: '#101828',
    fontSize: 13,
    lineHeight: 1.4,
  },

  referenceColumn: {
    minWidth: 0,
    display: 'grid',
    gap: 3,
  },

  clientColumn: {
    minWidth: 0,
    display: 'grid',
    gap: 3,
  },

  statusColumn: {
    minWidth: 0,
    display: 'grid',
    justifyItems: 'start',
    gap: 5,
  },

  fieldLabel: {
    color: '#98a2b3',
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },

  referenceValue: {
    color: '#101828',
    fontSize: 13,
  },

  formationValue: {
    overflow: 'hidden',
    color: '#667085',
    fontSize: 11,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  location: {
    overflow: 'hidden',
    color: '#667085',
    fontSize: 11,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: 24,
    padding: '3px 8px',
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 800,
    whiteSpace: 'nowrap',
  },

  trainerLine: {
    color: '#475467',
    fontSize: 11,
    fontWeight: 700,
  },

  actionMessage: {
    maxWidth: '100%',
    padding: '4px 7px',
    borderRadius: 6,
    fontSize: 10,
    fontWeight: 700,
    lineHeight: 1.35,
  },

  actionWarning: {
    background: '#fff7ed',
    color: '#c2410c',
  },

  actionWaiting: {
    background: '#eff6ff',
    color: '#1d4ed8',
  },

  actionNeutral: {
    background: '#f8fafc',
    color: '#64748b',
  },

  rowActions: {
    display: 'grid',
    gap: 5,
    justifyItems: 'stretch',
    minWidth: 82,
  },

  openButton: {
    padding: '6px 10px',
    border: '1px solid #bfdbfe',
    borderRadius: 7,
    background: '#eff6ff',
    color: '#1d4ed8',
    fontFamily: 'inherit',
    fontSize: 11,
    fontWeight: 800,
    cursor: 'pointer',
  },

  deleteButton: {
    padding: '6px 10px',
    border: '1px solid #fda29b',
    borderRadius: 7,
    background: '#ffffff',
    color: '#b42318',
    fontFamily: 'inherit',
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
  },

  stateCard: {
    padding: 30,
    border: '1px dashed #d0d5dd',
    borderRadius: 12,
    background: '#ffffff',
    color: '#667085',
    textAlign: 'center',
  },

  error: {
    marginBottom: 14,
    padding: 12,
    border: '1px solid #fda29b',
    borderRadius: 8,
    background: '#fef3f2',
    color: '#b42318',
  },
};
