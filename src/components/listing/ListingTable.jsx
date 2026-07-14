import SortHeader from './SortHeader';
import PlanningHeader from './planning/PlanningHeader';
import PlanningLegend from './planning/PlanningLegend';
import PlanningRow from './planning/PlanningRow';
import {
  getDaysInMonth,
  getMonthLabel,
} from './planning/planningUtils';

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
  const monthLabel = getMonthLabel(planningDate);

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
                  minWidth: 220,
                }}
              >
                Compétences / Matériel
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
                <PlanningHeader
                  days={days}
                  planningDate={planningDate}
                  monthLabel={monthLabel}
                  onPreviousMonth={onPreviousMonth}
                  onNextMonth={onNextMonth}
                  onCurrentMonth={onCurrentMonth}
                  planningLoading={planningLoading}
                  planningError={planningError}
                />
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredFormateurs.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={emptyStateStyle}
                >
                  Aucun formateur ne correspond aux
                  critères sélectionnés.
                </td>
              </tr>
            ) : (
              filteredFormateurs.map((formateur) => {
                const distance = distances.get(formateur);
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
                  planningAvailability[formateur.id] || {};

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
                              handleDelete(formateur.id)
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
                        minWidth: 220,
                        maxWidth: 280,
                      }}
                    >
                      <div
                        style={{
                          display: 'grid',
                          gap: 6,
                        }}
                      >
                        <div>
                          {renderList(formateur.competences) || '—'}
                        </div>

                        <div
                          style={{
                            fontSize: 12,
                            color: '#4b5563',
                            lineHeight: 1.35,
                          }}
                        >
                          <strong>Matériel :</strong>{' '}
                          {renderList(formateur.materiel) || '—'}
                        </div>
                      </div>
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
                      <PlanningRow
                        days={days}
                        planningDate={planningDate}
                        monthLabel={monthLabel}
                        fullName={fullName}
                        trainerPlanning={trainerPlanning}
                        planningLoading={planningLoading}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <PlanningLegend />
    </div>
  );
}

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

const emptyStateStyle = {
  padding: 24,
  textAlign: 'center',
  color: '#6b7280',
  borderBottom: '1px solid #e5e7eb',
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
  boxShadow: '0 3px 8px rgba(0, 0, 0, 0.10)',
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
