import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { Link } from 'react-router-dom';

import {
  deleteMission,
  getMissions,
  removeFormateurFromMission,
  selectFormateurForMission,
  updateMissionFormateurStatus,
} from '../services/missionsService';

import { getMissionRecommendations } from '../services/missionMatchingService';

export default function Missions() {
  const [missions, setMissions] = useState([]);

  const [
    selectedMissionId,
    setSelectedMissionId,
  ] = useState(null);

  const [
    recommendations,
    setRecommendations,
  ] = useState([]);

  const [
    recognizedPlace,
    setRecognizedPlace,
  ] = useState('');

  const [loading, setLoading] =
    useState(true);

  const [
    recommendationsLoading,
    setRecommendationsLoading,
  ] = useState(false);

  const [error, setError] = useState('');

  const [
    recommendationError,
    setRecommendationError,
  ] = useState('');

  const [
    actionTrainerId,
    setActionTrainerId,
  ] = useState(null);

  const [
    competenceFilters,
    setCompetenceFilters,
  ] = useState([]);

  const [
    materielFilters,
    setMaterielFilters,
  ] = useState([]);

  const [
    openFilter,
    setOpenFilter,
  ] = useState(null);

  const loadMissions =
    useCallback(async () => {
      setLoading(true);
      setError('');

      try {
        const missionsData =
          await getMissions();

        setMissions(missionsData);

        setSelectedMissionId(
          (currentId) => {
            if (
              currentId &&
              missionsData.some(
                (mission) =>
                  mission.id === currentId,
              )
            ) {
              return currentId;
            }

            return (
              missionsData[0]?.id ?? null
            );
          },
        );
      } catch (loadError) {
        console.error(
          'Erreur lors du chargement des missions :',
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

  const selectedMission = useMemo(
    () =>
      missions.find(
        (mission) =>
          mission.id === selectedMissionId,
      ) || null,
    [missions, selectedMissionId],
  );

  useEffect(() => {
    setCompetenceFilters(
      normalizeFilterArray(
        selectedMission?.competences,
      ),
    );

    setMaterielFilters(
      normalizeFilterArray(
        selectedMission?.materiel,
      ),
    );

    setOpenFilter(null);
  }, [
    selectedMissionId,
    selectedMission?.competences,
    selectedMission?.materiel,
  ]);

  const selectedTrainerIds = useMemo(
    () =>
      new Set(
        (
          selectedMission
            ?.mission_formateurs || []
        ).map(
          (missionFormateur) =>
            missionFormateur.formateur_id,
        ),
      ),
    [selectedMission],
  );

  const affectedMissionFormateur = useMemo(
    () =>
      (
        selectedMission
          ?.mission_formateurs || []
      ).find(
        (missionFormateur) =>
          missionFormateur.statut ===
          'affecte',
      ) || null,
    [selectedMission],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadRecommendations() {
      if (!selectedMission) {
        setRecommendations([]);
        setRecognizedPlace('');
        return;
      }

      setRecommendationsLoading(true);
      setRecommendationError('');

      try {
        const result =
          await getMissionRecommendations(
            selectedMission,
          );

        if (cancelled) {
          return;
        }

        setRecommendations(
          result.formateurs,
        );

        setRecognizedPlace(
          result.recognizedPlace || '',
        );
      } catch (loadError) {
        console.error(
          'Erreur lors du classement des formateurs :',
          loadError,
        );

        if (!cancelled) {
          setRecommendations([]);
          setRecognizedPlace('');

          setRecommendationError(
            loadError?.message ||
              'Impossible de classer les formateurs.',
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
  }, [selectedMission]);

  const competenceOptions = useMemo(
    () =>
      collectOptions(
        recommendations,
        'competences',
      ),
    [recommendations],
  );

  const materielOptions = useMemo(
    () =>
      collectOptions(
        recommendations,
        'materiel',
      ),
    [recommendations],
  );

  const filteredRecommendations = useMemo(
    () =>
      recommendations.filter(
        (formateur) => {
          const competenceMatches =
            hasAllSelectedValues(
              formateur.competences,
              competenceFilters,
            );

          const materielMatches =
            hasAllSelectedValues(
              formateur.materiel,
              materielFilters,
            );

          return (
            competenceMatches &&
            materielMatches
          );
        },
      ),
    [
      recommendations,
      competenceFilters,
      materielFilters,
    ],
  );

  const refreshSelectedMission =
    async () => {
      const missionsData =
        await getMissions();

      setMissions(missionsData);
    };

  const handleSelectTrainer = async (
    formateurId,
  ) => {
    if (!selectedMission) {
      return;
    }

    setActionTrainerId(formateurId);
    setRecommendationError('');

    try {
      await selectFormateurForMission(
        selectedMission.id,
        formateurId,
      );

      await refreshSelectedMission();
    } catch (selectionError) {
      console.error(
        'Erreur lors de la sélection du formateur :',
        selectionError,
      );

      setRecommendationError(
        selectionError?.message ||
          'Impossible de sélectionner ce formateur.',
      );
    } finally {
      setActionTrainerId(null);
    }
  };

  const handleTrainerStatusChange = async (
    formateurId,
    statut,
  ) => {
    if (!selectedMission) {
      return;
    }

    if (
      statut === 'affecte' &&
      affectedMissionFormateur &&
      affectedMissionFormateur.formateur_id !==
        formateurId
    ) {
      const currentTrainer =
        affectedMissionFormateur.trainer;

      const currentName = currentTrainer
        ? `${currentTrainer.prenom || ''} ${
            currentTrainer.nom || ''
          }`.trim()
        : 'le formateur actuellement affecté';

      const confirmed = window.confirm(
        `Une personne est déjà affectée à cette mission (${currentName}). Souhaites-tu la remplacer ?`,
      );

      if (!confirmed) {
        return;
      }
    }

    setActionTrainerId(formateurId);
    setRecommendationError('');

    try {
      await updateMissionFormateurStatus(
        selectedMission.id,
        formateurId,
        statut,
      );

      await refreshSelectedMission();
    } catch (statusError) {
      console.error(
        'Erreur lors de la mise à jour du statut du formateur :',
        statusError,
      );

      setRecommendationError(
        statusError?.message ||
          'Impossible de mettre à jour le statut du formateur.',
      );
    } finally {
      setActionTrainerId(null);
    }
  };

  const handleRemoveTrainer = async (
    formateurId,
  ) => {
    if (!selectedMission) {
      return;
    }

    setActionTrainerId(formateurId);
    setRecommendationError('');

    try {
      await removeFormateurFromMission(
        selectedMission.id,
        formateurId,
      );

      await refreshSelectedMission();
    } catch (removeError) {
      console.error(
        'Erreur lors du retrait du formateur :',
        removeError,
      );

      setRecommendationError(
        removeError?.message ||
          'Impossible de retirer ce formateur.',
      );
    } finally {
      setActionTrainerId(null);
    }
  };

  const handleDeleteMission = async (
    mission,
  ) => {
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
      await deleteMission(mission.id);
      await loadMissions();
    } catch (deleteError) {
      console.error(
        'Erreur lors de la suppression de la mission :',
        deleteError,
      );

      setError(
        deleteError?.message ||
          'Impossible de supprimer la mission.',
      );
    }
  };

  return (
    <div style={styles.page}>
      <header style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>
            Missions
          </h1>

          <p style={styles.pageSubtitle}>
            Sélectionne une mission puis
            choisis les formateurs à
            contacter.
          </p>
        </div>

        <Link
          to="/missions/new"
          style={styles.primaryLink}
        >
          + Créer une mission
        </Link>
      </header>

      {error && (
        <ErrorMessage message={error} />
      )}

      {loading ? (
        <div style={styles.loadingCard}>
          Chargement des missions…
        </div>
      ) : missions.length === 0 ? (
        <EmptyState />
      ) : (
        <div style={styles.workspace}>
          <aside style={styles.sidebar}>
            <div
              style={styles.sidebarHeader}
            >
              <strong>
                {missions.length}{' '}
                {missions.length === 1
                  ? 'mission'
                  : 'missions'}
              </strong>
            </div>

            <div
              style={styles.missionList}
            >
              {missions.map((mission) => (
                <MissionListItem
                  key={mission.id}
                  mission={mission}
                  selected={
                    mission.id ===
                    selectedMissionId
                  }
                  onClick={() =>
                    setSelectedMissionId(
                      mission.id,
                    )
                  }
                />
              ))}
            </div>
          </aside>

          <main style={styles.detailPanel}>
            {selectedMission && (
              <>
                <div
                  style={
                    styles.stickyMissionSummary
                  }
                >
                  <CompactMissionSummary
                    mission={
                      selectedMission
                    }
                    affectedMissionFormateur={
                      affectedMissionFormateur
                    }
                    onDelete={() =>
                      handleDeleteMission(
                        selectedMission,
                      )
                    }
                  />
                </div>

                <MissionFilters
                  competenceOptions={
                    competenceOptions
                  }
                  materielOptions={
                    materielOptions
                  }
                  competenceFilters={
                    competenceFilters
                  }
                  materielFilters={
                    materielFilters
                  }
                  setCompetenceFilters={
                    setCompetenceFilters
                  }
                  setMaterielFilters={
                    setMaterielFilters
                  }
                  resultCount={
                    filteredRecommendations.length
                  }
                  openFilter={openFilter}
                  setOpenFilter={
                    setOpenFilter
                  }
                />

                <SelectedTrainers
                  mission={selectedMission}
                  actionTrainerId={
                    actionTrainerId
                  }
                  onRemove={
                    handleRemoveTrainer
                  }
                  onStatusChange={
                    handleTrainerStatusChange
                  }
                />

                <section
                  style={styles.section}
                >
                  <div
                    style={
                      styles.sectionHeader
                    }
                  >
                    <div>
                      <h2
                        style={
                          styles.sectionTitle
                        }
                      >
                        Formateurs recommandés
                      </h2>

                      <p
                        style={
                          styles.sectionDescription
                        }
                      >
                        Classement automatique
                        selon la distance, la
                        disponibilité et le statut
                        du formateur.
                      </p>
                    </div>

                    {recognizedPlace && (
                      <span
                        style={
                          styles.recognizedPlace
                        }
                      >
                        📍 {recognizedPlace}
                      </span>
                    )}
                  </div>

                  {recommendationError && (
                    <ErrorMessage
                      message={
                        recommendationError
                      }
                    />
                  )}

                  {recommendationsLoading ? (
                    <div
                      style={
                        styles.recommendationLoading
                      }
                    >
                      Analyse des formateurs…
                    </div>
                  ) : recommendations.length ===
                    0 ? (
                    <div
                      style={
                        styles.emptyBlock
                      }
                    >
                      Aucun formateur disponible
                      dans la base.
                    </div>
                  ) : filteredRecommendations.length ===
                    0 ? (
                    <div
                      style={
                        styles.emptyBlock
                      }
                    >
                      Aucun formateur ne
                      correspond à l’ensemble des
                      critères sélectionnés.
                    </div>
                  ) : (
                    <div
                      style={
                        styles.recommendationList
                      }
                    >
                      {filteredRecommendations.map(
                        (
                          formateur,
                          index,
                        ) => (
                          <TrainerRecommendation
                            key={
                              formateur.id
                            }
                            rank={
                              index + 1
                            }
                            formateur={
                              formateur
                            }
                            selected={selectedTrainerIds.has(
                              formateur.id,
                            )}
                            unavailable={
                              formateur.availability
                                .status ===
                              'unavailable'
                            }
                            loading={
                              actionTrainerId ===
                              formateur.id
                            }
                            onSelect={() =>
                              handleSelectTrainer(
                                formateur.id,
                              )
                            }
                            onRemove={() =>
                              handleRemoveTrainer(
                                formateur.id,
                              )
                            }
                          />
                        ),
                      )}
                    </div>
                  )}
                </section>
              </>
            )}
          </main>
        </div>
      )}
    </div>
  );
}

function CompactMissionSummary({
  mission,
  affectedMissionFormateur,
  onDelete,
}) {
  return (
    <section
      style={styles.compactSummary}
    >
      <div style={styles.compactTopRow}>
        <div
          style={styles.compactIdentity}
        >
          <MissionStatus
            status={mission.statut}
          />

          <div>
            <h2
              style={styles.compactTitle}
            >
              {mission.intitule ||
                mission.formation ||
                'Mission sans intitulé'}
            </h2>

            {mission.client && (
              <div
                style={
                  styles.compactClient
                }
              >
                {mission.client}
              </div>
            )}

            {affectedMissionFormateur && (
              <div
                style={
                  styles.affectedTrainerLine
                }
              >
                Formateur affecté :{' '}
                <strong>
                  {formatMissionFormateurName(
                    affectedMissionFormateur,
                  )}
                </strong>
              </div>
            )}
          </div>
        </div>

        <div
          style={styles.compactActions}
        >
          <Link
            to={`/missions/edit/${mission.id}`}
            style={styles.editLink}
          >
            Modifier
          </Link>

          <button
            type="button"
            onClick={onDelete}
            style={styles.deleteButton}
          >
            Supprimer
          </button>
        </div>
      </div>

      <div style={styles.compactGrid}>
        <CompactInformation
          label="Lieu"
          value={formatLocation(mission)}
        />

        <CompactInformation
          label="Date"
          value={formatMissionDates(
            mission.mission_dates,
          )}
        />

        <CompactInformation
          label="Horaires"
          value={formatMissionHours(
            mission.mission_dates,
          )}
        />

        <CompactInformation
          label="Formation"
          value={mission.formation}
        />

        <CompactInformation
          label="Compétences"
          value={formatArray(
            mission.competences,
          )}
        />

        <CompactInformation
          label="Matériel"
          value={formatArray(
            mission.materiel,
          )}
        />
      </div>
    </section>
  );
}

function MissionFilters({
  competenceOptions,
  materielOptions,
  competenceFilters,
  materielFilters,
  setCompetenceFilters,
  setMaterielFilters,
  resultCount,
  openFilter,
  setOpenFilter,
}) {
  const hasFilters =
    competenceFilters.length > 0 ||
    materielFilters.length > 0;

  return (
    <section style={styles.filterSection}>
      <div style={styles.filterHeader}>
        <div>
          <h2 style={styles.sectionTitle}>
            Critères de recherche
          </h2>

          <p
            style={
              styles.sectionDescription
            }
          >
            Le formateur doit posséder tous les
            critères sélectionnés.
          </p>
        </div>

        <span
          style={styles.filterResultCount}
        >
          {resultCount}{' '}
          {resultCount === 1
            ? 'formateur'
            : 'formateurs'}
        </span>
      </div>

      <div style={styles.filters}>
        <MultiSelectFilter
          label="Compétences"
          options={competenceOptions}
          selectedValues={
            competenceFilters
          }
          onChange={
            setCompetenceFilters
          }
          emptyLabel="Toutes les compétences"
          isOpen={
            openFilter === 'competences'
          }
          onToggle={() =>
            setOpenFilter(
              openFilter === 'competences'
                ? null
                : 'competences',
            )
          }
          onClose={() =>
            setOpenFilter(null)
          }
        />

        <MultiSelectFilter
          label="Matériel"
          options={materielOptions}
          selectedValues={
            materielFilters
          }
          onChange={setMaterielFilters}
          emptyLabel="Tous les matériels"
          isOpen={
            openFilter === 'materiel'
          }
          onToggle={() =>
            setOpenFilter(
              openFilter === 'materiel'
                ? null
                : 'materiel',
            )
          }
          onClose={() =>
            setOpenFilter(null)
          }
        />

        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setCompetenceFilters([]);
              setMaterielFilters([]);
            }}
            style={
              styles.resetFiltersButton
            }
          >
            Tout réinitialiser
          </button>
        )}
      </div>
    </section>
  );
}

function MultiSelectFilter({
  label,
  options,
  selectedValues,
  onChange,
  emptyLabel,
  isOpen,
  onToggle,
  onClose,
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleOutsideClick = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target,
        )
      ) {
        onClose();
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener(
      'mousedown',
      handleOutsideClick,
    );

    document.addEventListener(
      'keydown',
      handleEscape,
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handleOutsideClick,
      );

      document.removeEventListener(
        'keydown',
        handleEscape,
      );
    };
  }, [isOpen, onClose]);

  const toggleValue = (value) => {
    const normalizedValue =
      normalizeFilterValue(value);

    const isSelected =
      selectedValues.some(
        (selectedValue) =>
          normalizeFilterValue(
            selectedValue,
          ) === normalizedValue,
      );

    if (isSelected) {
      onChange(
        selectedValues.filter(
          (selectedValue) =>
            normalizeFilterValue(
              selectedValue,
            ) !== normalizedValue,
        ),
      );

      return;
    }

    onChange([
      ...selectedValues,
      value,
    ]);
  };

  return (
    <div
      ref={containerRef}
      style={styles.multiSelect}
    >
      <button
        type="button"
        onClick={onToggle}
        style={styles.multiSelectSummary}
        aria-expanded={isOpen}
      >
        <span style={styles.multiSelectLabelBlock}>
          <strong>{label}</strong>

          <span
            style={styles.multiSelectText}
          >
            {selectedValues.length === 0
              ? emptyLabel
              : `${selectedValues.length} sélectionné${
                  selectedValues.length > 1
                    ? 's'
                    : ''
                }`}
          </span>
        </span>

        <span
          aria-hidden="true"
          style={{
            ...styles.chevron,
            transform: isOpen
              ? 'rotate(180deg)'
              : 'rotate(0deg)',
          }}
        >
          ⌄
        </span>
      </button>

      {isOpen && (
        <div
          style={styles.multiSelectMenu}
        >
          <div
            style={
              styles.multiSelectMenuHeader
            }
          >
            <span>
              {selectedValues.length}{' '}
              sélectionné
              {selectedValues.length > 1
                ? 's'
                : ''}
            </span>

            <button
              type="button"
              onClick={onClose}
              style={
                styles.closeFilterButton
              }
              aria-label={`Fermer le filtre ${label}`}
            >
              Fermer
            </button>
          </div>

          {options.length === 0 ? (
            <div
              style={
                styles.multiSelectEmpty
              }
            >
              Aucune option disponible.
            </div>
          ) : (
            options.map((option) => {
              const checked =
                selectedValues.some(
                  (selectedValue) =>
                    normalizeFilterValue(
                      selectedValue,
                    ) ===
                    normalizeFilterValue(
                      option,
                    ),
                );

              return (
                <label
                  key={option}
                  style={
                    styles.checkboxOption
                  }
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      toggleValue(option)
                    }
                  />

                  <span>{option}</span>
                </label>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function MissionListItem({
  mission,
  selected,
  onClick,
}) {
  const dates =
    mission.mission_dates || [];

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...styles.missionItem,
        ...(selected
          ? styles.missionItemSelected
          : {}),
      }}
    >
      <div
        style={styles.missionItemTop}
      >
        <MissionStatus
          status={mission.statut}
        />

        <span
          style={styles.missionDate}
        >
          {formatMissionDates(dates)}
        </span>
      </div>

      <strong
        style={styles.missionItemTitle}
      >
        {mission.intitule ||
          mission.formation ||
          'Mission sans intitulé'}
      </strong>

      {mission.client && (
        <span
          style={styles.missionClient}
        >
          {mission.client}
        </span>
      )}

      <span
        style={styles.missionLocation}
      >
        📍 {formatLocation(mission)}
      </span>

      <span
        style={styles.selectedCount}
      >
        {formatSelectedCount(
          mission.mission_formateurs,
        )}
      </span>
    </button>
  );
}

function SelectedTrainers({
  mission,
  actionTrainerId,
  onRemove,
  onStatusChange,
}) {
  const selectedTrainers = [
    ...(mission.mission_formateurs || []),
  ].sort(compareMissionFormateurs);

  return (
    <section style={styles.section}>
      <div
        style={styles.sectionHeader}
      >
        <div>
          <h2 style={styles.sectionTitle}>
            Suivi des formateurs
          </h2>

          <p
            style={
              styles.sectionDescription
            }
          >
            Sélection, proposition, réponse
            puis affectation à la mission.
          </p>
        </div>

        <span style={styles.counter}>
          {selectedTrainers.length}
        </span>
      </div>

      {selectedTrainers.length === 0 ? (
        <div style={styles.emptyBlock}>
          Aucun formateur sélectionné.
        </div>
      ) : (
        <div
          style={
            styles.selectedTrainerList
          }
        >
          {selectedTrainers.map(
            (missionFormateur) => {
              const trainer =
                missionFormateur.trainer;

              const formateurId =
                missionFormateur.formateur_id;

              const isLoading =
                actionTrainerId ===
                formateurId;

              return (
                <div
                  key={
                    missionFormateur.id
                  }
                  style={{
                    ...styles.selectedTrainer,
                    ...(missionFormateur.statut ===
                    'affecte'
                      ? styles.affectedTrainer
                      : {}),
                  }}
                >
                  <div
                    style={
                      styles.selectedTrainerMain
                    }
                  >
                    <div
                      style={
                        styles.selectedTrainerHeading
                      }
                    >
                      <strong>
                        {trainer
                          ? `${trainer.prenom || ''} ${
                              trainer.nom || ''
                            }`.trim()
                          : 'Formateur'}
                      </strong>

                      <TrainerMissionStatus
                        status={
                          missionFormateur.statut
                        }
                      />
                    </div>

                    <div
                      style={
                        styles.selectedTrainerMeta
                      }
                    >
                      {formatMissionTrainerTimeline(
                        missionFormateur,
                      )}
                    </div>

                    {missionFormateur.statut ===
                      'accepte' && (
                      <div
                        style={
                          styles.acceptedNotice
                        }
                      >
                        Le formateur a accepté, mais
                        la mission n’est pas encore
                        confirmée. Affecte-la
                        rapidement pour la sécuriser.
                        Tant que ce n’est pas fait, il
                        reste disponible.
                      </div>
                    )}

                    {missionFormateur.statut ===
                      'indisponible_affecte_ailleurs' && (
                      <div
                        style={
                          styles.unavailableNotice
                        }
                      >
                        Le formateur avait accepté,
                        mais il n’est désormais plus
                        disponible sur cette période.
                        Aucune information sur son
                        autre engagement n’est
                        communiquée.
                      </div>
                    )}
                  </div>

                  <div
                    style={
                      styles.selectedTrainerActions
                    }
                  >
                    {missionFormateur.statut ===
                      'selectionne' && (
                      <button
                        type="button"
                        onClick={() =>
                          onStatusChange(
                            formateurId,
                            'proposition_envoyee',
                          )
                        }
                        disabled={isLoading}
                        style={
                          styles.proposeButton
                        }
                      >
                        {isLoading
                          ? 'Enregistrement…'
                          : 'Proposer la mission'}
                      </button>
                    )}

                    {missionFormateur.statut ===
                      'proposition_envoyee' && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            onStatusChange(
                              formateurId,
                              'accepte',
                            )
                          }
                          disabled={isLoading}
                          style={
                            styles.acceptButton
                          }
                        >
                          Simuler accepter
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            onStatusChange(
                              formateurId,
                              'refuse',
                            )
                          }
                          disabled={isLoading}
                          style={
                            styles.refuseButton
                          }
                        >
                          Simuler refuser
                        </button>
                      </>
                    )}

                    {missionFormateur.statut ===
                      'accepte' && (
                      <button
                        type="button"
                        onClick={() =>
                          onStatusChange(
                            formateurId,
                            'affecte',
                          )
                        }
                        disabled={isLoading}
                        style={
                          styles.affectButton
                        }
                      >
                        {isLoading
                          ? 'Enregistrement…'
                          : 'Affecter'}
                      </button>
                    )}

                    {[
                      'proposition_envoyee',
                      'accepte',
                      'refuse',
                    ].includes(
                      missionFormateur.statut,
                    ) && (
                      <button
                        type="button"
                        onClick={() =>
                          onStatusChange(
                            formateurId,
                            'selectionne',
                          )
                        }
                        disabled={isLoading}
                        style={
                          styles.resetStatusButton
                        }
                      >
                        Réinitialiser
                      </button>
                    )}

                    {missionFormateur.statut ===
                      'affecte' && (
                      <button
                        type="button"
                        onClick={() => {
                          const confirmed =
                            window.confirm(
                              'Retirer l’affectation de ce formateur ? La mission repassera à « À pourvoir ».',
                            );

                          if (confirmed) {
                            onStatusChange(
                              formateurId,
                              'accepte',
                            );
                          }
                        }}
                        disabled={isLoading}
                        style={
                          styles.resetStatusButton
                        }
                      >
                        Désaffecter
                      </button>
                    )}

                    {missionFormateur.statut !==
                      'affecte' && (
                      <button
                        type="button"
                        onClick={() =>
                          onRemove(formateurId)
                        }
                        disabled={isLoading}
                        style={
                          styles.removeButton
                        }
                      >
                        Retirer
                      </button>
                    )}
                  </div>
                </div>
              );
            },
          )}
        </div>
      )}
    </section>
  );
}

function TrainerMissionStatus({ status }) {
  const config = {
    selectionne: {
      label: 'Sélectionné',
      background: '#f2f4f7',
      color: '#475467',
    },

    proposition_envoyee: {
      label: 'Proposition envoyée',
      background: '#eff8ff',
      color: '#175cd3',
    },

    accepte: {
      label: 'Accepté',
      background: '#ecfdf3',
      color: '#067647',
    },

    refuse: {
      label: 'Refusé',
      background: '#fef3f2',
      color: '#b42318',
    },

    indisponible_affecte_ailleurs: {
      label: 'Indisponible',
      background: '#fff6ed',
      color: '#c4320a',
    },

    affecte: {
      label: 'Affecté',
      background: '#f4f3ff',
      color: '#5925dc',
    },

    annule: {
      label: 'Annulé',
      background: '#f2f4f7',
      color: '#475467',
    },
  };

  const appearance =
    config[status] ||
    config.selectionne;

  return (
    <span
      style={{
        ...styles.trainerMissionStatus,
        background:
          appearance.background,
        color: appearance.color,
      }}
    >
      {appearance.label}
    </span>
  );
}

function TrainerRecommendation({
  rank,
  formateur,
  selected,
  unavailable,
  loading,
  onSelect,
  onRemove,
}) {
  return (
    <article style={styles.trainerCard}>
      <div style={styles.rank}>
        #{rank}
      </div>

      <div style={styles.trainerMain}>
        <div
          style={styles.trainerHeading}
        >
          <div style={styles.trainerIdentity}>
            <h3
              style={styles.trainerName}
            >
              {`${formateur.prenom} ${formateur.nom}`.trim() ||
                'Formateur sans nom'}
            </h3>

            <span
              style={
                styles.trainerLocation
              }
            >
              {[formateur.codePostal, formateur.ville]
                .filter(Boolean)
                .join(' ') ||
                'Ville non renseignée'}
            </span>
          </div>

          <div style={styles.score}>
            {formateur.score}
          </div>
        </div>

        <div style={styles.badges}>
          <TrainerStatus
            status={formateur.statut}
          />

          <AvailabilityBadge
            availability={
              formateur.availability
            }
          />

          {formateur.availability.reason ===
            'affected_mission' && (
            <span
              style={styles.confidentialInfo}
              title="Le formateur est déjà affecté sur cette période. Les détails de l’autre engagement restent confidentiels."
            >
              ⓘ
            </span>
          )}

          <span
            style={styles.neutralBadge}
          >
            {formateur.distance === null
              ? 'Distance inconnue'
              : `${Math.round(
                  formateur.distance,
                )} km`}
          </span>
        </div>

        {(formateur.competences.length >
          0 ||
          formateur.materiel.length >
            0) && (
          <div
            style={
              styles.trainerDetails
            }
          >
            {formateur.competences
              .length > 0 && (
              <div>
                <strong>
                  Compétences :
                </strong>{' '}
                {formateur.competences.join(
                  ', ',
                )}
              </div>
            )}

            {formateur.materiel.length >
              0 && (
              <div>
                <strong>
                  Matériel :
                </strong>{' '}
                {formateur.materiel.join(
                  ', ',
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div
        style={styles.trainerAction}
      >
        <button
          type="button"
          onClick={
            selected
              ? onRemove
              : onSelect
          }
          disabled={
            loading ||
            (!selected && unavailable)
          }
          style={
            selected
              ? styles.selectedButton
              : unavailable
                ? styles.unavailableButton
                : styles.selectButton
          }
        >
          {loading
            ? 'Enregistrement…'
            : selected
              ? 'Sélectionné ✓'
              : unavailable
                ? 'Indisponible'
                : 'Sélectionner'}
        </button>
      </div>
    </article>
  );
}

function CompactInformation({
  label,
  value,
}) {
  return (
    <div
      style={styles.compactInformation}
    >
      <span
        style={
          styles.compactInformationLabel
        }
      >
        {label}
      </span>

      <span
        style={
          styles.compactInformationValue
        }
        title={value || ''}
      >
        {value || 'Non renseigné'}
      </span>
    </div>
  );
}

function ErrorMessage({ message }) {
  return (
    <div style={styles.error}>
      <strong>
        Une erreur est survenue.
      </strong>

      <span>{message}</span>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={styles.emptyState}>
      <div style={styles.emptyIcon}>
        📋
      </div>

      <h2 style={styles.emptyTitle}>
        Aucune mission enregistrée
      </h2>

      <p style={styles.emptyText}>
        Crée une première mission pour
        lancer le moteur de sélection.
      </p>

      <Link
        to="/missions/new"
        style={styles.primaryLink}
      >
        Créer une mission
      </Link>
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
        ...styles.statusBadge,
        background,
        color,
      }}
    >
      {label}
    </span>
  );
}

function TrainerStatus({ status }) {
  const normalized = String(
    status || '',
  ).toLowerCase();

  let background = '#f2f4f7';
  let color = '#475467';

  if (normalized === 'premium') {
    background = '#f4f3ff';
    color = '#5925dc';
  }

  if (normalized === 'standard') {
    background = '#eff8ff';
    color = '#175cd3';
  }

  if (normalized === 'inactif') {
    background = '#fff6ed';
    color = '#c4320a';
  }

  if (normalized === 'black') {
    background = '#fef3f2';
    color = '#b42318';
  }

  return (
    <span
      style={{
        ...styles.neutralBadge,
        background,
        color,
      }}
    >
      {status || 'Statut inconnu'}
    </span>
  );
}

function AvailabilityBadge({
  availability,
}) {
  const config = {
    available: {
      background: '#ecfdf3',
      color: '#067647',
    },

    partial: {
      background: '#fffaeb',
      color: '#b54708',
    },

    unavailable: {
      background: '#fef3f2',
      color: '#b42318',
    },

    unknown: {
      background: '#f2f4f7',
      color: '#475467',
    },
  };

  const appearance =
    config[availability.status] ||
    config.unknown;

  return (
    <span
      style={{
        ...styles.neutralBadge,
        ...appearance,
      }}
    >
      {availability.label}
    </span>
  );
}

function collectOptions(
  recommendations,
  key,
) {
  const optionMap = new Map();

  recommendations.forEach(
    (formateur) => {
      (formateur[key] || []).forEach(
        (value) => {
          const normalizedValue =
            normalizeFilterValue(value);

          if (
            normalizedValue &&
            !optionMap.has(
              normalizedValue,
            )
          ) {
            optionMap.set(
              normalizedValue,
              value,
            );
          }
        },
      );
    },
  );

  return [...optionMap.values()].sort(
    (first, second) =>
      first.localeCompare(
        second,
        'fr',
      ),
  );
}

function hasAllSelectedValues(
  trainerValues = [],
  selectedValues = [],
) {
  if (selectedValues.length === 0) {
    return true;
  }

  const normalizedTrainerValues =
    new Set(
      trainerValues.map(
        normalizeFilterValue,
      ),
    );

  return selectedValues.every(
    (selectedValue) =>
      normalizedTrainerValues.has(
        normalizeFilterValue(
          selectedValue,
        ),
      ),
  );
}

function normalizeFilterArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(Boolean);
}

function normalizeFilterValue(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function formatLocation(mission) {
  return [
    mission.lieu,
    mission.adresse,
    [
      mission.code_postal,
      mission.ville,
    ]
      .filter(Boolean)
      .join(' '),
  ]
    .filter(Boolean)
    .join(' — ');
}

function formatMissionDates(
  dates = [],
) {
  if (dates.length === 0) {
    return 'Date non renseignée';
  }

  const sortedDates = [
    ...dates,
  ].sort((first, second) =>
    first.date.localeCompare(
      second.date,
    ),
  );

  if (sortedDates.length === 1) {
    return formatDate(
      sortedDates[0].date,
    );
  }

  return `${formatDate(
    sortedDates[0].date,
  )} au ${formatDate(
    sortedDates[
      sortedDates.length - 1
    ].date,
  )} · ${sortedDates.length} jours`;
}

function formatMissionHours(
  dates = [],
) {
  if (dates.length === 0) {
    return '';
  }

  const firstDate = [
    ...dates,
  ].sort((first, second) =>
    first.date.localeCompare(
      second.date,
    ),
  )[0];

  return `${formatTime(
    firstDate.heure_debut,
  )} – ${formatTime(
    firstDate.heure_fin,
  )}`;
}

function formatDate(value) {
  if (!value) {
    return '';
  }

  return new Intl.DateTimeFormat(
    'fr-FR',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    },
  ).format(
    new Date(`${value}T12:00:00`),
  );
}

function formatTime(value) {
  return value
    ? value
        .slice(0, 5)
        .replace(':', 'h')
    : '—';
}

function formatSelectedCount(
  missionFormateurs = [],
) {
  const affected =
    missionFormateurs.find(
      (missionFormateur) =>
        missionFormateur.statut ===
        'affecte',
    );

  if (affected) {
    return `Affecté : ${formatMissionFormateurName(
      affected,
    )}`;
  }

  const count =
    missionFormateurs.length;

  if (count === 0) {
    return 'Aucun formateur sélectionné';
  }

  return count === 1
    ? '1 formateur en suivi'
    : `${count} formateurs en suivi`;
}

function formatMissionFormateurName(
  missionFormateur,
) {
  const trainer =
    missionFormateur?.trainer;

  if (!trainer) {
    return 'Formateur';
  }

  return `${trainer.prenom || ''} ${
    trainer.nom || ''
  }`.trim() || 'Formateur';
}

function compareMissionFormateurs(
  first,
  second,
) {
  const priority = {
    affecte: 0,
    accepte: 1,
    proposition_envoyee: 2,
    selectionne: 3,
    indisponible_affecte_ailleurs: 4,
    refuse: 5,
    annule: 6,
  };

  const firstPriority =
    priority[first.statut] ?? 99;

  const secondPriority =
    priority[second.statut] ?? 99;

  if (firstPriority !== secondPriority) {
    return firstPriority - secondPriority;
  }

  return formatMissionFormateurName(
    first,
  ).localeCompare(
    formatMissionFormateurName(second),
    'fr',
  );
}

function formatMissionTrainerTimeline(
  missionFormateur,
) {
  const status =
    missionFormateur.statut;

  if (
    status === 'proposition_envoyee' &&
    missionFormateur.propose_le
  ) {
    return `Proposition envoyée le ${formatDateTime(
      missionFormateur.propose_le,
    )}`;
  }

  if (
    (status === 'accepte' ||
      status === 'refuse') &&
    missionFormateur.repondu_le
  ) {
    return `Réponse enregistrée le ${formatDateTime(
      missionFormateur.repondu_le,
    )}`;
  }

  if (
    status ===
    'indisponible_affecte_ailleurs'
  ) {
    return 'Indisponibilité détectée automatiquement après une autre affectation.';
  }

  if (
    status === 'affecte' &&
    missionFormateur.affecte_le
  ) {
    return `Affectation enregistrée le ${formatDateTime(
      missionFormateur.affecte_le,
    )}`;
  }

  return 'Aucune proposition envoyée.';
}

function formatDateTime(value) {
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
  ).format(new Date(value));
}

function formatTrainerMissionStatus(
  status,
) {
  const labels = {
    selectionne: 'Sélectionné',
    proposition_envoyee:
      'Proposition envoyée',
    accepte: 'Accepté',
    refuse: 'Refusé',
    indisponible_affecte_ailleurs:
      'Indisponible',
    affecte: 'Affecté',
    annule: 'Annulé',
  };

  return labels[status] || status;
}

function formatArray(value) {
  if (
    !Array.isArray(value) ||
    value.length === 0
  ) {
    return '';
  }

  return value.join(', ');
}

const styles = {
  page: {
    maxWidth: 1450,
    margin: '0 auto',
    padding: '8px 0 40px',
  },

  pageHeader: {
    display: 'flex',
    justifyContent:
      'space-between',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 10,
  },

  pageTitle: {
    margin: 0,
    color: '#172033',
    fontSize: 26,
  },

  pageSubtitle: {
    margin: '4px 0 0',
    color: '#667085',
    fontSize: 14,
  },

  primaryLink: {
    display: 'inline-flex',
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
    padding: '8px 13px',
    borderRadius: 8,
    background: '#175cd3',
    color: '#ffffff',
    fontWeight: 700,
    textDecoration: 'none',
  },

  workspace: {
    display: 'grid',
    gridTemplateColumns:
      'minmax(280px, 350px) minmax(0, 1fr)',
    height:
      'calc(100vh - 175px)',
    minHeight: 620,
    overflow: 'hidden',
    border:
      '1px solid #e4e7ec',
    borderRadius: 14,
    background: '#ffffff',
    boxShadow:
      '0 4px 16px rgba(16, 24, 40, 0.05)',
  },

  sidebar: {
    overflowY: 'auto',
    borderRight:
      '1px solid #e4e7ec',
    background: '#f9fafb',
  },

  sidebarHeader: {
    position: 'sticky',
    top: 0,
    zIndex: 2,
    padding: '17px 18px',
    borderBottom:
      '1px solid #e4e7ec',
    background: '#f9fafb',
    color: '#344054',
  },

  missionList: {
    display: 'grid',
  },

  missionItem: {
    display: 'grid',
    gap: 7,
    width: '100%',
    padding: 17,
    border: 0,
    borderBottom:
      '1px solid #e4e7ec',
    background: 'transparent',
    textAlign: 'left',
    cursor: 'pointer',
  },

  missionItemSelected: {
    background: '#eff8ff',
    boxShadow:
      'inset 4px 0 0 #175cd3',
  },

  missionItemTop: {
    display: 'flex',
    justifyContent:
      'space-between',
    alignItems: 'center',
    gap: 8,
  },

  missionDate: {
    color: '#667085',
    fontSize: 10,
  },

  missionItemTitle: {
    color: '#172033',
    fontSize: 15,
  },

  missionClient: {
    color: '#475467',
    fontSize: 13,
    fontWeight: 600,
  },

  missionLocation: {
    overflow: 'hidden',
    color: '#667085',
    fontSize: 13,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  selectedCount: {
    color: '#175cd3',
    fontSize: 10,
    fontWeight: 600,
  },

  detailPanel: {
    minWidth: 0,
    overflowY: 'auto',
    padding: '0 24px 24px',
    background: '#ffffff',
  },

  stickyMissionSummary: {
    position: 'sticky',
    top: 0,
    zIndex: 10,
    paddingTop: 12,
    paddingBottom: 8,
    background: '#ffffff',
    boxShadow:
      '0 10px 14px -16px rgba(16, 24, 40, 0.6)',
  },

  compactSummary: {
    padding: '12px 14px',
    border:
      '1px solid #e4e7ec',
    borderRadius: 8,
    background: '#ffffff',
  },

  compactTopRow: {
    display: 'flex',
    justifyContent:
      'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },

  compactIdentity: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    minWidth: 0,
  },

  compactTitle: {
    margin: 0,
    color: '#172033',
    fontSize: 18,
    lineHeight: 1.2,
  },

  compactClient: {
    marginTop: 2,
    color: '#667085',
    fontSize: 13,
    fontWeight: 600,
  },

  affectedTrainerLine: {
    marginTop: 4,
    color: '#5925dc',
    fontSize: 11,
  },

  compactActions: {
    display: 'flex',
    gap: 8,
    flexShrink: 0,
  },

  editLink: {
    display: 'inline-flex',
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
    padding: '7px 12px',
    border:
      '1px solid #175cd3',
    borderRadius: 7,
    background: '#175cd3',
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 700,
    textDecoration: 'none',
  },

  deleteButton: {
    minHeight: 34,
    padding: '7px 12px',
    border:
      '1px solid #fda29b',
    borderRadius: 7,
    background: '#ffffff',
    color: '#b42318',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },

  compactGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(6, minmax(0, 1fr))',
    gap: 10,
    marginTop: 10,
    paddingTop: 10,
    borderTop:
      '1px solid #f2f4f7',
  },

  compactInformation: {
    display: 'grid',
    minWidth: 0,
    gap: 3,
  },

  compactInformationLabel: {
    color: '#667085',
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase',
  },

  compactInformationValue: {
    overflow: 'hidden',
    color: '#344054',
    fontSize: 10,
    lineHeight: 1.35,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  filterSection: {
    padding: '12px 0',
    borderBottom:
      '1px solid #e4e7ec',
  },

  filterHeader: {
    display: 'flex',
    justifyContent:
      'space-between',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 8,
  },

  filters: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: 12,
  },

  multiSelect: {
    position: 'relative',
    width: 235,
  },

  multiSelectSummary: {
    display: 'flex',
    width: '100%',
    minHeight: 38,
    alignItems: 'center',
    justifyContent:
      'space-between',
    gap: 12,
    boxSizing: 'border-box',
    padding: '6px 10px',
    border:
      '1px solid #d0d5dd',
    borderRadius: 8,
    background: '#ffffff',
    color: '#344054',
    cursor: 'pointer',
  },

  multiSelectLabelBlock: {
    display: 'grid',
    gap: 1,
    textAlign: 'left',
  },

  chevron: {
    color: '#667085',
    fontSize: 10,
    transition: 'transform 0.15s ease',
  },

  multiSelectText: {
    display: 'block',
    marginTop: 2,
    color: '#667085',
    fontSize: 10,
    fontWeight: 400,
  },

  multiSelectMenu: {
    position: 'absolute',
    top: 'calc(100% + 5px)',
    left: 0,
    zIndex: 30,
    display: 'grid',
    width: '100%',
    maxHeight: 230,
    overflowY: 'auto',
    boxSizing: 'border-box',
    padding: 6,
    border:
      '1px solid #d0d5dd',
    borderRadius: 8,
    background: '#ffffff',
    boxShadow:
      '0 8px 24px rgba(16, 24, 40, 0.14)',
  },

  checkboxOption: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 7px',
    borderRadius: 6,
    color: '#344054',
    fontSize: 13,
    cursor: 'pointer',
  },

  multiSelectEmpty: {
    padding: 6,
    color: '#667085',
    fontSize: 13,
  },

  resetFiltersButton: {
    minHeight: 38,
    padding: '8px 12px',
    border:
      '1px solid #d0d5dd',
    borderRadius: 8,
    background: '#ffffff',
    color: '#344054',
    fontWeight: 600,
    cursor: 'pointer',
  },

  filterResultCount: {
    color: '#667085',
    fontSize: 13,
    fontWeight: 600,
  },

  section: {
    padding: '14px 0',
    borderBottom:
      '1px solid #e4e7ec',
  },

  sectionHeader: {
    display: 'flex',
    justifyContent:
      'space-between',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 10,
  },

  sectionTitle: {
    margin: 0,
    color: '#172033',
    fontSize: 16,
  },

  sectionDescription: {
    margin: '3px 0 0',
    color: '#667085',
    fontSize: 10,
  },

  counter: {
    display: 'inline-flex',
    minWidth: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    background: '#eff8ff',
    color: '#175cd3',
    fontWeight: 700,
  },

  selectedTrainerList: {
    display: 'grid',
    gap: 9,
  },

  selectedTrainer: {
    display: 'flex',
    justifyContent:
      'space-between',
    alignItems: 'center',
    gap: 12,
    padding: '10px 12px',
    border:
      '1px solid #b2ddff',
    borderRadius: 9,
    background: '#eff8ff',
  },

  affectedTrainer: {
    border: '1px solid #9b8afb',
    background: '#f4f3ff',
    boxShadow:
      'inset 3px 0 0 #7f56d9',
  },

  selectedTrainerMeta: {
    marginTop: 3,
    color: '#475467',
    fontSize: 10,
  },

  selectedTrainerMain: {
    display: 'grid',
    minWidth: 0,
    gap: 4,
  },

  selectedTrainerHeading: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },

  selectedTrainerActions: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 6,
  },

  trainerMissionStatus: {
    display: 'inline-flex',
    padding: '3px 7px',
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 700,
  },

  proposeButton: {
    minHeight: 32,
    padding: '6px 10px',
    border: '1px solid #175cd3',
    borderRadius: 7,
    background: '#175cd3',
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
  },

  acceptButton: {
    minHeight: 32,
    padding: '6px 10px',
    border: '1px solid #75e0a7',
    borderRadius: 7,
    background: '#ecfdf3',
    color: '#067647',
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
  },

  refuseButton: {
    minHeight: 32,
    padding: '6px 10px',
    border: '1px solid #fda29b',
    borderRadius: 7,
    background: '#fef3f2',
    color: '#b42318',
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
  },

  affectButton: {
    minHeight: 32,
    padding: '6px 10px',
    border: '1px solid #9b8afb',
    borderRadius: 7,
    background: '#f4f3ff',
    color: '#5925dc',
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
  },

  resetStatusButton: {
    minHeight: 32,
    padding: '6px 9px',
    border: '1px solid #d0d5dd',
    borderRadius: 7,
    background: '#ffffff',
    color: '#475467',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
  },

  removeButton: {
    minHeight: 34,
    padding: '6px 10px',
    border:
      '1px solid #d0d5dd',
    borderRadius: 7,
    background: '#ffffff',
    color: '#344054',
    fontWeight: 600,
    cursor: 'pointer',
  },

  acceptedNotice: {
    marginTop: 4,
    maxWidth: 620,
    color: '#067647',
    fontSize: 10,
    lineHeight: 1.4,
  },

  unavailableNotice: {
    marginTop: 4,
    maxWidth: 620,
    color: '#c4320a',
    fontSize: 10,
    lineHeight: 1.4,
  },

  confidentialInfo: {
    display: 'inline-flex',
    alignItems: 'center',
    color: '#667085',
    fontSize: 12,
    cursor: 'help',
  },

  unavailableButton: {
    minWidth: 92,
    minHeight: 32,
    padding: '6px 10px',
    border: '1px solid #d0d5dd',
    borderRadius: 8,
    background: '#f2f4f7',
    color: '#667085',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'not-allowed',
  },

  recommendationList: {
    display: 'grid',
    gap: 7,
  },

  trainerCard: {
    display: 'grid',
    gridTemplateColumns:
      '32px minmax(0, 1fr) auto',
    gap: 10,
    alignItems: 'center',
    padding: '10px 12px',
    border:
      '1px solid #e4e7ec',
    borderRadius: 8,
    background: '#ffffff',
  },

  rank: {
    display: 'flex',
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    background: '#f2f4f7',
    color: '#475467',
    fontSize: 10,
    fontWeight: 800,
  },

  trainerMain: {
    minWidth: 0,
  },

  trainerHeading: {
    display: 'flex',
    justifyContent:
      'space-between',
    alignItems: 'center',
    gap: 10,
  },

  trainerIdentity: {
    display: 'flex',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: 8,
    minWidth: 0,
  },

  trainerName: {
    margin: 0,
    color: '#172033',
    fontSize: 14,
  },

  trainerLocation: {
    marginTop: 3,
    color: '#667085',
    fontSize: 10,
  },

  score: {
    flexShrink: 0,
    color: '#175cd3',
    fontSize: 10,
    fontWeight: 700,
  },

  badges: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 6,
  },

  neutralBadge: {
    display: 'inline-flex',
    padding: '3px 6px',
    borderRadius: 999,
    background: '#f2f4f7',
    color: '#475467',
    fontSize: 10,
    fontWeight: 700,
  },

  statusBadge: {
    display: 'inline-flex',
    padding: '3px 6px',
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 700,
  },

  trainerDetails: {
    display: 'grid',
    gap: 4,
    marginTop: 10,
    color: '#475467',
    fontSize: 10,
    lineHeight: 1.4,
  },

  trainerAction: {
    display: 'flex',
    alignItems: 'center',
  },

  selectButton: {
    minWidth: 92,
    minHeight: 32,
    padding: '6px 10px',
    border:
      '1px solid #175cd3',
    borderRadius: 8,
    background: '#175cd3',
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
  },

  selectedButton: {
    minWidth: 92,
    minHeight: 32,
    padding: '6px 10px',
    border:
      '1px solid #75e0a7',
    borderRadius: 8,
    background: '#ecfdf3',
    color: '#067647',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
  },

  recognizedPlace: {
    maxWidth: 390,
    color: '#475467',
    fontSize: 10,
    textAlign: 'right',
  },

  recommendationLoading: {
    padding: 18,
    borderRadius: 9,
    background: '#f9fafb',
    color: '#475467',
  },

  emptyBlock: {
    padding: 16,
    border:
      '1px dashed #d0d5dd',
    borderRadius: 9,
    background: '#f9fafb',
    color: '#667085',
    textAlign: 'center',
  },

  loadingCard: {
    padding: 24,
    border:
      '1px solid #e4e7ec',
    borderRadius: 12,
    background: '#ffffff',
    color: '#475467',
  },

  error: {
    display: 'grid',
    gap: 4,
    marginBottom: 16,
    padding: 13,
    border:
      '1px solid #fda29b',
    borderRadius: 9,
    background: '#fef3f2',
    color: '#b42318',
  },

  emptyState: {
    display: 'grid',
    justifyItems: 'center',
    gap: 12,
    padding: '60px 20px',
    border:
      '1px dashed #d0d5dd',
    borderRadius: 14,
    background: '#ffffff',
    textAlign: 'center',
  },

  emptyIcon: {
    fontSize: 38,
  },

  emptyTitle: {
    margin: 0,
    color: '#172033',
  },

  emptyText: {
    margin: 0,
    color: '#667085',
  },
};
