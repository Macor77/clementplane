import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  useNavigate,
  useParams,
} from 'react-router-dom';

import { supabase } from '../lib/supabaseClient';

import {
  getTrainerMissionCommitments,
} from '../services/missionsService';

import {
  createOrganizationAvailabilityNote,
  deleteOrganizationAvailabilityNote,
  getOrganizationAvailabilityHistory,
  getOrganizationAvailabilityNotes,
  setOrganizationTrainerAvailability,
  updateOrganizationAvailabilityNote,
} from '../services/availabilityService';

import {
  getOrganizationTrainerRelation,
} from '../services/formateursService';

import {
  addTrainerToOrganization,
} from '../services/trainerSearchService';

import { useAuth } from '../context/AuthContext';
import {
  getTrainerInvitationHistory,
  isInvitationCoolingDown,
  sendTrainerClaimInvitation,
} from '../services/emailService';
import TrainerInvitationModal from '../components/TrainerInvitationModal';


function startOfMonth(date) {
  const next =
    new Date(date);

  next.setDate(1);
  next.setHours(0, 0, 0, 0);

  return next;
}


function endOfMonth(date) {
  const next =
    new Date(date);

  next.setMonth(
    next.getMonth() + 1,
    0,
  );

  next.setHours(
    23,
    59,
    59,
    999,
  );

  return next;
}


function addMonths(
  date,
  count,
) {
  const next =
    new Date(date);

  next.setMonth(
    next.getMonth() +
      count,
  );

  return next;
}


function toISODate(date) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1,
    ).padStart(2, '0');

  const day =
    String(
      date.getDate(),
    ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}


