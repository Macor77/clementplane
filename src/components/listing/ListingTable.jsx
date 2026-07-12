import SortHeader from './SortHeader';

function getDaysInMonth(date) {
  const year = date.getFullYear();
  const month = date.getMonth();

  const lastDay = new Date(
    year,
    month + 1,
    0
  ).getDate();

  return Array.from(
    { length: lastDay },
    (_, index) => index + 1
  );
}

function isCurrentMonth(date) {
  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth()
  );
}

function getISODate(planningDate, day) {
  const year = planningDate.getFullYear();

  const month = String(
    planningDate.getMonth() + 1
  ).padStart(2, '0');

  const formattedDay = String(day).padStart(
    2,
    '0'
  );

  return `${year}-${month}-${formattedDay}`;
}

function getPlanningCellAppearance(status) {
  switch (status) {
    case 'dispo':
      return {
        label: 'Disponible',
        background: '#86efac',
        border: '#22c55e',
      };

    case 'indispo':
      return {
        label: 'Indisponible',
        background: '#fca5a5',
        border: '#ef4444',
      };

    case 'mission':
      return {
        label: 'En mission',
        background: '#fde047',
        border: '#eab308',
      };

    default:
      return {
        label: 'Non renseigné',
        background: '#f1f5f9',
        border: '#cbd5e1',
      };
  }
}

