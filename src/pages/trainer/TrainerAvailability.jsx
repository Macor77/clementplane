import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { Link } from 'react-router-dom';

import {
  createMyAvailabilityNote,
  deleteMyAvailabilityNote,
  getMyAvailabilityHistory,
  getMyAvailabilityNotes,
  getMyTrainerAvailability,
  getMyTrainerCommitments,
  getMyTrainerMission,
  setMyTrainerAvailability,
  updateMyAvailabilityNote,
} from '../../services/trainerAvailabilityService';


const STATUS_LABELS = {
  '': 'Non renseigné',
  dispo: 'Disponible',
  indispo: 'Indisponible',
  option: 'Option',
  mission: 'Mission',
};


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
    new Date(`${isoDate}T12:00:00`),
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
  ).format(new Date(value));
}


function getHistoryActorLabel(item) {
  const actor =
    item.actor_name ||
    'Utilisateur Formaplane';

  if (item.source === 'trainer') {
    return `${actor} · Formateur`;
  }

  if (item.source === 'organization') {
    return item.organization_name
      ? `${actor} · ${item.organization_name}`
      : `${actor} · Organisme de formation`;
  }

  return `${actor} · Origine non identifiée`;
}


function getMonthRange(date) {
  const start =
    new Date(
      date.getFullYear(),
      date.getMonth(),
      1,
    );

  const end =
    new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0,
    );

  return {
    startDay: toISODate(start),
    endDay: toISODate(end),
  };
}


