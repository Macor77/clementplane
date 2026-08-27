import { useEffect, useMemo, useState } from 'react';
import { getAvailabilitiesForMonth } from '../services/availabilityService';

const normalizeSearchValue = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const normalizeId = (value) => String(value ?? '').trim();

const listToSearchText = (value) => {
  if (Array.isArray(value)) {
    return value.join(' ');
  }

  return value ?? '';
};

const matchesAllTerms = (searchText, query) => {
  const terms = normalizeSearchValue(query)
    .split(/\s+/)
    .filter(Boolean);

  if (terms.length === 0) return true;

  const normalizedText = normalizeSearchValue(searchText);

  return terms.every((term) => normalizedText.includes(term));
};

const toISODate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const getAvailabilityRange = (
  disponibilite,
  dateDisponibilite
) => {
  if (disponibilite === 'date') {
    if (!dateDisponibilite) return null;

    return {
      startDay: dateDisponibilite,
      endDay: dateDisponibilite,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (disponibilite === 'today') {
    const todayIso = toISODate(today);

    return {
      startDay: todayIso,
      endDay: todayIso,
    };
  }

  if (disponibilite === 'week') {
    const endOfWeek = new Date(today);
    const dayOfWeek = today.getDay();

    const daysUntilSunday =
      dayOfWeek === 0 ? 0 : 7 - dayOfWeek;

    endOfWeek.setDate(
      today.getDate() + daysUntilSunday
    );

    return {
      startDay: toISODate(today),
      endDay: toISODate(endOfWeek),
    };
  }

  return null;
};

export default function useListingFilters({
  formateurs,
  sortList,
}) {
  const [filteredFormateurs, setFilteredFormateurs] =
    useState([]);

  const [availableTrainerIds, setAvailableTrainerIds] =
    useState(null);

  const [availabilityLoading, setAvailabilityLoading] =
    useState(false);

  const [availabilityError, setAvailabilityError] =
    useState('');

  const [filters, setFilters] = useState({
    recherche: '',
    competence: '',
    materiel: '',
    statuts: [],
    disponibilite: 'all',
    dateDisponibilite: '',
  });

  const trainerIds = useMemo(
    () =>
      formateurs
        .map((formateur) => formateur.id)
        .filter(Boolean),
    [formateurs]
  );

  const availabilityRange = useMemo(
    () =>
      getAvailabilityRange(
        filters.disponibilite,
        filters.dateDisponibilite
      ),
    [
      filters.disponibilite,
      filters.dateDisponibilite,
    ]
  );

  useEffect(() => {
    let cancelled = false;

    const range = availabilityRange;

    if (!range) {
      setAvailableTrainerIds(null);
      setAvailabilityLoading(false);
      setAvailabilityError('');

      return undefined;
    }

    if (trainerIds.length === 0) {
      setAvailableTrainerIds(new Set());
      setAvailabilityLoading(false);
      setAvailabilityError('');

      return undefined;
    }

    async function loadAvailableTrainers() {
      setAvailabilityLoading(true);
      setAvailabilityError('');

      try {
        const rows =
          await getAvailabilitiesForMonth({
            trainerIds,
            startDay: range.startDay,
            endDay: range.endDay,
          });

        if (cancelled) return;

        const ids = new Set(
          rows
            .filter(
              (row) =>
                normalizeSearchValue(row.status) ===
                'dispo'
            )
            .map((row) =>
              normalizeId(row.trainer_id)
            )
            .filter(Boolean)
        );

        setAvailableTrainerIds(ids);
      } catch (error) {
        console.error(
          'Erreur filtre disponibilités :',
          error
        );

        if (!cancelled) {
          setAvailableTrainerIds(new Set());

          setAvailabilityError(
            'Impossible de vérifier les disponibilités pour le moment.'
          );
        }
      } finally {
        if (!cancelled) {
          setAvailabilityLoading(false);
        }
      }
    }

    loadAvailableTrainers();

    return () => {
      cancelled = true;
    };
  }, [availabilityRange, trainerIds]);

  useEffect(() => {
    const filtered = formateurs.filter(
      (formateur) => {
        const identityAndLocation = [
          formateur.prenom,
          formateur.nom,
          formateur.ville,
          formateur.codePostal,
          formateur.code_postal,
        ].join(' ');

        const competences = listToSearchText(
          formateur.competences
        );

        const materiel = listToSearchText(
          formateur.materiel
        );

        const matchesSearch = matchesAllTerms(
          identityAndLocation,
          filters.recherche
        );

        const matchesCompetence = matchesAllTerms(
          competences,
          filters.competence
        );

        const matchesMateriel = matchesAllTerms(
          materiel,
          filters.materiel
        );

        const normalizedTrainerStatus = normalizeSearchValue(formateur.statut);

        const matchesStatus =
          filters.statuts.length === 0 ||
          filters.statuts.some(
            (status) => normalizeSearchValue(status) === normalizedTrainerStatus
          );

        const availabilityFilterIsActive =
          filters.disponibilite !== 'all' &&
          !(
            filters.disponibilite === 'date' &&
            !filters.dateDisponibilite
          );

        const matchesAvailability =
          !availabilityFilterIsActive ||
          (
            !availabilityLoading &&
            availableTrainerIds instanceof Set &&
            availableTrainerIds.has(
              normalizeId(formateur.id)
            )
          );

        return (
          matchesSearch &&
          matchesCompetence &&
          matchesMateriel &&
          matchesStatus &&
          matchesAvailability
        );
      }
    );

    setFilteredFormateurs(sortList(filtered));
  }, [
    filters,
    formateurs,
    sortList,
    availableTrainerIds,
    availabilityLoading,
  ]);

  const handleStatutChange = (eventOrValue) => {
    const value =
      typeof eventOrValue === 'string'
        ? eventOrValue
        : eventOrValue?.target?.value;

    if (!value) return;

    setFilters((previousFilters) => {
      const statuts =
        previousFilters.statuts.includes(value)
          ? previousFilters.statuts.filter(
              (statut) => statut !== value
            )
          : [
              ...previousFilters.statuts,
              value,
            ];

      return {
        ...previousFilters,
        statuts,
      };
    });
  };

  const resetFilters = () => {
    setFilters({
      recherche: '',
      competence: '',
      materiel: '',
      statuts: [],
      disponibilite: 'all',
      dateDisponibilite: '',
    });
  };

  return {
    filters,
    setFilters,
    filteredFormateurs,
    handleStatutChange,
    resetFilters,
    availabilityLoading,
    availabilityError,
  };
}