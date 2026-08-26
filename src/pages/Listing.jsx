import { useCallback, useEffect, useState } from 'react';
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
import {
  formatInvitationRelativeLabel,
  getLatestSuccessfulInvitationByTrainer,
  getTrainerInvitationHistory,
  isInvitationCoolingDown,
  sendTrainerClaimInvitation,
} from '../services/emailService';
import TrainerInvitationModal from '../components/TrainerInvitationModal';


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

  const [
    inviteBusyId,
    setInviteBusyId,
  ] = useState(null);

  const [
    inviteMessage,
    setInviteMessage,
  ] = useState('');

  const [
    inviteError,
    setInviteError,
  ] = useState('');

  const [
    trainerToInvite,
    setTrainerToInvite,
  ] = useState(null);

  const [inviteCopyToSender, setInviteCopyToSender] = useState(false);

  const [
    invitationHistoryByTrainer,
    setInvitationHistoryByTrainer,
  ] = useState({});


  const refreshInvitationHistory =
    useCallback(
      async () => {
        if (!currentOrganization?.id) {
          setInvitationHistoryByTrainer({});
          return;
        }

        try {
          const history =
            await getTrainerInvitationHistory({
              organizationId: currentOrganization.id,
            });

          setInvitationHistoryByTrainer(
            getLatestSuccessfulInvitationByTrainer(history),
          );
        } catch (error) {
          console.error(
            "Impossible de charger l'état des invitations :",
            error,
          );
        }
      },
      [currentOrganization?.id],
    );


  useEffect(() => {
    refreshInvitationHistory();
  }, [refreshInvitationHistory]);


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
          `Retirer ${label} de votre réseau ?\n\nSa fiche Clementplane ne sera pas supprimée. Cette action retire uniquement le formateur du réseau de ${currentOrganization?.name || 'votre organisme'}.`,
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


  const handleInvite =
    (formateur) => {
      if (
        !formateur?.id ||
        !currentOrganization?.id ||
        inviteBusyId
      ) {
        return;
      }

      setInviteMessage('');
      setInviteError('');
      setInviteCopyToSender(false);
      setTrainerToInvite(formateur);
    };


  const handleConfirmInvite =
    async () => {
      const formateur = trainerToInvite;

      if (
        !formateur?.id ||
        !currentOrganization?.id ||
        inviteBusyId
      ) {
        return;
      }

      setInviteBusyId(formateur.id);
      setInviteMessage('');
      setInviteError('');

      try {
        await sendTrainerClaimInvitation({
          trainerId: formateur.id,
          organizationId: currentOrganization.id,
          copyToSender: inviteCopyToSender,
        });

        setInviteMessage(
          `Invitation envoyée à ${formateur.email}.`,
        );
        setTrainerToInvite(null);
        await refreshInvitationHistory();
      } catch (error) {
        console.error(
          "Impossible d'envoyer l'invitation formateur :",
          error,
        );
        setInviteError(
          error?.message ||
            "Impossible d'envoyer l'invitation pour le moment.",
        );
      } finally {
        setInviteBusyId(null);
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
        onImport={() =>
          navigate(
            '/formateurs/import',
          )
        }
      />


      {formateurs.some((formateur) => !formateur.claimed) ? (
        <div
          className="listing-invite-banner"
          style={{
            marginBottom: 14,
            padding: 16,
            border: '1px solid #bfdbfe',
            borderRadius: 12,
            background: '#eff6ff',
            color: '#334155',
            lineHeight: 1.55,
          }}
        >
          <strong style={{ color: '#1d4ed8' }}>
            Invitez vos formateurs à rejoindre Clementplane
          </strong>
          <div style={{ marginTop: 6 }}>
            Vous pouvez continuer à gérer vous-même leurs disponibilités, missions et informations, même sans compte formateur. Lorsqu’un formateur revendique sa fiche, il peut toutefois mettre à jour ses disponibilités et interagir directement avec vos propositions : les échanges et validations deviennent beaucoup plus fluides. L’invitation reste entièrement à votre choix.
          </div>
        </div>
      ) : null}

      {inviteMessage ? (
        <div style={{ marginBottom: 14, padding: 12, border: '1px solid #bbf7d0', borderRadius: 8, background: '#f0fdf4', color: '#15803d', fontWeight: 700 }}>
          {inviteMessage}
        </div>
      ) : null}

      {inviteError ? (
        <div style={{ marginBottom: 14, padding: 12, border: '1px solid #fecaca', borderRadius: 8, background: '#fef2f2', color: '#b91c1c', fontWeight: 700 }}>
          {inviteError}
        </div>
      ) : null}


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


      <TrainerInvitationModal
        open={Boolean(trainerToInvite)}
        trainerName={
          trainerToInvite
            ? [trainerToInvite.prenom, trainerToInvite.nom].filter(Boolean).join(' ')
            : ''
        }
        trainerEmail={trainerToInvite?.email || ''}
        sending={Boolean(inviteBusyId)}
        copyToSender={inviteCopyToSender}
        onCopyToSenderChange={setInviteCopyToSender}
        onCancel={() => {
          if (!inviteBusyId) setTrainerToInvite(null);
        }}
        onConfirm={handleConfirmInvite}
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
        handleInvite={
          handleInvite
        }
        inviteBusyId={
          inviteBusyId
        }
        invitationHistoryByTrainer={
          invitationHistoryByTrainer
        }
        isInvitationCoolingDown={
          isInvitationCoolingDown
        }
        formatInvitationRelativeLabel={
          formatInvitationRelativeLabel
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