function getMonthMatrix(refDate) {
  const year =
    refDate.getFullYear();

  const month =
    refDate.getMonth();

  const first =
    new Date(year, month, 1);

  const last =
    new Date(year, month + 1, 0);

  const start =
    new Date(first);

  const startOffset =
    (first.getDay() + 6) % 7;

  start.setDate(
    first.getDate() - startOffset,
  );

  const end =
    new Date(last);

  const endOffset =
    (last.getDay() + 6) % 7;

  end.setDate(
    last.getDate() +
      (6 - endOffset),
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

  const weeks = [];

  for (
    let index = 0;
    index < days.length;
    index += 7
  ) {
    weeks.push(
      days.slice(
        index,
        index + 7,
      ),
    );
  }

  return weeks;
}


function sameDay(
  first,
  second,
) {
  return (
    first.getFullYear() ===
      second.getFullYear() &&
    first.getMonth() ===
      second.getMonth() &&
    first.getDate() ===
      second.getDate()
  );
}


export default function TrainerAvailability() {
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
    commitments,
    setCommitments,
  ] = useState({});

  const [
    notesByDay,
    setNotesByDay,
  ] = useState({});

  const [
    historyByDay,
    setHistoryByDay,
  ] = useState({});

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    savingDay,
    setSavingDay,
  ] = useState('');

  const [
    error,
    setError,
  ] = useState('');

  const [
    lastUpdatedAt,
    setLastUpdatedAt,
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
    missionModal,
    setMissionModal,
  ] = useState(null);

  const [
    loadingMission,
    setLoadingMission,
  ] = useState(false);

  const [
    missionError,
    setMissionError,
  ] = useState('');

  const [
    optionModalDay,
    setOptionModalDay,
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


  const monthMatrix =
    useMemo(
      () =>
        getMonthMatrix(
          refDate,
        ),
      [refDate],
    );


  const monthLabel =
    useMemo(
      () =>
        refDate.toLocaleDateString(
          'fr-FR',
          {
            month: 'long',
            year: 'numeric',
          },
        ),
      [refDate],
    );


  const loadMonth =
    useCallback(async () => {
      setLoading(true);
      setError('');


      const {
        startDay,
        endDay,
      } =
        getMonthRange(
          refDate,
        );


      try {
        const [
          availabilityRows,
          commitmentRows,
          noteRows,
          historyRows,
        ] =
          await Promise.all([
            getMyTrainerAvailability({
              startDay,
              endDay,
            }),

            getMyTrainerCommitments({
              startDay,
              endDay,
            }),

            getMyAvailabilityNotes({
              startDay,
              endDay,
            }),

            getMyAvailabilityHistory({
              startDay,
              endDay,
            }),
          ]);


        const availabilityMap = {};

        let latestUpdate = null;


        for (
          const row of
          availabilityRows
        ) {
          availabilityMap[
            row.day
          ] = {
            status:
              row.status || '',

            updatedAt:
              row.updated_at,
          };


          if (
            row.updated_at &&
            (
              !latestUpdate ||
              new Date(
                row.updated_at,
              ) >
                new Date(
                  latestUpdate,
                )
            )
          ) {
            latestUpdate =
              row.updated_at;
          }
        }


        const commitmentMap = {};

        for (
          const row of
          commitmentRows
        ) {
          if (!commitmentMap[row.day]) {
            commitmentMap[row.day] = [];
          }

          commitmentMap[row.day].push({
            status: row.status || '',
            missionId: row.mission_id || null,
            missionFormateurId:
              row.mission_formateur_id || null,
            title:
              row.mission_title ||
              'Mission de formation',
            organizationId:
              row.organization_id || null,
            organizationName:
              row.organization_name ||
              'Organisme de formation',
          });
        }


        const noteMap = {};

        for (
          const note of
          noteRows
        ) {
          if (!noteMap[note.day]) {
            noteMap[note.day] = [];
          }

          noteMap[note.day].push(
            note,
          );
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
          availabilityMap,
        );

        setCommitments(
          commitmentMap,
        );

        setNotesByDay(
          noteMap,
        );

        setHistoryByDay(
          historyMap,
        );

        setLastUpdatedAt(
          latestUpdate,
        );
      } catch (loadError) {
        console.error(
          loadError,
        );

        setError(
          'Impossible de charger vos disponibilités.',
        );
      } finally {
        setLoading(false);
      }
    }, [refDate]);


  useEffect(() => {
    loadMonth();
  }, [loadMonth]);


  const changeMonth =
    (offset) => {
      setRefDate(
        (current) =>
          new Date(
            current.getFullYear(),
            current.getMonth() +
              offset,
            1,
          ),
      );
    };


  /*
   * Le statut n'est désormais modifié
   * QUE par un bouton explicite.
   *
   * Cliquer ailleurs dans la cellule
   * ne change plus rien.
   */
  const handleStatusChange =
    async (
      iso,
      nextStatus,
    ) => {
      const hasConfirmedMission = (commitments[iso] || []).some(
        (item) => item.status === 'mission',
      );

      // Une option n'empêche jamais le formateur de modifier
      // sa disponibilité déclarée. Seule une mission confirmée
      // verrouille la journée.
      if (hasConfirmedMission || savingDay) {
        return;
      }


      const currentStatus =
        availability[iso]
          ?.status || '';


      if (
        currentStatus ===
        nextStatus
      ) {
        return;
      }


      setSavingDay(iso);
      setError('');


      setAvailability(
        (current) => ({
          ...current,

          [iso]: {
            ...current[iso],

            status:
              nextStatus,
          },
        }),
      );


      try {
        const result =
          await setMyTrainerAvailability({
            day: iso,
            status:
              nextStatus,
          });


        if (result) {
          setAvailability(
            (current) => ({
              ...current,

              [iso]: {
                status:
                  result.status ||
                  '',

                updatedAt:
                  result.updated_at,
              },
            }),
          );


          setLastUpdatedAt(
            result.updated_at,
          );
        }


        await loadMonth();
      } catch (saveError) {
        console.error(
          saveError,
        );

        await loadMonth();

        setError(
          'Impossible de modifier cette disponibilité.',
        );
      } finally {
        setSavingDay('');
      }
    };


  const openNotes =
    (
      event,
      iso,
    ) => {
      event.stopPropagation();

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
      iso,
    ) => {
      event.stopPropagation();

      setHistoryModalDay(
        iso,
      );

      setNoteModalDay(
        null,
      );
    };


  const _openMission =
    async (
      event,
      missionId,
    ) => {
      event.stopPropagation();

      if (!missionId) {
        return;
      }

      setNoteModalDay(null);
      setHistoryModalDay(null);
      setMissionModal(null);
      setMissionError('');
      setLoadingMission(true);

      try {
        const mission =
          await getMyTrainerMission(
            missionId,
          );

        if (!mission) {
          throw new Error(
            'Mission introuvable.',
          );
        }

        setMissionModal(
          mission,
        );
      } catch (loadMissionError) {
        console.error(
          loadMissionError,
        );

        setMissionError(
          'Impossible de charger cette mission.',
        );
      } finally {
        setLoadingMission(false);
      }
    };


  const closeMission =
    () => {
      setMissionModal(null);
      setMissionError('');
      setLoadingMission(false);
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


  const startEditNote =
    (note) => {
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


  const saveNote =
    async () => {
      if (
        !noteModalDay ||
        !noteDraft.trim()
      ) {
        return;
      }


      setSavingNote(true);
      setError('');


      try {
        if (editingNoteId) {
          await updateMyAvailabilityNote({
            noteId:
              editingNoteId,

            content:
              noteDraft.trim(),
          });
        } else {
          await createMyAvailabilityNote({
            day:
              noteModalDay,

            content:
              noteDraft.trim(),
          });
        }


        await loadMonth();

        setEditingNoteId(null);
        setNoteDraft('');
      } catch (saveError) {
        console.error(
          saveError,
        );

        setError(
          'Impossible d’enregistrer cette note.',
        );
      } finally {
        setSavingNote(false);
      }
    };


  const deleteNote =
    async (noteId) => {
      if (!noteId) {
        return;
      }


      setSavingNote(true);
      setError('');


      try {
        await deleteMyAvailabilityNote(
          noteId,
        );

        await loadMonth();

        if (
          editingNoteId ===
          noteId
        ) {
          cancelEditNote();
        }
      } catch (deleteError) {
        console.error(
          deleteError,
        );

        setError(
          'Impossible de supprimer cette note.',
        );
      } finally {
        setSavingNote(false);
      }
    };


  const today =
    new Date();


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
      ? notesByDay[
          noteModalDay
        ] || []
      : [];


  const modalHistory =
    historyModalDay
      ? historyByDay[
          historyModalDay
        ] || []
      : [];


  return (
    <div className="page-container trainer-availability-page">

      <div className="page-heading trainer-availability-heading">

        <div>
          <p className="page-eyebrow">
            DISPONIBILITÉS
          </p>

          <h1>
            Mes disponibilités
          </h1>

          <p>
            Choisissez explicitement votre statut
            pour chaque journée et ajoutez des
            notes si nécessaire.
          </p>
        </div>


        <div className="trainer-availability-updated">
          Dernière mise à jour :{' '}
          {lastUpdatedAt
            ? new Date(
                lastUpdatedAt,
              ).toLocaleString(
                'fr-FR',
              )
            : '—'}
        </div>

      </div>


      {error ? (
        <div className="alert alert--error">
          {error}
        </div>
      ) : null}


      <div className="trainer-availability-info">

        <span className="trainer-availability-help-dot trainer-availability-help-dot--dispo" />
        <span>Disponible</span>

        <span className="trainer-availability-help-dot trainer-availability-help-dot--indispo" />
        <span>Indisponible</span>

        <span className="trainer-availability-help-dot trainer-availability-help-dot--option" />
        <span>Option</span>

        <span className="trainer-availability-help-dot trainer-availability-help-dot--mission" />
        <span>Mission</span>

      </div>


      <div className="calendar-card trainer-availability-calendar">

        <div className="trainer-availability-toolbar">

          <button
            type="button"
            className="icon-button"
            onClick={() =>
              changeMonth(-1)
            }
          >
            ‹
          </button>


          <div className="trainer-availability-month">
            {monthLabel}
          </div>


          <button
            type="button"
            className="icon-button"
            onClick={() =>
              changeMonth(1)
            }
          >
            ›
          </button>


          <button
            type="button"
            className="button button--soft"
            onClick={() =>
              setRefDate(
                new Date(),
              )
            }
          >
            Aujourd’hui
          </button>

        </div>


        <div className="trainer-availability-weekdays">

          {weekdays.map(
            (weekday) => (
              <div key={weekday}>
                {weekday}
              </div>
            ),
          )}

        </div>


        {loading ? (
          <div className="trainer-availability-loading">
            Chargement des disponibilités…
          </div>
        ) : (
          <div className="trainer-availability-grid">

            {monthMatrix
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


                  const declaredStatus =
                    availability[
                      iso
                    ]?.status ||
                    '';


                  const dayCommitments =
                    commitments[
                      iso
                    ] || [];

                  const missionCommitment =
                    dayCommitments.find(
                      (item) =>
                        item.status ===
                        'mission',
                    ) || null;

                  const optionCommitments =
                    dayCommitments.filter(
                      (item) =>
                        item.status ===
                        'option',
                    );

                  const missionId =
                    missionCommitment?.missionId ||
                    null;

                  /* Une option n'écrase jamais la disponibilité déclarée. */
                  const visibleStatus =
                    missionCommitment
                      ? 'mission'
                      : declaredStatus;

                  const locked =
                    Boolean(
                      missionCommitment,
                    );


                  const notes =
                    notesByDay[
                      iso
                    ] || [];


                  const history =
                    historyByDay[
                      iso
                    ] || [];


                  const hasNotes =
                    notes.length > 0;


                  const hasHistory =
                    history.length > 0;


                  const classes = [
                    'trainer-availability-day',

                    !inMonth
                      ? 'trainer-availability-day--outside'
                      : '',

                    sameDay(
                      date,
                      today,
                    )
                      ? 'trainer-availability-day--today'
                      : '',

                    visibleStatus
                      ? `trainer-availability-day--${visibleStatus}`
                      : '',

                    locked
                      ? 'trainer-availability-day--locked'
                      : '',

                    savingDay ===
                    iso
                      ? 'trainer-availability-day--saving'
                      : '',
                  ]
                    .filter(Boolean)
                    .join(' ');


                  return (
                    <div
                      key={iso}
                      className={
                        classes
                      }
                      style={{
                        cursor:
                          'default',

                        display:
                          'flex',

                        flexDirection:
                          'column',

                        minHeight:
                          138,
                      }}
                    >

                      <span className="trainer-availability-day__number">
                        {date.getDate()}
                      </span>


                      {visibleStatus ? (
                        <span className="trainer-availability-day__status">
                          {
                            STATUS_LABELS[
                              visibleStatus
                            ]
                          }
                        </span>
                      ) : null}


                      {optionCommitments.length > 0 ? (
                        <div style={{ display: 'grid', gap: 5, marginTop: 6 }}>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setOptionModalDay(iso);
                            }}
                            style={{
                              minHeight: 28,
                              border: '1px solid #facc15',
                              borderRadius: 6,
                              background: '#fff7d6',
                              color: '#854d0e',
                              fontSize: 9,
                              fontWeight: 800,
                              cursor: 'pointer',
                            }}
                          >
                            {optionCommitments.length} option{optionCommitments.length > 1 ? 's' : ''}
                          </button>

                          {optionCommitments.length === 1 && optionCommitments[0]?.missionId ? (
                            <Link
                              to={`/formateur/missions/${optionCommitments[0].missionId}`}
                              onClick={(event) => event.stopPropagation()}
                              style={{
                                display: 'grid',
                                placeItems: 'center',
                                minHeight: 26,
                                border: '1px solid #facc15',
                                borderRadius: 6,
                                background: '#fff',
                                color: '#854d0e',
                                fontSize: 8,
                                fontWeight: 800,
                                textDecoration: 'none',
                              }}
                            >
                              Voir la mission
                            </Link>
                          ) : null}
                        </div>
                      ) : null}

                      {locked ? (
                        <div
                          style={{
                            display:
                              'grid',

                            gap:
                              6,

                            marginTop:
                              6,
                          }}
                        >
                          <span className="trainer-availability-day__auto">
                            automatique
                          </span>

                          {missionId ? (
                            <Link
                              to={`/formateur/missions/${missionId}`}
                              onClick={(event) => event.stopPropagation()}
                              style={{
                                display: 'grid',
                                placeItems: 'center',
                                minHeight: 26,
                                border: '1px solid rgba(15,23,42,.16)',
                                borderRadius: 6,
                                background: visibleStatus === 'mission' ? '#dbeafe' : '#fff7d6',
                                color: visibleStatus === 'mission' ? '#1d4ed8' : '#854d0e',
                                fontSize: 8,
                                fontWeight: 800,
                                textDecoration: 'none',
                              }}
                            >
                              Voir la mission
                            </Link>
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
                            handleStatusChange
                          }
                        />
                      )}


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
                            6,
                        }}
                      >

                        <button
                          type="button"
                          onClick={(
                            event,
                          ) =>
                            openNotes(
                              event,
                              iso,
                            )
                          }
                          style={{
                            minHeight:
                              24,

                            border:
                              '1px solid rgba(15,23,42,.14)',

                            borderRadius:
                              6,

                            background:
                              hasNotes
                                ? '#fff7d6'
                                : 'rgba(255,255,255,.82)',

                            color:
                              '#334155',

                            fontSize:
                              8,

                            fontWeight:
                              750,

                            cursor:
                              'pointer',
                          }}
                        >
                          {hasNotes
                            ? `Note ${notes.length}`
                            : 'Note'}
                        </button>


                        <button
                          type="button"
                          onClick={(
                            event,
                          ) =>
                            openHistory(
                              event,
                              iso,
                            )
                          }
                          style={{
                            minHeight:
                              24,

                            border:
                              '1px solid rgba(15,23,42,.14)',

                            borderRadius:
                              6,

                            background:
                              hasHistory
                                ? '#eef2ff'
                                : 'rgba(255,255,255,.82)',

                            color:
                              '#334155',

                            fontSize:
                              8,

                            fontWeight:
                              750,

                            cursor:
                              'pointer',
                          }}
                        >
                          {hasHistory
                            ? `Historique ${history.length}`
                            : 'Historique'}
                        </button>

                      </div>

                    </div>
                  );
                },
              )}

          </div>
        )}


        <div className="trainer-availability-footer">

          <strong>
            Comment ça marche ?
          </strong>

          <span>
            Utilisez Disponible, Indisponible ou
            Non renseigné pour choisir explicitement
            l’état d’une journée.
          </span>

          <span>
            La couleur de toute la cellule indique
            immédiatement l’état actuel.
          </span>

          <span>
            Notes et historique sont deux fonctions
            distinctes.
          </span>

          <span>
            Les options et missions sont automatiques
            et ne peuvent pas être modifiées ici.
          </span>

        </div>

      </div>


      {noteModalDay ? (
        <div
          className="trainer-note-modal-backdrop"
          onMouseDown={
            closeNotes
          }
        >

          <div
            className="trainer-note-modal"
            onMouseDown={(
              event,
            ) =>
              event.stopPropagation()
            }
          >

            <div className="trainer-note-modal__heading">

              <div>
                <p className="page-eyebrow">
                  NOTES
                </p>

                <h2>
                  {formatLongDate(
                    noteModalDay,
                  )}
                </h2>
              </div>


              <button
                type="button"
                className="trainer-note-modal__close"
                onClick={
                  closeNotes
                }
              >
                ×
              </button>

            </div>


            <div className="trainer-note-list">

              {modalNotes.length ===
              0 ? (
                <div className="trainer-note-list__empty">
                  Aucune note pour cette journée.
                </div>
              ) : (
                modalNotes.map(
                  (note) => (
                    <article
                      key={note.id}
                      className="trainer-note-item"
                    >

                      <p>
                        {note.content}
                      </p>


                      <div className="trainer-note-item__actions">

                        <button
                          type="button"
                          disabled={
                            savingNote
                          }
                          onClick={() =>
                            startEditNote(
                              note,
                            )
                          }
                        >
                          Modifier
                        </button>


                        <button
                          type="button"
                          className="trainer-note-item__delete"
                          disabled={
                            savingNote
                          }
                          onClick={() =>
                            deleteNote(
                              note.id,
                            )
                          }
                        >
                          Supprimer
                        </button>

                      </div>

                    </article>
                  ),
                )
              )}

            </div>


            <div className="trainer-note-editor">

              <label>
                {editingNoteId
                  ? 'Modifier la note'
                  : 'Ajouter une note'}
              </label>


              <textarea
                rows={4}
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
                placeholder="Ex. Disponible uniquement l’après-midi"
              />


              <div className="trainer-note-editor__actions">

                {editingNoteId ? (
                  <button
                    type="button"
                    className="button"
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
                  className="button button--primary"
                  disabled={
                    savingNote ||
                    !noteDraft.trim()
                  }
                  onClick={
                    saveNote
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

          </div>

        </div>
      ) : null}


      {historyModalDay ? (
        <div
          className="trainer-note-modal-backdrop"
          onMouseDown={
            closeHistory
          }
        >

          <div
            className="trainer-note-modal"
            onMouseDown={(
              event,
            ) =>
              event.stopPropagation()
            }
          >

            <div className="trainer-note-modal__heading">

              <div>
                <p className="page-eyebrow">
                  HISTORIQUE
                </p>

                <h2>
                  {formatLongDate(
                    historyModalDay,
                  )}
                </h2>
              </div>


              <button
                type="button"
                className="trainer-note-modal__close"
                onClick={
                  closeHistory
                }
              >
                ×
              </button>

            </div>


            <p
              style={{
                margin:
                  '0 0 14px',

                color:
                  '#64748b',

                fontSize:
                  11,
              }}
            >
              Les changements de disponibilité
              sont conservés automatiquement et
              ne peuvent pas être modifiés.
            </p>


            {modalHistory.length ===
            0 ? (
              <div className="trainer-note-list__empty">
                Aucun changement enregistré pour cette journée.
              </div>
            ) : (
              <div
                style={{
                  display:
                    'grid',

                  gap:
                    9,
                }}
              >
                {modalHistory.map(
                  (item) => (
                    <HistoryItem
                      key={item.id}
                      item={item}
                    />
                  ),
                )}
              </div>
            )}

          </div>

        </div>
      ) : null}


      {optionModalDay ? (
        <div
          className="trainer-note-modal-backdrop"
          onMouseDown={() => setOptionModalDay(null)}
        >
          <div
            className="trainer-note-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="trainer-note-modal__heading">
              <div>
                <p className="page-eyebrow">OPTIONS</p>
                <h2>{formatLongDate(optionModalDay)}</h2>
              </div>
              <button
                type="button"
                className="trainer-note-modal__close"
                onClick={() => setOptionModalDay(null)}
              >×</button>
            </div>

            <p style={{ margin: '0 0 12px', color: '#667085', fontSize: 11 }}>
              Ces missions ont été acceptées mais aucun OF ne vous a encore affecté définitivement.
            </p>

            <div style={{ display: 'grid', gap: 8 }}>
              {(commitments[optionModalDay] || [])
                .filter((item) => item.status === 'option')
                .map((item) => (
                  <div
                    key={`${item.missionId}-${item.missionFormateurId || ''}`}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(0,1fr) auto',
                      gap: 12,
                      alignItems: 'center',
                      padding: '10px 11px',
                      border: '1px solid #e4e7ec',
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ display: 'grid', gap: 3 }}>
                      <strong style={{ color: '#101828', fontSize: 12 }}>{item.title}</strong>
                      <span style={{ color: '#667085', fontSize: 10 }}>OF : {item.organizationName}</span>
                    </div>
                    <Link
                      to={`/formateur/missions/${item.missionId}`}
                      className="button button--soft"
                      onClick={() => setOptionModalDay(null)}
                    >
                      Ouvrir
                    </Link>
                  </div>
                ))}
            </div>
          </div>
        </div>
      ) : null}

      {(loadingMission ||
        missionError ||
        missionModal) ? (
        <div
          className="trainer-note-modal-backdrop"
          onMouseDown={
            closeMission
          }
        >

          <div
            className="trainer-note-modal"
            onMouseDown={(
              event,
            ) =>
              event.stopPropagation()
            }
          >

            <div className="trainer-note-modal__heading">

              <div>
                <p className="page-eyebrow">
                  {missionModal?.relation_status ===
                  'affecte'
                    ? 'MISSION'
                    : 'OPTION'}
                </p>

                <h2>
                  {missionModal?.title ||
                    'Détail de la mission'}
                </h2>
              </div>


              <button
                type="button"
                className="trainer-note-modal__close"
                onClick={
                  closeMission
                }
              >
                ×
              </button>

            </div>


            {loadingMission ? (
              <div className="trainer-note-list__empty">
                Chargement de la mission…
              </div>
            ) : null}


            {missionError ? (
              <div className="alert alert--error">
                {missionError}
              </div>
            ) : null}


            {missionModal ? (
              <TrainerMissionDetails
                mission={
                  missionModal
                }
              />
            ) : null}

          </div>

        </div>
      ) : null}

    </div>
  );
}