function formatLongDate(isoDate) {
  if (!isoDate) {
    return '';
  }

  return new Intl.DateTimeFormat(
    'fr-FR',
    {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    },
  ).format(
    new Date(
      `${isoDate}T12:00:00`,
    ),
  );
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


function getMonthMatrix(refDate) {
  const first =
    startOfMonth(
      refDate,
    );

  const last =
    endOfMonth(
      refDate,
    );

  const start =
    new Date(first);

  const weekday =
    (first.getDay() + 6) % 7;

  start.setDate(
    first.getDate() -
      weekday,
  );


  const end =
    new Date(last);

  const weekdayEnd =
    (end.getDay() + 6) % 7;

  end.setDate(
    end.getDate() +
      (6 - weekdayEnd),
  );


  const days = [];

  const cursor =
    new Date(start);

  while (cursor <= end) {
    days.push(
      new Date(cursor),
    );

    cursor.setDate(
      cursor.getDate() + 1,
    );
  }


  const rows = [];

  for (
    let index = 0;
    index < days.length;
    index += 7
  ) {
    rows.push(
      days.slice(
        index,
        index + 7,
      ),
    );
  }


  return rows;
}


const STATUS_LABEL = {
  '': 'Non renseigné',
  dispo: 'Disponible',
  indispo: 'Indisponible',
  option: 'Option',
  mission: 'En mission',
};


const STATUS_BG = {
  '': '#f8fafc',
  dispo: '#eaffea',
  indispo: '#ffe3e3',
  option: '#fff7d6',
  mission: '#dbeafe',
};


const STATUS_BORDER = {
  '': '#e5e7eb',
  dispo: '#c7f0c7',
  indispo: '#ffb3b3',
  option: '#facc15',
  mission: '#60a5fa',
};


function getHistoryActorLabel(item) {
  const actor =
    item.actor_name ||
    'Utilisateur Clementplane';

  if (
    item.source ===
    'trainer'
  ) {
    return `${actor} · Formateur`;
  }

  if (
    item.source ===
    'organization'
  ) {
    return item.organization_name
      ? `${actor} · ${item.organization_name}`
      : `${actor} · Organisme de formation`;
  }

  return `${actor} · Origine non identifiée`;
}


export default function FormateurView() {
  const {
    id,
  } = useParams();

  const navigate =
    useNavigate();

  const {
    currentOrganization,
  } = useAuth();


  const [
    trainer,
    setTrainer,
  ] = useState(null);

  const [
    inNetwork,
    setInNetwork,
  ] = useState(false);

  const [
    addingToNetwork,
    setAddingToNetwork,
  ] = useState(false);

  const [
    networkRefreshKey,
    setNetworkRefreshKey,
  ] = useState(0);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState(null);

  const [
    inviteSending,
    setInviteSending,
  ] = useState(false);

  const [
    inviteMessage,
    setInviteMessage,
  ] = useState('');

  const [
    inviteError,
    setInviteError,
  ] = useState('');

  const [
    inviteModalOpen,
    setInviteModalOpen,
  ] = useState(false);

  const [inviteCopyToSender, setInviteCopyToSender] = useState(false);

  const [
    invitationHistory,
    setInvitationHistory,
  ] = useState([]);


  const refreshInvitationHistory =
    useCallback(
      async () => {
        if (!currentOrganization?.id || !trainer?.id) {
          setInvitationHistory([]);
          return;
        }

        try {
          const history =
            await getTrainerInvitationHistory({
              organizationId: currentOrganization.id,
              trainerId: trainer.id,
            });

          setInvitationHistory(history);
        } catch (error) {
          console.error(
            "Impossible de charger l'historique des invitations :",
            error,
          );
        }
      },
      [currentOrganization?.id, trainer?.id],
    );


  useEffect(() => {
    refreshInvitationHistory();
  }, [refreshInvitationHistory]);

  const latestSuccessfulInvitation =
    invitationHistory.find(
      (entry) =>
        entry.status === 'sent' &&
        entry.sent_at,
    ) || null;


  const [
    refDate,
    setRefDate,
  ] = useState(
    () => new Date(),
  );


  const [
    availability,
    setAvailability,
  ] = useState({});


  const [
    historyByDay,
    setHistoryByDay,
  ] = useState({});


  const [
    globalUpdatedAt,
    setGlobalUpdatedAt,
  ] = useState(null);


  const [
    hoveredDay,
    setHoveredDay,
  ] = useState(null);


  const [
    noteModalDay,
    setNoteModalDay,
  ] = useState(null);

  const [
    historyModalDay,
    setHistoryModalDay,
  ] = useState(null);


  const [
    noteDraft,
    setNoteDraft,
  ] = useState('');

  const [
    editingNoteId,
    setEditingNoteId,
  ] = useState(null);

  const [
    savingNote,
    setSavingNote,
  ] = useState(false);

  const [
    savingDay,
    setSavingDay,
  ] = useState('');


  const loadMonth =
    async (
      trainerId,
      monthDate,
    ) => {
      const from =
        startOfMonth(
          monthDate,
        );

      const to =
        endOfMonth(
          monthDate,
        );


      const fromISO =
        toISODate(from);

      const toISO =
        toISODate(to);


      try {
        const [
          availabilityResult,
          commitments,
          noteRows,
          historyRows,
        ] = await Promise.all([
          supabase
            .from(
              'trainer_availability',
            )
            .select(
              'id, trainer_id, day, status, updated_at',
            )
            .eq(
              'trainer_id',
              trainerId,
            )
            .gte(
              'day',
              fromISO,
            )
            .lte(
              'day',
              toISO,
            ),

          getTrainerMissionCommitments({
            trainerIds: [
              trainerId,
            ],

            startDay:
              fromISO,

            endDay:
              toISO,

            organizationId:
              currentOrganization?.id,
          }),

          getOrganizationAvailabilityNotes({
            organizationId:
              currentOrganization?.id,

            trainerIds: [
              trainerId,
            ],

            startDay:
              fromISO,

            endDay:
              toISO,
          }),

          getOrganizationAvailabilityHistory({
            organizationId:
              currentOrganization?.id,

            trainerIds: [
              trainerId,
            ],

            startDay:
              fromISO,

            endDay:
              toISO,
          }),
        ]);


        if (
          availabilityResult.error
        ) {
          throw availabilityResult.error;
        }


        const map = {};

        let maxUpdated = null;


        for (
          const row of
          availabilityResult.data ||
          []
        ) {
          map[row.day] = {
            status:
              row.status,

            declaredStatus:
              row.status,

            source:
              'availability',

            notes: [],

            updated_at:
              row.updated_at,

            id:
              row.id,

            missionId:
              null,
          };


          if (
            !maxUpdated ||
            new Date(
              row.updated_at,
            ) >
              new Date(
                maxUpdated,
              )
          ) {
            maxUpdated =
              row.updated_at;
          }
        }


        for (
          const note of
          noteRows
        ) {
          if (!map[note.day]) {
            map[note.day] = {
              status: '',
              declaredStatus: '',
              source:
                'availability',
              notes: [],
              updated_at: null,
              id: null,
              missionId: null,
            };
          }


          map[
            note.day
          ].notes.push(
            note,
          );
        }


        for (
          const commitment of
          commitments || []
        ) {
          const isOwnOrganization =
            commitment.is_own_organization ===
            true;

          const derivedStatus =
            commitment.statut ===
              'affecte'
              ? isOwnOrganization
                ? 'mission'
                : 'indispo'
              : 'option';

          const derivedSource =
            commitment.statut ===
              'affecte' &&
            !isOwnOrganization
              ? 'external_commitment'
              : derivedStatus;


          for (
            const day of
            commitment.dates || []
          ) {
            const current =
              map[day] || {
                status: '',
                declaredStatus: '',
                source:
                  'availability',
                notes: [],
                updated_at: null,
                id: null,
                missionId: null,
              };


            const currentPriority =
              current.source ===
                'mission' ||
              current.source ===
                'external_commitment'
                ? 3
                : current.source ===
                    'option'
                  ? 2
                  : 1;

            const incomingPriority =
              derivedSource ===
                'mission' ||
              derivedSource ===
                'external_commitment'
                ? 3
                : 2;

            const shouldReplace =
              incomingPriority >=
              currentPriority;


            if (!shouldReplace) {
              continue;
            }


            map[day] = {
              ...current,

              status:
                derivedStatus,

              source:
                derivedSource,

              missionId:
                isOwnOrganization
                  ? commitment.mission_id ||
                    commitment.mission?.id ||
                    null
                  : null,
            };
          }
        }


        const historyMap = {};


        for (
          const historyItem of
          historyRows
        ) {
          if (
            !historyMap[
              historyItem.day
            ]
          ) {
            historyMap[
              historyItem.day
            ] = [];
          }

          historyMap[
            historyItem.day
          ].push(
            historyItem,
          );
        }


        setAvailability(
          map,
        );

        setHistoryByDay(
          historyMap,
        );

        setGlobalUpdatedAt(
          maxUpdated,
        );
      } catch (
        loadError
      ) {
        console.error(
          'Load planning error:',
          loadError,
        );
      }
    };


  useEffect(() => {
    let active = true;

    async function loadTrainer() {
      setLoading(true);
      setError(null);

      try {
        const relation = await getOrganizationTrainerRelation({
          organizationId: currentOrganization?.id,
          trainerId: id,
        });

        let data = null;

        if (relation) {
          const trainerResult = await supabase
            .from('trainers')
            .select('*')
            .eq('id', id)
            .single();

          if (trainerResult.error) throw trainerResult.error;
          data = trainerResult.data;
        } else {
          const publicResult = await supabase.rpc(
            'get_trainer_profile_for_organization',
            { p_trainer_id: id },
          );

          if (publicResult.error) throw publicResult.error;
          data = Array.isArray(publicResult.data)
            ? publicResult.data[0]
            : publicResult.data;
        }

        if (!data) {
          throw new Error('Fiche formateur introuvable.');
        }

        if (!active) return;

        setInNetwork(Boolean(relation));
        setTrainer({
          id: data.id,
          prenom: data.prenom ?? '',
          nom: data.nom ?? '',
          ville: data.user_id
            ? data.ville ?? ''
            : relation?.ville ?? '',
          codePostal: data.user_id
            ? data.code_postal ?? ''
            : relation?.code_postal ?? '',
          competences: Array.isArray(data.competences) ? data.competences : (data.competences ?? []),
          materiel: Array.isArray(data.materiel) ? data.materiel : (data.materiel ?? []),
          statut: relation?.statut ?? '',
          tarif: relation?.tarif ?? null,
          notes: relation?.notes ?? '',
          telephone: data.telephone ?? '',
          email: data.email ?? '',
          adresse: data.adresse ?? '',
          claimed: Boolean(data.user_id),
          created_at: data.created_at,
        });

        if (relation) {
          await loadMonth(data.id, refDate);
        } else {
          setAvailability({});
          setHistoryByDay({});
          setGlobalUpdatedAt(null);
        }
      } catch (loadError) {
        if (active) setError(loadError?.message || 'Impossible de charger cette fiche.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadTrainer();

    return () => {
      active = false;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, currentOrganization?.id, networkRefreshKey]);


  useEffect(() => {
    if (!trainer?.id || !inNetwork) {
      return;
    }


    loadMonth(
      trainer.id,
      refDate,
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    refDate,
    trainer?.id,
    currentOrganization?.id,
  ]);


  const matrix =
    useMemo(
      () =>
        getMonthMatrix(
          refDate,
        ),
      [refDate],
    );


  if (loading) {
    return (
      <div
        style={{
          padding: '1rem',
        }}
      >
        Chargement…
      </div>
    );
  }


  if (error) {
    return (
      <div
        style={{
          padding: '1rem',
          color: 'crimson',
        }}
      >
        Erreur : {error}
      </div>
    );
  }


  if (!trainer) {
    return (
      <div
        style={{
          padding: '1rem',
        }}
      >
        Introuvable.
      </div>
    );
  }


  const title =
    `${trainer.prenom} ${trainer.nom}`.trim();


  const handleInviteTrainer =
    () => {
      if (
        trainer.claimed ||
        !trainer.email ||
        !currentOrganization?.id ||
        inviteSending
      ) {
        return;
      }

      setInviteMessage('');
      setInviteError('');
      setInviteCopyToSender(false);
      setInviteModalOpen(true);
    };


  const handleConfirmInviteTrainer =
    async () => {
      if (
        trainer.claimed ||
        !trainer.email ||
        !currentOrganization?.id ||
        inviteSending
      ) {
        return;
      }

      setInviteSending(true);
      setInviteMessage('');
      setInviteError('');

      try {
        await sendTrainerClaimInvitation({
          trainerId: trainer.id,
          organizationId: currentOrganization.id,
          copyToSender: inviteCopyToSender,
        });

        setInviteMessage(
          `Invitation envoyée à ${trainer.email}.`,
        );
        setInviteModalOpen(false);
        await refreshInvitationHistory();
      } catch (sendError) {
        console.error(
          "Impossible d'envoyer l'invitation formateur :",
          sendError,
        );
        setInviteError(
          sendError?.message ||
            "Impossible d'envoyer l'invitation pour le moment.",
        );
      } finally {
        setInviteSending(false);
      }
    };


  const saveAvailability =
    async (
      iso,
      status,
    ) => {
      const current =
        availability[
          iso
        ]?.declaredStatus ??
        availability[
          iso
        ]?.status ??
        '';


      if (
        current === status ||
        savingDay
      ) {
        return;
      }


      setSavingDay(
        iso,
      );


      try {
        const data =
          await setOrganizationTrainerAvailability({
            organizationId:
              currentOrganization?.id,

            trainerId:
              trainer.id,

            day:
              iso,

            status,
          });


        if (!data) {
          throw new Error(
            'Aucune disponibilité retournée.',
          );
        }


        await loadMonth(
          trainer.id,
          refDate,
        );
      } catch (
        saveError
      ) {
        console.error(
          saveError,
        );

        alert(
          'Enregistrement impossible.',
        );
      } finally {
        setSavingDay('');
      }
    };


  const openNotes =
    (
      event,
      date,
    ) => {
      event.stopPropagation();

      const iso =
        toISODate(date);

      setHoveredDay(null);

      setNoteModalDay(
        iso,
      );

      setHistoryModalDay(
        null,
      );

      setNoteDraft('');
      setEditingNoteId(null);
    };


  const openHistory =
    (
      event,
      date,
    ) => {
      event.stopPropagation();

      const iso =
        toISODate(date);

      setHoveredDay(null);

      setHistoryModalDay(
        iso,
      );

      setNoteModalDay(
        null,
      );
    };


  const openMission =
    (
      event,
      missionId,
    ) => {
      event.stopPropagation();

      if (!missionId) {
        return;
      }

      setHoveredDay(null);

      navigate(
        `/missions/${missionId}`,
      );
    };


  const closeNotes =
    () => {
      if (savingNote) {
        return;
      }

      setNoteModalDay(null);
      setNoteDraft('');
      setEditingNoteId(null);
    };


  const closeHistory =
    () => {
      setHistoryModalDay(
        null,
      );
    };


  const startEditOrganizationNote =
    (note) => {
      if (!note.can_edit) {
        return;
      }

      setEditingNoteId(
        note.id,
      );

      setNoteDraft(
        note.content,
      );
    };


  const cancelEditNote =
    () => {
      setEditingNoteId(null);
      setNoteDraft('');
    };


  const saveOrganizationNote =
    async () => {
      if (
        !noteModalDay ||
        !noteDraft.trim() ||
        !currentOrganization?.id
      ) {
        return;
      }


      setSavingNote(true);


      try {
        if (editingNoteId) {
          await updateOrganizationAvailabilityNote({
            organizationId:
              currentOrganization.id,

            noteId:
              editingNoteId,

            content:
              noteDraft.trim(),
          });
        } else {
          await createOrganizationAvailabilityNote({
            organizationId:
              currentOrganization.id,

            trainerId:
              trainer.id,

            day:
              noteModalDay,

            content:
              noteDraft.trim(),
          });
        }


        await loadMonth(
          trainer.id,
          refDate,
        );


        setEditingNoteId(
          null,
        );

        setNoteDraft('');
      } catch (
        saveNoteError
      ) {
        console.error(
          saveNoteError,
        );

        alert(
          "Impossible d'enregistrer cette note.",
        );
      } finally {
        setSavingNote(
          false,
        );
      }
    };


  const deleteOrganizationNote =
    async (note) => {
      if (
        !note.can_edit ||
        !currentOrganization?.id
      ) {
        return;
      }


      setSavingNote(
        true,
      );


      try {
        await deleteOrganizationAvailabilityNote({
          organizationId:
            currentOrganization.id,

          noteId:
            note.id,
        });


        await loadMonth(
          trainer.id,
          refDate,
        );


        if (
          editingNoteId ===
          note.id
        ) {
          cancelEditNote();
        }
      } catch (
        deleteError
      ) {
        console.error(
          deleteError,
        );

        alert(
          'Impossible de supprimer cette note.',
        );
      } finally {
        setSavingNote(
          false,
        );
      }
    };


  const handleAddToNetwork = async () => {
    if (!currentOrganization?.id || !trainer?.id || inNetwork || addingToNetwork) return;

    setAddingToNetwork(true);
    setError(null);

    try {
      await addTrainerToOrganization({
        organizationId: currentOrganization.id,
        trainerId: trainer.id,
      });
      setNetworkRefreshKey((current) => current + 1);
    } catch (addError) {
      console.error('Erreur ajout au réseau :', addError);
      setError("Impossible d'ajouter ce formateur à votre réseau.");
    } finally {
      setAddingToNetwork(false);
    }
  };


  const frenchMonth =
    refDate.toLocaleDateString(
      'fr-FR',
      {
        month: 'long',
        year: 'numeric',
      },
    );


  const weekdays = [
    'Lun',
    'Mar',
    'Mer',
    'Jeu',
    'Ven',
    'Sam',
    'Dim',
  ];


  const modalNotes =
    noteModalDay
      ? availability[
          noteModalDay
        ]?.notes || []
      : [];


  const modalHistory =
    historyModalDay
      ? historyByDay[
          historyModalDay
        ] || []
      : [];


  return (
    <div
      className="of-trainer-view-page"
      style={{
        padding: '1rem',
        display: 'grid',
        gap: 14,
        maxWidth: 920,
      }}
    >

      <h2>
        Fiche formateur
      </h2>

      {!inNetwork ? (
        <div style={{ padding: 14, border: '1px solid #bfdbfe', borderRadius: 12, background: '#eff6ff', display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <strong>Ce formateur n’est pas encore dans votre réseau.</strong>
            <div style={{ marginTop: 4, color: '#475569', fontSize: 13 }}>
              Consultez sa fiche puis ajoutez-le à votre réseau pour gérer vos informations internes et ses disponibilités dans votre espace OF.
            </div>
          </div>
          <button className="button" type="button" onClick={handleAddToNetwork} disabled={addingToNetwork}>
            {addingToNetwork ? 'Ajout…' : 'Ajouter à mon réseau'}
          </button>
        </div>
      ) : null}


      <div
        style={{
          display: 'grid',
          gap: 8,
          gridTemplateColumns:
            'repeat(auto-fit,minmax(240px,1fr))',
        }}
      >

        <Info
          label="Prénom"
          value={trainer.prenom}
        />

        <Info
          label="Nom"
          value={trainer.nom}
        />

        <Info
          label="Ville"
          value={trainer.ville}
        />

        <Info
          label="Code postal"
          value={trainer.codePostal}
        />

        {inNetwork ? (
          <>
            <Info label="Statut" value={trainer.statut} />
            <Info
              label="Tarif"
              value={trainer.tarif != null ? `${trainer.tarif} €` : '—'}
            />
          </>
        ) : null}

        {inNetwork ? (
          <>
            <Info label="Téléphone" value={trainer.telephone || '—'} />
            <Info label="Email" value={trainer.email || '—'} />
            <Info label="Adresse" value={trainer.adresse || '—'} />
          </>
        ) : null}

      </div>

      <TrainerInvitationModal
        open={inviteModalOpen}
        trainerName={title}
        trainerEmail={trainer.email || ''}
        sending={inviteSending}
        copyToSender={inviteCopyToSender}
        onCopyToSenderChange={setInviteCopyToSender}
        recentInvitation={
          isInvitationCoolingDown(latestSuccessfulInvitation)
            ? latestSuccessfulInvitation
            : null
        }
        onCancel={() => {
          if (!inviteSending) setInviteModalOpen(false);
        }}
        onConfirm={handleConfirmInviteTrainer}
      />

      <div
        style={{
          borderTop: '1px solid #e5e7eb',
          borderBottom: '1px solid #e5e7eb',
          padding: '12px 0',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            fontSize: 13,
            fontWeight: 800,
            color: trainer.claimed ? '#15803d' : '#b45309',
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: trainer.claimed ? '#22c55e' : '#f59e0b',
              flex: '0 0 auto',
            }}
          />
          {trainer.claimed ? 'Profil revendiqué' : 'Profil non revendiqué'}
        </div>

        {trainer.claimed ? (
          <p
            style={{
              margin: '6px 0 0',
              color: '#64748b',
              lineHeight: 1.5,
              fontSize: 13,
              maxWidth: 900,
            }}
          >
            Le formateur possède son propre espace Clementplane. Vos notes, tarifs et données internes restent propres à votre organisme.
          </p>
        ) : (
          <>
            <p
              style={{
                margin: '6px 0 10px',
                color: '#64748b',
                lineHeight: 1.5,
                fontSize: 13,
                maxWidth: 900,
              }}
            >
              Vous pouvez continuer à gérer vous-même ses disponibilités, missions et informations. En l’invitant à revendiquer sa fiche, les mises à jour et validations deviennent plus fluides.
            </p>

            {!trainer.email ? (
              <div
                style={{
                  color: '#b45309',
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                Ajoutez une adresse e-mail à cette fiche pour pouvoir envoyer une invitation.
              </div>
            ) : (
              <button
                type="button"
                onClick={handleInviteTrainer}
                disabled={inviteSending}
                style={{
                  border: '1px solid #cbd5e1',
                  background: '#fff',
                  color: '#334155',
                  borderRadius: 8,
                  padding: '8px 12px',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: inviteSending ? 'wait' : 'pointer',
                }}
              >
                {inviteSending ? 'Envoi de l’invitation…' : 'Inviter à rejoindre Clementplane'}
              </button>
            )}

            {inviteMessage ? (
              <div style={{ marginTop: 8, color: '#15803d', fontWeight: 700, fontSize: 13 }}>
                {inviteMessage}
              </div>
            ) : null}

            {inviteError ? (
              <div style={{ marginTop: 8, color: '#b42318', fontWeight: 700, fontSize: 13 }}>
                {inviteError}
              </div>
            ) : null}

            <div
              style={{
                marginTop: 18,
                paddingTop: 14,
                borderTop: '1px solid #e5e7eb',
                maxWidth: 900,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: '#334155',
                  marginBottom: 8,
                }}
              >
                Historique des invitations Clementplane
              </div>

              {invitationHistory.length === 0 ? (
                <div style={{ color: '#94a3b8', fontSize: 13 }}>
                  Aucune invitation envoyée pour le moment.
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 6 }}>
                  {invitationHistory.map((entry) => {
                    const eventDate =
                      entry.sent_at ||
                      entry.failed_at ||
                      entry.created_at;

                    return (
                      <div
                        key={entry.id}
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '6px 10px',
                          alignItems: 'center',
                          fontSize: 13,
                          color: '#64748b',
                        }}
                      >
                        <span>
                          {new Date(eventDate).toLocaleString('fr-FR')}
                        </span>
                        <span aria-hidden="true">•</span>
                        <span>{entry.recipient_email}</span>
                        <span
                          style={{
                            fontWeight: 700,
                            color:
                              entry.status === 'sent'
                                ? '#15803d'
                                : entry.status === 'failed'
                                  ? '#b42318'
                                  : '#64748b',
                          }}
                        >
                          {entry.status === 'sent'
                            ? 'Invitation envoyée'
                            : entry.status === 'failed'
                              ? 'Échec de l’envoi'
                              : 'Envoi en cours'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>


      <Info
        label="Compétences"
        value={
          (
            trainer.competences ||
            []
          ).join(', ') ||
          '—'
        }
      />


      <Info
        label="Matériel"
        value={
          (
            trainer.materiel ||
            []
          ).join(', ') ||
          '—'
        }
      />


      {inNetwork ? (
        <>
      <div>
        <strong>
          Notes internes sur le formateur :
        </strong>

        <div
          style={{
            whiteSpace:
              'pre-wrap',
            border:
              '1px solid #ddd',
            borderRadius: 8,
            padding: 8,
            marginTop: 6,
          }}
        >
          {trainer.notes || '—'}
        </div>
      </div>


      <div
        style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          marginTop: 8,
        }}
      >

        <button
          onClick={() =>
            navigate(
              `/formateur/edit/${trainer.id}`,
            )
          }
        >
          Modifier
        </button>

        <button
          onClick={() =>
            navigate('/listing')
          }
        >
          Retour
        </button>

      </div>

        </>
      ) : null}

      {inNetwork ? <hr /> : null}


      {inNetwork ? (
        <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent:
            'space-between',
          gap: 8,
        }}
      >

        <h3
          style={{
            margin: 0,
          }}
        >
          Disponibilités — {title}
        </h3>


        <div
          style={{
            opacity: 0.8,
            fontSize: 13,
          }}
        >
          Dernière mise à jour :{' '}

          {globalUpdatedAt
            ? new Date(
                globalUpdatedAt,
              ).toLocaleString(
                'fr-FR',
              )
            : '—'}
        </div>

      </div>


      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >

        <button
          onClick={() =>
            setRefDate(
              (date) =>
                addMonths(
                  date,
                  -1,
                ),
            )
          }
        >
          ◀️ Mois précédent
        </button>


        <div
          style={{
            minWidth: 180,
            textAlign: 'center',
            fontWeight: 600,
            textTransform:
              'capitalize',
          }}
        >
          {frenchMonth}
        </div>


        <button
          onClick={() =>
            setRefDate(
              (date) =>
                addMonths(
                  date,
                  1,
                ),
            )
          }
        >
          Mois suivant ▶️
        </button>


        <button
          onClick={() =>
            setRefDate(
              new Date(),
            )
          }
          style={{
            marginLeft: 'auto',
          }}
        >
          Aujourd’hui
        </button>

      </div>


      <div
        className="of-trainer-availability-calendar"
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(7,1fr)',
          gap: 6,
        }}
      >

        {weekdays.map(
          (weekday) => (
            <div
              key={weekday}
              style={{
                textAlign:
                  'center',
                fontWeight:
                  600,
                padding:
                  '6px 0',
              }}
            >
              {weekday}
            </div>
          ),
        )}


        {matrix
          .flat()
          .map(
            (date) => {

              const iso =
                toISODate(
                  date,
                );


              const inMonth =
                date.getMonth() ===
                refDate.getMonth();


              const cell =
                availability[
                  iso
                ];


              const status =
                cell?.status ??
                '';


              const declaredStatus =
                cell?.declaredStatus ??
                '';


              const notes =
                cell?.notes ||
                [];


              const history =
                historyByDay[
                  iso
                ] || [];


              const trainerNotes =
                notes.filter(
                  (note) =>
                    note.source ===
                    'trainer',
                );


              const organizationNotes =
                notes.filter(
                  (note) =>
                    note.source ===
                    'organization',
                );


              const totalNotes =
                notes.length;


              const totalHistory =
                history.length;


              const background =
                STATUS_BG[
                  status
                ] ??
                STATUS_BG[''];


              const border =
                STATUS_BORDER[
                  status
                ] ??
                STATUS_BORDER[''];


              const isMissionState =
                cell?.source ===
                  'mission' ||
                cell?.source ===
                  'option';


              const isExternalCommitment =
                cell?.source ===
                'external_commitment';


              const missionId =
                cell?.missionId ||
                null;


              const showTooltip =
                hoveredDay ===
                  iso &&
                totalNotes > 0 &&
                !noteModalDay &&
                !historyModalDay;


              return (
                <div
                  key={iso}

                  onMouseEnter={() =>
                    setHoveredDay(
                      iso,
                    )
                  }

                  onMouseLeave={() =>
                    setHoveredDay(
                      null,
                    )
                  }

                  style={{
                    position:
                      'relative',

                    display:
                      'flex',

                    flexDirection:
                      'column',

                    textAlign:
                      'left',

                    border:
                      `1px solid ${border}`,

                    background,

                    borderRadius:
                      8,

                    padding:
                      8,

                    minHeight:
                      152,

                    opacity:
                      inMonth
                        ? 1
                        : 0.5,

                    cursor:
                      'default',

                    overflow:
                      'visible',
                  }}
                >

                  <div
                    style={{
                      display:
                        'flex',

                      justifyContent:
                        'space-between',

                      alignItems:
                        'baseline',
                    }}
                  >

                    <span
                      style={{
                        fontSize:
                          12,

                        opacity:
                          0.7,
                      }}
                    >
                      {iso.slice(-2)}
                      /
                      {iso.slice(5, 7)}
                    </span>


                    <span
                      style={{
                        fontSize:
                          11,

                        opacity:
                          0.6,
                      }}
                    >
                      {
                        STATUS_LABEL[
                          status
                        ] ??
                        'Non renseigné'
                      }
                    </span>

                  </div>


                  {isExternalCommitment ? (
                    <div
                      style={{
                        marginTop:
                          9,

                        fontSize:
                          11,

                        lineHeight:
                          1.3,

                        color:
                          '#991b1b',

                        fontWeight:
                          700,
                      }}
                    >
                      Indisponible
                    </div>
                  ) : isMissionState ? (
                    <div
                      style={{
                        display:
                          'grid',

                        gap:
                          7,

                        marginTop:
                          7,
                      }}
                    >
                      <div
                        style={{
                          fontSize:
                            11,

                          lineHeight:
                            1.3,

                          color:
                            status ===
                            'mission'
                              ? '#1d4ed8'
                              : '#854d0e',

                          fontWeight:
                            600,
                        }}
                      >
                        {status ===
                        'mission'
                          ? 'Mission confirmée'
                          : "Acceptée, en attente d'affectation"}
                      </div>

                      {missionId ? (
                        <button
                          type="button"
                          onClick={(
                            event,
                          ) =>
                            openMission(
                              event,
                              missionId,
                            )
                          }
                          style={{
                            minHeight:
                              27,

                            border:
                              `1px solid ${
                                status ===
                                'mission'
                                  ? '#93c5fd'
                                  : '#facc15'
                              }`,

                            borderRadius:
                              6,

                            background:
                              status ===
                              'mission'
                                ? '#eff6ff'
                                : '#fff',

                            color:
                              status ===
                              'mission'
                                ? '#1d4ed8'
                                : '#854d0e',

                            fontSize:
                              9,

                            fontWeight:
                              800,

                            cursor:
                              'pointer',
                          }}
                        >
                          Voir la mission
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    <StatusButtons
                      iso={iso}
                      currentStatus={
                        declaredStatus
                      }
                      saving={
                        savingDay ===
                        iso
                      }
                      onChange={
                        saveAvailability
                      }
                    />
                  )}


                  {trainerNotes.length >
                  0 ? (
                    <div
                      style={{
                        marginTop:
                          5,

                        fontSize:
                          9,

                        color:
                          '#111827',
                      }}
                    >
                      ●{' '}
                      {
                        trainerNotes.length
                      }{' '}
                      note
                      {trainerNotes.length >
                      1
                        ? 's'
                        : ''}{' '}
                      formateur
                    </div>
                  ) : null}


                  {organizationNotes.length >
                  0 ? (
                    <div
                      style={{
                        marginTop:
                          3,

                        fontSize:
                          9,

                        color:
                          '#854d0e',
                      }}
                    >
                      ●{' '}
                      {
                        organizationNotes.length
                      }{' '}
                      note
                      {organizationNotes.length >
                      1
                        ? 's'
                        : ''}{' '}
                      interne
                    </div>
                  ) : null}


                  <div
                    style={{
                      display:
                        'grid',

                      gridTemplateColumns:
                        '1fr 1fr',

                      gap:
                        4,

                      marginTop:
                        'auto',

                      paddingTop:
                        7,
                    }}
                  >

                    <button
                      type="button"
                      onClick={(
                        event,
                      ) =>
                        openNotes(
                          event,
                          date,
                        )
                      }
                      style={{
                        minHeight:
                          25,

                        border:
                          '1px solid #d1d5db',

                        borderRadius:
                          6,

                        background:
                          totalNotes
                            ? '#fff7d6'
                            : '#fff',

                        color:
                          '#374151',

                        fontSize:
                          9,

                        fontWeight:
                          totalNotes
                            ? 700
                            : 600,

                        cursor:
                          'pointer',
                      }}
                    >
                      {totalNotes
                        ? `Note ${totalNotes}`
                        : 'Note'}
                    </button>


                    <button
                      type="button"
                      onClick={(
                        event,
                      ) =>
                        openHistory(
                          event,
                          date,
                        )
                      }
                      style={{
                        minHeight:
                          25,

                        border:
                          '1px solid #d1d5db',

                        borderRadius:
                          6,

                        background:
                          totalHistory
                            ? '#eef2ff'
                            : '#fff',

                        color:
                          '#374151',

                        fontSize:
                          9,

                        fontWeight:
                          totalHistory
                            ? 700
                            : 600,

                        cursor:
                          'pointer',
                      }}
                    >
                      {totalHistory
                        ? `Historique ${totalHistory}`
                        : 'Historique'}
                    </button>

                  </div>


                  {showTooltip ? (
                    <AvailabilityNotesTooltip
                      iso={iso}
                      status={
                        status
                      }
                      trainerNotes={
                        trainerNotes
                      }
                      organizationNotes={
                        organizationNotes
                      }
                    />
                  ) : null}

                </div>
              );
            },
          )}

      </div>


      <Legend />

        </>
      ) : null}

      {noteModalDay ? (
        <div
          onClick={
            closeNotes
          }
          style={modalBackdropStyle}
        >

          <div
            onClick={(
              event,
            ) =>
              event.stopPropagation()
            }
            style={modalCardStyle}
          >

            <h3
              style={{
                margin: 0,
              }}
            >
              Notes —{' '}
              {formatLongDate(
                noteModalDay,
              )}
            </h3>


            {modalNotes.length ===
            0 ? (
              <div
                style={{
                  color:
                    '#6b7280',

                  fontSize:
                    13,
                }}
              >
                Aucune note pour cette journée.
              </div>
            ) : (
              modalNotes.map(
                (note) => (
                  <div
                    key={note.id}
                    style={{
                      padding:
                        12,

                      border:
                        note.source ===
                        'trainer'
                          ? '1px solid #bfdbfe'
                          : '1px solid #fde68a',

                      borderRadius:
                        9,

                      background:
                        note.source ===
                        'trainer'
                          ? '#eff6ff'
                          : '#fffbeb',
                    }}
                  >

                    <div
                      style={{
                        display:
                          'flex',

                        justifyContent:
                          'space-between',

                        gap:
                          10,

                        marginBottom:
                          6,
                      }}
                    >

                      <strong
                        style={{
                          fontSize:
                            12,
                        }}
                      >
                        {note.source ===
                        'trainer'
                          ? '🔒 Note du formateur'
                          : 'Note interne de votre organisme'}
                      </strong>


                      {note.can_edit ? (
                        <div
                          style={{
                            display:
                              'flex',

                            gap:
                              8,
                          }}
                        >

                          <button
                            type="button"
                            disabled={
                              savingNote
                            }
                            onClick={() =>
                              startEditOrganizationNote(
                                note,
                              )
                            }
                          >
                            Modifier
                          </button>


                          <button
                            type="button"
                            disabled={
                              savingNote
                            }
                            onClick={() =>
                              deleteOrganizationNote(
                                note,
                              )
                            }
                          >
                            Supprimer
                          </button>

                        </div>
                      ) : (
                        <span
                          style={{
                            fontSize:
                              10,

                            color:
                              '#6b7280',
                          }}
                        >
                          Lecture seule
                        </span>
                      )}

                    </div>


                    <div
                      style={{
                        whiteSpace:
                          'pre-wrap',

                        fontSize:
                          13,

                        lineHeight:
                          1.45,
                      }}
                    >
                      {note.content}
                    </div>

                  </div>
                ),
              )
            )}


            <div
              style={{
                borderTop:
                  '1px solid #e5e7eb',

                paddingTop:
                  14,

                display:
                  'grid',

                gap:
                  8,
              }}
            >

              <strong
                style={{
                  fontSize:
                    13,
                }}
              >
                {editingNoteId
                  ? 'Modifier ma note interne'
                  : 'Ajouter une note interne'}
              </strong>


              <textarea
                value={
                  noteDraft
                }
                onChange={(
                  event,
                ) =>
                  setNoteDraft(
                    event.target.value,
                  )
                }
                rows={4}
                placeholder="Note visible uniquement par votre organisme."
                style={{
                  width:
                    '100%',

                  resize:
                    'vertical',

                  border:
                    '1px solid #d1d5db',

                  borderRadius:
                    8,

                  padding:
                    10,

                  fontFamily:
                    'inherit',

                  fontSize:
                    14,
                }}
              />


              <div
                style={{
                  display:
                    'flex',

                  justifyContent:
                    'flex-end',

                  gap:
                    8,
                }}
              >

                {editingNoteId ? (
                  <button
                    type="button"
                    disabled={
                      savingNote
                    }
                    onClick={
                      cancelEditNote
                    }
                  >
                    Annuler la modification
                  </button>
                ) : null}


                <button
                  type="button"
                  disabled={
                    savingNote ||
                    !noteDraft.trim()
                  }
                  onClick={
                    saveOrganizationNote
                  }
                >
                  {savingNote
                    ? 'Enregistrement…'
                    : editingNoteId
                      ? 'Enregistrer'
                      : 'Ajouter la note'}
                </button>

              </div>

            </div>


            <button
              type="button"
              onClick={
                closeNotes
              }
            >
              Fermer
            </button>

          </div>

        </div>
      ) : null}


      {historyModalDay ? (
        <div
          onClick={
            closeHistory
          }
          style={modalBackdropStyle}
        >

          <div
            onClick={(
              event,
            ) =>
              event.stopPropagation()
            }
            style={modalCardStyle}
          >

            <h3
              style={{
                margin: 0,
              }}
            >
              Historique —{' '}
              {formatLongDate(
                historyModalDay,
              )}
            </h3>


            <div
              style={{
                color:
                  '#6b7280',

                fontSize:
                  11,
              }}
            >
              Historique automatique en lecture seule.
            </div>


            {modalHistory.length ===
            0 ? (
              <div
                style={{
                  padding:
                    14,

                  border:
                    '1px dashed #d1d5db',

                  borderRadius:
                    8,

                  color:
                    '#6b7280',

                  fontSize:
                    12,

                  textAlign:
                    'center',
                }}
              >
                Aucun changement enregistré pour cette journée.
              </div>
            ) : (
              modalHistory.map(
                (item) => (
                  <AvailabilityHistoryItem
                    key={item.id}
                    item={item}
                  />
                ),
              )
            )}


            <button
              type="button"
              onClick={
                closeHistory
              }
            >
              Fermer
            </button>

          </div>

        </div>
      ) : null}

    </div>
  );
}


function StatusButtons({
  iso,
  currentStatus,
  saving,
  onChange,
}) {
  const options = [
    {
      value:
        'dispo',
      label:
        'Disponible',
      activeBackground:
        '#16a34a',
    },

    {
      value:
        'indispo',
      label:
        'Indisponible',
      activeBackground:
        '#dc2626',
    },

    {
      value:
        '',
      label:
        'Non renseigné',
      activeBackground:
        '#475569',
    },
  ];


  return (
    <div
      style={{
        display:
          'grid',

        gridTemplateColumns:
          '1fr 1fr',

        gap:
          3,

        marginTop:
          7,
      }}
    >
      {options.map(
        (option) => {
          const active =
            currentStatus ===
            option.value;

          return (
            <button
              key={
                option.label
              }
              type="button"
              disabled={
                saving ||
                active
              }
              onClick={() =>
                onChange(
                  iso,
                  option.value,
                )
              }
              style={{
                gridColumn:
                  option.value ===
                  ''
                    ? '1 / -1'
                    : 'auto',

                minHeight:
                  24,

                border:
                  active
                    ? '1px solid transparent'
                    : '1px solid rgba(15,23,42,.16)',

                borderRadius:
                  5,

                background:
                  active
                    ? option.activeBackground
                    : 'rgba(255,255,255,.80)',

                color:
                  active
                    ? '#fff'
                    : '#475569',

                fontSize:
                  8,

                fontWeight:
                  active
                    ? 800
                    : 650,

                cursor:
                  active
                    ? 'default'
                    : 'pointer',

                opacity:
                  saving
                    ? 0.55
                    : 1,
              }}
            >
              {option.label}
            </button>
          );
        },
      )}
    </div>
  );
}


function AvailabilityHistoryItem({
  item,
}) {
  const isTrainer =
    item.source ===
    'trainer';

  return (
    <article
      style={{
        display:
          'grid',

        gap:
          7,

        padding:
          12,

        border:
          isTrainer
            ? '1px solid #bfdbfe'
            : '1px solid #e5e7eb',

        borderRadius:
          9,

        background:
          isTrainer
            ? '#eff6ff'
            : '#f8fafc',
      }}
    >

      <div
        style={{
          display:
            'flex',

          justifyContent:
            'space-between',

          gap:
            12,
        }}
      >

        <strong
          style={{
            fontSize:
              11,
          }}
        >
          {getHistoryActorLabel(
            item,
          )}
        </strong>


        <span
          style={{
            color:
              '#64748b',

            fontSize:
              9,
          }}
        >
          {formatHistoryDate(
            item.created_at,
          )}
        </span>

      </div>


      <div
        style={{
          display:
            'flex',

          alignItems:
            'center',

          flexWrap:
            'wrap',

          gap:
            7,

          fontSize:
            11,
        }}
      >

        <span
          style={historyStatusStyle}
        >
          {
            STATUS_LABEL[
              item.previous_status ??
              ''
            ]
          }
        </span>

        <strong>
          →
        </strong>

        <span
          style={historyStatusStyle}
        >
          {
            STATUS_LABEL[
              item.new_status ??
              ''
            ]
          }
        </span>

      </div>

    </article>
  );
}


function AvailabilityNotesTooltip({
  iso,
  status,
  trainerNotes,
  organizationNotes,
}) {
  return (
    <div
      style={{
        position:
          'absolute',

        zIndex:
          5000,

        left:
          '50%',

        bottom:
          'calc(100% + 8px)',

        transform:
          'translateX(-50%)',

        width:
          290,

        padding:
          12,

        border:
          '1px solid #dbe4ef',

        borderRadius:
          10,

        background:
          '#ffffff',

        color:
          '#0f172a',

        boxShadow:
          '0 10px 30px rgba(15, 23, 42, 0.20)',

        fontSize:
          11,

        lineHeight:
          1.45,

        textAlign:
          'left',

        pointerEvents:
          'none',
      }}
    >

      <strong>
        {formatLongDate(
          iso,
        )}
      </strong>


      <span
        style={{
          marginLeft:
            8,

          color:
            '#64748b',
        }}
      >
        {
          STATUS_LABEL[
            status
          ]
        }
      </span>


      {trainerNotes.length >
      0 ? (
        <TooltipNotesGroup
          title={
            trainerNotes.length > 1
              ? 'Notes du formateur'
              : 'Note du formateur'
          }
          notes={
            trainerNotes
          }
          titleColor="#2563eb"
        />
      ) : null}


      {organizationNotes.length >
      0 ? (
        <TooltipNotesGroup
          title={
            organizationNotes.length > 1
              ? 'Notes internes OF'
              : 'Note interne OF'
          }
          notes={
            organizationNotes
          }
          titleColor="#92400e"
        />
      ) : null}

    </div>
  );
}


function TooltipNotesGroup({
  title,
  notes,
  titleColor,
}) {
  return (
    <div
      style={{
        display:
          'grid',

        gap:
          5,

        marginTop:
          8,
      }}
    >

      <strong
        style={{
          color:
            titleColor,

          fontSize:
            10,
        }}
      >
        {title}
      </strong>


      {notes.map(
        (note) => (
          <div
            key={
              note.id
            }
            style={{
              color:
                '#334155',

              whiteSpace:
                'pre-wrap',
            }}
          >
            • {note.content}
          </div>
        ),
      )}

    </div>
  );
}


function Info({
  label,
  value,
}) {
  return (
    <div
      style={{
        display: 'grid',
        gap: 4,
      }}
    >
      <div
        style={{
          fontSize: 12,
          opacity: 0.7,
        }}
      >
        {label}
      </div>

      <div>
        {value}
      </div>
    </div>
  );
}


function Legend() {
  const items = [
    {
      key: '',
      label:
        'Non renseigné',
    },

    {
      key:
        'dispo',
      label:
        'Disponible',
    },

    {
      key:
        'indispo',
      label:
        'Indisponible',
    },

    {
      key:
        'option',
      label:
        'Option',
    },

    {
      key:
        'mission',
      label:
        'Mission',
    },
  ];


  return (
    <div
      style={{
        display:
          'flex',

        gap:
          10,

        flexWrap:
          'wrap',

        marginTop:
          8,
      }}
    >
      {items.map(
        (item) => (
          <span
            key={
              item.key
            }
            style={{
              padding:
                '6px 10px',

              border:
                `1px solid ${STATUS_BORDER[item.key]}`,

              borderRadius:
                8,

              background:
                STATUS_BG[item.key],

              fontSize:
                11,
            }}
          >
            {item.label}
          </span>
        ),
      )}
    </div>
  );
}


const modalBackdropStyle = {
  position:
    'fixed',

  inset:
    0,

  zIndex:
    9999,

  display:
    'flex',

  alignItems:
    'center',

  justifyContent:
    'center',

  padding:
    20,

  background:
    'rgba(0,0,0,.35)',
};


const modalCardStyle = {
  display:
    'grid',

  gap:
    14,

  width:
    'min(640px, 100%)',

  maxHeight:
    '85vh',

  overflowY:
    'auto',

  padding:
    18,

  borderRadius:
    12,

  background:
    '#fff',

  boxShadow:
    '0 10px 30px rgba(0,0,0,.2)',
};


const historyStatusStyle = {
  padding:
    '3px 7px',

  borderRadius:
    999,

  background:
    '#fff',
};