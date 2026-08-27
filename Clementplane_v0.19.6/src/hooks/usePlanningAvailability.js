import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  getAvailabilitiesForMonth,
  getOrganizationAvailabilityNotes,
} from '../services/availabilityService';

import {
  getTrainerMissionCommitments,
} from '../services/missionsService';

import { useAuth } from '../context/AuthContext';


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
    startDay:
      toISODate(start),

    endDay:
      toISODate(end),
  };
}


export default function usePlanningAvailability({
  formateurs,
  planningDate,
}) {
  const {
    currentOrganization,
  } = useAuth();

  const [
    planningAvailability,
    setPlanningAvailability,
  ] = useState({});

  const [
    planningLoading,
    setPlanningLoading,
  ] = useState(false);

  const [
    planningError,
    setPlanningError,
  ] = useState('');


  const trainerIds =
    useMemo(
      () =>
        formateurs
          .map(
            (formateur) =>
              formateur.id,
          )
          .filter(Boolean),
      [formateurs],
    );


  const trainerIdsKey =
    trainerIds.join(',');


  useEffect(() => {
    let cancelled = false;


    async function loadPlanning() {
      if (
        trainerIds.length === 0
      ) {
        setPlanningAvailability({});
        setPlanningLoading(false);
        setPlanningError('');

        return;
      }


      setPlanningLoading(true);
      setPlanningError('');


      const {
        startDay,
        endDay,
      } =
        getMonthRange(
          planningDate,
        );


      try {
        const [
          availabilityRows,
          commitmentRows,
          noteRows,
        ] =
          await Promise.all([
            getAvailabilitiesForMonth({
              trainerIds,
              startDay,
              endDay,
            }),

            getTrainerMissionCommitments({
              trainerIds,
              startDay,
              endDay,

              organizationId:
                currentOrganization?.id,
            }),

            getOrganizationAvailabilityNotes({
              organizationId:
                currentOrganization?.id,

              trainerIds,

              startDay,
              endDay,
            }),
          ]);


        if (cancelled) {
          return;
        }


        const availabilityMap = {};


        /*
         * DISPONIBILITÉS
         */
        for (
          const row of
          availabilityRows
        ) {
          if (
            !availabilityMap[
              row.trainer_id
            ]
          ) {
            availabilityMap[
              row.trainer_id
            ] = {};
          }


          availabilityMap[
            row.trainer_id
          ][row.day] = {
            id:
              row.id,

            status:
              row.status ?? '',

            declaredStatus:
              row.status ?? '',

            source:
              'availability',

            notes: [],

            /*
             * Compatibilité avec les composants
             * historiques qui vérifient encore
             * simplement "note".
             */
            note: '',

            updatedAt:
              row.updated_at,
          };
        }


        /*
         * NOTES
         */
        for (
          const note of
          noteRows
        ) {
          if (
            !availabilityMap[
              note.trainer_id
            ]
          ) {
            availabilityMap[
              note.trainer_id
            ] = {};
          }


          if (
            !availabilityMap[
              note.trainer_id
            ][note.day]
          ) {
            availabilityMap[
              note.trainer_id
            ][note.day] = {
              id: null,
              status: '',
              declaredStatus: '',
              source:
                'availability',
              notes: [],
              note: '',
              updatedAt: null,
            };
          }


          const cell =
            availabilityMap[
              note.trainer_id
            ][note.day];


          cell.notes.push(
            note,
          );


          /*
           * On conserve "note" sous forme de texte
           * pour le mini-planning historique.
           */
          cell.note =
            cell.notes
              .map(
                (item) =>
                  item.content,
              )
              .join('\n');
        }


        /*
         * OPTIONS / MISSIONS
         */
        for (
          const commitment of
          commitmentRows
        ) {
          if (
            !availabilityMap[
              commitment.formateur_id
            ]
          ) {
            availabilityMap[
              commitment.formateur_id
            ] = {};
          }


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
              availabilityMap[
                commitment.formateur_id
              ][day] || {
                status: '',
                declaredStatus: '',
                source:
                  'availability',
                notes: [],
                note: '',
                updatedAt: null,
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


            availabilityMap[
              commitment.formateur_id
            ][day] = {
              ...current,

              status:
                derivedStatus,

              source:
                derivedSource,
            };
          }
        }


        setPlanningAvailability(
          availabilityMap,
        );
      } catch (error) {
        console.error(
          'Erreur chargement planning :',
          error,
        );


        if (!cancelled) {
          setPlanningAvailability(
            {},
          );

          setPlanningError(
            'Impossible de charger les disponibilités.',
          );
        }
      } finally {
        if (!cancelled) {
          setPlanningLoading(
            false,
          );
        }
      }
    }


    loadPlanning();


    return () => {
      cancelled = true;
    };
  }, [
    trainerIdsKey,
    planningDate,
    currentOrganization?.id,
  ]);


  return {
    planningAvailability,
    planningLoading,
    planningError,
  };
}