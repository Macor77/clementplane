import {
  useEffect,
  useState,
} from 'react';

import {
  useNavigate,
  useParams,
} from 'react-router-dom';

import {
  createMission,
  getMissionById,
  updateMissionWithRevalidation,
} from '../services/missionsService';

import { sendMissionChangeRevalidationEmails } from '../services/emailService';

import CompetencyInput from '../components/CompetencyInput';

const EMPTY_MISSION = {
  client: '',
  intitule: '',
  formation: '',
  lieu: '',
  adresse: '',
  code_postal: '',
  ville: '',
  competences: '',
  materiel: '',
  commentaire: '',
  statut: 'a_pourvoir',
};

const EMPTY_DATE = {
  date: '',
  heure_debut: '09:00',
  heure_fin: '17:00',
};

export default function MissionForm() {
  const navigate = useNavigate();
  const { id } = useParams();

  const isEditMode = Boolean(id);

  const [mission, setMission] =
    useState(EMPTY_MISSION);

  const [dates, setDates] = useState([
    { ...EMPTY_DATE },
  ]);

  const [loading, setLoading] =
    useState(isEditMode);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadMission() {
      if (!isEditMode) {
        return;
      }

      setLoading(true);
      setError('');

      try {
        const missionData =
          await getMissionById(id);

        if (cancelled) {
          return;
        }

        setMission({
          client: missionData.client || '',
          intitule: missionData.intitule || '',
          formation: missionData.formation || '',
          lieu: missionData.lieu || '',
          adresse: missionData.adresse || '',
          code_postal:
            missionData.code_postal || '',
          ville: missionData.ville || '',
          competences: formatArrayForInput(
            missionData.competences,
          ),
          materiel: formatArrayForInput(
            missionData.materiel,
          ),
          commentaire:
            missionData.commentaire || '',
          statut:
            missionData.statut || 'a_pourvoir',
        });

        const missionDates =
          missionData.mission_dates || [];

        setDates(
          missionDates.length > 0
            ? missionDates.map(
                (missionDate) => ({
                  date: missionDate.date || '',
                  heure_debut:
                    formatTimeForInput(
                      missionDate.heure_debut,
                    ) || '09:00',
                  heure_fin:
                    formatTimeForInput(
                      missionDate.heure_fin,
                    ) || '17:00',
                }),
              )
            : [{ ...EMPTY_DATE }],
        );
      } catch (loadError) {
        console.error(
          'Erreur lors du chargement de la mission :',
          loadError,
        );

        if (!cancelled) {
          setError(
            loadError?.message ||
              'Impossible de charger la mission.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadMission();

    return () => {
      cancelled = true;
    };
  }, [id, isEditMode]);

  const handleMissionChange = (event) => {
    const { name, value } = event.target;

    setMission((previousMission) => ({
      ...previousMission,
      [name]: value,
    }));
  };

  const handleDateChange = (index, event) => {
    const { name, value } = event.target;

    setDates((previousDates) =>
      previousDates.map(
        (missionDate, dateIndex) =>
          dateIndex === index
            ? {
                ...missionDate,
                [name]: value,
              }
            : missionDate,
      ),
    );
  };

  const addDate = () => {
    setDates((previousDates) => [
      ...previousDates,
      { ...EMPTY_DATE },
    ]);
  };

  const removeDate = (index) => {
    if (dates.length === 1) {
      return;
    }

    setDates((previousDates) =>
      previousDates.filter(
        (_, dateIndex) =>
          dateIndex !== index,
      ),
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSaving(true);
    setError('');

    try {
      if (isEditMode) {
        const result =
          await updateMissionWithRevalidation(
            id,
            {
              mission,
              dates,
            },
          );

        if (result.revalidationRequired && result.requestId) {
          try {
            await sendMissionChangeRevalidationEmails({
              requestId: result.requestId,
            });
          } catch (emailError) {
            // La modification métier est déjà enregistrée : un échec e-mail
            // ne doit jamais provoquer une seconde soumission de la mission.
            console.error(
              'Mission modifiée, mais notification de revalidation non envoyée :',
              emailError,
            );
          }
        }

        navigate(
          result.revalidationRequired
            ? `/missions/${id}?modification=proposee`
            : `/missions/${id}`,
        );
      } else {
        const createdMission =
          await createMission({
            mission,
            dates,
          });

        navigate(
          `/missions/${createdMission.id}`,
        );
      }
    } catch (saveError) {
      console.error(
        isEditMode
          ? 'Erreur lors de la modification de la mission :'
          : 'Erreur lors de la création de la mission :',
        saveError,
      );

      setError(
        saveError?.message ||
          (isEditMode
            ? 'Impossible de modifier la mission.'
            : 'Impossible de créer la mission.'),
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingCard}>
        Chargement de la mission…
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            {isEditMode
              ? 'Modifier la mission'
              : 'Créer une mission'}
          </h1>

          <p style={styles.subtitle}>
            {isEditMode
              ? 'Modifie les informations de la mission. Si un formateur a déjà accepté ou été affecté, tout changement essentiel devra être validé par lui.'
              : 'Enregistre les informations de la mission. Les formateurs pourront ensuite être sélectionnés depuis le moteur de recommandations.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            navigate('/missions')
          }
          style={styles.secondaryButton}
        >
          Annuler
        </button>
      </div>

      {error && (
        <div style={styles.error}>
          <strong>
            {isEditMode
              ? 'La mission n’a pas été modifiée.'
              : 'La mission n’a pas été créée.'}
          </strong>

          <div>{error}</div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={styles.form}
      >
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>
            Informations générales
          </h2>

          <div style={styles.twoColumns}>
            <Field label="Client">
              <input
                type="text"
                name="client"
                value={mission.client}
                onChange={
                  handleMissionChange
                }
                placeholder="Ex. ENGIE"
                style={styles.input}
              />
            </Field>

            <Field label="Code interne de session">
              <input
                type="text"
                name="intitule"
                value={mission.intitule}
                onChange={
                  handleMissionChange
                }
                placeholder="Ex. AP-2026-084"
                style={styles.input}
              />
            </Field>
          </div>

          <Field label="Formation">
            <input
              type="text"
              name="formation"
              value={mission.formation}
              onChange={handleMissionChange}
              placeholder="Ex. Manipulation des extincteurs"
              style={styles.input}
            />
          </Field>

          <div style={styles.twoColumns}>
            <Field
              label="Compétences requises"
              help="Choisissez une compétence existante ou ajoutez-en une nouvelle au référentiel."
            >
              <CompetencyInput
                label=""
                values={parseInputToArray(
                  mission.competences,
                )}
                onChange={(values) =>
                  setMission(
                    (previousMission) => ({
                      ...previousMission,
                      competences:
                        values.join(' ; '),
                    }),
                  )
                }
                placeholder="Rechercher ou ajouter une compétence…"
              />
            </Field>

            <Field
              label="Matériel requis"
              help="Sépare les matériels avec un point-virgule."
            >
              <input
                type="text"
                name="materiel"
                value={mission.materiel}
                onChange={
                  handleMissionChange
                }
                placeholder="Ex. Extincteurs ; Générateur de flammes"
                style={styles.input}
              />
            </Field>
          </div>
        </section>

        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>
            Lieu de la formation
          </h2>

          <Field
            label="Nom du site"
            help="Facultatif. Cette information ne sert pas au calcul des distances."
          >
            <input
              type="text"
              name="lieu"
              value={mission.lieu}
              onChange={
                handleMissionChange
              }
              placeholder="Ex. Théâtre de Chelles, siège social, agence…"
              style={styles.input}
            />
          </Field>

          <Field
            label="Adresse"
            help="Facultative. Si elle n’est pas renseignée, Formaplane utilisera le code postal et la ville pour le calcul de proximité."
          >
            <input
              type="text"
              name="adresse"
              value={mission.adresse}
              onChange={
                handleMissionChange
              }
              placeholder="Ex. 10 rue de la Formation (facultatif)"
              style={styles.input}
            />
          </Field>

          <div style={styles.postalGrid}>
            <Field label="Code postal" required>
              <input
                type="text"
                name="code_postal"
                value={
                  mission.code_postal
                }
                onChange={
                  handleMissionChange
                }
                placeholder="93200"
                required
                style={styles.input}
              />
            </Field>

            <Field label="Ville" required>
              <input
                type="text"
                name="ville"
                value={mission.ville}
                onChange={
                  handleMissionChange
                }
                placeholder="Saint-Denis"
                required
                style={styles.input}
              />
            </Field>
          </div>
        </section>

        <section style={styles.card}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>
                Date et horaires
              </h2>

              <p
                style={
                  styles.sectionDescription
                }
              >
                Une mission peut comprendre une
                ou plusieurs journées.
              </p>
            </div>

            <button
              type="button"
              onClick={addDate}
              style={styles.secondaryButton}
            >
              + Ajouter une date
            </button>
          </div>

          <div style={styles.dateList}>
            {dates.map(
              (missionDate, index) => (
                <div
                  key={`mission-date-${index}`}
                  style={styles.dateRow}
                >
                  <div
                    style={styles.dateNumber}
                  >
                    Jour {index + 1}
                  </div>

                  <Field
                    label="Date"
                    required
                  >
                    <input
                      type="date"
                      name="date"
                      value={
                        missionDate.date
                      }
                      onChange={(event) =>
                        handleDateChange(
                          index,
                          event,
                        )
                      }
                      required
                      style={styles.input}
                    />
                  </Field>

                  <Field label="Début">
                    <input
                      type="time"
                      name="heure_debut"
                      value={
                        missionDate.heure_debut
                      }
                      onChange={(event) =>
                        handleDateChange(
                          index,
                          event,
                        )
                      }
                      style={styles.input}
                    />
                  </Field>

                  <Field label="Fin">
                    <input
                      type="time"
                      name="heure_fin"
                      value={
                        missionDate.heure_fin
                      }
                      onChange={(event) =>
                        handleDateChange(
                          index,
                          event,
                        )
                      }
                      style={styles.input}
                    />
                  </Field>

                  <button
                    type="button"
                    onClick={() =>
                      removeDate(index)
                    }
                    disabled={
                      dates.length === 1
                    }
                    style={{
                      ...styles.removeButton,
                      opacity:
                        dates.length === 1
                          ? 0.4
                          : 1,
                      cursor:
                        dates.length === 1
                          ? 'not-allowed'
                          : 'pointer',
                    }}
                    title="Supprimer cette date"
                  >
                    Supprimer
                  </button>
                </div>
              ),
            )}
          </div>
        </section>

        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>
            Commentaire
          </h2>

          <Field label="Notes internes">
            <textarea
              name="commentaire"
              value={mission.commentaire}
              onChange={
                handleMissionChange
              }
              placeholder="Informations complémentaires sur la mission…"
              rows={5}
              style={{
                ...styles.input,
                resize: 'vertical',
                minHeight: 110,
              }}
            />
          </Field>
        </section>

        <div style={styles.actions}>
          <button
            type="button"
            onClick={() =>
              navigate('/missions')
            }
            disabled={saving}
            style={styles.secondaryButton}
          >
            Annuler
          </button>

          <button
            type="submit"
            disabled={saving}
            style={{
              ...styles.primaryButton,
              opacity: saving ? 0.7 : 1,
              cursor: saving
                ? 'wait'
                : 'pointer',
            }}
          >
            {saving
              ? isEditMode
                ? 'Modification en cours…'
                : 'Création en cours…'
              : isEditMode
                ? 'Enregistrer les modifications'
                : 'Créer la mission'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  required = false,
  help = '',
  children,
}) {
  return (
    <label style={styles.field}>
      <span style={styles.label}>
        {label}

        {required && (
          <span style={styles.required}>
            {' '}
            *
          </span>
        )}
      </span>

      {children}

      {help && (
        <span style={styles.help}>
          {help}
        </span>
      )}
    </label>
  );
}

function parseInputToArray(value) {
  if (!value) {
    return [];
  }

  return String(value)
    .split(/[;,\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}


function formatArrayForInput(value) {
  if (!Array.isArray(value)) {
    return '';
  }

  return value.join(' ; ');
}

function formatTimeForInput(value) {
  if (!value) {
    return '';
  }

  return value.slice(0, 5);
}

const styles = {
  page: {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '12px 0 40px',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 20,
    marginBottom: 24,
  },

  title: {
    margin: 0,
    fontSize: 30,
    color: '#172033',
  },

  subtitle: {
    maxWidth: 720,
    margin: '8px 0 0',
    color: '#667085',
    lineHeight: 1.5,
  },

  form: {
    display: 'grid',
    gap: 18,
  },

  card: {
    display: 'grid',
    gap: 18,
    padding: 22,
    border: '1px solid #e4e7ec',
    borderRadius: 14,
    background: '#ffffff',
    boxShadow:
      '0 2px 8px rgba(16, 24, 40, 0.04)',
  },

  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 20,
  },

  sectionTitle: {
    margin: 0,
    fontSize: 19,
    color: '#172033',
  },

  sectionDescription: {
    margin: '5px 0 0',
    fontSize: 14,
    color: '#667085',
  },

  twoColumns: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(260px, 1fr))',
    gap: 16,
  },

  postalGrid: {
    display: 'grid',
    gridTemplateColumns:
      'minmax(150px, 220px) minmax(260px, 1fr)',
    gap: 16,
  },

  field: {
    display: 'grid',
    gap: 7,
  },

  label: {
    fontSize: 14,
    fontWeight: 600,
    color: '#344054',
  },

  required: {
    color: '#d92d20',
  },

  help: {
    fontSize: 12,
    color: '#667085',
  },

  input: {
    boxSizing: 'border-box',
    width: '100%',
    minHeight: 42,
    padding: '10px 12px',
    border: '1px solid #d0d5dd',
    borderRadius: 8,
    background: '#ffffff',
    color: '#101828',
    fontFamily: 'inherit',
    fontSize: 14,
  },

  dateList: {
    display: 'grid',
    gap: 12,
  },

  dateRow: {
    display: 'grid',
    gridTemplateColumns:
      '90px minmax(170px, 1fr) 135px 135px auto',
    gap: 12,
    alignItems: 'end',
    padding: 16,
    border: '1px solid #e4e7ec',
    borderRadius: 10,
    background: '#f9fafb',
  },

  dateNumber: {
    alignSelf: 'center',
    fontWeight: 700,
    color: '#344054',
  },

  error: {
    display: 'grid',
    gap: 4,
    marginBottom: 18,
    padding: 14,
    border: '1px solid #fda29b',
    borderRadius: 10,
    background: '#fef3f2',
    color: '#b42318',
  },

  loadingCard: {
    maxWidth: 1100,
    margin: '20px auto',
    padding: 24,
    border: '1px solid #e4e7ec',
    borderRadius: 12,
    background: '#ffffff',
    color: '#475467',
  },

  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
    paddingTop: 4,
  },

  primaryButton: {
    minHeight: 42,
    padding: '10px 18px',
    border: '1px solid #175cd3',
    borderRadius: 8,
    background: '#175cd3',
    color: '#ffffff',
    fontWeight: 700,
  },

  secondaryButton: {
    minHeight: 42,
    padding: '10px 16px',
    border: '1px solid #d0d5dd',
    borderRadius: 8,
    background: '#ffffff',
    color: '#344054',
    fontWeight: 600,
    cursor: 'pointer',
  },

  removeButton: {
    minHeight: 42,
    padding: '8px 12px',
    border: '1px solid #fda29b',
    borderRadius: 8,
    background: '#ffffff',
    color: '#b42318',
    fontWeight: 600,
  },
};
