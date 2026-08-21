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
  previewMissionRevalidation,
  recordMissionChangeContact,
  updateMissionWithRevalidation,
} from '../services/missionsService';

import { sendMissionChangeRevalidationEmails } from '../services/emailService';

import CompetencyInput from '../components/CompetencyInput';
import EmailCopyToSenderOption from '../components/EmailCopyToSenderOption';

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
  const [revalidationConfirm, setRevalidationConfirm] =
    useState(null);
  const [revalidationContactChannel, setRevalidationContactChannel] =
    useState('email');
  const [revalidationContactNote, setRevalidationContactNote] =
    useState('');
  const [revalidationCopyToSender, setRevalidationCopyToSender] =
    useState(false);

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

  const saveMission = async () => {
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

        if (
          result.revalidationRequired &&
          result.requestId
        ) {
          if (revalidationContactChannel === 'email') {
            try {
              await sendMissionChangeRevalidationEmails({
                requestId: result.requestId,
                copyToSender: revalidationCopyToSender,
              });
            } catch (emailError) {
              console.error(
                'Mission modifiée, mais notification de revalidation non envoyée :',
                emailError,
              );
            }
          }

          try {
            await recordMissionChangeContact({
              requestId: result.requestId,
              channel: revalidationContactChannel,
              note: revalidationContactNote,
            });
          } catch (contactError) {
            console.error(
              'Modification enregistrée, mais le moyen de contact n’a pas pu être ajouté à l’historique :',
              contactError,
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
      setRevalidationConfirm(null);
      setRevalidationContactChannel('email');
      setRevalidationContactNote('');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isEditMode) {
      await saveMission();
      return;
    }

    setSaving(true);
    setError('');

    try {
      const preview =
        await previewMissionRevalidation(
          id,
          {
            mission,
            dates,
          },
        );

      if (preview.revalidationRequired) {
        setRevalidationContactChannel('email');
        setRevalidationContactNote('');
        setRevalidationCopyToSender(false);
        setRevalidationConfirm(preview);
        setSaving(false);
        return;
      }

      setSaving(false);
      await saveMission();
    } catch (previewError) {
      setSaving(false);

      setError(
        previewError?.message ||
          'Impossible de vérifier les conséquences de cette modification.',
      );
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

      {revalidationConfirm ? (
        <div style={styles.modalBackdrop}>
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="revalidation-dialog-title"
            style={styles.modalCard}
          >
            <p style={styles.modalEyebrow}>
              MODIFICATION IMPORTANTE
            </p>

            <h2
              id="revalidation-dialog-title"
              style={styles.modalTitle}
            >
              Informer les formateurs concernés
            </h2>

            <p style={styles.modalText}>
              Cette modification nécessite une nouvelle validation de{' '}
              <strong>
                {revalidationConfirm.trainerCount}{' '}
                {revalidationConfirm.trainerCount > 1
                  ? 'formateurs'
                  : 'formateur'}
              </strong>{' '}
              ayant déjà accepté la mission ou étant affecté.
            </p>

            <div style={styles.channelGroup}>
              <div style={styles.channelGroupTitle}>
                Envoyer maintenant avec Formaplane
              </div>

              <label
                style={{
                  ...styles.channelOption,
                  ...(revalidationContactChannel === 'email'
                    ? styles.channelOptionSelected
                    : {}),
                }}
              >
                <input
                  type="radio"
                  name="revalidation-contact-channel"
                  value="email"
                  checked={revalidationContactChannel === 'email'}
                  onChange={() =>
                    setRevalidationContactChannel('email')
                  }
                />

                <span>
                  <strong>
                    Envoyer immédiatement un e-mail via Formaplane
                  </strong>

                  <span style={styles.channelOptionHelp}>
                    Chaque formateur recevra les changements
                    « Avant → Maintenant » et un lien sécurisé
                    pour accepter ou refuser.
                  </span>
                </span>
              </label>
            </div>

            {revalidationContactChannel === 'email' ? (
              <EmailCopyToSenderOption
                checked={revalidationCopyToSender}
                onChange={setRevalidationCopyToSender}
                disabled={saving}
                multiple
                compact
              />
            ) : null}

            <div style={styles.channelGroupSecondary}>
              <div style={styles.channelGroupTitleSecondary}>
                J’ai déjà informé les formateurs autrement
              </div>

              <p style={styles.channelExplanation}>
                Ces choix n’envoient aucun message depuis Formaplane.
                Ils enregistrent simplement le moyen utilisé dans l’historique.
              </p>

              <div style={styles.channelList}>
                {[
                  ['sms', 'J’ai envoyé un SMS'],
                  ['whatsapp', 'J’ai envoyé un message WhatsApp'],
                  ['phone', 'J’ai appelé les formateurs'],
                  ['other', 'Autre'],
                ].map(([value, label]) => (
                  <label
                    key={value}
                    style={{
                      ...styles.channelOption,
                      ...(revalidationContactChannel === value
                        ? styles.channelOptionSelected
                        : {}),
                    }}
                  >
                    <input
                      type="radio"
                      name="revalidation-contact-channel"
                      value={value}
                      checked={revalidationContactChannel === value}
                      onChange={() =>
                        setRevalidationContactChannel(value)
                      }
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            {revalidationContactChannel === 'other' ? (
              <label style={styles.channelOtherField}>
                <span>
                  Moyen utilisé / précision
                </span>

                <input
                  value={revalidationContactNote}
                  onChange={(event) =>
                    setRevalidationContactNote(event.target.value)
                  }
                  placeholder="Ex. Teams, LinkedIn, assistante…"
                  style={styles.channelOtherInput}
                />
              </label>
            ) : null}

            {revalidationContactChannel === 'email' ? (
              <p style={styles.modalHelp}>
                L’e-mail Formaplane permet également aux formateurs
                qui n’ont pas encore de compte de répondre.
              </p>
            ) : null}

            <div style={styles.modalActions}>
              <button
                type="button"
                onClick={() => {
                  setRevalidationConfirm(null);
                  setRevalidationCopyToSender(false);
                }}
                disabled={saving}
                style={styles.secondaryButton}
              >
                Revenir aux modifications
              </button>

              <button
                type="button"
                onClick={saveMission}
                disabled={
                  saving ||
                  (
                    revalidationContactChannel === 'other' &&
                    !revalidationContactNote.trim()
                  )
                }
                style={styles.primaryButton}
              >
                {saving
                  ? 'Enregistrement…'
                  : revalidationContactChannel === 'email'
                    ? 'Enregistrer et envoyer les e-mails'
                    : 'Enregistrer la modification'}
              </button>
            </div>
          </section>
        </div>
      ) : null}
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

  modalBackdrop: {
    position: 'fixed',
    inset: 0,
    zIndex: 1000,
    display: 'grid',
    placeItems: 'center',
    padding: 20,
    background: 'rgba(15, 23, 42, 0.42)',
  },

  modalCard: {
    width: 'min(560px, 100%)',
    boxSizing: 'border-box',
    padding: 24,
    border: '1px solid #bfdbfe',
    borderRadius: 16,
    background: '#ffffff',
    boxShadow:
      '0 24px 70px rgba(15, 23, 42, 0.20)',
  },

  modalEyebrow: {
    margin: '0 0 7px',
    color: '#2563eb',
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: '.08em',
  },

  modalTitle: {
    margin: '0 0 10px',
    color: '#101828',
    fontSize: 22,
  },

  modalText: {
    margin: '0 0 16px',
    color: '#667085',
    fontSize: 14,
    lineHeight: 1.6,
  },

  modalInfo: {
    display: 'grid',
    gap: 5,
    padding: 15,
    border: '1px solid #bfdbfe',
    borderRadius: 10,
    background: '#eff6ff',
    color: '#475467',
    fontSize: 13,
    lineHeight: 1.55,
  },

  modalHelp: {
    margin: '12px 0 0',
    color: '#667085',
    fontSize: 12,
    lineHeight: 1.5,
  },

  channelGroup: {
    padding: 12,
    border: '1px solid #bfdbfe',
    borderRadius: 10,
    background: '#eff6ff',
  },

  channelGroupSecondary: {
    marginTop: 10,
    padding: 12,
    border: '1px solid #e2e8f0',
    borderRadius: 10,
    background: '#ffffff',
  },

  channelGroupTitle: {
    marginBottom: 8,
    color: '#1d4ed8',
    fontSize: 11,
    fontWeight: 850,
    textTransform: 'uppercase',
    letterSpacing: '.5px',
  },

  channelGroupTitleSecondary: {
    marginBottom: 6,
    color: '#64748b',
    fontSize: 11,
    fontWeight: 850,
    textTransform: 'uppercase',
    letterSpacing: '.5px',
  },

  channelExplanation: {
    margin: '0 0 8px',
    color: '#64748b',
    fontSize: 11,
    lineHeight: 1.45,
  },

  channelList: {
    display: 'grid',
    gap: 7,
  },

  channelOption: {
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    padding: '9px 10px',
    border: '1px solid #dbeafe',
    borderRadius: 8,
    background: '#ffffff',
    cursor: 'pointer',
    color: '#334155',
    fontSize: 12,
    fontWeight: 650,
  },

  channelOptionSelected: {
    border: '1px solid #60a5fa',
    background: '#f8fbff',
  },

  channelOptionHelp: {
    display: 'block',
    marginTop: 3,
    color: '#64748b',
    fontSize: 10.5,
    fontWeight: 500,
    lineHeight: 1.4,
  },

  channelOtherField: {
    display: 'grid',
    gap: 6,
    marginTop: 10,
    color: '#475569',
    fontSize: 11,
    fontWeight: 750,
  },

  channelOtherInput: {
    minHeight: 38,
    padding: '0 10px',
    border: '1px solid #d0d5dd',
    borderRadius: 8,
    font: 'inherit',
  },

  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 20,
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
