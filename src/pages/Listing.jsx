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

import { useAuth } from '../context/AuthContext';


export default function Listing() {
  const navigate =
    useNavigate();

  const {
    currentOrganization,
  } = useAuth();

  const {
    formateurs,
    removeFormateur,
    loading: formateursLoading,
    error: formateursError,
  } = useFormateurs({
    organizationId:
      currentOrganization?.id,
  });


  const {
    lieu,
    setLieu,
    distances,
    recognizedPlace,
    computeDistances,
    clearDistances,
    distanceLoading,
    distanceError,
  } = useDistances({
    formateurs,
  });


  const {
    sort,
    sortList,
    toggleSort,
    activateDistanceSort,
    deactivateDistanceSort,
  } = useSort({
    distances,
  });


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
  ] = useState(
    () => new Date(),
  );


  const {
    planningAvailability,
    planningLoading,
    planningError,
  } = usePlanningAvailability({
    formateurs,
    planningDate,
  });


  const handlePreviousMonth =
    () => {
      setPlanningDate(
        (currentDate) => {
          const newDate =
            new Date(
              currentDate,
            );

          newDate.setDate(
            1,
          );

          newDate.setMonth(
            newDate.getMonth() -
              1,
          );

          return newDate;
        },
      );
    };


  const handleNextMonth =
    () => {
      setPlanningDate(
        (currentDate) => {
          const newDate =
            new Date(
              currentDate,
            );

          newDate.setDate(
            1,
          );

          newDate.setMonth(
            newDate.getMonth() +
              1,
          );

          return newDate;
        },
      );
    };


  const handleCurrentMonth =
    () => {
      setPlanningDate(
        new Date(),
      );
    };


  const handleDelete =
    async (id) => {
      if (!id) {
        return;
      }

      const formateur =
        formateurs.find(
          (item) =>
            item.id === id,
        );

      const label =
        formateur
          ? `${formateur.prenom || ''} ${formateur.nom || ''}`.trim()
          : 'ce formateur';

      const ok =
        window.confirm(
          `Retirer ${label} de votre réseau ?\n\nSa fiche Formaplane ne sera pas supprimée. Cette action retire uniquement le formateur du réseau de ${currentOrganization?.name || 'votre organisme'}.`,
        );

      if (!ok) {
        return;
      }

      try {
        await removeFormateur(
          id,
        );

        clearDistances();

        deactivateDistanceSort();
      } catch (
        error
      ) {
        console.error(
          '❌ Erreur retrait du formateur :',
          error,
        );

        alert(
          'Impossible de retirer ce formateur de votre réseau.',
        );
      }
    };


  const handleCalculateDistances =
    async () => {
      const normalizedPlace =
        String(
          lieu ?? '',
        ).trim();

      if (!normalizedPlace) {
        clearDistances();
        deactivateDistanceSort();

        return;
      }

      const success =
        await computeDistances(
          normalizedPlace,
        );

      if (success) {
        activateDistanceSort();
      } else {
        deactivateDistanceSort();
      }
    };


  const renderList =
    (value) =>
      Array.isArray(
        value,
      )
        ? value.join(', ')
        : value || '';


  return (
    <div className="listing-page">

      <ListingHeader
        onAdd={() =>
          navigate(
            '/formateur/new',
          )
        }
        onSearch={() =>
          navigate(
            '/formateurs/recherche',
          )
        }
      />


      {formateursError ? (
        <div
          style={{
            marginBottom: 14,
            padding: 12,
            border: '1px solid #fecaca',
            borderRadius: 8,
            background: '#fef2f2',
            color: '#b91c1c',
          }}
        >
          Impossible de charger le réseau de formateurs.
        </div>
      ) : null}


      <ListingFilters
        lieu={
          lieu
        }
        setLieu={
          setLieu
        }
        recognizedPlace={
          recognizedPlace
        }
        handleCalculateDistances={
          handleCalculateDistances
        }
        distanceLoading={
          distanceLoading
        }
        distanceError={
          distanceError
        }
        filters={
          filters
        }
        setFilters={
          setFilters
        }
        handleStatutChange={
          handleStatutChange
        }
        resetFilters={
          resetFilters
        }
        resultCount={
          filteredFormateurs.length
        }
        totalCount={
          formateurs.length
        }
        availabilityLoading={
          availabilityLoading ||
          formateursLoading
        }
        availabilityError={
          availabilityError
        }
      />


      <ListingTable
        filteredFormateurs={
          filteredFormateurs
        }
        distances={
          distances
        }
        sort={
          sort
        }
        toggleSort={
          toggleSort
        }
        renderList={
          renderList
        }
        navigate={
          navigate
        }
        handleDelete={
          handleDelete
        }
        planningDate={
          planningDate
        }
        onPreviousMonth={
          handlePreviousMonth
        }
        onNextMonth={
          handleNextMonth
        }
        onCurrentMonth={
          handleCurrentMonth
        }
        planningAvailability={
          planningAvailability
        }
        planningLoading={
          planningLoading ||
          formateursLoading
        }
        planningError={
          planningError
        }
      />

    </div>
  );
}
