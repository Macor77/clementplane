import { useState } from 'react';
import { Link } from 'react-router-dom';

import useFormateurs from '../hooks/useFormateurs';
import { completeMissingGps } from '../services/gpsService';
import { hasValidCoords } from '../services/geocodingService';

export default function Settings() {
  const { formateurs, updateFormateurCoords } = useFormateurs();
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('');

  const handleCompleteGps = async () => {
    const missing = formateurs.filter(
      (formateur) => !hasValidCoords(formateur.latitude, formateur.longitude)
    );

    if (missing.length === 0) {
      setGpsStatus('Tous les formateurs ont déjà des coordonnées GPS.');
      return;
    }

    const confirmed = window.confirm(
      `Compléter les coordonnées GPS de ${missing.length} formateur(s) ?\n\n` +
        `Le logiciel utilisera leurs adresses, codes postaux et villes.`
    );

    if (!confirmed) return;

    setGpsLoading(true);
    setGpsStatus(`Géocodage en cours : 0 / ${missing.length}`);

    try {
      const result = await completeMissingGps({
        formateurs,
        onProgress: setGpsStatus,
        onCoordsFound: updateFormateurCoords,
      });

      setGpsStatus(
        `Terminé : ${result.updatedCount} coordonnée(s) ajoutée(s), ` +
          `${result.notFoundCount} introuvable(s).`
      );
    } catch (error) {
      console.error('Erreur géolocalisation :', error);
      setGpsStatus('Impossible de compléter les coordonnées GPS pour le moment.');
    } finally {
      setGpsLoading(false);
    }
  };

  return (
    <div className="page-container">
      <header className="page-heading">
        <div>
          <p className="page-eyebrow">Paramètres</p>
          <h1>Paramètres</h1>
          <p>Les réglages et outils techniques de TimeForma sont regroupés ici.</p>
        </div>
      </header>

      <section className="settings-grid">
        <article className="dashboard-card">
          <span className="dashboard-card__label">Technique</span>
          <h2>Connexion Supabase</h2>
          <p>Vérifie la configuration et l’accès à la base de données.</p>
          <Link to="/env-check">Vérifier Supabase →</Link>
        </article>

        <article className="dashboard-card settings-maintenance-card">
          <span className="dashboard-card__label">Maintenance</span>
          <h2>Coordonnées GPS des formateurs</h2>
          <p>
            Complète ponctuellement les coordonnées manquantes après un import
            ou une modification d’adresse.
          </p>
          <button
            className="button button--secondary"
            type="button"
            onClick={handleCompleteGps}
            disabled={gpsLoading}
          >
            {gpsLoading ? 'Géolocalisation en cours…' : 'Compléter les GPS manquants'}
          </button>
          {gpsStatus && <div className="settings-maintenance-status">{gpsStatus}</div>}
        </article>
      </section>
    </div>
  );
}
