import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signOutCurrentUser } from '../services/authService';
import {
  claimTrainerProfile,
  createTrainerProfile,
  getTrainerClaimCandidates,
} from '../services/trainerClaimService';
import {
  geocodeTrainer,
  hasValidCoords,
} from '../services/geocodingService';
import './Auth.css';

function friendlyError(error) {
  const message = error?.message || '';
  if (message.includes('TRAINER_PROFILE_ALREADY_CLAIMED')) {
    return 'Cette fiche a déjà été revendiquée par un autre compte.';
  }
  if (message.includes('TRAINER_PROFILE_ALREADY_LINKED')) {
    return 'Votre compte est déjà lié à une fiche formateur.';
  }
  if (message.includes('MATCHING_TRAINER_PROFILE_EXISTS')) {
    return 'Une fiche existe déjà avec votre adresse e-mail. Si elle n’apparaît pas ici, elle est déjà rattachée à un autre compte et devra être vérifiée avant tout nouveau rattachement.';
  }
  return 'Une erreur est survenue. Réessayez dans quelques instants.';
}

export default function TrainerClaimStart() {
  const navigate = useNavigate();
  const { profile, user, trainerProfile, refreshUserContext } = useAuth();
  const [candidates, setCandidates] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    firstName: profile?.first_name || '',
    lastName: profile?.last_name || '',
    phone: profile?.phone || '',
    city: '',
    postalCode: '',
  });
  const [claimLocation, setClaimLocation] = useState({
    city: '',
    postalCode: '',
  });

  useEffect(() => {
    setForm((current) => ({
      ...current,
      firstName: current.firstName || profile?.first_name || '',
      lastName: current.lastName || profile?.last_name || '',
      phone: current.phone || profile?.phone || '',
    }));
  }, [profile]);

  useEffect(() => {
    let active = true;

    async function loadCandidates() {
      if (trainerProfile) {
        setLoadingCandidates(false);
        return;
      }

      try {
        const rows = await getTrainerClaimCandidates();
        if (active) setCandidates(rows);
      } catch (loadError) {
        console.error(loadError);
        if (active) setError('Impossible de rechercher une fiche existante pour le moment.');
      } finally {
        if (active) setLoadingCandidates(false);
      }
    }

    loadCandidates();
    return () => { active = false; };
  }, [trainerProfile]);

  const firstName = profile?.first_name || 'Bienvenue';
  const hasCandidate = candidates.length > 0;

  const candidateTitle = useMemo(() => {
    if (candidates.length === 1) return 'Nous avons trouvé votre fiche';
    if (candidates.length > 1) return 'Nous avons trouvé plusieurs fiches possibles';
    return '';
  }, [candidates.length]);

  const geocodeLocation = async ({
    city,
    postalCode,
  }) => {
    let latitude = null;
    let longitude = null;

    try {
      const coords =
        await geocodeTrainer({
          ville:
            city,
          codePostal:
            postalCode,
        });

      if (
        coords &&
        hasValidCoords(
          coords.latitude,
          coords.longitude,
        )
      ) {
        latitude =
          coords.latitude;
        longitude =
          coords.longitude;
      }
    } catch (geocodingError) {
      console.error(
        'Géocodage de la localisation formateur impossible :',
        geocodingError,
      );
    }

    return {
      latitude,
      longitude,
    };
  };

  const handleClaim = async (trainerId) => {
    setBusyId(trainerId);
    setError('');

    try {
      const {
        latitude,
        longitude,
      } =
        await geocodeLocation(
          claimLocation,
        );

      await claimTrainerProfile({
        trainerId,
        city:
          claimLocation.city,
        postalCode:
          claimLocation.postalCode,
        latitude,
        longitude,
      });

      await refreshUserContext();

      navigate(
        '/formateur/espace',
        {
          replace: true,
        },
      );
    } catch (claimError) {
      console.error(claimError);
      setError(
        friendlyError(
          claimError,
        ),
      );
    } finally {
      setBusyId(null);
    }
  };

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setError('');
    setCreating(true);

    try {
      const {
        latitude,
        longitude,
      } =
        await geocodeLocation({
          city:
            form.city,
          postalCode:
            form.postalCode,
        });

      await createTrainerProfile({
        ...form,
        latitude,
        longitude,
      });

      await refreshUserContext();

      navigate(
        '/formateur/espace',
        {
          replace: true,
        },
      );
    } catch (createError) {
      console.error(createError);
      setError(
        friendlyError(
          createError,
        ),
      );
    } finally {
      setCreating(false);
    }
  };

  if (trainerProfile) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <div className="auth-brand">
          <img src="/brand/formaplane-logo.svg" alt="Formaplane" />
        </div>
          <p className="auth-eyebrow">Profil formateur</p>
          <h1>Votre fiche est déjà rattachée.</h1>
          <p className="auth-muted">
            {trainerProfile.prenom} {trainerProfile.nom} est bien lié à votre compte Formaplane.
          </p>
          <button className="auth-button auth-button--link" type="button" onClick={() => navigate('/formateur/espace')}>
            Accéder à mon espace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-screen">
      <div className="auth-card auth-card--wide">
        <div className="auth-brand">
          <img src="/brand/formaplane-logo.svg" alt="Formaplane" />
        </div>
        <p className="auth-eyebrow">Votre profil professionnel</p>
        <h1>{firstName}, retrouvons votre fiche.</h1>
        <p className="auth-muted">
          Formaplane recherche uniquement les fiches utilisant la même adresse e-mail que votre compte.
          Vos notes internes, tarifs négociés et autres informations propres aux organismes ne sont jamais affichés ici.
        </p>

        <div className="auth-alert">
          Compte vérifié : <strong>{user?.email}</strong>
        </div>

        {error ? <div className="auth-alert auth-alert--error claim-spacing">{error}</div> : null}

        {loadingCandidates ? (
          <div className="claim-loading">Recherche d’une fiche existante…</div>
        ) : hasCandidate ? (
          <section className="claim-section">
            <div className="claim-section__header">
              <p className="auth-eyebrow">Fiche existante</p>
              <h2>{candidateTitle}</h2>
              <p>Vérifiez les informations ci-dessous avant de confirmer.</p>
            </div>

            <div className="auth-alert claim-spacing">
              <strong>Confirmez votre localisation</strong>
              <p>
                Une fois la fiche revendiquée, votre ville et votre code postal
                deviennent la localisation de référence visible par vos organismes
                partenaires. Les anciennes localisations propres à chaque organisme
                ne sont alors plus utilisées.
              </p>

              <div className="auth-grid">
                <label>
                  Code postal
                  <input
                    value={claimLocation.postalCode}
                    onChange={(event) =>
                      setClaimLocation((current) => ({
                        ...current,
                        postalCode: event.target.value,
                      }))
                    }
                    inputMode="numeric"
                    required
                  />
                </label>

                <label>
                  Ville
                  <input
                    value={claimLocation.city}
                    onChange={(event) =>
                      setClaimLocation((current) => ({
                        ...current,
                        city: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
              </div>
            </div>

            <div className="claim-candidates">
              {candidates.map((candidate) => (
                <article className="claim-candidate" key={candidate.id}>
                  <div>
                    <strong>{candidate.prenom} {candidate.nom}</strong>
                    {candidate.telephone ? <span>{candidate.telephone}</span> : null}
                    <span>{candidate.email}</span>
                  </div>
                  <button
                    className="auth-button"
                    type="button"
                    disabled={
                      busyId !== null ||
                      !claimLocation.city.trim() ||
                      !claimLocation.postalCode.trim()
                    }
                    onClick={() => handleClaim(candidate.id)}
                  >
                    {busyId === candidate.id ? 'Rattachement…' : 'Oui, c’est bien moi'}
                  </button>
                </article>
              ))}
            </div>

            {candidates.length > 1 ? (
              <p className="claim-help">
                Plusieurs fiches utilisent votre adresse e-mail. Choisissez celle qui vous correspond ; nous traiterons les éventuels doublons séparément.
              </p>
            ) : null}
          </section>
        ) : (
          <section className="claim-section">
            <div className="claim-section__header">
              <p className="auth-eyebrow">Aucune fiche trouvée</p>
              <h2>Créons votre profil formateur</h2>
              <p>
                Aucun organisme n’a encore créé de fiche avec l’adresse <strong>{user?.email}</strong>.
                Vous pouvez créer votre profil maintenant.
              </p>
            </div>

            <form className="auth-form" onSubmit={handleCreate}>
              <div className="auth-grid">
                <label>
                  Prénom
                  <input value={form.firstName} onChange={updateField('firstName')} required />
                </label>
                <label>
                  Nom
                  <input value={form.lastName} onChange={updateField('lastName')} required />
                </label>
              </div>

              <label>
                Adresse e-mail
                <input type="email" value={user?.email || ''} disabled />
              </label>

              <label>
                Téléphone <span className="claim-optional">(facultatif)</span>
                <input value={form.phone} onChange={updateField('phone')} autoComplete="tel" />
              </label>

              <div className="auth-grid">
                <label>
                  Code postal
                  <input value={form.postalCode} onChange={updateField('postalCode')} inputMode="numeric" required />
                </label>
                <label>
                  Ville
                  <input value={form.city} onChange={updateField('city')} required />
                </label>
              </div>

              <button className="auth-button" type="submit" disabled={creating}>
                {creating ? 'Création du profil…' : 'Créer mon profil formateur'}
              </button>
            </form>
          </section>
        )}

        <div className="claim-footer">
          <button className="claim-signout" type="button" onClick={signOutCurrentUser}>Se déconnecter</button>
        </div>
      </div>
    </div>
  );
}