function getNotes(note) {
  if (!note) return [];

  return note
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

function getPlanningTooltip({
  fullName,
  day,
  monthLabel,
  availability,
}) {
  const appearance = getPlanningCellAppearance(
    availability?.status
  );

  const lines = [
    fullName || 'Formateur',
    `${day} ${monthLabel}`,
    appearance.label,
  ];

  const notes = getNotes(availability?.note);

  if (notes.length > 0) {
    lines.push('');
    lines.push('Notes :');

    for (const note of notes) {
      lines.push(`• ${note}`);
    }
  }

  return lines.join('\n');
}

export default function ListingTable({
  filteredFormateurs,
  distances,
  sort,
  toggleSort,
  renderList,
  navigate,
  handleDelete,
  planningDate,
  onPreviousMonth,
  onNextMonth,
  onCurrentMonth,
  planningAvailability,
  planningLoading,
  planningError,
}) {
  const days = getDaysInMonth(planningDate);

  const monthLabel =
    planningDate.toLocaleDateString('fr-FR', {
      month: 'long',
      year: 'numeric',
    });

  const today = new Date();

  return (
    <div>
      <div
        style={{
          width: '100%',
          overflow: 'visible',
        }}
      >
        <table
          style={{
            width: '100%',
            minWidth: 1280,
            borderCollapse: 'separate',
            borderSpacing: 0,
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  ...headerStyle,
                  minWidth: 225,
                }}
              >
                <SortHeader
                  label="Formateur"
                  colKey="nom"
                  sort={sort}
                  onToggleSort={toggleSort}
                />
              </th>

              <th
                style={{
                  ...headerStyle,
                  minWidth: 165,
                }}
              >
                <SortHeader
                  label="Localisation"
                  colKey="ville"
                  sort={sort}
                  onToggleSort={toggleSort}
                />
              </th>

              <th
                style={{
                  ...headerStyle,
                  minWidth: 190,
                }}
              >
                Compétences
              </th>

              <th
                style={{
                  ...headerStyle,
                  minWidth: 95,
                }}
              >
                <SortHeader
                  label="Statut"
                  colKey="statut"
                  sort={sort}
                  onToggleSort={toggleSort}
                />
              </th>

              <th
                style={{
                  ...headerStyle,
                  minWidth: 90,
                }}
              >
                <SortHeader
                  label="Distance"
                  colKey="distance"
                  sort={sort}
                  onToggleSort={toggleSort}
                />
              </th>

              <th
                style={{
                  ...headerStyle,
                  minWidth: 610,
                  padding: 10,
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 10,
                    }}
                  >
                    <button
                      type="button"
                      onClick={onPreviousMonth}
                      title="Mois précédent"
                      style={monthButtonStyle}
                    >
                      ◀
                    </button>

                    <div
                      style={{
                        minWidth: 160,
                        textAlign: 'center',
                        fontWeight: 700,
                        textTransform: 'capitalize',
                      }}
                    >
                      Planning — {monthLabel}
                    </div>

                    <button
                      type="button"
                      onClick={onNextMonth}
                      title="Mois suivant"
                      style={monthButtonStyle}
                    >
                      ▶
                    </button>

                    {!isCurrentMonth(planningDate) && (
                      <button
                        type="button"
                        onClick={onCurrentMonth}
                        title="Revenir au mois actuel"
                        style={{
                          ...monthButtonStyle,
                          padding: '4px 8px',
                          fontSize: 11,
                        }}
                      >
                        Aujourd’hui
                      </button>
                    )}
                  </div>

                  {planningLoading && (
                    <div style={planningMessageStyle}>
                      Chargement des disponibilités…
                    </div>
                  )}

                  {planningError && (
                    <div
                      style={{
                        ...planningMessageStyle,
                        color: '#b91c1c',
                      }}
                    >
                      {planningError}
                    </div>
                  )}

                  <div
                    style={planningGridStyle(
                      days.length
                    )}
                  >
                    {days.map((day) => {
                      const isToday =
                        isCurrentMonth(planningDate) &&
                        day === today.getDate();

                      return (
                        <div
                          key={day}
                          title={`${day} ${monthLabel}`}
                          style={{
                            ...dayHeaderStyle,
                            ...(isToday
                              ? todayHeaderStyle
                              : {}),
                          }}
                        >
                          {day}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredFormateurs.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    padding: 24,
                    textAlign: 'center',
                    color: '#6b7280',
                    borderBottom:
                      '1px solid #e5e7eb',
                  }}
                >
                  Aucun formateur ne correspond aux
                  critères sélectionnés.
                </td>
              </tr>
            ) : (
              filteredFormateurs.map(
                (formateur) => {
                  const distance =
                    distances.get(formateur);

                  const fullName = [
                    formateur.prenom,
                    formateur.nom,
                  ]
                    .filter(Boolean)
                    .join(' ');

                  const localisation = [
                    formateur.ville,
                    formateur.codePostal,
                  ]
                    .filter(Boolean)
                    .join(' — ');

                  const trainerPlanning =
                    planningAvailability[
                      formateur.id
                    ] || {};

                  return (
                    <tr key={formateur.id}>
                      <td
                        style={{
                          ...cellStyle,
                          minWidth: 225,
                          paddingTop: 12,
                          paddingBottom: 12,
                        }}
                      >
                        <div
                          style={{
                            display: 'grid',
                            gap: 8,
                          }}
                        >
                          <div
                            style={{
                              fontWeight: 700,
                              lineHeight: 1.25,
                            }}
                          >
                            {fullName || '—'}
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              gap: 6,
                              flexWrap: 'wrap',
                            }}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                navigate(
                                  `/formateur/view/${formateur.id}`
                                )
                              }
                              disabled={!formateur.id}
                              style={actionButtonStyle}
                            >
                              Voir
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                navigate(
                                  `/formateur/edit/${formateur.id}`
                                )
                              }
                              disabled={!formateur.id}
                              style={actionButtonStyle}
                            >
                              Modifier
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  formateur.id
                                )
                              }
                              disabled={!formateur.id}
                              style={deleteButtonStyle}
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>
                      </td>

                      <td
                        style={{
                          ...cellStyle,
                          minWidth: 165,
                        }}
                      >
                        {localisation || '—'}
                      </td>

                      <td
                        style={{
                          ...cellStyle,
                          minWidth: 190,
                          maxWidth: 240,
                        }}
                      >
                        {renderList(
                          formateur.competences
                        ) || '—'}
                      </td>

                      <td
                        style={{
                          ...cellStyle,
                          minWidth: 95,
                        }}
                      >
                        {formateur.statut || '—'}
                      </td>

                      <td
                        style={{
                          ...cellStyle,
                          minWidth: 90,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {typeof distance === 'number'
                          ? `${distance.toFixed(2)} km`
                          : distance || '—'}
                      </td>

                      <td
                        style={{
                          ...cellStyle,
                          minWidth: 610,
                          padding: 10,
                        }}
                      >
                        <div
                          style={planningGridStyle(
                            days.length
                          )}
                        >
                          {days.map((day) => {
                            const isoDate =
                              getISODate(
                                planningDate,
                                day
                              );

                            const availability =
                              trainerPlanning[
                                isoDate
                              ];

                            const appearance =
                              getPlanningCellAppearance(
                                availability?.status
                              );

                            const notes = getNotes(
                              availability?.note
                            );

                            const hasNote =
                              notes.length > 0;

                            const isToday =
                              isCurrentMonth(
                                planningDate
                              ) &&
                              day === today.getDate();

                            return (
                              <div
                                key={day}
                                title={getPlanningTooltip(
                                  {
                                    fullName,
                                    day,
                                    monthLabel,
                                    availability,
                                  }
                                )}
                                style={{
                                  ...planningCellStyle,
                                  background:
                                    appearance.background,
                                  border: `${
                                    isToday ? 2 : 1
                                  }px solid ${
                                    isToday
                                      ? '#2563eb'
                                      : appearance.border
                                  }`,
                                  opacity:
                                    planningLoading
                                      ? 0.55
                                      : 1,
                                }}
                              >
                                {hasNote && (
                                  <span
                                    aria-hidden="true"
                                    style={
                                      noteIndicatorStyle
                                    }
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                }
              )
            )}
          </tbody>
        </table>
      </div>

      <PlanningLegend />
    </div>
  );
}

function PlanningLegend() {
  const items = [
    {
      label: 'Disponible',
      background: '#86efac',
      border: '#22c55e',
    },
    {
      label: 'Indisponible',
      background: '#fca5a5',
      border: '#ef4444',
    },
    {
      label: 'En mission',
      background: '#fde047',
      border: '#eab308',
    },
    {
      label: 'Non renseigné',
      background: '#f1f5f9',
      border: '#cbd5e1',
    },
  ];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
        marginTop: 12,
        padding: '10px 12px',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        background: '#ffffff',
        fontSize: 12,
      }}
    >
      <strong>Légende :</strong>

      {items.map((item) => (
        <div
          key={item.label}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span
            style={{
              width: 16,
              height: 16,
              borderRadius: 4,
              background: item.background,
              border: `1px solid ${item.border}`,
              boxSizing: 'border-box',
            }}
          />

          <span>{item.label}</span>
        </div>
      ))}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: '#111827',
            display: 'inline-block',
          }}
        />

        <span>Note présente</span>
      </div>
    </div>
  );
}

