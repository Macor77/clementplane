import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  createMyAvailabilityContact,
  deleteMyAvailabilityContact,
  getMyAvailabilityContacts,
  updateMyAvailabilityContact,
} from '../../services/trainerAvailabilityContactsService';

import {
  getMyAvailabilitySharePreview,
  getSharedDayState,
} from '../../services/trainerAvailabilityShareService';

import {
  sendTrainerAvailabilityShareEmail,
} from '../../services/emailService';


const EMPTY_FORM = {
  organizationName: '',
  contactName: '',
  email: '',
  phone: '',
};


function formatShareDate(value) {
  if (!value) return '';

  return new Intl.DateTimeFormat(
    'fr-FR',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
  ).format(new Date(value));
}


function formatSharedMonths(months = []) {
  if (!Array.isArray(months) || months.length === 0) {
    return '';
  }

  return months
    .map((value) =>
      monthLabelFromKey(value),
    )
    .join(', ');
}


function getDeliveryStatusPresentation(lastShare) {
  if (!lastShare?.sentAt) {
    return null;
  }

  const status =
    String(lastShare.status || '');

  if (status === 'delivered') {
    return {
      label: 'Délivré',
      color: '#15803d',
      background: '#dcfce7',
    };
  }

  if (
    [
      'failed',
      'soft_bounce',
      'hard_bounce',
      'blocked',
      'invalid',
    ].includes(status)
  ) {
    return {
      label: 'Non délivré',
      color: '#b42318',
      background: '#fee2e2',
    };
  }

  return {
    label: 'En cours de livraison',
    color: '#a16207',
    background: '#fef3c7',
  };
}


function pad(value) {
  return String(value).padStart(2, '0');
}


function toISODate(date) {
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join('-');
}


function monthKey(date) {
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
  ].join('-');
}


function monthDateFromKey(value) {
  const [
    year,
    month,
  ] = String(value)
    .split('-')
    .map(Number);

  return new Date(
    year,
    month - 1,
    1,
  );
}


function monthLabelFromKey(value) {
  return new Intl.DateTimeFormat(
    'fr-FR',
    {
      month: 'long',
      year: 'numeric',
    },
  ).format(
    monthDateFromKey(value),
  );
}


function getMonthRangeFromKeys(keys) {
  if (!keys.length) {
    return null;
  }

  const ordered =
    [...keys].sort();

  const first =
    monthDateFromKey(
      ordered[0],
    );

  const last =
    monthDateFromKey(
      ordered[
        ordered.length - 1
      ],
    );

  return {
    startDay:
      toISODate(
        new Date(
          first.getFullYear(),
          first.getMonth(),
          1,
        ),
      ),

    endDay:
      toISODate(
        new Date(
          last.getFullYear(),
          last.getMonth() + 1,
          0,
        ),
      ),
  };
}


function getMonthMatrix(monthKeyValue) {
  const refDate =
    monthDateFromKey(
      monthKeyValue,
    );

  const year =
    refDate.getFullYear();

  const month =
    refDate.getMonth();

  const first =
    new Date(
      year,
      month,
      1,
    );

  const last =
    new Date(
      year,
      month + 1,
      0,
    );

  const start =
    new Date(first);

  const startOffset =
    (first.getDay() + 6) % 7;

  start.setDate(
    first.getDate() -
      startOffset,
  );

  const end =
    new Date(last);

  const endOffset =
    (last.getDay() + 6) % 7;

  end.setDate(
    last.getDate() +
      (6 - endOffset),
  );

  const days = [];

  const cursor =
    new Date(start);

  while (cursor <= end) {
    days.push(
      new Date(cursor),
    );

    cursor.setDate(
      cursor.getDate() + 1,
    );
  }

  const weeks = [];

  for (
    let index = 0;
    index < days.length;
    index += 7
  ) {
    weeks.push(
      days.slice(
        index,
        index + 7,
      ),
    );
  }

  return weeks;
}


function StatusBadge({
  children,
  tone = 'neutral',
}) {
  const palette = {
    success: {
      background: '#dcfce7',
      color: '#15803d',
    },

    info: {
      background: '#dbeafe',
      color: '#1d4ed8',
    },

    neutral: {
      background: '#f1f5f9',
      color: '#64748b',
    },
  };

  const colors =
    palette[tone] ||
    palette.neutral;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 8px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 800,
        ...colors,
      }}
    >
      {children}
    </span>
  );
}


function SharedDay({
  date,
  currentMonth,
  state,
}) {
  const inMonth =
    date.getMonth() ===
    currentMonth;

  if (!inMonth) {
    return (
      <div
        style={{
          minHeight: 66,
          borderRadius: 10,
          background: '#f8fafc',
          opacity: 0.42,
        }}
      />
    );
  }


  const palettes = {
    available: {
      background: '#f0fdf4',
      border: '#86efac',
      color: '#15803d',
    },

    unavailable: {
      background: '#fef2f2',
      border: '#fecaca',
      color: '#b42318',
    },

    option: {
      background: '#fffbeb',
      border: '#fde68a',
      color: '#a16207',
    },

    mission: {
      background: '#eff6ff',
      border: '#bfdbfe',
      color: '#1d4ed8',
    },

    unknown: {
      background: '#f8fafc',
      border: '#e2e8f0',
      color: '#64748b',
    },
  };


  const palette =
    palettes[state.tone] ||
    palettes.unknown;


  return (
    <div
      style={{
        minHeight: 66,
        border:
          `1px solid ${palette.border}`,
        borderRadius: 10,
        padding: 7,
        background:
          palette.background,
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 800,
          color: '#475569',
        }}
      >
        {date.getDate()}
      </div>

      <div
        style={{
          marginTop: 6,
          fontSize: 11,
          lineHeight: 1.25,
          fontWeight: 800,
          color: palette.color,
        }}
      >
        {state.label}
      </div>

      {state.otherOptionsCount > 0 ? (
        <div
          style={{
            marginTop: 4,
            fontSize: 9.5,
            lineHeight: 1.3,
            color: '#854d0e',
            fontWeight: 700,
          }}
        >
          ⚠️{' '}
          {state.otherOptionsCount === 1
            ? "1 autre organisme s'est positionné"
            : `${state.otherOptionsCount} autres organismes se sont positionnés`}
        </div>
      ) : null}
    </div>
  );
}


