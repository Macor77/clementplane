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
  getMissionTrainerHistory,
  getPendingMissionChangeForOrganization,
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
    missionHistory,
    setMissionHistory,
  ] = useState([]);

  const [
    expandedHistoryTrainerId,
    setExpandedHistoryTrainerId,
  ] = useState(null);

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

  const [unassignTrainerId, setUnassignTrainerId] = useState(null);
  const [pendingMissionChange, setPendingMissionChange] = useState(null);

  const loadMission =
    useCallback(async () => {
      setLoading(true);
      setError('');

      try {
        const [
          data,
          historyRows,
          pendingChangeRow,
        ] = await Promise.all([
          getMissionById(id),
          getMissionTrainerHistory(id),
          getPendingMissionChangeForOrganization(id),
        ]);

        setMission(data);
        setMissionHistory(
          historyRows,
        );
        setPendingMissionChange(
          pendingChangeRow,
        );

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
    const [
      data,
      historyRows,
    ] = await Promise.all([
      getMissionById(id),
      getMissionTrainerHistory(id),
    ]);

    setMission(data);
    setMissionHistory(
      historyRows,
    );
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

    if (
      status === 'accepte' &&
      affectedTrainer?.formateur_id === trainerId
    ) {
      setUnassignTrainerId(trainerId);
      return;
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
      {unassignTrainerId ? (
        <div style={styles.modalBackdrop}>
          <div style={styles.confirmModal}>
            <p style={styles.modalEyebrow}>AFFECTATION CONFIRMÉE</p>
            <h2 style={styles.modalTitle}>Désaffecter ce formateur ?</h2>
            <p style={styles.modalText}>Cette action retire une affectation déjà confirmée. La mission repassera à affecter.</p>
            <div style={styles.modalWarning}><strong>Important</strong><span>Pensez à prévenir directement le formateur par téléphone, e-mail ou tout autre moyen habituel.</span></div>
            <div style={styles.modalActions}>
              <button type="button" style={styles.modalCancel} onClick={() => setUnassignTrainerId(null)}>Annuler</button>
              <button type="button" style={styles.modalDanger} onClick={async () => { const trainerId = unassignTrainerId; setUnassignTrainerId(null); setActionTrainerId(trainerId); setError(''); try { await updateMissionFormateurStatus(id, trainerId, 'accepte'); await refresh(); } catch (actionError) { setError(actionError?.message || 'Impossible de retirer l’affectation.'); } finally { setActionTrainerId(null); } }}>Confirmer la désaffectation</button>
            </div>
          </div>
        </div>
      ) : null}
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
          missionId={id}
          onDelete={handleDelete}
          pendingMissionChange={pendingMissionChange}
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
            history={missionHistory}
            expandedHistoryTrainerId={
              expandedHistoryTrainerId
            }
            setExpandedHistoryTrainerId={
              setExpandedHistoryTrainerId
            }
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
            pendingMissionChange={
              pendingMissionChange
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
  missionId,
  onDelete,
  pendingMissionChange,
}) {
  const missionDates = [
    ...(mission.mission_dates || []),
  ].sort((first, second) =>
    first.date.localeCompare(second.date),
  );

  const firstDate =
    missionDates[0] || null;

  const lastDate =
    missionDates[
      missionDates.length - 1
    ] || null;

  const acceptedTrainers = (
    mission.mission_formateurs || []
  ).filter(
    (item) => item.statut === 'accepte',
  );

  const pendingProposals = (
    mission.mission_formateurs || []
  ).filter(
    (item) =>
      item.statut ===
      'proposition_envoyee',
  );

  const missionSituation =
    getMissionSituation({
      mission,
      affectedTrainer,
      acceptedTrainers,
      pendingProposals,
      pendingMissionChange,
    });

  return (
    <section style={styles.infoCard}>
      <div style={styles.infoHeader}>
        <div>
          <h2 style={styles.infoTitle}>
            Informations de la mission
          </h2>

          <p style={styles.infoSubtitle}>
            Les informations essentielles de la
            session en un coup d’œil.
          </p>
        </div>

        <MissionSituationBadge
          situation={missionSituation}
        />
      </div>

      <div style={styles.missionSummary}>
        <SummaryItem
          icon="📅"
          label="Quand ?"
          value={formatMissionPeriod(
            missionDates,
          )}
          detail={formatMissionHours(
            firstDate,
            lastDate,
          )}
        />

        <SummaryItem
          icon="📍"
          label="Où ?"
          value={
            [
              mission.code_postal,
              mission.ville,
            ]
              .filter(Boolean)
              .join(' ') ||
            mission.lieu ||
            'Lieu non renseigné'
          }
          detail={
            mission.lieu &&
            mission.lieu !== mission.ville
              ? mission.lieu
              : ''
          }
        />

        <SummaryItem
          icon="👤"
          label="Avec qui ?"
          value={
            affectedTrainer
              ? formatTrainerName(
                  affectedTrainer.trainer,
                )
              : missionSituation.summary
          }
          detail={
            pendingMissionChange
              ? missionSituation.detail
              : affectedTrainer
                ? 'Formateur affecté'
                : missionSituation.detail
          }
        />
      </div>

      <div style={styles.infoBlocks}>
        <InformationBlock
          title="Mission"
          items={[
            {
              label: 'Référence',
              value:
                mission.intitule ||
                'Non renseignée',
            },
            {
              label: 'Client',
              value:
                mission.client ||
                'Non renseigné',
            },
            {
              label: 'Formation',
              value:
                mission.formation ||
                'Non renseignée',
            },
          ]}
        />

        <InformationBlock
          title="Lieu"
          items={[
            {
              label: 'Site',
              value:
                mission.lieu ||
                'Non renseigné',
            },
            {
              label: 'Adresse',
              value:
                mission.adresse ||
                'Non renseignée',
            },
            {
              label: 'Ville',
              value:
                [
                  mission.code_postal,
                  mission.ville,
                ]
                  .filter(Boolean)
                  .join(' ') ||
                'Non renseignée',
            },
          ]}
        />

        <InformationBlock
          title="Besoins formateur"
          items={[
            {
              label: 'Compétences',
              value: formatArray(
                mission.competences,
              ),
            },
            {
              label: 'Matériel',
              value: formatArray(
                mission.materiel,
              ),
            },
          ]}
        />
      </div>

      <div style={styles.commentBox}>
        <span style={styles.commentIcon}>
          💬
        </span>

        <div>
          <span style={styles.commentLabel}>
            Commentaire
          </span>

          <p style={styles.commentValue}>
            {mission.commentaire ||
              'Aucun commentaire'}
          </p>
        </div>
      </div>

      {missionSituation.notice && (
        <div
          style={{
            ...styles.missionNotice,
            background:
              missionSituation.noticeBackground,
            borderColor:
              missionSituation.noticeBorder,
            color:
              missionSituation.noticeColor,
          }}
        >
          <strong>
            {missionSituation.noticeTitle}
          </strong>
          <span>
            {missionSituation.notice}
          </span>
        </div>
      )}

      {pendingMissionChange ? (
        <div style={styles.pendingChangeBox}>
          <div>
            <strong>Modification des conditions en attente</strong>
            <span>
              La mission a été modifiée. Les formateurs concernés doivent maintenant confirmer qu’ils acceptent toujours la mission avec ces nouvelles conditions.
            </span>
          </div>
          <div style={styles.pendingChangeResponses}>
            {(pendingMissionChange.trainer_responses || []).map((item) => (
              <span key={item.mission_formateur_id}>
                {item.trainer_name || 'Formateur'} : {formatChangeResponseStatus(item.response_status)}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div style={styles.missionActions}>
        <Link
          to={`/missions/edit/${missionId}`}
          style={styles.editMissionLink}
        >
          Modifier la mission
        </Link>

        <button
          type="button"
          onClick={onDelete}
          style={styles.deleteMissionButton}
        >
          Supprimer la mission
        </button>
      </div>
    </section>
  );
}

function SummaryItem({
  icon,
  label,
  value,
  detail,
}) {
  return (
    <div style={styles.summaryItem}>
      <span
        style={styles.summaryIcon}
        aria-hidden="true"
      >
        {icon}
      </span>

      <div style={styles.summaryContent}>
        <span style={styles.summaryLabel}>
          {label}
        </span>

        <strong style={styles.summaryValue}>
          {value}
        </strong>

        {detail && (
          <span style={styles.summaryDetail}>
            {detail}
          </span>
        )}
      </div>
    </div>
  );
}

function InformationBlock({
  title,
  items,
}) {
  return (
    <div style={styles.informationBlock}>
      <h3 style={styles.informationBlockTitle}>
        {title}
      </h3>

      <div style={styles.informationBlockContent}>
        {items.map((item) => (
          <div
            key={item.label}
            style={styles.informationLine}
          >
            <span
              style={styles.informationLineLabel}
            >
              {item.label}
            </span>

            <strong
              style={styles.informationLineValue}
            >
              {item.value}
            </strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function MissionSituationBadge({
  situation,
}) {
  return (
    <div style={styles.missionSituation}>
      <span
        style={{
          ...styles.badge,
          background: situation.background,
          color: situation.color,
        }}
      >
        {situation.label}
      </span>

      {situation.secondary && (
        <span
          style={styles.missionSituationSecondary}
        >
          {situation.secondary}
        </span>
      )}
    </div>
  );
}

function getMissionSituation({
  mission,
  affectedTrainer,
  acceptedTrainers,
  pendingProposals,
  pendingMissionChange,
}) {
  if (
    mission.statut === 'annulee'
  ) {
    return {
      label: 'Annulée',
      summary: 'Mission annulée',
      detail: '',
      background: '#fef3f2',
      color: '#b42318',
    };
  }

  if (
    mission.statut === 'archivee'
  ) {
    return {
      label: 'Archivée',
      summary: 'Mission archivée',
      detail: '',
      background: '#f2f4f7',
      color: '#475467',
    };
  }

  if (
    mission.statut === 'realisee'
  ) {
    return {
      label: 'Réalisée',
      summary: 'Mission réalisée',
      detail: '',
      background: '#f4f3ff',
      color: '#5925dc',
    };
  }

  if (pendingMissionChange) {
    const pendingResponses = (pendingMissionChange.trainer_responses || []).filter(
      (item) => item.response_status === 'pending',
    );
    const previousAffected = pendingResponses.find(
      (item) => item.previous_status === 'affecte',
    );
    const firstPending = pendingResponses[0];
    const trainerName = firstPending?.trainer_name || 'Formateur';

    return {
      label: 'Revalidation en attente',
      secondary: 'Réponse du formateur attendue',
      summary: previousAffected
        ? (previousAffected.trainer_name || trainerName)
        : trainerName,
      detail: previousAffected
        ? 'Affectation à reconfirmer'
        : 'Acceptation à revalider',
      background: '#fff7ed',
      color: '#c2410c',
      noticeTitle: 'Action requise : attendre la revalidation',
      notice: previousAffected
        ? `${previousAffected.trainer_name || 'Le formateur'} était affecté avant la modification. Son affectation doit maintenant être reconfirmée sur les nouvelles conditions.`
        : `${trainerName} doit accepter les nouvelles conditions avant de pouvoir être affecté.`,
      noticeBackground: '#fff7ed',
      noticeBorder: '#fdba74',
      noticeColor: '#9a3412',
    };
  }

  if (affectedTrainer) {
    return {
      label: 'Affectée',
      summary: formatTrainerName(
        affectedTrainer.trainer,
      ),
      detail: 'Formateur affecté',
      background: '#eff8ff',
      color: '#175cd3',
    };
  }

  if (acceptedTrainers.length > 0) {
    const trainerName =
      formatTrainerName(
        acceptedTrainers[0].trainer,
      );

    return {
      label: 'Formateur disponible',
      secondary:
        'Affectation à confirmer',
      summary: trainerName,
      detail:
        acceptedTrainers.length > 1
          ? `${acceptedTrainers.length} formateurs ont accepté`
          : 'A accepté la proposition',
      background: '#fff7ed',
      color: '#c2410c',
      noticeTitle:
        'Action requise : confirmer l’affectation',
      notice:
        acceptedTrainers.length > 1
          ? `${acceptedTrainers.length} formateurs ont accepté cette mission. Choisis maintenant le formateur à affecter dans le suivi ci-dessous.`
          : `${trainerName} a accepté cette mission. Il faut maintenant confirmer son affectation dans le suivi ci-dessous.`,
      noticeBackground: '#fff7ed',
      noticeBorder: '#fdba74',
      noticeColor: '#9a3412',
    };
  }

  if (pendingProposals.length > 0) {
    return {
      label: 'À pourvoir',
      secondary: `${pendingProposals.length} réponse${
        pendingProposals.length > 1
          ? 's'
          : ''
      } attendue${
        pendingProposals.length > 1
          ? 's'
          : ''
      }`,
      summary: 'Réponse en attente',
      detail: `${pendingProposals.length} proposition${
        pendingProposals.length > 1
          ? 's'
          : ''
      } en cours`,
      background: '#fff6ed',
      color: '#c4320a',
    };
  }

  if (
    mission.statut === 'brouillon'
  ) {
    return {
      label: 'Brouillon',
      summary: 'Mission en préparation',
      detail: 'Création non terminée',
      background: '#f2f4f7',
      color: '#344054',
    };
  }

  return {
    label: 'À pourvoir',
    secondary: 'À proposer',
    summary: 'Aucun formateur',
    detail: 'Proposition à envoyer',
    background: '#fff6ed',
    color: '#c4320a',
    noticeTitle:
      'Action requise : proposer la mission',
    notice:
      'Aucune réponse n’est actuellement attendue. Sélectionne un formateur ci-dessous puis envoie-lui la proposition.',
    noticeBackground: '#fffaeb',
    noticeBorder: '#fedf89',
    noticeColor: '#93370d',
  };
}

function formatMissionPeriod(
  dates = [],
) {
  if (dates.length === 0) {
    return 'Dates non renseignées';
  }

  const sorted = [...dates].sort(
    (first, second) =>
      first.date.localeCompare(
        second.date,
      ),
  );

  const first = sorted[0];
  const last =
    sorted[sorted.length - 1];

  const countLabel = `${sorted.length} journée${
    sorted.length > 1 ? 's' : ''
  }`;

  return `${formatLongMissionDate(
    first.date,
  )} → ${formatLongMissionDate(
    last.date,
  )} · ${countLabel}`;
}

function formatMissionHours(
  firstDate,
  lastDate,
) {
  if (!firstDate) {
    return '';
  }

  if (
    firstDate.date === lastDate?.date
  ) {
    return `${formatTime(
      firstDate.heure_debut,
    )} → ${formatTime(
      firstDate.heure_fin,
    )}`;
  }

  const sameHours =
    firstDate.heure_debut ===
      lastDate?.heure_debut &&
    firstDate.heure_fin ===
      lastDate?.heure_fin;

  if (sameHours) {
    return `${formatTime(
      firstDate.heure_debut,
    )} → ${formatTime(
      firstDate.heure_fin,
    )} chaque journée`;
  }

  return 'Horaires détaillés dans la mission';
}

function formatLongMissionDate(value) {
  if (!value) {
    return '—';
  }

  return new Intl.DateTimeFormat(
    'fr-FR',
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    },
  ).format(
    new Date(`${value}T12:00:00`),
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
          'Exclu',
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
  history,
  expandedHistoryTrainerId,
  setExpandedHistoryTrainerId,
  actionTrainerId,
  onRemove,
  onStatusChange,
  onPrepareProposal,
  pendingMissionChange,
}) {
  const historyByTrainer =
    useMemo(() => {
      const grouped =
        new Map();

      for (const item of history || []) {
        if (
          !grouped.has(
            item.trainer_id,
          )
        ) {
          grouped.set(
            item.trainer_id,
            [],
          );
        }

        grouped
          .get(item.trainer_id)
          .push(item);
      }

      return grouped;
    }, [history]);

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
            Chaque action est maintenant
            historisée avec son auteur.
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
            (missionTrainer) => {
              const trainerHistory =
                historyByTrainer.get(
                  missionTrainer.formateur_id,
                ) || [];

              const historyOpen =
                expandedHistoryTrainerId ===
                missionTrainer.formateur_id;

              const pendingChangeResponse =
                (pendingMissionChange?.trainer_responses || []).find(
                  (item) => item.trainer_id === missionTrainer.formateur_id,
                ) || null;

              const latestChangeResponse = trainerHistory
                .find((item) =>
                  ['change_accepted', 'change_refused'].includes(item.action) &&
                  item.details?.comment
                ) || null;

              return (
                <div
                  key={missionTrainer.id}
                  style={
                    styles.trackedTrainerHistoryGroup
                  }
                >
                  <TrackedTrainerRow
                    missionTrainer={
                      missionTrainer
                    }
                    historyCount={
                      trainerHistory.length
                    }
                    historyOpen={
                      historyOpen
                    }
                    onToggleHistory={() =>
                      setExpandedHistoryTrainerId(
                        historyOpen
                          ? null
                          : missionTrainer.formateur_id,
                      )
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
                    pendingChangeResponse={
                      pendingChangeResponse
                    }
                    latestChangeResponse={
                      latestChangeResponse
                    }
                  />

                  {historyOpen ? (
                    <TrainerHistory
                      items={
                        trainerHistory
                      }
                    />
                  ) : null}
                </div>
              );
            },
          )}
        </div>
      )}
    </section>
  );
}

function TrainerHistory({
  items,
}) {
  return (
    <div style={styles.historyPanel}>
      <div style={styles.historyPanelHeader}>
        <strong>
          Historique des actions
        </strong>

        <span>
          {items.length}{' '}
          événement
          {items.length > 1
            ? 's'
            : ''}
        </span>
      </div>

      {items.length === 0 ? (
        <div style={styles.historyEmpty}>
          Aucun événement enregistré pour
          ce formateur depuis l’activation
          de l’historique.
        </div>
      ) : (
        <div style={styles.historyList}>
          {items.map((item) => (
            <div
              key={item.id}
              style={styles.historyItem}
            >
              <div
                style={styles.historyMarker}
                aria-hidden="true"
              />

              <div style={styles.historyContent}>
                <div style={styles.historyTopline}>
                  <strong>
                    {getHistoryActionLabel(
                      item,
                    )}
                  </strong>

                  <span>
                    {formatHistoryDateTime(
                      item.created_at,
                    )}
                  </span>
                </div>

                <div style={styles.historyActor}>
                  {formatHistoryActor(
                    item,
                  )}
                </div>

                {getHistoryDetail(
                  item,
                ) ? (
                  <div
                    style={
                      styles.historyDetail
                    }
                  >
                    {getHistoryDetail(
                      item,
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getHistoryActionLabel(
  item,
) {
  const labels = {
    selected:
      'Formateur sélectionné',
    proposal_sent:
      'Proposition envoyée',
    accepted:
      item.previous_status === 'affecte'
        ? 'Affectation retirée par l’OF'
        : item.actor_type === 'organization'
          ? 'Acceptation enregistrée au nom du formateur'
          : 'Proposition acceptée',
    refused:
      item.actor_type === 'organization'
        ? 'Refus enregistré au nom du formateur'
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
      'Modification des conditions proposée',
    change_accepted:
      'Modification acceptée par le formateur',
    change_refused:
      'Modification refusée par le formateur',
    change_applied:
      'Nouvelles conditions appliquées',
  };

  return (
    labels[item.action] ||
    'Action enregistrée'
  );
}

function formatHistoryActor(
  item,
) {
  const name =
    item.actor_display_name ||
    (
      item.actor_type === 'system'
        ? 'Formaplane'
        : 'Utilisateur'
    );

  if (
    item.actor_type ===
    'trainer'
  ) {
    return `Par ${name} · Formateur`;
  }

  if (
    item.actor_type ===
    'organization'
  ) {
    return [
      `Par ${name}`,
      item.actor_organization_name,
    ]
      .filter(Boolean)
      .join(' · ');
  }

  return `Par ${name} · Système`;
}

function getHistoryDetail(
  item,
) {
  const details = [];

  if (
    item.previous_status &&
    item.new_status &&
    item.previous_status !==
      item.new_status
  ) {
    details.push(
      `${formatHistoryStatus(
        item.previous_status,
      )} → ${formatHistoryStatus(
        item.new_status,
      )}`,
    );
  }

  const comment =
    item.details?.comment?.trim?.() || '';

  if (comment) {
    details.push(`Commentaire : « ${comment} »`);
  }

  return details.join(' · ');
}

function formatHistoryStatus(
  status,
) {
  const labels = {
    selectionne:
      'Sélectionné',
    proposition_envoyee:
      'Proposition envoyée',
    accepte:
      'Accepté',
    refuse:
      'Refusé',
    affecte:
      'Affecté',
    indisponible_affecte_ailleurs:
      'Indisponible',
    annule:
      'Annulé',
  };

  return labels[status] || status;
}

function formatHistoryDateTime(
  value,
) {
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

function TrackedTrainerRow({
  missionTrainer,
  historyCount,
  historyOpen,
  onToggleHistory,
  loading,
  onRemove,
  onStatusChange,
  onPrepareProposal,
  pendingChangeResponse,
  latestChangeResponse,
}) {
  const trainer =
    missionTrainer.trainer || {};

  return (
    <article
      style={{
        ...styles.trackedTrainerRow,
        ...(pendingChangeResponse?.response_status === 'pending'
          ? styles.revalidationRow
          : missionTrainer.statut === 'affecte'
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

      {pendingChangeResponse?.response_status === 'pending' ? (
        <span style={{ ...styles.badge, background: '#fff7ed', color: '#c2410c' }}>
          Revalidation en attente
        </span>
      ) : (
        <TrainerMissionStatus
          status={missionTrainer.statut}
        />
      )}

      <div style={styles.trainerResponseColumn}>
        <span style={styles.timeline}>
          {pendingChangeResponse?.response_status === 'pending'
            ? 'Réponse aux nouvelles conditions attendue'
            : formatTimeline(missionTrainer)}
        </span>

        {pendingChangeResponse?.response_status === 'pending' ? (
          <div style={styles.revalidationReason}>
            <strong>Affectation impossible pour le moment</strong>
            <span>Le formateur doit d’abord accepter les nouvelles conditions de la mission.</span>
          </div>
        ) : null}

        {latestChangeResponse?.details?.comment ? (
          <div style={styles.trainerResponseComment}>
            <strong>Commentaire de revalidation</strong>
            <span>{latestChangeResponse.details.comment}</span>
          </div>
        ) : null}

        {missionTrainer.response_comment &&
        ['accepte', 'affecte'].includes(missionTrainer.statut) ? (
          <div style={styles.trainerResponseComment}>
            <strong>Commentaire du formateur</strong>
            <span>{missionTrainer.response_comment}</span>
          </div>
        ) : null}

        {missionTrainer.withdrawal_comment ? (
          <div style={styles.trainerResponseComment}>
            <strong>Commentaire de désistement</strong>
            <span>{missionTrainer.withdrawal_comment}</span>
          </div>
        ) : null}
      </div>

      <div style={styles.rowActions}>
        <ActionButton
          label={
            historyOpen
              ? 'Fermer historique'
              : `Historique${
                  historyCount > 0
                    ? ` (${historyCount})`
                    : ''
                }`
          }
          loading={false}
          onClick={onToggleHistory}
        />

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
            label={
              pendingChangeResponse?.response_status === 'pending'
                ? 'Affectation en attente'
                : 'Affecter'
            }
            loading={loading}
            primary
            disabled={pendingChangeResponse?.response_status === 'pending'}
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

function formatChangeResponseStatus(status) {
  const labels = {
    pending: 'Réponse attendue',
    accepted: 'Acceptée',
    refused: 'Refusée',
  };

  return labels[status] || status;
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
      'Plus disponible',
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
    desiste: [
      'Désistement',
      '#fff6ed',
      '#c4320a',
    ],
    mission_pourvue: [
      'Mission pourvue',
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

  revalidationRow: {
    borderColor: '#fdba74',
    background: '#fffcf5',
  },
  revalidationReason: {
    display: 'grid',
    gap: 2,
    padding: '6px 8px',
    borderRadius: 7,
    background: '#fff7ed',
    color: '#9a3412',
    fontSize: 9,
    lineHeight: 1.35,
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
    gap: 12,
    padding: '15px 16px',
    border: '1px solid #e4e7ec',
    borderRadius: 11,
    background: '#fff',
    boxShadow: '0 1px 3px rgba(16,24,40,.04)',
  },
  infoHeader: { display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, paddingBottom: 10, borderBottom: '1px solid #eef1f5' },
  infoTitle: { margin: 0, color: '#101828', fontSize: 15 },
  infoSubtitle: { margin: '2px 0 0', color: '#667085', fontSize: 10 },
  missionSituation: { display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center', gap: 7 },
  missionSituationSecondary: { color: '#667085', fontSize: 10, fontWeight: 650 },
  missionSummary: { display: 'grid', gridTemplateColumns: '1.45fr 1fr 1fr', gap: 8 },
  summaryItem: { display: 'flex', minWidth: 0, gap: 9, padding: '10px 11px', border: '1px solid #e4e7ec', borderRadius: 9, background: '#f9fafb' },
  summaryIcon: { flexShrink: 0, fontSize: 17, lineHeight: 1.2 },
  summaryContent: { display: 'grid', minWidth: 0, alignContent: 'start', gap: 2 },
  summaryLabel: { color: '#667085', fontSize: 9, fontWeight: 750, letterSpacing: '.04em', textTransform: 'uppercase' },
  summaryValue: { color: '#101828', fontSize: 12, lineHeight: 1.35, overflowWrap: 'anywhere' },
  summaryDetail: { color: '#667085', fontSize: 10, lineHeight: 1.3 },
  infoBlocks: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 },
  informationBlock: { minWidth: 0, padding: '10px 11px', border: '1px solid #eef1f5', borderRadius: 9, background: '#fff' },
  informationBlockTitle: { margin: '0 0 8px', color: '#344054', fontSize: 10, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase' },
  informationBlockContent: { display: 'grid', gap: 6 },
  informationLine: { display: 'grid', gridTemplateColumns: '86px minmax(0, 1fr)', gap: 7, alignItems: 'start' },
  informationLineLabel: { color: '#667085', fontSize: 10 },
  informationLineValue: { color: '#344054', fontSize: 11, lineHeight: 1.35, overflowWrap: 'anywhere' },
  commentBox: { display: 'flex', gap: 8, padding: '9px 11px', borderRadius: 8, background: '#f9fafb' },
  commentIcon: { flexShrink: 0, fontSize: 14 },
  commentLabel: { display: 'block', marginBottom: 2, color: '#667085', fontSize: 9, fontWeight: 750, letterSpacing: '.04em', textTransform: 'uppercase' },
  commentValue: { margin: 0, color: '#475467', fontSize: 11, lineHeight: 1.4, whiteSpace: 'pre-line' },
  missionNotice: { display: 'flex', flexWrap: 'wrap', gap: 5, padding: '8px 10px', border: '1px solid', borderRadius: 8, fontSize: 10, lineHeight: 1.4 },
  pendingChangeBox: { display: 'grid', gap: 8, padding: '10px 11px', border: '1px solid #fdb022', borderRadius: 8, background: '#fffcf5', color: '#7a2e0e', fontSize: 10, lineHeight: 1.4 },
  pendingChangeResponses: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  missionActions: { display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 7, paddingTop: 2 },
  editMissionLink: { display: 'inline-flex', minHeight: 32, alignItems: 'center', padding: '0 10px', border: '1px solid #d0d5dd', borderRadius: 7, background: '#fff', color: '#344054', fontSize: 11, fontWeight: 650, textDecoration: 'none' },
  deleteMissionButton: { minHeight: 32, padding: '0 10px', border: '1px solid #fda29b', borderRadius: 7, background: '#fff', color: '#b42318', fontSize: 11, fontWeight: 650, cursor: 'pointer' },
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
  trackedTrainerHistoryGroup: { display: 'grid', gap: 6 },
  trackedTrainerRow: { display: 'grid', gridTemplateColumns: 'minmax(170px,1.2fr) 72px 115px minmax(150px,1fr) auto', gap: 10, alignItems: 'center', padding: '8px 10px', border: '1px solid #e4e7ec', borderRadius: 8, background: '#fff' },
  historyPanel: { marginLeft: 12, padding: '10px 12px', borderLeft: '2px solid #bfdbfe', borderRadius: '0 8px 8px 0', background: '#f8fafc' },
  historyPanelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 8, color: '#475467', fontSize: 10 },
  historyList: { display: 'grid', gap: 7 },
  historyItem: { display: 'grid', gridTemplateColumns: '8px minmax(0,1fr)', gap: 8, alignItems: 'start' },
  historyMarker: { width: 7, height: 7, marginTop: 5, borderRadius: 999, background: '#3b82f6' },
  historyContent: { display: 'grid', gap: 2, minWidth: 0 },
  historyTopline: { display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, color: '#344054', fontSize: 10 },
  historyActor: { color: '#667085', fontSize: 10 },
  historyDetail: { color: '#667085', fontSize: 9 },
  historyEmpty: { color: '#667085', fontSize: 10 },
  trainerRow: { display: 'grid', gridTemplateColumns: 'minmax(180px,1.25fr) 72px minmax(125px,.85fr) 80px minmax(220px,1.5fr) auto', gap: 10, alignItems: 'center', padding: '8px 10px', border: '1px solid #e4e7ec', borderRadius: 8, background: '#fff' },
  trainerIdentity: { display: 'grid', minWidth: 0, gap: 2, color: '#101828', fontSize: 12 },
  trainerResponseColumn: { display: 'grid', gap: 5, minWidth: 0 },
  trainerResponseComment: { display: 'grid', gap: 2, padding: '5px 7px', borderLeft: '2px solid #3b82f6', borderRadius: '0 6px 6px 0', background: '#eff6ff', color: '#475467', fontSize: 9, lineHeight: 1.35, overflowWrap: 'anywhere' },
  modalBackdrop: { position: 'fixed', inset: 0, zIndex: 2000, display: 'grid', placeItems: 'center', padding: 20, background: 'rgba(15,23,42,.48)' },
  confirmModal: { width: 'min(520px,100%)', padding: 20, borderRadius: 14, background: '#fff', boxShadow: '0 24px 70px rgba(15,23,42,.25)' },
  modalEyebrow: { margin: 0, color: '#b42318', fontSize: 9, fontWeight: 800, letterSpacing: '.08em' },
  modalTitle: { margin: '6px 0 8px', color: '#101828', fontSize: 20 },
  modalText: { margin: 0, color: '#475467', fontSize: 11, lineHeight: 1.5 },
  modalWarning: { display: 'grid', gap: 4, marginTop: 14, padding: '11px 12px', border: '1px solid #fed7aa', borderRadius: 9, background: '#fff7ed', color: '#9a3412', fontSize: 10, lineHeight: 1.45 },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16, paddingTop: 14, borderTop: '1px solid #e4e7ec' },
  modalCancel: { minHeight: 36, padding: '0 12px', border: '1px solid #d0d5dd', borderRadius: 7, background: '#fff', color: '#344054', fontWeight: 700, cursor: 'pointer' },
  modalDanger: { minHeight: 36, padding: '0 12px', border: '1px solid #d92d20', borderRadius: 7, background: '#d92d20', color: '#fff', fontWeight: 750, cursor: 'pointer' },
  trainerMeta: { overflow: 'hidden', color: '#667085', fontSize: 10, textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  criteria: { display: 'grid', minWidth: 0, overflowWrap: 'anywhere', gap: 2, color: '#667085', fontSize: 10, lineHeight: 1.3 },
  actionButton: { minHeight: 29, padding: '4px 8px', border: '1px solid #d0d5dd', borderRadius: 6, background: '#fff', color: '#344054', fontSize: 10, fontWeight: 650 },
  badge: { display: 'inline-flex', width: 'fit-content', padding: '3px 6px', borderRadius: 999, fontSize: 9, fontWeight: 750 },

};

const styles = { ...baseStyles, ...compactStyles };
