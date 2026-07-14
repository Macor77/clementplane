import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import ListingTable from '../components/listing/ListingTable';
import ListingFilters from '../components/listing/ListingFilters';
import ListingHeader from '../components/listing/ListingHeader';

import useFormateurs from '../hooks/useFormateurs';
import useSort from '../hooks/useSort';
import useListingFilters from '../hooks/useListingFilters';
import useDistances from '../hooks/useDistances';
import usePlanningAvailability from '../hooks/usePlanningAvailability';

import { completeMissingGps } from '../services/gpsService';
import { hasValidCoords } from '../services/geocodingService';

export default function Listing() {
  const navigate = useNavigate();

  const {
    formateurs,
    removeFormateur,
    updateFormateurCoords,
  } = useFormateurs();

  const {
    lieu,
    setLieu,
    distances,
    recognizedPlace,
    computeDistances,
    clearDistances,
    distanceLoading,
    distanceError,
  } = useDistances({ formateurs });

  const {
    sort,
    sortList,
    toggleSort,
    activateDistanceSort,
    deactivateDistanceSort,
  } = useSort({ distances });

  const {
    filters,
    setFilters,
    filteredFormateurs,
    handleStatutChange,
    resetFilters,
    availabilityLoading,
    availabilityError,
  } = useListingFilters({
    formateurs,
    sortList,
  });

  const [gpsStatus, setGpsStatus] =
    useState('');

  const [gpsLoading, setGpsLoading] =
    useState(false);

  const [
    planningDate,
    setPlanningDate,
  ] = useState(() => new Date());

  const {
    planningAvailability,
    planningLoading,
    planningError,
  } = usePlanningAvailability({
    formateurs,
    planningDate,
  });

  const handlePreviousMonth = () => {
    setPlanningDate((currentDate) => {
      const newDate = new Date(
        currentDate
      );

      newDate.setDate(1);
      newDate.setMonth(
        newDate.getMonth() - 1
      );

      return newDate;
    });
  };

  const handleNextMonth = () => {
    setPlanningDate((currentDate) => {
      const newDate = new Date(
        currentDate
      );

      newDate.setDate(1);
      newDate.setMonth(
        newDate.getMonth() + 1
      );

      return newDate;
    });
  };

  const handleCurrentMonth = () => {
    setPlanningDate(new Date());
  };

  const handleDelete = async (id) => {
    if (!id) return;

    const formateur = formateurs.find(
      (item) => item.id === id
    );

    const label = formateur
      ? `${formateur.prenom || ''} ${
          formateur.nom || ''
        }`.trim()
      : 'ce formateur';

    const ok = window.confirm(
      `Voulez-vous vraiment supprimer ${label} ?\nCette action est définitive.`
    );

    if (!ok) return;

    try {
      await removeFormateur(id);
      clearDistances();
      deactivateDistanceSort();
    } catch (error) {
      console.error(
        '❌ Erreur suppression formateur :',
        error
      );

      alert('Suppression échouée.');
    }
  };

  const handleCalculateDistances =
    async () => {
      const normalizedPlace = String(
        lieu ?? ''
      ).trim();

      if (!normalizedPlace) {
        clearDistances();
        deactivateDistanceSort();

        return;
      }

      const success =
        await computeDistances(
          normalizedPlace
        );

      if (success) {
        activateDistanceSort();
      } else {
        deactivateDistanceSort();
      }
    };

  const handleCompleteGps = async () => {
    const missing = formateurs.filter(
      (formateur) =>
        !hasValidCoords(
          formateur.latitude,
          formateur.longitude
        )
    );

    if (missing.length === 0) {
      alert(
        'Tous les formateurs ont déjà des coordonnées GPS.'
      );

      setGpsStatus(
        'Tous les formateurs ont déjà des coordonnées GPS.'
      );

      return;
    }

    const ok = window.confirm(
      `Compléter les coordonnées GPS de ${missing.length} formateur(s) ?\n\n` +
        `Le logiciel va utiliser l’adresse, le code postal et/ou la ville.\n` +
        `L’opération peut prendre quelques minutes.`
    );

    if (!ok) return;

    setGpsLoading(true);

    setGpsStatus(
      `Géocodage en cours : 0 / ${missing.length}`
    );

    try {
      const result =
        await completeMissingGps({
          formateurs,
          onProgress: setGpsStatus,
          onCoordsFound:
            updateFormateurCoords,
        });

      setGpsStatus(
        `Terminé : ${result.updatedCount} coordonnée(s) ajoutée(s), ` +
          `${result.notFoundCount} introuvable(s).`
      );

      let message =
        `Coordonnées GPS ajoutées : ${result.updatedCount}\n` +
        `Introuvables : ${result.notFoundCount}`;

      if (
        result.notFound.length > 0
      ) {
        message +=
          `\n\nÀ vérifier manuellement :\n- ` +
          result.notFound.join('\n- ');
      }

      alert(message);
    } catch (error) {
      console.error(
        'Erreur géolocalisation :',
        error
      );

      setGpsStatus(
        'Impossible de compléter les coordonnées GPS pour le moment.'
      );
    } finally {
      setGpsLoading(false);
    }
  };

  const renderList = (value) =>
    Array.isArray(value)
      ? value.join(', ')
      : value || '';

  return (
    <div style={{ padding: '1rem' }}>
      <ListingHeader
        onAdd={() =>
          navigate('/formateur/new')
        }
      />

      <ListingFilters
        lieu={lieu}
        setLieu={setLieu}
        recognizedPlace={
          recognizedPlace
        }
        handleCalculateDistances={
          handleCalculateDistances
        }
        handleCompleteGps={
          handleCompleteGps
        }
        gpsLoading={gpsLoading}
        gpsStatus={gpsStatus}
        distanceLoading={
          distanceLoading
        }
        distanceError={distanceError}
        filters={filters}
        setFilters={setFilters}
        handleStatutChange={
          handleStatutChange
        }
        resetFilters={resetFilters}
        resultCount={
          filteredFormateurs.length
        }
        totalCount={formateurs.length}
        availabilityLoading={
          availabilityLoading
        }
        availabilityError={
          availabilityError
        }
      />

      <ListingTable
        filteredFormateurs={
          filteredFormateurs
        }
        distances={distances}
        sort={sort}
        toggleSort={toggleSort}
        renderList={renderList}
        navigate={navigate}
        handleDelete={handleDelete}
        planningDate={planningDate}
        onPreviousMonth={
          handlePreviousMonth
        }
        onNextMonth={handleNextMonth}
        onCurrentMonth={
          handleCurrentMonth
        }
        planningAvailability={
          planningAvailability
        }
        planningLoading={
          planningLoading
        }
        planningError={planningError}
      />
    </div>
  );
}