export default function TrainerAvailabilityShare() {
  const [
    contacts,
    setContacts,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState('');

  const [
    message,
    setMessage,
  ] = useState('');

  const [
    form,
    setForm,
  ] = useState(
    EMPTY_FORM,
  );

  const [
    editingId,
    setEditingId,
  ] = useState(null);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    deletingId,
    setDeletingId,
  ] = useState(null);

  const [
    contactToDelete,
    setContactToDelete,
  ] = useState(null);


  const monthChoices =
    useMemo(() => {
      const current =
        new Date();

      return Array.from(
        {
          length: 6,
        },
        (
          _,
          index,
        ) => {
          const date =
            new Date(
              current.getFullYear(),
              current.getMonth() +
                index,
              1,
            );

          return {
            key:
              monthKey(date),

            label:
              new Intl.DateTimeFormat(
                'fr-FR',
                {
                  month: 'long',
                  year: 'numeric',
                },
              ).format(
                date,
              ),
          };
        },
      );
    }, []);


  const [
    selectedMonths,
    setSelectedMonths,
  ] = useState(
    () => [
      monthKey(
        new Date(),
      ),
    ],
  );


  const [
    previewContactId,
    setPreviewContactId,
  ] = useState('');


  const [
    previewData,
    setPreviewData,
  ] = useState(null);

  const [
    previewLoading,
    setPreviewLoading,
  ] = useState(false);

  const [
    previewError,
    setPreviewError,
  ] = useState('');


  const [
    selectedContactIds,
    setSelectedContactIds,
  ] = useState([]);

  const [
    sendingShare,
    setSendingShare,
  ] = useState(false);

  const [
    sendConfirmOpen,
    setSendConfirmOpen,
  ] = useState(false);

  const [
    sendMessage,
    setSendMessage,
  ] = useState('');

  const [
    sendError,
    setSendError,
  ] = useState('');


  const [
    commonShareMessage,
    setCommonShareMessage,
  ] = useState('');

  const [
    customizeMessages,
    setCustomizeMessages,
  ] = useState(false);

  const [
    customMessagesByContact,
    setCustomMessagesByContact,
  ] = useState({});


  const previewContact =
    useMemo(
      () =>
        contacts.find(
          (contact) =>
            contact.id ===
            previewContactId,
        ) || null,
      [
        contacts,
        previewContactId,
      ],
    );


  const loadContacts =
    useCallback(async () => {
      setLoading(true);
      setError('');

      try {
        const rows =
          await getMyAvailabilityContacts();

        setContacts(
          rows,
        );

        setSelectedContactIds(
          (current) =>
            current.filter(
              (contactId) =>
                rows.some(
                  (contact) =>
                    contact.id ===
                    contactId,
                ),
            ),
        );

        setPreviewContactId(
          (current) =>
            current ||
            rows?.[0]?.id ||
            '',
        );
      } catch (loadError) {
        setError(
          loadError?.message ||
            "Impossible de charger votre carnet d'organismes.",
        );
      } finally {
        setLoading(false);
      }
    }, []);


  useEffect(() => {
    loadContacts();
  }, [loadContacts]);


  const loadPreview =
    useCallback(async () => {
      if (
        !previewContact ||
        selectedMonths.length === 0
      ) {
        setPreviewData(null);
        return;
      }

      const range =
        getMonthRangeFromKeys(
          selectedMonths,
        );

      if (!range) {
        setPreviewData(null);
        return;
      }

      setPreviewLoading(true);
      setPreviewError('');

      try {
        const data =
          await getMyAvailabilitySharePreview({
            ...range,
            organizationId:
              previewContact.organization_id,
          });

        setPreviewData(data);
      } catch (loadError) {
        console.error(
          'Préparation de l’aperçu impossible :',
          loadError,
        );

        setPreviewError(
          "Impossible de préparer l'aperçu de vos disponibilités.",
        );
      } finally {
        setPreviewLoading(false);
      }
    }, [
      previewContact,
      selectedMonths,
    ]);


  useEffect(() => {
    loadPreview();
  }, [loadPreview]);


  const resetForm = () => {
    setForm(
      EMPTY_FORM,
    );

    setEditingId(null);
    setError('');
  };


  const change = (event) => {
    setForm(
      (previous) => ({
        ...previous,
        [
          event.target.name
        ]:
          event.target.value,
      }),
    );

    setError('');
    setMessage('');
  };


  const sortContacts =
    (rows) =>
      [...rows].sort(
        (
          first,
          second,
        ) =>
          String(
            first.organization_name ||
              '',
          ).localeCompare(
            String(
              second.organization_name ||
                '',
            ),
            'fr',
          ),
      );


  const submit = async (
    event,
  ) => {
    event.preventDefault();

    if (saving) {
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      if (editingId) {
        const updated =
          await updateMyAvailabilityContact({
            contactId:
              editingId,
            ...form,
          });

        setContacts(
          (rows) =>
            sortContacts(
              rows.map(
                (row) =>
                  row.id ===
                  editingId
                    ? updated
                    : row,
              ),
            ),
        );

        setMessage(
          'Le contact a bien été modifié.',
        );
      } else {
        const created =
          await createMyAvailabilityContact(
            form,
          );

        setContacts(
          (rows) =>
            sortContacts([
              ...rows,
              created,
            ]),
        );

        setPreviewContactId(
          (current) =>
            current ||
            created.id,
        );

        setMessage(
          "L'organisme a bien été ajouté à votre carnet.",
        );
      }

      setForm(
        EMPTY_FORM,
      );

      setEditingId(null);
    } catch (saveError) {
      setError(
        saveError?.message ||
          "Impossible d'enregistrer ce contact.",
      );
    } finally {
      setSaving(false);
    }
  };


  const edit = (
    contact,
  ) => {
    setEditingId(
      contact.id,
    );

    setForm({
      organizationName:
        contact.organization_name ||
        '',

      contactName:
        contact.contact_name ||
        '',

      email:
        contact.email || '',

      phone:
        contact.phone || '',
    });

    setError('');
    setMessage('');

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };


  const askDelete = (
    contact,
  ) => {
    if (deletingId) {
      return;
    }

    setContactToDelete(
      contact,
    );

    setError('');
    setMessage('');
  };


  const cancelDelete =
    () => {
      if (deletingId) {
        return;
      }

      setContactToDelete(
        null,
      );
    };


  const confirmDelete =
    async () => {
      const contact =
        contactToDelete;

      if (
        !contact?.id ||
        deletingId
      ) {
        return;
      }

      setDeletingId(
        contact.id,
      );

      setError('');
      setMessage('');

      try {
        await deleteMyAvailabilityContact(
          contact.id,
        );

        setContacts(
          (rows) =>
            rows.filter(
              (row) =>
                row.id !==
                contact.id,
            ),
        );


        setSelectedContactIds(
          (current) =>
            current.filter(
              (id) =>
                id !==
                contact.id,
            ),
        );

        if (
          previewContactId ===
          contact.id
        ) {
          const replacement =
            contacts.find(
              (row) =>
                row.id !==
                contact.id,
            );

          setPreviewContactId(
            replacement?.id ||
            '',
          );
        }

        if (
          editingId ===
          contact.id
        ) {
          resetForm();
        }

        setContactToDelete(
          null,
        );

        setMessage(
          'Le contact a bien été supprimé.',
        );
      } catch (deleteError) {
        setError(
          deleteError?.message ||
            'Impossible de supprimer ce contact.',
        );
      } finally {
        setDeletingId(
          null,
        );
      }
    };


  const toggleRecipient =
    (contactId) => {
      setSendMessage('');
      setSendError('');

      setSelectedContactIds(
        (current) =>
          current.includes(contactId)
            ? current.filter(
                (id) =>
                  id !== contactId,
              )
            : [
                ...current,
                contactId,
              ],
      );
    };


  const selectedContacts =
    contacts.filter(
      (contact) =>
        selectedContactIds.includes(
          contact.id,
        ),
    );


  const openSendConfirmation =
    () => {
      setSendMessage('');
      setSendError('');

      if (
        selectedContactIds.length ===
        0
      ) {
        setSendError(
          'Sélectionnez au moins un contact destinataire.',
        );
        return;
      }

      if (
        selectedMonths.length ===
        0
      ) {
        setSendError(
          'Sélectionnez au moins un mois à partager.',
        );
        return;
      }

      setSendConfirmOpen(
        true,
      );
    };


  const confirmSendShare =
    async () => {
      if (sendingShare) {
        return;
      }

      setSendingShare(true);
      setSendError('');
      setSendMessage('');

      let sentCount = 0;
      const failures = [];

      try {
        for (
          const contact of
          selectedContacts
        ) {
          try {
            const customMessage =
              customizeMessages
                ? String(
                    customMessagesByContact[
                      contact.id
                    ] || '',
                  ).trim()
                : '';

            await sendTrainerAvailabilityShareEmail({
              contactId:
                contact.id,
              months:
                selectedMonths
                  .slice()
                  .sort(),
              message:
                customMessage ||
                commonShareMessage.trim(),
            });

            sentCount += 1;
          } catch (
            contactError
          ) {
            failures.push(
              `${contact.organization_name} : ${
                contactError?.message ||
                "échec de l'envoi"
              }`,
            );
          }
        }

        setSendConfirmOpen(
          false,
        );

        if (
          sentCount > 0
        ) {
          setSendMessage(
            `${sentCount} e-mail${
              sentCount > 1
                ? 's'
                : ''
            } transmis au service d'envoi. Le statut de livraison sera mis à jour dès le retour de Brevo.`,
          );
        }

        if (
          failures.length > 0
        ) {
          setSendError(
            failures.join(' · '),
          );
        }

        await loadContacts();
      } finally {
        setSendingShare(false);
      }
    };


  const toggleMonth =
    (key) => {
      setPreviewError('');

      setSelectedMonths(
        (current) => {
          if (
            current.includes(
              key,
            )
          ) {
            if (
              current.length ===
              1
            ) {
              return current;
            }

            return current.filter(
              (item) =>
                item !== key,
            );
          }

          return [
            ...current,
            key,
          ].sort();
        },
      );
    };


  const unknownDaysCount =
    useMemo(() => {
      if (!previewData) {
        return 0;
      }

      let count = 0;

      for (
        const selectedMonth of
        selectedMonths
      ) {
        const matrix =
          getMonthMatrix(
            selectedMonth,
          );

        const currentMonth =
          monthDateFromKey(
            selectedMonth,
          ).getMonth();

        for (
          const week of matrix
        ) {
          for (
            const date of week
          ) {
            if (
              date.getMonth() !==
              currentMonth
            ) {
              continue;
            }

            const state =
              getSharedDayState({
                day:
                  toISODate(
                    date,
                  ),

                ...previewData,
              });

            if (
              state.key ===
              'unknown'
            ) {
              count += 1;
            }
          }
        }
      }

      return count;
    }, [
      previewData,
      selectedMonths,
    ]);


  return (
    <div className="page-container">
      <div className="page-heading">
        <div>
          <p className="page-eyebrow">
            PARTAGE DES DISPONIBILITÉS
          </p>

          <h1>
            Partager mes disponibilités
          </h1>

          <p>
            Gérez vos contacts, choisissez les mois à partager et prévisualisez exactement ce que chaque organisme verra.
          </p>
        </div>
      </div>


      <div className="panel-card">
        <h2>
          Mon carnet d'organismes
        </h2>

        <p>
          Ajoutez vos contacts OF. Formaplane vous indique si l'organisme possède déjà un compte et, lorsqu'il est inscrit, s'il vous a déjà ajouté à son réseau de formateurs.
        </p>


        <form
          onSubmit={
            submit
          }
          style={{
            marginTop: 14,
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 10,
            }}
          >
            <label
              style={{
                display: 'grid',
                gap: 5,
                fontWeight: 700,
              }}
            >
              Organisme de formation
              <input
                name="organizationName"
                value={
                  form.organizationName
                }
                onChange={
                  change
                }
                placeholder="Ex. Alter Prévention"
                required
              />
            </label>

            <label
              style={{
                display: 'grid',
                gap: 5,
                fontWeight: 700,
              }}
            >
              Nom du contact
              <input
                name="contactName"
                value={
                  form.contactName
                }
                onChange={
                  change
                }
                placeholder="Ex. Sophie Martin"
              />
            </label>

            <label
              style={{
                display: 'grid',
                gap: 5,
                fontWeight: 700,
              }}
            >
              Adresse e-mail
              <input
                type="email"
                name="email"
                value={
                  form.email
                }
                onChange={
                  change
                }
                placeholder="contact@organisme.fr"
                required
              />
            </label>

            <label
              style={{
                display: 'grid',
                gap: 5,
                fontWeight: 700,
              }}
            >
              Téléphone
              <input
                type="tel"
                name="phone"
                value={
                  form.phone
                }
                onChange={
                  change
                }
                placeholder="Optionnel"
              />
            </label>
          </div>


          {error ? (
            <div
              style={{
                marginTop: 14,
                color: '#b42318',
                fontWeight: 700,
              }}
            >
              {error}
            </div>
          ) : null}


          {message ? (
            <div
              style={{
                marginTop: 14,
                color: '#15803d',
                fontWeight: 700,
              }}
            >
              {message}
            </div>
          ) : null}


          <div
            style={{
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
              marginTop: 12,
            }}
          >
            <button
              className="button"
              type="submit"
              disabled={
                saving
              }
            >
              {saving
                ? 'Enregistrement…'
                : editingId
                  ? 'Enregistrer les modifications'
                  : "Ajouter l'organisme"}
            </button>

            {editingId ? (
              <button
                className="button button--soft"
                type="button"
                onClick={
                  resetForm
                }
              >
                Annuler
              </button>
            ) : null}
          </div>
        </form>
      </div>


      <div
        className="panel-card"
        style={{
          marginTop: 14,
        }}
      >
        <h2
          style={{
            marginBottom: 4,
          }}
        >
          Mes contacts
        </h2>

        <p
          style={{
            margin: 0,
          }}
        >
          {contacts.length}{' '}
          contact
          {contacts.length >
          1
            ? 's'
            : ''}
        </p>


        {contacts.length > 0 ? (
          <div
            style={{
              marginTop: 8,
            }}
          >
            <button
              type="button"
              className="button button--soft"
              onClick={
                loadContacts
              }
              style={{
                padding: '6px 10px',
                fontSize: 11,
              }}
            >
              Actualiser les statuts de livraison
            </button>
          </div>
        ) : null}


        {loading ? (
          <p
            style={{
              marginTop: 12,
            }}
          >
            Chargement du carnet…
          </p>
        ) : null}


        {!loading &&
        contacts.length ===
          0 ? (
          <div
            style={{
              marginTop: 12,
              padding: 18,
              border:
                '1px dashed #cbd5e1',
              borderRadius: 12,
              background:
                '#f8fafc',
              color: '#64748b',
            }}
          >
            Votre carnet est vide. Ajoutez votre premier organisme ci-dessus.
          </div>
        ) : null}


        {!loading &&
        contacts.length >
          0 ? (
          <div
            style={{
              display: 'grid',
              gap: 12,
              marginTop: 12,
            }}
          >
            {contacts.map(
              (contact) => (
                <div
                  key={
                    contact.id
                  }
                  style={{
                    border:
                      '1px solid #e2e8f0',
                    borderRadius: 12,
                    padding: 12,
                    display: 'flex',
                    justifyContent:
                      'space-between',
                    alignItems:
                      'center',
                    gap: 16,
                    flexWrap:
                      'wrap',
                    background: '#fff',
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems:
                          'center',
                        gap: 5,
                        flexWrap:
                          'wrap',
                      }}
                    >
                      <strong>
                        {
                          contact.organization_name
                        }
                      </strong>

                      <StatusBadge
                        tone={
                          contact.organization_id
                            ? 'success'
                            : 'neutral'
                        }
                      >
                        {contact.organization_id
                          ? 'Inscrit sur Formaplane'
                          : 'Non inscrit'}
                      </StatusBadge>

                      {contact.organization_id ? (
                        <StatusBadge
                          tone={
                            contact.is_referenced
                              ? 'info'
                              : 'neutral'
                          }
                        >
                          {contact.is_referenced
                            ? 'Vous êtes dans son réseau'
                            : 'Pas encore dans son réseau'}
                        </StatusBadge>
                      ) : null}
                    </div>

                    {contact.contact_name ? (
                      <div
                        style={{
                          marginTop: 6,
                          color:
                            '#475569',
                        }}
                      >
                        {
                          contact.contact_name
                        }
                      </div>
                    ) : null}

                    <div
                      style={{
                        marginTop: 4,
                        color:
                          '#64748b',
                        fontSize: 14,
                      }}
                    >
                      {
                        contact.email
                      }
                    </div>

                    {contact.phone ? (
                      <div
                        style={{
                          marginTop: 2,
                          color:
                            '#64748b',
                          fontSize: 14,
                        }}
                      >
                        {
                          contact.phone
                        }
                      </div>
                    ) : null}


                    {contact.last_share?.sentAt ? (() => {
                      const delivery =
                        getDeliveryStatusPresentation(
                          contact.last_share,
                        );

                      return (
                        <div
                          style={{
                            marginTop: 8,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 7,
                            flexWrap: 'wrap',
                            fontSize: 11,
                            color: '#64748b',
                          }}
                        >
                          <span>
                            Dernier partage :{' '}
                            <strong>
                              {formatShareDate(
                                contact.last_share.sentAt,
                              )}
                            </strong>
                            {contact.last_share.months?.length
                              ? ` · ${formatSharedMonths(
                                  contact.last_share.months,
                                )}`
                              : ''}
                          </span>

                          {delivery ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                padding: '3px 7px',
                                borderRadius: 999,
                                fontWeight: 800,
                                color: delivery.color,
                                background: delivery.background,
                              }}
                            >
                              {delivery.label}
                            </span>
                          ) : null}
                        </div>
                      );
                    })() : null}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      gap: 5,
                    }}
                  >
                    <button
                      className="button button--soft"
                      type="button"
                      onClick={() =>
                        edit(
                          contact,
                        )
                      }
                    >
                      Modifier
                    </button>

                    <button
                      className="button button--soft"
                      type="button"
                      disabled={
                        deletingId ===
                        contact.id
                      }
                      onClick={() =>
                        askDelete(
                          contact,
                        )
                      }
                      style={{
                        color:
                          '#b42318',
                      }}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ),
            )}
          </div>
        ) : null}
      </div>


      <div
        className="panel-card"
        style={{
          marginTop: 14,
        }}
      >
        <p className="page-eyebrow">
          PRÉPARER LE PARTAGE
        </p>

        <h2>
          Choisir les mois et prévisualiser
        </h2>

        <p>
          L'aperçu est personnalisé pour l'organisme sélectionné. Une mission ou une option avec cet organisme est donc identifiée sans révéler l'activité avec vos autres partenaires.
        </p>


        {contacts.length ===
        0 ? (
          <div
            style={{
              marginTop: 12,
              padding: 18,
              border:
                '1px dashed #cbd5e1',
              borderRadius: 12,
              background:
                '#f8fafc',
              color: '#64748b',
            }}
          >
            Ajoutez au moins un organisme à votre carnet pour préparer un partage.
          </div>
        ) : (
          <>
            <div
              style={{
                marginTop: 14,
              }}
            >
              <div
                style={{
                  fontWeight: 800,
                  marginBottom: 6,
                }}
              >
                Destinataires
              </div>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 7,
                }}
              >
                {contacts.map(
                  (contact) => {
                    const selected =
                      selectedContactIds.includes(
                        contact.id,
                      );

                    return (
                      <label
                        key={
                          contact.id
                        }
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '7px 9px',
                          borderRadius: 9,
                          border: selected
                            ? '1px solid #93c5fd'
                            : '1px solid #e2e8f0',
                          background: selected
                            ? '#eff6ff'
                            : '#ffffff',
                          cursor: 'pointer',
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#334155',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={
                            selected
                          }
                          onChange={() =>
                            toggleRecipient(
                              contact.id,
                            )
                          }
                        />

                        {
                          contact.organization_name
                        }
                      </label>
                    );
                  },
                )}
              </div>

              <p
                style={{
                  margin: '6px 0 0',
                  color: '#64748b',
                  fontSize: 11,
                }}
              >
                Chaque organisme recevra un e-mail individuel avec un planning personnalisé.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'minmax(240px, 1fr) minmax(300px, 2fr)',
                gap: 14,
                marginTop: 14,
              }}
            >
              <div>
                <label
                  style={{
                    display: 'grid',
                    gap: 7,
                    fontWeight: 700,
                  }}
                >
                  Aperçu pour
                  <select
                    value={
                      previewContactId
                    }
                    onChange={(
                      event,
                    ) =>
                      setPreviewContactId(
                        event.target.value,
                      )
                    }
                  >
                    {contacts.map(
                      (contact) => (
                        <option
                          key={
                            contact.id
                          }
                          value={
                            contact.id
                          }
                        >
                          {
                            contact.organization_name
                          }
                          {contact.contact_name
                            ? ` — ${contact.contact_name}`
                            : ''}
                        </option>
                      ),
                    )}
                  </select>
                </label>
              </div>


              <div>
                <div
                  style={{
                    fontWeight: 700,
                    marginBottom: 5,
                  }}
                >
                  Mois à partager
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 5,
                  }}
                >
                  {monthChoices.map(
                    (choice) => {
                      const selected =
                        selectedMonths.includes(
                          choice.key,
                        );

                      return (
                        <button
                          key={
                            choice.key
                          }
                          className={
                            selected
                              ? 'button'
                              : 'button button--soft'
                          }
                          type="button"
                          onClick={() =>
                            toggleMonth(
                              choice.key,
                            )
                          }
                          style={{
                            textTransform:
                              'capitalize',
                          }}
                        >
                          {
                            choice.label
                          }
                        </button>
                      );
                    },
                  )}
                </div>

                <p
                  style={{
                    margin:
                      '6px 0 0',
                    fontSize: 12,
                    color:
                      '#64748b',
                  }}
                >
                  Vous pouvez sélectionner plusieurs mois. Au moins un mois doit rester sélectionné.
                </p>
              </div>
            </div>


            <div
              style={{
                marginTop: 14,
                padding:
                  '10px 12px',
                borderRadius: 12,
                background:
                  '#f8fafc',
                border:
                  '1px solid #e2e8f0',
                fontSize: 13,
                lineHeight: 1.55,
                color: '#475569',
              }}
            >
              <strong>
                Confidentialité :
              </strong>{' '}
              les missions effectuées pour un autre organisme apparaissent uniquement comme « Indisponible ». Les options des autres organismes ne sont jamais identifiées nominativement.
            </div>


            {previewError ? (
              <div
                style={{
                  marginTop: 16,
                  color: '#b42318',
                  fontWeight: 700,
                }}
              >
                {
                  previewError
                }
              </div>
            ) : null}


            {previewLoading ? (
              <p
                style={{
                  marginTop: 12,
                }}
              >
                Préparation de l'aperçu…
              </p>
            ) : null}


            {!previewLoading &&
            previewData ? (
              <>
                {unknownDaysCount >
                0 ? (
                  <div
                    style={{
                      marginTop: 12,
                      padding:
                        '10px 12px',
                      borderRadius: 10,
                      border:
                        '1px solid #fde68a',
                      background:
                        '#fffbeb',
                      color:
                        '#854d0e',
                      fontSize: 13,
                      lineHeight: 1.5,
                    }}
                  >
                    ⚠️{' '}
                    <strong>
                      {unknownDaysCount}{' '}
                      jour
                      {unknownDaysCount >
                      1
                        ? 's'
                        : ''}{' '}
                      non renseigné
                      {unknownDaysCount >
                      1
                        ? 's'
                        : ''}
                    </strong>{' '}
                    sur la période sélectionnée. Ils restent visibles dans cet aperçu afin d'éviter de présenter une disponibilité qui n'a pas été déclarée.
                  </div>
                ) : null}


                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 10,
                    marginTop: 12,
                    padding:
                      '12px 0',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  <span
                    style={{
                      color:
                        '#15803d',
                    }}
                  >
                    ● Disponible
                  </span>

                  <span
                    style={{
                      color:
                        '#a16207',
                    }}
                  >
                    ● Option avec votre organisme
                  </span>

                  <span
                    style={{
                      color:
                        '#1d4ed8',
                    }}
                  >
                    ● Mission avec votre organisme
                  </span>

                  <span
                    style={{
                      color:
                        '#b42318',
                    }}
                  >
                    ● Indisponible
                  </span>

                  <span
                    style={{
                      color:
                        '#64748b',
                    }}
                  >
                    ● Non renseigné
                  </span>
                </div>


                <div
                  style={{
                    display: 'grid',
                    gap: 18,
                    marginTop: 6,
                  }}
                >
                  {selectedMonths
                    .slice()
                    .sort()
                    .map(
                      (
                        selectedMonth,
                      ) => {
                        const monthDate =
                          monthDateFromKey(
                            selectedMonth,
                          );

                        const currentMonth =
                          monthDate.getMonth();

                        const matrix =
                          getMonthMatrix(
                            selectedMonth,
                          );

                        return (
                          <section
                            key={
                              selectedMonth
                            }
                            style={{
                              border:
                                '1px solid #e2e8f0',
                              borderRadius:
                                14,
                              padding: 12,
                              background:
                                '#ffffff',
                            }}
                          >
                            <h3
                              style={{
                                margin:
                                  '0 0 10px',
                                textTransform:
                                  'capitalize',
                              }}
                            >
                              {monthLabelFromKey(
                                selectedMonth,
                              )}
                            </h3>

                            <div
                              style={{
                                display:
                                  'grid',
                                gridTemplateColumns:
                                  'repeat(7, minmax(0, 1fr))',
                                gap: 5,
                              }}
                            >
                              {[
                                'Lun',
                                'Mar',
                                'Mer',
                                'Jeu',
                                'Ven',
                                'Sam',
                                'Dim',
                              ].map(
                                (
                                  label,
                                ) => (
                                  <div
                                    key={
                                      label
                                    }
                                    style={{
                                      textAlign:
                                        'center',
                                      color:
                                        '#64748b',
                                      fontWeight:
                                        800,
                                      fontSize:
                                        11,
                                      padding:
                                        '2px 0',
                                    }}
                                  >
                                    {
                                      label
                                    }
                                  </div>
                                ),
                              )}


                              {matrix.flat().map(
                                (
                                  date,
                                  index,
                                ) => {
                                  const iso =
                                    toISODate(
                                      date,
                                    );

                                  const state =
                                    getSharedDayState({
                                      day:
                                        iso,
                                      ...previewData,
                                    });

                                  return (
                                    <SharedDay
                                      key={`${iso}-${index}`}
                                      date={
                                        date
                                      }
                                      currentMonth={
                                        currentMonth
                                      }
                                      state={
                                        state
                                      }
                                    />
                                  );
                                },
                              )}
                            </div>
                          </section>
                        );
                      },
                    )}
                </div>


                <div
                  style={{
                    marginTop: 12,
                    padding:
                      '14px 16px',
                    borderRadius: 12,
                    border:
                      '1px solid #dbeafe',
                    background:
                      '#f8fbff',
                    color:
                      '#475569',
                    fontSize: 13,
                    lineHeight: 1.55,
                  }}
                >
                  <strong>
                    Aperçu personnalisé pour{' '}
                    {
                      previewContact?.organization_name
                    }.
                  </strong>{' '}
                  Lors de l'envoi à plusieurs organismes, Formaplane générera automatiquement la version adaptée à chaque destinataire.
                </div>

                <div
                  style={{
                    marginTop: 12,
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    background: '#ffffff',
                  }}
                >
                  <div
                    style={{
                      fontWeight: 800,
                      marginBottom: 5,
                    }}
                  >
                    Ajouter un message
                    <span
                      style={{
                        marginLeft: 5,
                        color: '#94a3b8',
                        fontWeight: 600,
                        fontSize: 11,
                      }}
                    >
                      (facultatif)
                    </span>
                  </div>

                  <p
                    style={{
                      margin: '0 0 8px',
                      fontSize: 11,
                      lineHeight: 1.45,
                      color: '#64748b',
                    }}
                  >
                    Ce message sera ajouté dans le corps de l'e-mail envoyé aux organismes sélectionnés.
                  </p>

                  <textarea
                    value={
                      commonShareMessage
                    }
                    onChange={(
                      event,
                    ) =>
                      setCommonShareMessage(
                        event.target.value,
                      )
                    }
                    maxLength={1500}
                    rows={3}
                    placeholder="Ex. Je suis particulièrement disponible sur la deuxième quinzaine du mois. N'hésitez pas à me contacter."
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      resize: 'vertical',
                    }}
                  />

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 8,
                      marginTop: 5,
                      fontSize: 10,
                      color: '#94a3b8',
                    }}
                  >
                    <span>
                      Message commun à tous les destinataires
                    </span>
                    <span>
                      {commonShareMessage.length}/1500
                    </span>
                  </div>

                  {selectedContactIds.length > 0 ? (
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 7,
                        marginTop: 10,
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#475569',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={
                          customizeMessages
                        }
                        onChange={(
                          event,
                        ) =>
                          setCustomizeMessages(
                            event.target.checked,
                          )
                        }
                      />
                      Personnaliser le message pour certains destinataires
                    </label>
                  ) : null}

                  {customizeMessages &&
                  selectedContacts.length >
                    0 ? (
                    <div
                      style={{
                        display: 'grid',
                        gap: 9,
                        marginTop: 10,
                      }}
                    >
                      {selectedContacts.map(
                        (contact) => (
                          <div
                            key={
                              contact.id
                            }
                            style={{
                              padding: 10,
                              border:
                                '1px solid #e2e8f0',
                              borderRadius: 9,
                              background:
                                '#f8fafc',
                            }}
                          >
                            <label
                              style={{
                                display:
                                  'grid',
                                gap: 5,
                                fontSize:
                                  11,
                                fontWeight:
                                  800,
                                color:
                                  '#334155',
                              }}
                            >
                              {
                                contact.organization_name
                              }
                              <textarea
                                value={
                                  customMessagesByContact[
                                    contact.id
                                  ] || ''
                                }
                                onChange={(
                                  event,
                                ) =>
                                  setCustomMessagesByContact(
                                    (
                                      current,
                                    ) => ({
                                      ...current,
                                      [
                                        contact.id
                                      ]:
                                        event
                                          .target
                                          .value,
                                    }),
                                  )
                                }
                                maxLength={
                                  1500
                                }
                                rows={2}
                                placeholder={
                                  commonShareMessage
                                    ? 'Laissez vide pour utiliser le message commun.'
                                    : 'Message spécifique à cet organisme.'
                                }
                                style={{
                                  width:
                                    '100%',
                                  boxSizing:
                                    'border-box',
                                  resize:
                                    'vertical',
                                  background:
                                    '#ffffff',
                                }}
                              />
                            </label>

                            <div
                              style={{
                                marginTop:
                                  4,
                                textAlign:
                                  'right',
                                fontSize:
                                  9,
                                color:
                                  '#94a3b8',
                              }}
                            >
                              {String(
                                customMessagesByContact[
                                  contact.id
                                ] || '',
                              ).length}
                              /1500
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  ) : null}
                </div>


                <div
                  style={{
                    marginTop: 12,
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    background: '#ffffff',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      flexWrap: 'wrap',
                    }}
                  >
                    <div>
                      <strong>
                        Prêt à partager
                      </strong>

                      <div
                        style={{
                          marginTop: 3,
                          fontSize: 11,
                          color: '#64748b',
                        }}
                      >
                        {selectedContactIds.length}{' '}
                        destinataire
                        {selectedContactIds.length > 1
                          ? 's'
                          : ''}{' '}
                        · {selectedMonths.length}{' '}
                        mois sélectionné
                        {selectedMonths.length > 1
                          ? 's'
                          : ''}
                      </div>
                    </div>

                    <button
                      className="button"
                      type="button"
                      onClick={
                        openSendConfirmation
                      }
                      disabled={
                        sendingShare
                      }
                    >
                      Envoyer mes disponibilités
                    </button>
                  </div>

                  {sendMessage ? (
                    <div
                      style={{
                        marginTop: 9,
                        color: '#15803d',
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {sendMessage}
                    </div>
                  ) : null}

                  {sendError ? (
                    <div
                      style={{
                        marginTop: 9,
                        color: '#b42318',
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {sendError}
                    </div>
                  ) : null}
                </div>

              </>
            ) : null}
          </>
        )}
      </div>


      {sendConfirmOpen ? (
        <div
          role="presentation"
          onMouseDown={(
            event,
          ) => {
            if (
              event.target ===
                event.currentTarget &&
              !sendingShare
            ) {
              setSendConfirmOpen(
                false,
              );
            }
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'grid',
            placeItems: 'center',
            padding: 20,
            background:
              'rgba(15, 23, 42, 0.55)',
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="send-share-title"
            style={{
              width:
                'min(100%, 500px)',
              background: '#ffffff',
              borderRadius: 16,
              boxShadow:
                '0 24px 70px rgba(15, 23, 42, 0.28)',
              padding: 22,
            }}
          >
            <p
              className="page-eyebrow"
              style={{
                marginTop: 0,
              }}
            >
              PARTAGE DES DISPONIBILITÉS
            </p>

            <h2
              id="send-share-title"
              style={{
                marginTop: 6,
              }}
            >
              Envoyer vos disponibilités ?
            </h2>

            <p
              style={{
                color: '#475569',
                lineHeight: 1.55,
                fontSize: 13,
              }}
            >
              Formaplane va envoyer un e-mail individuel à{' '}
              <strong>
                {selectedContacts.length}{' '}
                contact
                {selectedContacts.length > 1
                  ? 's'
                  : ''}
              </strong>
              . Chaque organisme recevra uniquement la version du planning qui lui est destinée.
            </p>

            <div
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                fontSize: 11,
                lineHeight: 1.55,
                color: '#64748b',
              }}
            >
              <div>
                <strong>
                  Destinataires :
                </strong>{' '}
                {selectedContacts
                  .map(
                    (contact) =>
                      contact.organization_name,
                  )
                  .join(', ')}
              </div>

              <div
                style={{
                  marginTop: 4,
                }}
              >
                <strong>
                  Mois :
                </strong>{' '}
                {formatSharedMonths(
                  selectedMonths
                    .slice()
                    .sort(),
                )}
              </div>

              {commonShareMessage.trim() ||
              (
                customizeMessages &&
                selectedContacts.some(
                  (contact) =>
                    String(
                      customMessagesByContact[
                        contact.id
                      ] || '',
                    ).trim(),
                )
              ) ? (
                <div
                  style={{
                    marginTop: 4,
                  }}
                >
                  <strong>
                    Message :
                  </strong>{' '}
                  ajouté au partage
                  {customizeMessages
                    ? ' (personnalisé selon le destinataire si renseigné)'
                    : ''}
                </div>
              ) : null}
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 9,
                flexWrap: 'wrap',
                marginTop: 18,
              }}
            >
              <button
                className="button button--soft"
                type="button"
                onClick={() =>
                  setSendConfirmOpen(
                    false,
                  )
                }
                disabled={
                  sendingShare
                }
              >
                Annuler
              </button>

              <button
                className="button"
                type="button"
                onClick={
                  confirmSendShare
                }
                disabled={
                  sendingShare
                }
              >
                {sendingShare
                  ? 'Envoi…'
                  : 'Confirmer l’envoi'}
              </button>
            </div>
          </div>
        </div>
      ) : null}


      {contactToDelete ? (
        <div
          role="presentation"
          onMouseDown={(
            event,
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              cancelDelete();
            }
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'grid',
            placeItems:
              'center',
            padding: 20,
            background:
              'rgba(15, 23, 42, 0.55)',
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-contact-title"
            style={{
              width:
                'min(100%, 480px)',
              background:
                '#ffffff',
              borderRadius: 16,
              boxShadow:
                '0 24px 70px rgba(15, 23, 42, 0.28)',
              padding: 24,
            }}
          >
            <p
              className="page-eyebrow"
              style={{
                marginTop: 0,
              }}
            >
              CARNET D'ORGANISMES
            </p>

            <h2
              id="delete-contact-title"
              style={{
                marginTop: 6,
              }}
            >
              Supprimer ce contact ?
            </h2>

            <p
              style={{
                color: '#475569',
                lineHeight: 1.55,
              }}
            >
              <strong>
                {
                  contactToDelete.organization_name
                }
              </strong>{' '}
              sera retiré de votre carnet. Cette action ne supprime aucun compte Formaplane et ne modifie pas votre éventuel référencement auprès de cet organisme.
            </p>

            <div
              style={{
                display: 'flex',
                justifyContent:
                  'flex-end',
                gap: 10,
                flexWrap:
                  'wrap',
                marginTop: 22,
              }}
            >
              <button
                className="button button--soft"
                type="button"
                onClick={
                  cancelDelete
                }
                disabled={
                  Boolean(
                    deletingId,
                  )
                }
              >
                Annuler
              </button>

              <button
                className="button"
                type="button"
                onClick={
                  confirmDelete
                }
                disabled={
                  Boolean(
                    deletingId,
                  )
                }
                style={{
                  background:
                    '#b42318',
                }}
              >
                {deletingId
                  ? 'Suppression…'
                  : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
