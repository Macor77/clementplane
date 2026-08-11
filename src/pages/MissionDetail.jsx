import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Link,
  useNavigate,
  useParams,
} from 'react-router-dom';

import {
  deleteMission,
  getMissionById,
  removeFormateurFromMission,
  selectFormateurForMission,
  updateMissionFormateurStatus,
} from '../services/missionsService';

import { getMissionRecommendations } from '../services/missionMatchingService';
import { prepareMissionProposal } from '../services/proposalService';

const INITIAL_FILTERS = {
  recherche: '',
  competence: '',
  materiel: '',
  statuts: [],
  disponibilite: 'all',
};

export default function MissionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [mission, setMission] =
    useState(null);

  const [
    recommendations,
    setRecommendations,
  ] = useState([]);

  const [
    recognizedPlace,
    setRecognizedPlace,
  ] = useState('');

  const [filters, setFilters] =
    useState(INITIAL_FILTERS);

  const [locationDraft, setLocationDraft] =
    useState('');

  const [locationOverride, setLocationOverride] =
    useState('');

  const [locationEditing, setLocationEditing] =
    useState(false);

  const [trainerSort, setTrainerSort] =
    useState('distance');

  const [loading, setLoading] =
    useState(true);

  const [
    recommendationsLoading,
    setRecommendationsLoading,
  ] = useState(false);

  const [error, setError] =
    useState('');

  const [
    actionTrainerId,
    setActionTrainerId,
  ] = useState(null);

  const loadMission =
    useCallback(async () => {
      setLoading(true);
      setError('');

      try {
        const data =
          await getMissionById(id);

        setMission(data);

        setLocationDraft(
          buildMissionLocationLabel(data),
        );
      } catch (loadError) {
        console.error(
          'Erreur chargement mission :',
          loadError,
        );

        setError(
          loadError?.message ||
            'Impossible de charger la mission.',
        );
      } finally {
        setLoading(false);
      }
    }, [id]);

  useEffect(() => {
    loadMission();
  }, [loadMission]);

  useEffect(() => {
    let cancelled = false;

    async function loadRecommendations() {
      if (!mission) {
        return;
      }

      setRecommendationsLoading(true);
      setError('');

      try {
        const result =
          await getMissionRecommendations(
            mission,
            {
              locationQuery:
                locationOverride,
            },
          );

        if (cancelled) {
          return;
        }

        setRecommendations(
          result.formateurs || [],
        );

        setRecognizedPlace(
          result.recognizedPlace || '',
        );
      } catch (loadError) {
        console.error(
          'Erreur recommandations :',
          loadError,
        );

        if (!cancelled) {
          setError(
            loadError?.message ||
              'Impossible de charger les formateurs.',
          );
        }
      } finally {
        if (!cancelled) {
          setRecommendationsLoading(false);
        }
      }
    }

    loadRecommendations();

    return () => {
      cancelled = true;
    };
  }, [mission, locationOverride]);

  const trackedTrainerIds = useMemo(
    () =>
      new Set(
        (
          mission?.mission_formateurs ||
          []
        ).map(
          (item) =>
            item.formateur_id,
        ),
      ),
    [mission],
  );

  const affectedTrainer = useMemo(
    () =>
      (
        mission?.mission_formateurs ||
        []
      ).find(
        (item) =>
          item.statut === 'affecte',
      ) || null,
    [mission],
  );

  const filteredRecommendations =
    useMemo(
      () =>
        recommendations
          .filter(
            (trainer) =>
              !trackedTrainerIds.has(
                trainer.id,
              ),
          )
          .filter((trainer) =>
            matchesFilters(
              trainer,
              filters,
            ),
          ),
      [
        recommendations,
        trackedTrainerIds,
        filters,
      ],
    );

  const sortedRecommendations =
    useMemo(() => {
      const sorted = [
        ...filteredRecommendations,
      ];

      if (trainerSort === 'name') {
        return sorted.sort(
          (first, second) =>
            formatTrainerName(
              first,
            ).localeCompare(
              formatTrainerName(
                second,
              ),
              'fr',
            ),
        );
      }

      return sorted.sort(
        compareByDistance,
      );
    }, [
      filteredRecommendations,
      trainerSort,
    ]);

  const trackedTrainers = useMemo(() => {
    const recommendationById =
      new Map(
        recommendations.map(
          (trainer) => [
            trainer.id,
            trainer,
          ],
        ),
      );

    return [
      ...(
        mission?.mission_formateurs ||
        []
      ),
    ]
      .map((missionTrainer) => ({
        ...missionTrainer,
        recommendation:
          recommendationById.get(
            missionTrainer.formateur_id,
          ) || null,
      }))
      .sort(
        compareMissionFormateurs,
      );
  }, [mission, recommendations]);

  const refresh = async () => {
    const data =
      await getMissionById(id);

    setMission(data);
  };

  const handleSelect = async (
    trainerId,
  ) => {
    setActionTrainerId(trainerId);
    setError('');

    try {
      await selectFormateurForMission(
        id,
        trainerId,
      );

      await refresh();
    } catch (actionError) {
      setError(
        actionError?.message ||
          'Impossible de sélectionner le formateur.',
      );
    } finally {
      setActionTrainerId(null);
    }
  };

  const handleRemove = async (
    trainerId,
  ) => {
    setActionTrainerId(trainerId);
    setError('');

    try {
      await removeFormateurFromMission(
        id,
        trainerId,
      );

      await refresh();
    } catch (actionError) {
      setError(
        actionError?.message ||
          'Impossible de retirer le formateur.',
      );
    } finally {
      setActionTrainerId(null);
    }
  };

  const handleStatusChange = async (
    trainerId,
    status,
  ) => {
    if (
      status === 'affecte' &&
      affectedTrainer &&
      affectedTrainer.formateur_id !==
        trainerId
    ) {
      const confirmed = window.confirm(
        `Un formateur est déjà affecté. Souhaites-tu le remplacer ?`,
      );

      if (!confirmed) {
        return;
      }
    }

    setActionTrainerId(trainerId);
    setError('');

    try {
      await updateMissionFormateurStatus(
        id,
        trainerId,
        status,
      );

      await refresh();
    } catch (actionError) {
      setError(
        actionError?.message ||
          'Impossible de modifier le statut.',
      );
    } finally {
      setActionTrainerId(null);
    }
  };

  const handlePrepareProposal = async (missionTrainerId, trainerId) => {
    setActionTrainerId(trainerId);
    setError('');

    try {
      const { url } = await prepareMissionProposal(missionTrainerId);

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        window.alert('Le lien de proposition a été généré et copié dans le presse-papiers.');
      } else {
        window.prompt('Copie ce lien et envoie-le au formateur :', url);
      }

      await refresh();
    } catch (actionError) {
      setError(
        actionError?.message ||
          'Impossible de préparer la proposition.',
      );
    } finally {
      setActionTrainerId(null);
    }
  };

  const handleApplyLocation = () => {
    const cleanedLocation =
      locationDraft.trim();

    if (!cleanedLocation) {
      setError(
        'Le lieu de recherche ne peut pas être vide.',
      );
      return;
    }

    const missionLocation =
      buildMissionLocationLabel(mission);

    setLocationOverride(
      normalize(cleanedLocation) ===
        normalize(missionLocation)
        ? ''
        : cleanedLocation,
    );

    setLocationEditing(false);
  };

  const handleRestoreMissionLocation = () => {
    setLocationDraft(
      buildMissionLocationLabel(mission),
    );
    setLocationOverride('');
    setLocationEditing(false);
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      'Supprimer définitivement cette mission ?',
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteMission(id);
      navigate('/missions');
    } catch (deleteError) {
      setError(
        deleteError?.message ||
          'Impossible de supprimer la mission.',
      );
    }
  };

  if (loading) {
    return (
      <div style={styles.stateCard}>
        Chargement de la mission…
      </div>
    );
  }

  if (!mission) {
    return (
      <div style={styles.stateCard}>
        Mission introuvable.
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <div style={styles.breadcrumb}>
            <Link
              to="/missions"
              style={styles.breadcrumbLink}
            >
              Missions
            </Link>
            <span>›</span>
            <span>Mission</span>
          </div>

          <h1 style={styles.title}>
            {mission.intitule ||
              mission.formation ||
              'Session sans code interne'}
          </h1>
        </div>

        <div style={styles.headerActions}>
          <Link
            to={`/missions/edit/${id}`}
            style={styles.secondaryLink}
          >
            Modifier la mission
          </Link>

          <Link
            to="/missions/new"
            style={styles.primaryLink}
          >
            + Nouvelle mission
          </Link>
        </div>
      </header>

      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}

      <div style={styles.layout}>
        <MissionInformation
          mission={mission}
          affectedTrainer={affectedTrainer}
          onDelete={handleDelete}
        />

        <main style={styles.mainColumn}>
          <TrainerFilters
            filters={filters}
            setFilters={setFilters}
            resultCount={
              filteredRecommendations.length
            }
            recognizedPlace={
              recognizedPlace
            }
            locationDraft={
              locationDraft
            }
            setLocationDraft={
              setLocationDraft
            }
            locationEditing={
              locationEditing
            }
            setLocationEditing={
              setLocationEditing
            }
            locationOverride={
              locationOverride
            }
            onApplyLocation={
              handleApplyLocation
            }
            onRestoreMissionLocation={
              handleRestoreMissionLocation
            }
            trainerSort={trainerSort}
            setTrainerSort={
              setTrainerSort
            }
          />

          <TrackedTrainers
            trainers={trackedTrainers}
            actionTrainerId={
              actionTrainerId
            }
            onRemove={handleRemove}
            onStatusChange={
              handleStatusChange
            }
            onPrepareProposal={
              handlePrepareProposal
            }
          />

          <section style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={styles.sectionTitle}>
                  Autres formateurs
                </h2>

                <p style={styles.sectionSubtitle}>
                  Classés par distance croissante.
                  Les distances inconnues
                  apparaissent à la fin.
                </p>
              </div>

              <strong style={styles.resultCount}>
                {sortedRecommendations.length}{' '}
                formateur
                {sortedRecommendations.length >
                1
                  ? 's'
                  : ''}
              </strong>
            </div>

            {recommendationsLoading ? (
              <div style={styles.empty}>
                Recherche des formateurs…
              </div>
            ) : sortedRecommendations.length ===
              0 ? (
              <div style={styles.empty}>
                Aucun formateur ne correspond aux
                filtres sélectionnés.
              </div>
            ) : (
              <div style={styles.trainerList}>
                {sortedRecommendations.map(
                  (trainer) => (
                    <TrainerRow
                      key={trainer.id}
                      trainer={trainer}
                      loading={
                        actionTrainerId ===
                        trainer.id
                      }
                      onSelect={() =>
                        handleSelect(
                          trainer.id,
                        )
                      }
                    />
                  ),
                )}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

function MissionInformation({
  mission,
  affectedTrainer,
  onDelete,
}) {
  return (
    <section style={styles.infoCard}>
      <div style={styles.infoHeader}>
        <h2 style={styles.infoTitle}>
          Informations de la mission
        </h2>

        <MissionStatus
          status={mission.statut}
        />
      </div>

      <Information
        label="Code interne de session"
        value={
          mission.intitule ||
          'Non renseigné'
        }
      />

      <Information
        label="Client"
        value={
          mission.client ||
          'Non renseigné'
        }
      />

      <Information
        label="Formation"
        value={
          mission.formation ||
          'Non renseignée'
        }
      />

      <Information
        label="Lieu"
        value={formatFullLocation(
          mission,
        )}
      />

      <Information
        label="Dates et horaires"
        value={formatDatesAndHours(
          mission.mission_dates,
        )}
        multiline
      />

      <Information
        label="Compétences requises"
        value={formatArray(
          mission.competences,
        )}
      />

      <Information
        label="Matériel requis"
        value={formatArray(
          mission.materiel,
        )}
      />

      <Information
        label="Formateur affecté"
        value={
          affectedTrainer
            ? formatTrainerName(
                affectedTrainer.trainer,
              )
            : 'Aucun'
        }
      />

      <Information
        label="Commentaire"
        value={
          mission.commentaire ||
          'Aucun commentaire'
        }
        multiline
      />

      <button
        type="button"
        onClick={onDelete}
        style={styles.deleteMissionButton}
      >
        Supprimer la mission
      </button>
    </section>
  );
}

function TrainerFilters({
  filters,
  setFilters,
  resultCount,
  recognizedPlace,
  locationDraft,
  setLocationDraft,
  locationEditing,
  setLocationEditing,
  locationOverride,
  onApplyLocation,
  onRestoreMissionLocation,
  trainerSort,
  setTrainerSort,
}) {
  const update = (key, value) => {
    setFilters((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const toggleStatus = (status) => {
    setFilters((previous) => ({
      ...previous,
      statuts:
        previous.statuts.includes(
          status,
        )
          ? previous.statuts.filter(
              (item) => item !== status,
            )
          : [
              ...previous.statuts,
              status,
            ],
    }));
  };

  const hasFilters =
    filters.recherche ||
    filters.competence ||
    filters.materiel ||
    filters.statuts.length > 0 ||
    filters.disponibilite !== 'all';

  return (
    <section style={styles.filterCard}>
      <div style={styles.sectionHeader}>
        <div>
          <h2 style={styles.sectionTitle}>
            Rechercher des formateurs
          </h2>

          <p style={styles.sectionSubtitle}>
            Même logique de recherche que le
            listing, appliquée aux dates de la
            mission.
          </p>
        </div>

      </div>

      {recognizedPlace && (
        <div style={styles.recognizedPlaceBox}>
          <span style={styles.recognizedPlaceLabel}>
            📍 Lieu réellement retenu
          </span>

          <strong>
            {recognizedPlace}
          </strong>
        </div>
      )}

      <div style={styles.filterGrid}>
        <FilterField label="Recherche">
          <input
            type="search"
            value={filters.recherche}
            onChange={(event) =>
              update(
                'recherche',
                event.target.value,
              )
            }
            placeholder="Nom, prénom, ville ou code postal"
            style={styles.input}
          />
        </FilterField>

        <FilterField label="Lieu de formation">
          <div style={styles.locationControl}>
            <input
              type="search"
              value={locationDraft}
              readOnly={!locationEditing}
              onChange={(event) =>
                setLocationDraft(
                  event.target.value,
                )
              }
              onKeyDown={(event) => {
                if (
                  event.key === 'Enter' &&
                  locationEditing
                ) {
                  event.preventDefault();
                  onApplyLocation();
                }
              }}
              style={{
                ...styles.input,
                ...(!locationEditing
                  ? styles.lockedInput
                  : {}),
              }}
              title={
                locationEditing
                  ? 'Saisis un lieu temporaire'
                  : 'Lieu repris automatiquement depuis la mission'
              }
            />

            {!locationEditing ? (
              <button
                type="button"
                onClick={() =>
                  setLocationEditing(true)
                }
                style={styles.locationButton}
              >
                Modifier
              </button>
            ) : (
              <button
                type="button"
                onClick={onApplyLocation}
                style={{
                  ...styles.locationButton,
                  ...styles.locationApplyButton,
                }}
              >
                Rechercher
              </button>
            )}
          </div>

          {locationOverride && (
            <button
              type="button"
              onClick={
                onRestoreMissionLocation
              }
              style={styles.restoreLocationButton}
            >
              Utiliser le lieu de la mission
            </button>
          )}
        </FilterField>

        <FilterField label="Compétence">
          <input
            type="search"
            value={filters.competence}
            onChange={(event) =>
              update(
                'competence',
                event.target.value,
              )
            }
            placeholder="Ex. SST"
            style={styles.input}
          />
        </FilterField>

        <FilterField label="Matériel">
          <input
            type="search"
            value={filters.materiel}
            onChange={(event) =>
              update(
                'materiel',
                event.target.value,
              )
            }
            placeholder="Ex. Extincteurs"
            style={styles.input}
          />
        </FilterField>

        <FilterField label="Disponibilité">
          <select
            value={filters.disponibilite}
            onChange={(event) =>
              update(
                'disponibilite',
                event.target.value,
              )
            }
            style={styles.input}
          >
            <option value="all">
              Toutes
            </option>
            <option value="available">
              Disponible sur toutes les dates
            </option>
            <option value="partial">
              Partiellement disponible
            </option>
            <option value="unavailable">
              Indisponible
            </option>
            <option value="unknown">
              Planning non renseigné
            </option>
          </select>
        </FilterField>
      </div>

      <div style={styles.statusRow}>
        <strong style={styles.statusLabel}>
          Statut :
        </strong>

        {[
          'Premium',
          'Standard',
          'Inactif',
          'Black',
        ].map((status) => (
          <label
            key={status}
            style={styles.checkLabel}
          >
            <input
              type="checkbox"
              checked={filters.statuts.includes(
                status,
              )}
              onChange={() =>
                toggleStatus(status)
              }
            />
            {status}
          </label>
        ))}

        <label style={styles.sortControl}>
          <span>Trier :</span>

          <select
            value={trainerSort}
            onChange={(event) =>
              setTrainerSort(
                event.target.value,
              )
            }
            style={styles.sortSelect}
          >
            <option value="distance">
              Proximité
            </option>

            <option value="name">
              Nom
            </option>
          </select>
        </label>

        {hasFilters && (
          <button
            type="button"
            onClick={() =>
              setFilters(
                INITIAL_FILTERS,
              )
            }
            style={styles.resetButton}
          >
            Effacer les filtres
          </button>
        )}

        <strong style={styles.filterCount}>
          {resultCount} résultat
          {resultCount > 1 ? 's' : ''}
        </strong>
      </div>
    </section>
  );
}

function TrackedTrainers({
  trainers,
  actionTrainerId,
  onRemove,
  onStatusChange,
  onPrepareProposal,
}) {
  return (
    <section style={styles.sectionCard}>
      <div style={styles.sectionHeader}>
        <div>
          <h2 style={styles.sectionTitle}>
            Suivi des formateurs
          </h2>

          <p style={styles.sectionSubtitle}>
            Formateurs déjà sélectionnés,
            contactés ou affectés.
          </p>
        </div>

        <strong style={styles.resultCount}>
          {trainers.length}
        </strong>
      </div>

      {trainers.length === 0 ? (
        <div style={styles.empty}>
          Aucun formateur en suivi.
        </div>
      ) : (
        <div style={styles.trainerList}>
          {trainers.map(
            (missionTrainer) => (
              <TrackedTrainerRow
                key={missionTrainer.id}
                missionTrainer={
                  missionTrainer
                }
                loading={
                  actionTrainerId ===
                  missionTrainer.formateur_id
                }
                onRemove={() =>
                  onRemove(
                    missionTrainer.formateur_id,
                  )
                }
                onStatusChange={(status) =>
                  onStatusChange(
                    missionTrainer.formateur_id,
                    status,
                  )
                }
                onPrepareProposal={() =>
                  onPrepareProposal(
                    missionTrainer.id,
                    missionTrainer.formateur_id,
                  )
                }
              />
            ),
          )}
        </div>
      )}
    </section>
  );
}

function TrackedTrainerRow({
  missionTrainer,
  loading,
  onRemove,
  onStatusChange,
  onPrepareProposal,
}) {
  const trainer =
    missionTrainer.trainer || {};

  return (
    <article
      style={{
        ...styles.trackedTrainerRow,
        ...(missionTrainer.statut ===
        'affecte'
          ? styles.affectedRow
          : {}),
      }}
    >
      <div style={styles.trainerIdentity}>
        <strong>
          {formatTrainerName(trainer)}
        </strong>

        <span style={styles.trainerMeta}>
          {[
            trainer.code_postal,
            trainer.ville,
          ]
            .filter(Boolean)
            .join(' ') ||
            'Localisation non renseignée'}
        </span>
        <TrainerViewLink
          trainerId={trainer.id}
        />
      </div>

      <span style={styles.distance}>
        {missionTrainer.recommendation
          ?.distance == null
          ? 'Distance inconnue'
          : `${Math.round(
              missionTrainer.recommendation
                .distance,
            )} km`}
      </span>

      <TrainerMissionStatus
        status={missionTrainer.statut}
      />

      <span style={styles.timeline}>
        {formatTimeline(
          missionTrainer,
        )}
      </span>

      <div style={styles.rowActions}>
        {missionTrainer.statut ===
          'selectionne' && (
          <ActionButton
            label="Proposer"
            loading={loading}
            primary
            onClick={onPrepareProposal}
          />
        )}

        {missionTrainer.statut ===
          'proposition_envoyee' && (
          <>
            <ActionButton
              label="Copier le lien"
              loading={loading}
              primary
              onClick={onPrepareProposal}
            />
            <ActionButton
              label="Accepter"
              loading={loading}
              onClick={() =>
                onStatusChange('accepte')
              }
            />
            <ActionButton
              label="Refuser"
              loading={loading}
              onClick={() =>
                onStatusChange('refuse')
              }
            />
          </>
        )}

        {missionTrainer.statut ===
          'accepte' && (
          <ActionButton
            label="Affecter"
            loading={loading}
            primary
            onClick={() =>
              onStatusChange('affecte')
            }
          />
        )}

        {missionTrainer.statut ===
          'affecte' && (
          <ActionButton
            label="Désaffecter"
            loading={loading}
            onClick={() =>
              onStatusChange('accepte')
            }
          />
        )}

        {[
          'proposition_envoyee',
          'accepte',
          'refuse',
        ].includes(
          missionTrainer.statut,
        ) && (
          <ActionButton
            label="Réinitialiser"
            loading={loading}
            onClick={() =>
              onStatusChange(
                'selectionne',
              )
            }
          />
        )}

        {missionTrainer.statut !==
          'affecte' && (
          <ActionButton
            label="Retirer"
            loading={loading}
            danger
            onClick={onRemove}
          />
        )}
      </div>
    </article>
  );
}

function TrainerRow({
  trainer,
  loading,
  onSelect,
}) {
  return (
    <article style={styles.trainerRow}>
      <div style={styles.trainerIdentity}>
        <strong>
          {formatTrainerName(trainer)}
        </strong>

        <span style={styles.trainerMeta}>
          {[
            trainer.codePostal,
            trainer.ville,
          ]
            .filter(Boolean)
            .join(' ') ||
            'Localisation non renseignée'}
        </span>
        <TrainerViewLink
          trainerId={trainer.id}
        />
      </div>

      <span style={styles.distance}>
        {trainer.distance === null
          ? 'Distance inconnue'
          : `${Math.round(
              trainer.distance,
            )} km`}
      </span>

      <AvailabilityBadge
        availability={
          trainer.availability
        }
      />

      <span style={styles.tarif}>
        {trainer.tarif != null
          ? `${trainer.tarif} €`
          : 'Tarif non renseigné'}
      </span>

      <div style={styles.criteria}>
        <span>
          <strong>Compétences :</strong>{' '}
          {formatArray(
            trainer.competences,
          )}
        </span>

        <span>
          <strong>Matériel :</strong>{' '}
          {formatArray(
            trainer.materiel,
          )}
        </span>
      </div>

      <ActionButton
        label="Sélectionner"
        loading={loading}
        primary
        disabled={
          trainer.availability
            ?.status === 'unavailable'
        }
        onClick={onSelect}
      />
    </article>
  );
}

function TrainerViewLink({
  trainerId,
}) {
  if (!trainerId) {
    return null;
  }

  return (
    <a
      href={`/formateur/view/${trainerId}`}
      target="_blank"
      rel="noopener noreferrer"
      style={styles.viewTrainerLink}
    >
      Voir la fiche ↗
    </a>
  );
}

function FilterField({
  label,
  children,
}) {
  return (
    <label style={styles.filterField}>
      <span style={styles.filterLabel}>
        {label}
      </span>
      {children}
    </label>
  );
}

function Information({
  label,
  value,
  multiline = false,
}) {
  return (
    <div style={styles.information}>
      <span style={styles.informationLabel}>
        {label}
      </span>

      <span
        style={{
          ...styles.informationValue,
          whiteSpace: multiline
            ? 'pre-line'
            : 'normal',
        }}
      >
        {value}
      </span>
    </div>
  );
}

function ActionButton({
  label,
  loading,
  primary = false,
  danger = false,
  disabled = false,
  onClick,
}) {
  return (
    <button
      type="button"
      disabled={loading || disabled}
      onClick={onClick}
      style={{
        ...styles.actionButton,
        ...(primary
          ? styles.actionPrimary
          : {}),
        ...(danger
          ? styles.actionDanger
          : {}),
        opacity:
          loading || disabled
            ? 0.55
            : 1,
        cursor:
          loading || disabled
            ? 'not-allowed'
            : 'pointer',
      }}
    >
      {loading
        ? 'Enregistrement…'
        : label}
    </button>
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

function TrainerMissionStatus({
  status,
}) {
  const config = {
    selectionne: [
      'Sélectionné',
      '#f2f4f7',
      '#475467',
    ],
    proposition_envoyee: [
      'Proposition envoyée',
      '#eff8ff',
      '#175cd3',
    ],
    accepte: [
      'Accepté',
      '#ecfdf3',
      '#067647',
    ],
    refuse: [
      'Refusé',
      '#fef3f2',
      '#b42318',
    ],
    indisponible_affecte_ailleurs: [
      'Indisponible',
      '#fff6ed',
      '#c4320a',
    ],
    affecte: [
      'Affecté',
      '#f4f3ff',
      '#5925dc',
    ],
    annule: [
      'Annulé',
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
    config.selectionne;

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

function AvailabilityBadge({
  availability,
}) {
  const config = {
    available: [
      '#ecfdf3',
      '#067647',
    ],
    partial: [
      '#fffaeb',
      '#b54708',
    ],
    unavailable: [
      '#fef3f2',
      '#b42318',
    ],
    unknown: [
      '#f2f4f7',
      '#475467',
    ],
  };

  const [
    background,
    color,
  ] =
    config[
      availability?.status
    ] || config.unknown;

  return (
    <span
      style={{
        ...styles.badge,
        background,
        color,
      }}
    >
      {availability?.label ||
        'Planning non renseigné'}
    </span>
  );
}

function matchesFilters(
  trainer,
  filters,
) {
  const identity = normalize(
    [
      trainer.prenom,
      trainer.nom,
      trainer.ville,
      trainer.codePostal,
    ].join(' '),
  );

  const matchesSearch =
    splitTerms(filters.recherche).every(
      (term) =>
        identity.includes(term),
    );

  const competenceText =
    normalize(
      (trainer.competences || []).join(
        ' ',
      ),
    );

  const materialText = normalize(
    (trainer.materiel || []).join(' '),
  );

  const matchesCompetence =
    splitTerms(
      filters.competence,
    ).every((term) =>
      competenceText.includes(term),
    );

  const matchesMaterial =
    splitTerms(
      filters.materiel,
    ).every((term) =>
      materialText.includes(term),
    );

  const matchesStatus =
    filters.statuts.length === 0 ||
    filters.statuts.includes(
      trainer.statut,
    );

  const matchesAvailability =
    filters.disponibilite === 'all' ||
    trainer.availability?.status ===
      filters.disponibilite;

  return (
    matchesSearch &&
    matchesCompetence &&
    matchesMaterial &&
    matchesStatus &&
    matchesAvailability
  );
}

function splitTerms(value) {
  return normalize(value)
    .split(/\s+/)
    .filter(Boolean);
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

function compareByDistance(
  first,
  second,
) {
  if (
    first.distance != null &&
    second.distance != null
  ) {
    const difference =
      first.distance -
      second.distance;

    if (difference !== 0) {
      return difference;
    }
  } else if (first.distance != null) {
    return -1;
  } else if (second.distance != null) {
    return 1;
  }

  return formatTrainerName(
    first,
  ).localeCompare(
    formatTrainerName(second),
    'fr',
  );
}

function compareMissionFormateurs(
  first,
  second,
) {
  const priorities = {
    affecte: 0,
    accepte: 1,
    proposition_envoyee: 2,
    selectionne: 3,
    indisponible_affecte_ailleurs: 4,
    refuse: 5,
    annule: 6,
  };

  return (
    (priorities[first.statut] ??
      99) -
      (priorities[second.statut] ??
        99) ||
    formatTrainerName(
      first.trainer,
    ).localeCompare(
      formatTrainerName(
        second.trainer,
      ),
      'fr',
    )
  );
}

function formatTrainerName(trainer) {
  return [
    trainer?.prenom,
    trainer?.nom,
  ]
    .filter(Boolean)
    .join(' ') ||
    'Formateur';
}

function formatTimeline(item) {
  if (
    item.statut === 'affecte' &&
    item.affecte_le
  ) {
    return `Affecté le ${formatDateTime(
      item.affecte_le,
    )}`;
  }

  if (
    [
      'accepte',
      'refuse',
    ].includes(item.statut) &&
    item.repondu_le
  ) {
    return `Réponse le ${formatDateTime(
      item.repondu_le,
    )}`;
  }

  if (
    item.statut ===
      'proposition_envoyee' &&
    item.propose_le
  ) {
    return `Proposée le ${formatDateTime(
      item.propose_le,
    )}`;
  }

  if (
    item.statut ===
    'indisponible_affecte_ailleurs'
  ) {
    return 'Indisponible sur cette période';
  }

  return 'Aucune proposition envoyée';
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat(
    'fr-FR',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
  ).format(new Date(value));
}

function buildMissionLocationLabel(
  mission,
) {
  if (!mission) {
    return '';
  }

  return [
    mission.adresse,
    [
      mission.code_postal,
      mission.ville,
    ]
      .filter(Boolean)
      .join(' '),
  ]
    .filter(Boolean)
    .join(', ');
}

function formatFullLocation(mission) {
  const address = [
    mission.adresse,
    [
      mission.code_postal,
      mission.ville,
    ]
      .filter(Boolean)
      .join(' '),
  ]
    .filter(Boolean)
    .join('\n');

  const site = mission.lieu
    ? `Site : ${mission.lieu}`
    : '';

  return [site, address]
    .filter(Boolean)
    .join('\n') ||
    'Non renseigné';
}

function formatDatesAndHours(
  dates = [],
) {
  if (dates.length === 0) {
    return 'Non renseignées';
  }

  return [...dates]
    .sort((first, second) =>
      first.date.localeCompare(
        second.date,
      ),
    )
    .map(
      (item) =>
        `${formatDate(item.date)} · ${formatTime(
          item.heure_debut,
        )} – ${formatTime(
          item.heure_fin,
        )}`,
    )
    .join('\n');
}

function formatDate(value) {
  return new Intl.DateTimeFormat(
    'fr-FR',
  ).format(
    new Date(`${value}T12:00:00`),
  );
}

function formatTime(value) {
  return value
    ? value.slice(0, 5).replace(':', 'h')
    : '—';
}

function formatArray(value) {
  return Array.isArray(value) &&
    value.length > 0
    ? value.join(', ')
    : 'Non renseigné';
}

const baseStyles = {
  page: {
    width: '100%',
    maxWidth: 1280,
    boxSizing: 'border-box',
    margin: '0 auto',
    padding: '4px 0 40px',
  },

  header: {
    display: 'flex',
    justifyContent:
      'space-between',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 16,
  },

  breadcrumb: {
    display: 'flex',
    gap: 7,
    marginBottom: 7,
    color: '#667085',
    fontSize: 13,
  },

  breadcrumbLink: {
    color: '#475467',
    textDecoration: 'none',
  },

  title: {
    margin: 0,
    color: '#101828',
    fontSize: 28,
  },

  headerActions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 9,
  },

  primaryLink: {
    display: 'inline-flex',
    minHeight: 40,
    alignItems: 'center',
    padding: '0 14px',
    borderRadius: 8,
    background: '#067647',
    color: '#ffffff',
    fontWeight: 700,
    textDecoration: 'none',
  },

  secondaryLink: {
    display: 'inline-flex',
    minHeight: 40,
    alignItems: 'center',
    padding: '0 14px',
    border: '1px solid #d0d5dd',
    borderRadius: 8,
    background: '#ffffff',
    color: '#344054',
    fontWeight: 600,
    textDecoration: 'none',
  },

  layout: {
    display: 'grid',
    gridTemplateColumns:
      'minmax(245px, 285px) minmax(0, 1fr)',
    gap: 16,
    alignItems: 'start',
  },

  missionColumn: {
    position: 'sticky',
    top: 12,
  },

  mainColumn: {
    display: 'grid',
    minWidth: 0,
    maxWidth: '100%',
    gap: 14,
    overflow: 'hidden',
  },

  infoCard: {
    display: 'grid',
    gap: 16,
    padding: 18,
    border: '1px solid #e4e7ec',
    borderRadius: 12,
    background: '#ffffff',
    boxShadow:
      '0 2px 8px rgba(16, 24, 40, 0.04)',
  },

  infoHeader: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent:
      'space-between',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 12,
    borderBottom: '1px solid #f2f4f7',
  },

  infoTitle: {
    margin: 0,
    color: '#101828',
    fontSize: 17,
  },

  information: {
    display: 'grid',
    gap: 4,
  },

  informationLabel: {
    color: '#667085',
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
  },

  informationValue: {
    color: '#344054',
    fontSize: 13,
    lineHeight: 1.45,
  },

  deleteMissionButton: {
    marginTop: 8,
    minHeight: 38,
    border: '1px solid #fda29b',
    borderRadius: 8,
    background: '#ffffff',
    color: '#b42318',
    fontWeight: 600,
    cursor: 'pointer',
  },

  filterCard: {
    padding: 16,
    border: '1px solid #e4e7ec',
    borderRadius: 12,
    background: '#ffffff',
    boxShadow:
      '0 2px 8px rgba(16, 24, 40, 0.04)',
  },

  sectionCard: {
    padding: 16,
    border: '1px solid #e4e7ec',
    borderRadius: 12,
    background: '#ffffff',
    boxShadow:
      '0 2px 8px rgba(16, 24, 40, 0.04)',
  },

  sectionHeader: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent:
      'space-between',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 13,
  },

  sectionTitle: {
    margin: 0,
    color: '#101828',
    fontSize: 17,
  },

  sectionSubtitle: {
    margin: '3px 0 0',
    color: '#667085',
    fontSize: 12,
  },

  place: {
    maxWidth: 420,
    color: '#475467',
    fontSize: 11,
    textAlign: 'right',
  },

  recognizedPlaceBox: {
    display: 'grid',
    gap: 3,
    marginBottom: 12,
    padding: '9px 11px',
    border: '1px solid #bbf7d0',
    borderRadius: 8,
    background: '#f0fdf4',
    color: '#166534',
    fontSize: 12,
  },

  recognizedPlaceLabel: {
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase',
  },

  filterGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(165px, 1fr))',
    gap: 10,
  },

  locationControl: {
    display: 'flex',
    minWidth: 0,
    gap: 6,
  },

  lockedInput: {
    background: '#f9fafb',
    color: '#475467',
    cursor: 'default',
  },

  locationButton: {
    flexShrink: 0,
    minHeight: 38,
    padding: '7px 9px',
    border: '1px solid #d0d5dd',
    borderRadius: 8,
    background: '#ffffff',
    color: '#344054',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
  },

  locationApplyButton: {
    border: '1px solid #067647',
    background: '#067647',
    color: '#ffffff',
  },

  restoreLocationButton: {
    width: 'fit-content',
    padding: 0,
    border: 0,
    background: 'transparent',
    color: '#175cd3',
    fontSize: 10,
    cursor: 'pointer',
    textAlign: 'left',
  },

  viewTrainerLink: {
    width: 'fit-content',
    color: '#175cd3',
    fontSize: 10,
    fontWeight: 700,
    textDecoration: 'none',
  },

  filterField: {
    display: 'grid',
    gap: 5,
  },

  filterLabel: {
    color: '#475467',
    fontSize: 11,
    fontWeight: 700,
  },

  input: {
    boxSizing: 'border-box',
    width: '100%',
    minHeight: 38,
    padding: '8px 10px',
    border: '1px solid #d0d5dd',
    borderRadius: 8,
    background: '#ffffff',
    fontFamily: 'inherit',
  },

  statusRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTop: '1px solid #f2f4f7',
  },

  statusLabel: {
    color: '#344054',
    fontSize: 12,
  },

  checkLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    color: '#475467',
    fontSize: 12,
  },

  sortControl: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    color: '#475467',
    fontSize: 12,
  },

  sortSelect: {
    minHeight: 32,
    padding: '5px 8px',
    border: '1px solid #d0d5dd',
    borderRadius: 7,
    background: '#ffffff',
    color: '#344054',
  },

  resetButton: {
    minHeight: 32,
    padding: '5px 9px',
    border: '1px solid #d0d5dd',
    borderRadius: 7,
    background: '#ffffff',
    color: '#344054',
    cursor: 'pointer',
  },

  filterCount: {
    marginLeft: 'auto',
    color: '#475467',
    fontSize: 12,
  },

  resultCount: {
    color: '#475467',
    fontSize: 12,
  },

  trainerList: {
    display: 'grid',
    minWidth: 0,
    gap: 7,
  },

  trackedTrainerRow: {
    display: 'grid',
    gridTemplateColumns:
      'minmax(145px, 1.1fr) 78px minmax(110px, auto) minmax(120px, 1fr) auto',
    gap: 8,
    alignItems: 'center',
    padding: '9px 10px',
    border: '1px solid #e4e7ec',
    borderRadius: 9,
    background: '#ffffff',
  },

  trainerRow: {
    display: 'grid',
    gridTemplateColumns:
      'minmax(150px, 1.25fr) 78px minmax(120px, 1fr) 82px minmax(135px, 1.15fr) auto',
    gap: 8,
    alignItems: 'center',
    padding: '9px 10px',
    border: '1px solid #e4e7ec',
    borderRadius: 9,
    background: '#ffffff',
  },

  affectedRow: {
    border: '1px solid #9b8afb',
    background: '#f4f3ff',
    boxShadow: 'inset 3px 0 0 #7f56d9',
  },

  trainerIdentity: {
    display: 'grid',
    minWidth: 0,
    gap: 3,
    color: '#101828',
    fontSize: 13,
  },

  trainerMeta: {
    overflow: 'hidden',
    color: '#667085',
    fontSize: 11,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  distance: {
    color: '#344054',
    fontSize: 12,
    fontWeight: 700,
  },

  tarif: {
    color: '#475467',
    fontSize: 12,
  },

  criteria: {
    display: 'grid',
    minWidth: 0,
    overflowWrap: 'anywhere',
    gap: 3,
    color: '#667085',
    fontSize: 10,
    lineHeight: 1.35,
  },

  timeline: {
    color: '#667085',
    fontSize: 10,
  },

  rowActions: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 5,
  },

  actionButton: {
    minHeight: 32,
    padding: '5px 9px',
    border: '1px solid #d0d5dd',
    borderRadius: 7,
    background: '#ffffff',
    color: '#344054',
    fontSize: 11,
    fontWeight: 600,
  },

  actionPrimary: {
    border: '1px solid #067647',
    background: '#067647',
    color: '#ffffff',
  },

  actionDanger: {
    border: '1px solid #fda29b',
    color: '#b42318',
  },

  badge: {
    display: 'inline-flex',
    width: 'fit-content',
    padding: '4px 7px',
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 700,
  },

  empty: {
    padding: 20,
    border: '1px dashed #d0d5dd',
    borderRadius: 9,
    background: '#f9fafb',
    color: '#667085',
    textAlign: 'center',
  },

  stateCard: {
    maxWidth: 900,
    margin: '20px auto',
    padding: 30,
    border: '1px solid #e4e7ec',
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

const compactStyles = {
  // Polish UI 7.2 — version compacte et pleine largeur
  page: {
    width: '100%',
    maxWidth: 1500,
    boxSizing: 'border-box',
    margin: '0 auto',
    padding: '0 0 28px',
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  breadcrumb: { display: 'flex', gap: 6, marginBottom: 4, color: '#667085', fontSize: 11 },
  title: { margin: 0, color: '#101828', fontSize: 24, lineHeight: 1.2, letterSpacing: '-0.025em' },
  headerActions: { display: 'flex', flexWrap: 'wrap', gap: 7 },
  primaryLink: { display: 'inline-flex', minHeight: 36, alignItems: 'center', padding: '0 12px', borderRadius: 8, background: '#087a55', color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none' },
  secondaryLink: { display: 'inline-flex', minHeight: 36, alignItems: 'center', padding: '0 12px', border: '1px solid #d0d5dd', borderRadius: 8, background: '#fff', color: '#344054', fontSize: 12, fontWeight: 650, textDecoration: 'none' },
  layout: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 12, alignItems: 'start' },
  missionColumn: { position: 'static' },
  mainColumn: { display: 'grid', minWidth: 0, width: '100%', gap: 12, overflow: 'visible' },
  infoCard: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, minmax(130px, 1fr))',
    gap: '10px 18px',
    padding: '14px 16px',
    border: '1px solid #e4e7ec',
    borderRadius: 11,
    background: '#fff',
    boxShadow: '0 1px 3px rgba(16,24,40,.04)',
  },
  infoHeader: { gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, paddingBottom: 9, borderBottom: '1px solid #eef1f5' },
  infoTitle: { margin: 0, color: '#101828', fontSize: 15 },
  information: { display: 'grid', alignContent: 'start', gap: 2, minWidth: 0 },
  informationLabel: { color: '#667085', fontSize: 9, fontWeight: 750, letterSpacing: '.04em', textTransform: 'uppercase' },
  informationValue: { color: '#344054', fontSize: 12, lineHeight: 1.35, overflowWrap: 'anywhere' },
  deleteMissionButton: { minHeight: 32, alignSelf: 'end', border: '1px solid #fda29b', borderRadius: 7, background: '#fff', color: '#b42318', fontSize: 11, fontWeight: 650, cursor: 'pointer' },
  filterCard: { padding: 14, border: '1px solid #e4e7ec', borderRadius: 11, background: '#fff', boxShadow: '0 1px 3px rgba(16,24,40,.04)' },
  sectionCard: { padding: 14, border: '1px solid #e4e7ec', borderRadius: 11, background: '#fff', boxShadow: '0 1px 3px rgba(16,24,40,.04)' },
  sectionHeader: { display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 10 },
  sectionTitle: { margin: 0, color: '#101828', fontSize: 15 },
  sectionSubtitle: { margin: '2px 0 0', color: '#667085', fontSize: 11 },
  recognizedPlaceBox: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, padding: '7px 9px', border: '1px solid #bbf7d0', borderRadius: 7, background: '#f0fdf4', color: '#166534', fontSize: 11 },
  recognizedPlaceLabel: { fontSize: 9, fontWeight: 750, textTransform: 'uppercase', whiteSpace: 'nowrap' },
  filterGrid: { display: 'grid', gridTemplateColumns: '1.35fr 1.15fr 1fr 1fr .9fr', gap: 8 },
  input: { boxSizing: 'border-box', width: '100%', minHeight: 34, padding: '6px 9px', border: '1px solid #d0d5dd', borderRadius: 7, background: '#fff', fontFamily: 'inherit', fontSize: 12 },
  locationButton: { flexShrink: 0, minHeight: 34, padding: '5px 8px', border: '1px solid #d0d5dd', borderRadius: 7, background: '#fff', color: '#344054', fontSize: 10, fontWeight: 650, cursor: 'pointer' },
  statusRow: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 10, paddingTop: 10, borderTop: '1px solid #f2f4f7' },
  trackedTrainerRow: { display: 'grid', gridTemplateColumns: 'minmax(170px,1.2fr) 72px 115px minmax(150px,1fr) auto', gap: 10, alignItems: 'center', padding: '8px 10px', border: '1px solid #e4e7ec', borderRadius: 8, background: '#fff' },
  trainerRow: { display: 'grid', gridTemplateColumns: 'minmax(180px,1.25fr) 72px minmax(125px,.85fr) 80px minmax(220px,1.5fr) auto', gap: 10, alignItems: 'center', padding: '8px 10px', border: '1px solid #e4e7ec', borderRadius: 8, background: '#fff' },
  trainerIdentity: { display: 'grid', minWidth: 0, gap: 2, color: '#101828', fontSize: 12 },
  trainerMeta: { overflow: 'hidden', color: '#667085', fontSize: 10, textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  criteria: { display: 'grid', minWidth: 0, overflowWrap: 'anywhere', gap: 2, color: '#667085', fontSize: 10, lineHeight: 1.3 },
  actionButton: { minHeight: 29, padding: '4px 8px', border: '1px solid #d0d5dd', borderRadius: 6, background: '#fff', color: '#344054', fontSize: 10, fontWeight: 650 },
  badge: { display: 'inline-flex', width: 'fit-content', padding: '3px 6px', borderRadius: 999, fontSize: 9, fontWeight: 750 },

};

const styles = { ...baseStyles, ...compactStyles };
