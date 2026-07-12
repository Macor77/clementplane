import { useEffect, useMemo, useState } from 'react';
import { getAvailabilitiesForMonth } from '../services/availabilityService';

function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getMonthRange(date) {
  const start = new Date(
    date.getFullYear(),
    date.getMonth(),
    1
  );

  const end = new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0
  );

  return {
    startDay: toISODate(start),
    endDay: toISODate(end),
  };
}

export default function usePlanningAvailability({
  formateurs,
  planningDate,
}) {
  const [planningAvailability, setPlanningAvailability] =
    useState({});

  const [planningLoading, setPlanningLoading] =
    useState(false);

  const [planningError, setPlanningError] =
    useState('');

  const trainerIds = useMemo(
    () =>
      formateurs
        .map((formateur) => formateur.id)
        .filter(Boolean),
    [formateurs]
  );

  const trainerIdsKey = trainerIds.join(',');

  useEffect(() => {
    let cancelled = false;

    async function loadPlanning() {
      if (trainerIds.length === 0) {
        setPlanningAvailability({});
        setPlanningLoading(false);
        setPlanningError('');
        return;
      }

      setPlanningLoading(true);
      setPlanningError('');

      const { startDay, endDay } =
        getMonthRange(planningDate);

      try {
        const rows =
          await getAvailabilitiesForMonth({
            trainerIds,
            startDay,
            endDay,
          });

        if (cancelled) return;

        const availabilityMap = {};

        for (const row of rows) {
          if (!availabilityMap[row.trainer_id]) {
            availabilityMap[row.trainer_id] = {};
          }

          availabilityMap[row.trainer_id][row.day] = {
            id: row.id,
            status: row.status ?? '',
            note: row.note ?? '',
            updatedAt: row.updated_at,
          };
        }

        setPlanningAvailability(availabilityMap);
      } catch (error) {
        console.error(
          'Erreur chargement planning :',
          error
        );

        if (!cancelled) {
          setPlanningAvailability({});
          setPlanningError(
            'Impossible de charger les disponibilités.'
          );
        }
      } finally {
        if (!cancelled) {
          setPlanningLoading(false);
        }
      }
    }

    loadPlanning();

    return () => {
      cancelled = true;
    };
  }, [
    trainerIdsKey,
    planningDate.getFullYear(),
    planningDate.getMonth(),
  ]);

  return {
    planningAvailability,
    planningLoading,
    planningError,
  };
}