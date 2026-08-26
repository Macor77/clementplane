import {
  useEffect,
  useState,
} from 'react';

import {
  getMyTrainerProfile,
  updateMyTrainerProfile,
} from '../../services/trainerProfileService';

import {
  geocodeTrainer,
  hasValidCoords,
} from '../../services/geocodingService';

import { useAuth } from '../../context/AuthContext';
import CompetencyInput from '../../components/CompetencyInput';
import EquipmentInput from '../../components/EquipmentInput';

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  postalCode: '',
  city: '',
  skills: [],
  equipment: [],
};






export default function TrainerProfile() {
  const { refreshUserContext } = useAuth();

  const [form, setForm] =
    useState(EMPTY_FORM);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const profile =
          await getMyTrainerProfile();

        if (!active) return;

        if (!profile) {
          setError(
            'Aucun profil formateur n’est rattaché à ce compte.',
          );
          return;
        }

        setForm({
          firstName:
            profile.prenom || '',
          lastName:
            profile.nom || '',
          email:
            profile.email || '',
          phone:
            profile.telephone || '',
          postalCode:
            profile.code_postal || '',
          city:
            profile.ville || '',
          skills:
            Array.isArray(
              profile.competences,
            )
              ? profile.competences
              : [],
          equipment:
            Array.isArray(
              profile.materiel,
            )
              ? profile.materiel
              : [],
        });
      } catch (loadError) {
        console.error(loadError);

        if (active) {
          setError(
            'Impossible de charger votre profil pour le moment.',
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  const updateField =
    (field) => (event) => {
      setForm((current) => ({
        ...current,
        [field]: event.target.value,
      }));
    };

  const handleSubmit = async (
    event,
  ) => {
    event.preventDefault();

    setError('');
    setSuccess('');
    setSaving(true);

    try {
      let latitude = null;
      let longitude = null;

      try {
        const coords =
          await geocodeTrainer({
            ville:
              form.city,
            codePostal:
              form.postalCode,
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
          'Géocodage du profil formateur impossible :',
          geocodingError,
        );
      }

      const updated =
        await updateMyTrainerProfile({
          firstName:
            form.firstName,
          lastName:
            form.lastName,
          phone:
            form.phone,
          city:
            form.city,
          postalCode:
            form.postalCode,
          latitude,
          longitude,
          skills:
            form.skills,
          equipment:
            form.equipment,
        });

      setForm((current) => ({
        ...current,
        firstName:
          updated?.prenom ||
          current.firstName,
        lastName:
          updated?.nom ||
          current.lastName,
        phone:
          updated?.telephone || '',
        postalCode:
          updated?.code_postal || '',
        city:
          updated?.ville || '',
        skills:
          updated?.competences || [],
        equipment:
          updated?.materiel || [],
      }));

      await refreshUserContext();

      setSuccess(
        'Votre profil a bien été mis à jour.',
      );
    } catch (saveError) {
      console.error(saveError);

      setError(
        'Impossible d’enregistrer vos modifications.',
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        Chargement de votre profil…
      </div>
    );
  }

  return (
    <div className="page-container trainer-profile-page">
      <div className="page-heading">
        <div>
          <p className="page-eyebrow">
            PROFIL
          </p>

          <h1>Mon profil</h1>

          <p>
            Gérez vos informations
            professionnelles utilisées dans
            Clementplane.
          </p>
        </div>
      </div>

      {error ? (
        <div className="alert alert--error">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="trainer-profile-success">
          {success}
        </div>
      ) : null}

      <form
        className="trainer-profile-form"
        onSubmit={handleSubmit}
      >
        <section className="panel-card trainer-profile-section">
          <div className="trainer-profile-section__heading">
            <p className="page-eyebrow">
              IDENTITÉ
            </p>

            <h2>
              Informations personnelles
            </h2>
          </div>

          <div className="trainer-profile-grid">
            <div className="trainer-profile-field">
              <label>Prénom</label>

              <input
                value={form.firstName}
                onChange={updateField(
                  'firstName',
                )}
                required
              />
            </div>

            <div className="trainer-profile-field">
              <label>Nom</label>

              <input
                value={form.lastName}
                onChange={updateField(
                  'lastName',
                )}
                required
              />
            </div>

            <div className="trainer-profile-field">
              <label>
                Adresse e-mail
              </label>

              <input
                value={form.email}
                disabled
              />

              <span className="trainer-profile-help">
                Cette adresse correspond à
                votre compte Clementplane.
              </span>
            </div>

            <div className="trainer-profile-field">
              <label>Téléphone</label>

              <input
                value={form.phone}
                onChange={updateField(
                  'phone',
                )}
                autoComplete="tel"
              />
            </div>
          </div>
        </section>

        <section className="panel-card trainer-profile-section">
          <div className="trainer-profile-section__heading">
            <p className="page-eyebrow">
              LOCALISATION
            </p>

            <h2>
              Localisation professionnelle
            </h2>

            <p>
              Votre ville et votre code postal sont utilisés pour calculer
              votre proximité avec les missions. Votre adresse postale
              complète n'est pas nécessaire.
            </p>
          </div>

          <div className="trainer-profile-grid">
            <div className="trainer-profile-field">
              <label>Code postal</label>

              <input
                value={form.postalCode}
                onChange={updateField(
                  'postalCode',
                )}
                inputMode="numeric"
              />
            </div>

            <div className="trainer-profile-field">
              <label>Ville</label>

              <input
                value={form.city}
                onChange={updateField(
                  'city',
                )}
              />
            </div>
          </div>
        </section>

        <section className="panel-card trainer-profile-section">
          <div className="trainer-profile-section__heading">
            <p className="page-eyebrow">
              PROFESSIONNEL
            </p>

            <h2>
              Compétences et matériel
            </h2>

            <p>
              Ces informations permettent aux
              organismes de formation de mieux
              identifier les missions qui vous
              correspondent.
            </p>
          </div>

          <div className="trainer-profile-professional">
            <CompetencyInput
              label="Compétences"
              values={form.skills}
              onChange={(skills) =>
                setForm((current) => ({
                  ...current,
                  skills,
                }))
              }
              placeholder="Rechercher ou ajouter une compétence…"
            />

            <EquipmentInput
              label="Matériel"
              values={form.equipment}
              onChange={(equipment) =>
                setForm((current) => ({
                  ...current,
                  equipment,
                }))
              }
              placeholder="Rechercher ou ajouter du matériel…"
            />
          </div>
        </section>

        <div className="trainer-profile-footer">
          <button
            className="button button--primary"
            type="submit"
            disabled={saving}
          >
            {saving
              ? 'Enregistrement…'
              : 'Enregistrer les modifications'}
          </button>
        </div>
      </form>
    </div>
  );
}