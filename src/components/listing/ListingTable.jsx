import SortHeader from './SortHeader';
import PlanningHeader from './planning/PlanningHeader';
import PlanningLegend from './planning/PlanningLegend';
import PlanningRow from './planning/PlanningRow';
import {
  getDaysInMonth,
  getMonthLabel,
} from './planning/planningUtils';


export default function ListingTable(
  props,
) {
  const {
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
  } = props;


  const days =
    getDaysInMonth(
      planningDate,
    );

  const monthLabel =
    getMonthLabel(
      planningDate,
    );


  return (
    <div className="listing-table-card">

      <table className="listing-table">

        <colgroup>
          <col className="listing-col--trainer" />
          <col className="listing-col--location" />
          <col className="listing-col--status" />
          <col className="listing-col--distance" />
          <col className="listing-col--planning" />
        </colgroup>


        <thead>
          <tr>

            <th>
              <SortHeader
                label="Formateur"
                colKey="nom"
                sort={sort}
                onToggleSort={
                  toggleSort
                }
              />
            </th>

            <th>
              <SortHeader
                label="Localisation"
                colKey="ville"
                sort={sort}
                onToggleSort={
                  toggleSort
                }
              />
            </th>

            <th>
              <SortHeader
                label="Statut"
                colKey="statut"
                sort={sort}
                onToggleSort={
                  toggleSort
                }
              />
            </th>

            <th>
              <SortHeader
                label="Distance"
                colKey="distance"
                sort={sort}
                onToggleSort={
                  toggleSort
                }
              />
            </th>

            <th className="listing-table__planning-head">
              <PlanningHeader
                days={days}
                planningDate={
                  planningDate
                }
                monthLabel={
                  monthLabel
                }
                onPreviousMonth={
                  onPreviousMonth
                }
                onNextMonth={
                  onNextMonth
                }
                onCurrentMonth={
                  onCurrentMonth
                }
                planningLoading={
                  planningLoading
                }
                planningError={
                  planningError
                }
              />
            </th>

          </tr>
        </thead>


        <tbody>

          {filteredFormateurs.length ===
          0 ? (
            <tr>
              <td
                colSpan={5}
                className="listing-table__empty"
              >
                Aucun formateur ne correspond aux critères sélectionnés.
              </td>
            </tr>
          ) : (
            filteredFormateurs.map(
              (formateur) => {

                const distance =
                  distances.get(
                    formateur,
                  );

                const fullName =
                  [
                    formateur.prenom,
                    formateur.nom,
                  ]
                    .filter(Boolean)
                    .join(' ');

                const localisation =
                  [
                    formateur.ville,
                    formateur.codePostal,
                  ]
                    .filter(Boolean)
                    .join(' · ');

                const trainerPlanning =
                  planningAvailability[
                    formateur.id
                  ] || {};

                const competences =
                  renderList(
                    formateur.competences,
                  );

                const materiel =
                  renderList(
                    formateur.materiel,
                  );


                return (
                  <tr
                    key={
                      formateur.id
                    }
                  >

                    <td>
                      <div className="trainer-cell">

                        <button
                          type="button"
                          className="trainer-cell__name"
                          onClick={() =>
                            navigate(
                              `/formateur/view/${formateur.id}`,
                            )
                          }
                        >
                          {fullName ||
                            '—'}
                        </button>


                        {competences ? (
                          <span className="trainer-cell__skills">
                            {competences}
                          </span>
                        ) : null}


                        {materiel ? (
                          <span className="trainer-cell__equipment">
                            Matériel :{' '}
                            {materiel}
                          </span>
                        ) : null}


                        <div className="trainer-cell__actions">

                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                `/formateur/view/${formateur.id}`,
                              )
                            }
                          >
                            Voir
                          </button>


                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                `/formateur/edit/${formateur.id}`,
                              )
                            }
                          >
                            Modifier
                          </button>


                          <button
                            type="button"
                            className="danger"
                            onClick={() =>
                              handleDelete(
                                formateur.id,
                              )
                            }
                          >
                            Retirer
                          </button>

                        </div>

                      </div>
                    </td>


                    <td className="listing-table__muted">
                      {localisation ||
                        '—'}
                    </td>


                    <td>
                      <span
                        className={`listing-status listing-status--${String(
                          formateur.statut ||
                            '',
                        ).toLowerCase()}`}
                      >
                        {formateur.statut ||
                          '—'}
                      </span>
                    </td>


                    <td className="listing-table__distance">
                      {typeof distance ===
                      'number'
                        ? `${distance.toFixed(
                            1,
                          )} km`
                        : distance ||
                          '—'}
                    </td>


                    <td className="listing-table__planning-cell">
                      <PlanningRow
                        days={days}
                        planningDate={
                          planningDate
                        }
                        monthLabel={
                          monthLabel
                        }
                        fullName={
                          fullName
                        }
                        trainerPlanning={
                          trainerPlanning
                        }
                        planningLoading={
                          planningLoading
                        }
                      />
                    </td>

                  </tr>
                );
              },
            )
          )}

        </tbody>

      </table>


      <PlanningLegend />

    </div>
  );
}