function planningGridStyle(dayCount) {
  return {
    display: 'grid',
    gridTemplateColumns: `repeat(${dayCount}, 17px)`,
    gap: 2,
    alignItems: 'center',
    justifyContent: 'center',
  };
}

const monthButtonStyle = {
  border: '1px solid #d1d5db',
  borderRadius: 6,
  background: '#ffffff',
  cursor: 'pointer',
  padding: '4px 7px',
  fontSize: 12,
};

const actionButtonStyle = {
  border: '1px solid #d1d5db',
  borderRadius: 6,
  background: '#ffffff',
  cursor: 'pointer',
  padding: '3px 7px',
  fontSize: 11,
};

const deleteButtonStyle = {
  ...actionButtonStyle,
  border: '1px solid #fecaca',
  background: '#fff7f7',
  color: '#991b1b',
};

const dayHeaderStyle = {
  width: 17,
  height: 20,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 5,
  fontSize: 9,
  color: '#4b5563',
  boxSizing: 'border-box',
};

const todayHeaderStyle = {
  border: '2px solid #2563eb',
  background: '#dbeafe',
  color: '#1d4ed8',
  fontWeight: 700,
};

const planningCellStyle = {
  width: 17,
  height: 22,
  borderRadius: 4,
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition:
    'background 120ms ease, border 120ms ease',
};

const noteIndicatorStyle = {
  width: 5,
  height: 5,
  borderRadius: '50%',
  background: '#111827',
  display: 'block',
  pointerEvents: 'none',
  boxShadow:
    '0 0 0 1px rgba(255, 255, 255, 0.65)',
};

const planningMessageStyle = {
  textAlign: 'center',
  fontSize: 11,
  fontWeight: 400,
  color: '#6b7280',
};

const headerStyle = {
  padding: '10px 12px',
  textAlign: 'left',
  verticalAlign: 'middle',
  borderBottom: '2px solid #d1d5db',
  backgroundColor: '#f8fafc',
  fontSize: 13,
  whiteSpace: 'nowrap',
  position: 'sticky',
  top: 0,
  zIndex: 20,
  boxShadow:
    '0 3px 8px rgba(0, 0, 0, 0.10)',
  isolation: 'isolate',
};

const cellStyle = {
  padding: '10px 12px',
  textAlign: 'left',
  verticalAlign: 'middle',
  borderBottom: '1px solid #e5e7eb',
  background: '#ffffff',
  fontSize: 13,
};