import {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  getMyTrainerProfile,
  updateMyTrainerProfile,
} from '../../services/trainerProfileService';

import { useAuth } from '../../context/AuthContext';

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  postalCode: '',
  city: '',
  skills: [],
  equipment: [],
};

function normalize(value) {
  return value.trim();
}

function ChipsInput({
  label,
  values,
  onChange,
  placeholder,
}) {
  const [input, setInput] = useState('');
  const inputRef = useRef(null);

  const addValue = (value) => {
    const normalized = normalize(value);

    if (!normalized) return;

    if (
      values.some(
        (item) =>
          item.toLowerCase() ===
          normalized.toLowerCase(),
      )
    ) {
      setInput('');
      return;
    }

    onChange([...values, normalized]);
    setInput('');
  };

  const removeValue = (index) => {
    onChange(
      values.filter(
        (_, currentIndex) =>
          currentIndex !== index,
      ),
    );
  };

  const handleKeyDown = (event) => {
    if (
      event.key === 'Enter' ||
      event.key === ',' ||
      event.key === ';'
    ) {
      event.preventDefault();

      if (input) {
        addValue(input);
      }
    }

    if (
      event.key === 'Backspace' &&
      !input &&
      values.length > 0
    ) {
      removeValue(values.length - 1);
    }
  };

  return (
    <div className="trainer-profile-field">
      <label>{label}</label>

      <div
        className="trainer-profile-chips"
        onClick={() =>
          inputRef.current?.focus()
        }
      >
        {values.map((value, index) => (
          <span
            className="trainer-profile-chip"
            key={`${value}-${index}`}
          >
            {value}

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                removeValue(index);
              }}
              aria-label={`Supprimer ${value}`}
            >
              ×
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          value={input}
          onChange={(event) =>
            setInput(event.target.value)
          }
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (input) {
              addValue(input);
            }
          }}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}

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
          address:
            profile.adresse || '',
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
      const updated =
        await updateMyTrainerProfile({
          firstName:
            form.firstName,
          lastName:
            form.lastName,
          phone:
            form.phone,
          address:
            form.address,
          city:
            form.city,
          postalCode:
            form.postalCode,
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
        address:
          updated?.adresse || '',
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
            Formaplane.
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
                votre compte Formaplane.
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
              Adresse professionnelle
            </h2>
          </div>

          <div className="trainer-profile-grid">
            <div className="trainer-profile-field trainer-profile-field--wide">
              <label>Adresse</label>

              <input
                value={form.address}
                onChange={updateField(
                  'address',
                )}
              />
            </div>

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
            <ChipsInput
              label="Compétences"
              values={form.skills}
              onChange={(skills) =>
                setForm((current) => ({
                  ...current,
                  skills,
                }))
              }
              placeholder="Ex. SST, incendie..."
            />

            <ChipsInput
              label="Matériel"
              values={form.equipment}
              onChange={(equipment) =>
                setForm((current) => ({
                  ...current,
                  equipment,
                }))
              }
              placeholder="Ex. vidéoprojecteur..."
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