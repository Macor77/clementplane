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
    handleInvite,
    inviteBusyId,
    invitationHistoryByTrainer,
    isInvitationCoolingDown,
    formatInvitationRelativeLabel,
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

                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            width: 'fit-content',
                            marginTop: 3,
                            gap: 5,
                            fontSize: 11,
                            fontWeight: 700,
                            color: formateur.claimed ? '#15803d' : '#b45309',
                          }}
                        >
                          <span
                            aria-hidden="true"
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: '50%',
                              background: formateur.claimed ? '#22c55e' : '#f59e0b',
                              flex: '0 0 auto',
                            }}
                          />
                          {formateur.claimed ? 'Revendiqué' : 'Non revendiqué'}
                        </span>


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


                          {!formateur.claimed && formateur.email ? (
                            isInvitationCoolingDown?.(
                              invitationHistoryByTrainer?.[formateur.id],
                            ) ? (
                              <button
                                type="button"
                                disabled
                                title={
                                  invitationHistoryByTrainer?.[formateur.id]?.sent_at
                                    ? `Dernière invitation envoyée le ${new Date(
                                        invitationHistoryByTrainer[formateur.id].sent_at,
                                      ).toLocaleString('fr-FR')}. Une nouvelle invitation depuis le listing sera possible après 72 h. Vous pouvez toujours renvoyer une invitation depuis la fiche du formateur.`
                                    : ''
                                }
                                style={{
                                  opacity: 0.58,
                                  cursor: 'not-allowed',
                                }}
                              >
                                {formatInvitationRelativeLabel?.(
                                  invitationHistoryByTrainer?.[formateur.id],
                                ) || 'Invitation récente'}
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={inviteBusyId === formateur.id}
                                onClick={() => handleInvite(formateur)}
                              >
                                {inviteBusyId === formateur.id
                                  ? 'Envoi…'
                                  : 'Inviter'}
                              </button>
                            )
                          ) : null}

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
