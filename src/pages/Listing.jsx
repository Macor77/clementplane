import { useEffect, useState } from 'react';
import { completeMissingGps } from '../services/gpsService';
import useFormateurs from "../hooks/useFormateurs";
import { useNavigate } from 'react-router-dom';
import ListingTable from "../components/listing/ListingTable";
import ListingFilters from "../components/listing/ListingFilters";
import ListingHeader from "../components/listing/ListingHeader";
import useSort from "../hooks/useSort";
import useListingFilters from "../hooks/useListingFilters";
import useDistances from "../hooks/useDistances";
import { hasValidCoords } from "../services/geocodingService";

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
  computeDistances,
  clearDistances,
} = useDistances({ formateurs });

  const { sort, sortList, toggleSort, refreshSort } = useSort({ distances });

  const {
    filters,
    setFilters,
    filteredFormateurs,
    handleStatutChange,
  } = useListingFilters({ formateurs, sortList });

  const [gpsStatus, setGpsStatus] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false); 

  const handleDelete = async (id) => {
  if (!id) return;

  const formateur = formateurs.find((item) => item.id === id);
  const label = formateur
    ? `${formateur.prenom || ''} ${formateur.nom || ''}`.trim()
    : 'ce formateur';

  const ok = window.confirm(
    `Voulez-vous vraiment supprimer ${label} ?\nCette action est définitive.`
  );

  if (!ok) return;

  try {
    await removeFormateur(id);
    clearDistances();
  } catch (error) {
    console.error('❌ Erreur suppression formateur :', error);
    alert('Suppression échouée.');
  }
};

  const handleRechercheProximite = async () => {
  await computeDistances(lieu);

  if (sort.key === 'distance') {
    refreshSort();
  }
};

  const handleCompleteGps = async () => {
  const missing = formateurs.filter(
    (formateur) => !hasValidCoords(formateur.latitude, formateur.longitude)
  );

  if (missing.length === 0) {
    alert('Tous les formateurs ont déjà des coordonnées GPS.');
    setGpsStatus('Tous les formateurs ont déjà des coordonnées GPS.');
    return;
  }

  const ok = window.confirm(
    `Compléter les coordonnées GPS de ${missing.length} formateur(s) ?\n\n` +
      `Le logiciel va utiliser l’adresse, le code postal et/ou la ville.\n` +
      `L’opération peut prendre quelques minutes.`
  );

  if (!ok) return;

  setGpsLoading(true);
  setGpsStatus(`Géocodage en cours : 0 / ${missing.length}`);

  const result = await completeMissingGps({
    formateurs,
    onProgress: setGpsStatus,
    onCoordsFound: updateFormateurCoords,
  });

  setGpsLoading(false);
  setGpsStatus(
    `Terminé : ${result.updatedCount} coordonnée(s) ajoutée(s), ${result.notFoundCount} introuvable(s).`
  );

  let message = `Coordonnées GPS ajoutées : ${result.updatedCount}\nIntrouvables : ${result.notFoundCount}`;

  if (result.notFound.length > 0) {
    message += `\n\nÀ vérifier manuellement :\n- ${result.notFound.join('\n- ')}`;
  }

  alert(message);
};

  useEffect(() => {
  if (!lieu) return;

  computeDistances(lieu);
}, [formateurs]); 
  
  const renderList = (value) => (Array.isArray(value) ? value.join(', ') : value || '');

  return (
    <div style={{ padding: '1rem' }}>
      <ListingHeader onAdd={() => navigate('/formateur/new')} />

      <ListingFilters
        lieu={lieu}
        setLieu={setLieu}
        handleRechercheProximite={handleRechercheProximite}
        handleCompleteGps={handleCompleteGps}
        gpsLoading={gpsLoading}
        gpsStatus={gpsStatus}
        filters={filters}
        setFilters={setFilters}
        handleStatutChange={handleStatutChange}
      />

      <ListingTable
        filteredFormateurs={filteredFormateurs}
        distances={distances}
        sort={sort}
        toggleSort={toggleSort}
        renderList={renderList}
        navigate={navigate}
        handleDelete={handleDelete}
      />
    </div>
  );
}