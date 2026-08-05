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

  const filteredMissions = useMemo(
    () =>
      missions.filter((mission) => {
        const text = normalize(
          [
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
              text.includes(term),
            );

        const matchesStatus =
          status === 'all' ||
          mission.statut === status;

        return (
          matchesSearch &&
          matchesStatus
        );
      }),
    [missions, search, status],
  );

  const handleDelete = async (
    event,
    mission,
  ) => {
    event.stopPropagation();

    const label =
      mission.intitule ||
      mission.formation ||
      mission.client ||
      mission.lieu ||
      'cette mission';

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
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>
            Missions
          </h1>

          <p style={styles.subtitle}>
            Retrouve toutes les missions et
            ouvre leur espace de gestion.
          </p>
        </div>

        <Link
          to="/missions/new"
          style={styles.primaryLink}
        >
          + Créer une mission
        </Link>
      </header>

      <section style={styles.toolbar}>
        <input
          type="search"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder="Rechercher une mission, un client ou une ville"
          style={styles.searchInput}
        />

        <select
          value={status}
          onChange={(event) =>
            setStatus(event.target.value)
          }
          style={styles.select}
        >
          <option value="all">
            Tous les statuts
          </option>
          <option value="brouillon">
            Brouillon
          </option>
          <option value="a_pourvoir">
            À pourvoir
          </option>
          <option value="affectee">
            Affectée
          </option>
          <option value="confirmee">
            Confirmée
          </option>
          <option value="realisee">
            Réalisée
          </option>
          <option value="annulee">
            Annulée
          </option>
          <option value="archivee">
            Archivée
          </option>
        </select>

        <strong style={styles.count}>
          {filteredMissions.length}{' '}
          mission
          {filteredMissions.length > 1
            ? 's'
            : ''}
        </strong>
      </section>

      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={styles.stateCard}>
          Chargement des missions…
        </div>
      ) : filteredMissions.length ===
        0 ? (
        <div style={styles.stateCard}>
          Aucune mission ne correspond à
          la recherche.
        </div>
      ) : (
        <div style={styles.grid}>
          {filteredMissions.map(
            (mission) => (
              <article
                key={mission.id}
                onClick={() =>
                  navigate(
                    `/missions/${mission.id}`,
                  )
                }
                style={styles.card}
              >
                <div style={styles.cardTop}>
                  <MissionStatus
                    status={mission.statut}
                  />

                  <span
                    style={styles.date}
                  >
                    {formatMissionDates(
                      mission.mission_dates,
                    )}
                  </span>
                </div>

                <h2 style={styles.cardTitle}>
                  {mission.intitule ||
                    mission.formation ||
                    'Session sans code interne'}
                </h2>

                <div style={styles.client}>
                  {mission.client ||
                    'Client non renseigné'}
                </div>

                <div style={styles.location}>
                  📍 {formatLocation(mission)}
                </div>

                <div style={styles.footer}>
                  <span>
                    {formatTracking(
                      mission.mission_formateurs,
                    )}
                  </span>

                  <div
                    style={styles.actions}
                  >
                    <Link
                      to={`/missions/edit/${mission.id}`}
                      onClick={(event) =>
                        event.stopPropagation()
                      }
                      style={styles.editLink}
                    >
                      Modifier
                    </Link>

                    <button
                      type="button"
                      onClick={(event) =>
                        handleDelete(
                          event,
                          mission,
                        )
                      }
                      style={styles.deleteButton}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </article>
            ),
          )}
        </div>
      )}
    </div>
  );
}

function MissionStatus({ status }) {
  const config = {
    brouillon: [
      'Brouillon',
      '#f2f4f7',
      '#344054',
    ],
    a_pourvoir: [
      'À pourvoir',
      '#fff6ed',
      '#c4320a',
    ],
    affectee: [
      'Affectée',
      '#eff8ff',
      '#175cd3',
    ],
    confirmee: [
      'Confirmée',
      '#ecfdf3',
      '#067647',
    ],
    realisee: [
      'Réalisée',
      '#f4f3ff',
      '#5925dc',
    ],
    annulee: [
      'Annulée',
      '#fef3f2',
      '#b42318',
    ],
    archivee: [
      'Archivée',
      '#f2f4f7',
      '#475467',
    ],
  };

  const [
    label,
    background,
    color,
  ] =
    config[status] ||
    config.brouillon;

  return (
    <span
      style={{
        ...styles.badge,
        background,
        color,
      }}
    >
      {label}
    </span>
  );
}

function formatTracking(
  missionFormateurs = [],
) {
  const affected =
    missionFormateurs.find(
      (item) =>
        item.statut === 'affecte',
    );

  if (affected?.trainer) {
    return `Affecté : ${[
      affected.trainer.prenom,
      affected.trainer.nom,
    ]
      .filter(Boolean)
      .join(' ')}`;
  }

  const count =
    missionFormateurs.length;

  if (count === 0) {
    return 'Aucun formateur en suivi';
  }

  return `${count} formateur${
    count > 1 ? 's' : ''
  } en suivi`;
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

function formatMissionDates(
  dates = [],
) {
  if (dates.length === 0) {
    return 'Date non renseignée';
  }

  const sorted = [...dates].sort(
    (first, second) =>
      first.date.localeCompare(
        second.date,
      ),
  );

  if (sorted.length === 1) {
    return formatDate(
      sorted[0].date,
    );
  }

  return `${formatDate(
    sorted[0].date,
  )} au ${formatDate(
    sorted[sorted.length - 1].date,
  )}`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat(
    'fr-FR',
  ).format(
    new Date(`${value}T12:00:00`),
  );
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
    maxWidth: 1450,
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

  toolbar: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
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

  grid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(330px, 1fr))',
    gap: 14,
  },

  card: {
    display: 'grid',
    gap: 8,
    padding: 18,
    border: '1px solid #e4e7ec',
    borderRadius: 12,
    background: '#ffffff',
    boxShadow:
      '0 2px 8px rgba(16, 24, 40, 0.04)',
    cursor: 'pointer',
  },

  cardTop: {
    display: 'flex',
    justifyContent:
      'space-between',
    alignItems: 'center',
    gap: 10,
  },

  badge: {
    display: 'inline-flex',
    padding: '4px 8px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
  },

  date: {
    color: '#667085',
    fontSize: 12,
  },

  cardTitle: {
    margin: '4px 0 0',
    color: '#101828',
    fontSize: 18,
  },

  client: {
    color: '#344054',
    fontWeight: 600,
  },

  location: {
    color: '#667085',
    fontSize: 13,
  },

  footer: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent:
      'space-between',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    paddingTop: 12,
    borderTop: '1px solid #f2f4f7',
    color: '#175cd3',
    fontSize: 12,
    fontWeight: 600,
  },

  actions: {
    display: 'flex',
    gap: 7,
  },

  editLink: {
    padding: '6px 9px',
    border: '1px solid #d0d5dd',
    borderRadius: 7,
    background: '#ffffff',
    color: '#344054',
    textDecoration: 'none',
  },

  deleteButton: {
    padding: '6px 9px',
    border: '1px solid #fda29b',
    borderRadius: 7,
    background: '#ffffff',
    color: '#b42318',
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