function TrainerMissionDetails({
  mission,
}) {
  const dates =
    Array.isArray(
      mission.dates,
    )
      ? mission.dates
      : [];


  const location = [
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


  return (
    <div
      style={{
        display:
          'grid',

        gap:
          14,
      }}
    >

      <div
        style={{
          display:
            'grid',

          gridTemplateColumns:
            'repeat(auto-fit, minmax(180px, 1fr))',

          gap:
            10,
        }}
      >
        <MissionInfo
          label="Statut"
          value={
            mission.relation_status ===
            'affecte'
              ? 'Mission confirmée'
              : 'Option'
          }
        />

        <MissionInfo
          label="Formation"
          value={
            mission.formation ||
            mission.title ||
            '—'
          }
        />

        <MissionInfo
          label="Lieu"
          value={
            mission.lieu ||
            location ||
            '—'
          }
        />
      </div>


      {location ? (
        <MissionInfo
          label="Adresse"
          value={location}
        />
      ) : null}


      <div>
        <strong
          style={{
            display:
              'block',

            marginBottom:
              8,

            fontSize:
              12,
          }}
        >
          Date{dates.length > 1 ? 's' : ''} et horaires
        </strong>


        {dates.length ===
        0 ? (
          <div className="trainer-note-list__empty">
            Aucune date renseignée.
          </div>
        ) : (
          <div
            style={{
              display:
                'grid',

              gap:
                7,
            }}
          >
            {dates.map(
              (dateItem) => (
                <div
                  key={`${dateItem.date}-${dateItem.heure_debut || ''}`}
                  style={{
                    padding:
                      10,

                    border:
                      '1px solid #e2e8f0',

                    borderRadius:
                      8,

                    background:
                      '#f8fafc',

                    fontSize:
                      11,
                  }}
                >
                  <strong>
                    {formatLongDate(
                      dateItem.date,
                    )}
                  </strong>

                  {(dateItem.heure_debut ||
                    dateItem.heure_fin) ? (
                    <span
                      style={{
                        marginLeft:
                          8,

                        color:
                          '#64748b',
                      }}
                    >
                      {dateItem.heure_debut ||
                        '—'}
                      {' → '}
                      {dateItem.heure_fin ||
                        '—'}
                    </span>
                  ) : null}
                </div>
              ),
            )}
          </div>
        )}
      </div>


      <div
        style={{
          padding:
            10,

          border:
            '1px solid #dbeafe',

          borderRadius:
            8,

          background:
            '#eff6ff',

          color:
            '#1e3a8a',

          fontSize:
            10,

          lineHeight:
            1.45,
        }}
      >
        Cette vue affiche uniquement les informations
        de mission accessibles au formateur.
      </div>

    </div>
  );
}


function MissionInfo({
  label,
  value,
}) {
  return (
    <div>
      <div
        style={{
          marginBottom:
            3,

          color:
            '#64748b',

          fontSize:
            9,

          fontWeight:
            700,

          textTransform:
            'uppercase',

          letterSpacing:
            '.04em',
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize:
            12,

          fontWeight:
            650,
        }}
      >
        {value}
      </div>
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
      activeColor:
        '#fff',
    },

    {
      value:
        'indispo',
      label:
        'Indisponible',
      activeBackground:
        '#dc2626',
      activeColor:
        '#fff',
    },

    {
      value:
        '',
      label:
        'Non renseigné',
      activeBackground:
        '#475569',
      activeColor:
        '#fff',
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
          8,
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
                  23,

                padding:
                  '2px 4px',

                border:
                  active
                    ? '1px solid transparent'
                    : '1px solid rgba(15,23,42,.15)',

                borderRadius:
                  5,

                background:
                  active
                    ? option.activeBackground
                    : 'rgba(255,255,255,.78)',

                color:
                  active
                    ? option.activeColor
                    : '#475569',

                fontSize:
                  7,

                fontWeight:
                  active
                    ? 850
                    : 700,

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


function HistoryItem({
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
          6,

        padding:
          12,

        border:
          isTrainer
            ? '1px solid #bfdbfe'
            : '1px solid #e2e8f0',

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
          style={{
            padding:
              '3px 7px',

            borderRadius:
              999,

            background:
              '#fff',
          }}
        >
          {
            STATUS_LABELS[
              item.previous_status ??
              ''
            ]
          }
        </span>


        <strong>
          →
        </strong>


        <span
          style={{
            padding:
              '3px 7px',

            borderRadius:
              999,

            background:
              '#fff',
          }}
        >
          {
            STATUS_LABELS[
              item.new_status ??
              ''
            ]
          }
        </span>

      </div>

    </article>
  );
}