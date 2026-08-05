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

  const renderList = (value) =>
    Array.isArray(value)
      ? value.join(', ')
      : value || '';

  return (
    <div className="listing-page">
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