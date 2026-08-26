import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import { Link } from 'react-router-dom';

import PlanningFilterMenu from '../../components/planning/PlanningFilterMenu';
import PlanningDayModal from '../../components/planning/PlanningDayModal';
import { filterTrainerPlanningItems, getTrainerDayItems, getTrainerOrganizationOptions } from '../../utils/planningFilters';

import {
  getMyMissionProposals,
} from '../../services/trainerProposalService';


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


function getMonthMatrix(refDate) {
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


function sameDay(
  first,
  second,
) {
  return (
    first.getFullYear() ===
      second.getFullYear() &&
    first.getMonth() ===
      second.getMonth() &&
    first.getDate() ===
      second.getDate()
  );
}


function formatTime(value) {
  if (!value) {
    return '';
  }

  return value.slice(0, 5);
}


function formatLongDate(
  isoDate,
) {
  if (!isoDate) {
    return '';
  }

  return new Intl.DateTimeFormat(
    'fr-FR',
    {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    },
  ).format(
    new Date(
      `${isoDate}T12:00:00`,
    ),
  );
}


function getStatusLabel(status) {
  if (status === 'affecte') {
    return 'Mission confirmée';
  }

  return 'Option';
}


function getPlanningItems(
  proposals,
) {
  const items = [];

  for (
    const proposal of proposals
  ) {
    if (
      proposal.status !==
        'accepte' &&
      proposal.status !==
        'affecte'
    ) {
      continue;
    }

    const dates =
      Array.isArray(
        proposal.dates,
      )
        ? proposal.dates
        : [];

    for (
      const missionDate of dates
    ) {
      if (!missionDate?.date) {
        continue;
      }

      items.push({
        id: `${proposal.mission_formateur_id}-${missionDate.date}`,

        missionFormateurId:
          proposal.mission_formateur_id,

        missionId:
          proposal.mission_id,

        status:
          proposal.status,

        title:
          proposal.mission_title ||
          proposal.formation ||
          'Mission de formation',

        formation:
          proposal.formation ||
          '',

        client:
          proposal.client ||
          '',

        organizationId:
          proposal.organization_id ||
          null,

        organizationName:
          proposal.organization_name ||
          '',

        location:
          [
            proposal.location,
            proposal.postal_code,
            proposal.city,
          ]
            .filter(Boolean)
            .join(' '),

        offeredFee:
          proposal.offered_fee,

        notes:
          proposal.mission_notes ||
          '',

        date:
          missionDate.date,

        startTime:
          missionDate.heure_debut ||
          '',

        endTime:
          missionDate.heure_fin ||
          '',
      });
    }
  }

  return items.sort(
    (first, second) => {
      const firstKey =
        `${first.date} ${first.startTime || ''}`;

      const secondKey =
        `${second.date} ${second.startTime || ''}`;

      return firstKey.localeCompare(
        secondKey,
      );
    },
  );
}


export default function TrainerPlanning() {
  const [
    refDate,
    setRefDate,
  ] = useState(
    () => new Date(),
  );

  const [
    proposals,
    setProposals,
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
    selectedDay,
    setSelectedDay,
  ] = useState('');

  const [selectedOrganizationIds, setSelectedOrganizationIds] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);


  useEffect(() => {
    let active = true;

    async function loadPlanning() {
      setLoading(true);
      setError('');

      try {
        const rows =
          await getMyMissionProposals();

        if (active) {
          setProposals(
            rows,
          );
        }
      } catch (loadError) {
        console.error(
          loadError,
        );

        if (active) {
          setError(
            'Impossible de charger votre planning.',
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadPlanning();

    return () => {
      active = false;
    };
  }, []);


  const planningItems =
    useMemo(
      () =>
        getPlanningItems(
          proposals,
        ),
      [proposals],
    );


  const organizationOptions = useMemo(
    () => getTrainerOrganizationOptions(planningItems),
    [planningItems],
  );

  const filteredPlanningItems = useMemo(
    () => filterTrainerPlanningItems(planningItems, { organizationIds: selectedOrganizationIds, statuses: selectedStatuses }),
    [planningItems, selectedOrganizationIds, selectedStatuses],
  );


  const itemsByDay =
    useMemo(() => {
      const map = {};

      for (
        const item of
        filteredPlanningItems
      ) {
        if (!map[item.date]) {
          map[item.date] = [];
        }

        map[item.date].push(
          item,
        );
      }

      return map;
    }, [filteredPlanningItems]);


  const monthMatrix =
    useMemo(
      () =>
        getMonthMatrix(
          refDate,
        ),
      [refDate],
    );


  const monthLabel =
    useMemo(
      () =>
        refDate.toLocaleDateString(
          'fr-FR',
          {
            month: 'long',
            year: 'numeric',
          },
        ),
      [refDate],
    );


  const selectedItems =
    useMemo(
      () => getTrainerDayItems(filteredPlanningItems, selectedDay),
      [filteredPlanningItems, selectedDay],
    );


  const monthItems =
    useMemo(
      () =>
        planningItems.filter(
          (item) => {
            const date =
              new Date(
                `${item.date}T12:00:00`,
              );

            return (
              date.getFullYear() ===
                refDate.getFullYear() &&
              date.getMonth() ===
                refDate.getMonth()
            );
          },
        ),
      [
        planningItems,
        refDate,
      ],
    );


  const optionCount =
    monthItems.filter(
      (item) =>
        item.status ===
        'accepte',
    ).length;


  const missionCount =
    monthItems.filter(
      (item) =>
        item.status ===
        'affecte',
    ).length;


  const changeMonth =
    (offset) => {
      setRefDate(
        (current) =>
          new Date(
            current.getFullYear(),
            current.getMonth() +
              offset,
            1,
          ),
      );
    };


  const goToday = () => {
    const today =
      new Date();

    setRefDate(
      new Date(
        today.getFullYear(),
        today.getMonth(),
        1,
      ),
    );

    setSelectedDay('');
  };


  const weekdays = [
    'Lun',
    'Mar',
    'Mer',
    'Jeu',
    'Ven',
    'Sam',
    'Dim',
  ];

  const today =
    new Date();


  return (
    <div className="page-container trainer-planning-page">

      <div className="page-heading trainer-planning-heading">

        <div>
          <p className="page-eyebrow">
            PLANNING
          </p>

          <h1>
            Mon planning
          </h1>

          <p>
            Retrouvez vos options et
            missions confirmées.
          </p>
        </div>

      </div>


      {error ? (
        <div className="alert alert--error">
          {error}
        </div>
      ) : null}


      <div className="trainer-planning-summary">

        <div className="trainer-planning-summary__item">

          <span className="trainer-planning-dot trainer-planning-dot--option" />

          <strong>
            {optionCount}
          </strong>

          <span>
            option
            {optionCount > 1
              ? 's'
              : ''}
            {' '}ce mois
          </span>

        </div>


        <div className="trainer-planning-summary__item">

          <span className="trainer-planning-dot trainer-planning-dot--mission" />

          <strong>
            {missionCount}
          </strong>

          <span>
            mission
            {missionCount > 1
              ? 's'
              : ''}
            {' '}confirmée
            {missionCount > 1
              ? 's'
              : ''}
            {' '}ce mois
          </span>

        </div>

      </div>


      <div className="trainer-planning-layout">


        <div className="calendar-card trainer-planning-calendar">

          <div className="trainer-planning-toolbar">

            <button
              type="button"
              className="icon-button"
              onClick={() =>
                changeMonth(-1)
              }
              aria-label="Mois précédent"
            >
              ‹
            </button>


            <button
              type="button"
              className="icon-button"
              onClick={() =>
                changeMonth(1)
              }
              aria-label="Mois suivant"
            >
              ›
            </button>


            <div className="trainer-planning-month">
              {monthLabel}
            </div>


            <button
              type="button"
              className="button button--soft"
              onClick={
                goToday
              }
            >
              Aujourd’hui
            </button>

            <div className="trainer-planning-toolbar__spacer" />

            <PlanningFilterMenu
              label="Organismes"
              options={organizationOptions}
              selected={selectedOrganizationIds}
              onChange={setSelectedOrganizationIds}
            />

            <PlanningFilterMenu
              label="Statut"
              options={[{ id: 'affecte', label: 'Mission confirmée' }, { id: 'accepte', label: 'Option' }]}
              selected={selectedStatuses}
              onChange={setSelectedStatuses}
            />

            <button
              type="button"
              className="planning-reset"
              disabled={!selectedOrganizationIds.length && !selectedStatuses.length}
              onClick={() => { setSelectedOrganizationIds([]); setSelectedStatuses([]); }}
            >
              Réinitialiser
            </button>

          </div>


          <div className="trainer-planning-weekdays">

            {weekdays.map(
              (weekday) => (
                <div key={weekday}>
                  {weekday}
                </div>
              ),
            )}

          </div>


          {loading ? (
            <div className="trainer-planning-loading">
              Chargement du planning…
            </div>
          ) : (
            <div className="trainer-planning-grid">

              {monthMatrix
                .flat()
                .map(
                  (date) => {

                    const iso =
                      toISODate(
                        date,
                      );

                    const dayItems =
                      itemsByDay[
                        iso
                      ] || [];

                    const inMonth =
                      date.getMonth() ===
                      refDate.getMonth();

                    const selected =
                      selectedDay ===
                      iso;

                    const classes = [
                      'trainer-planning-day',

                      !inMonth
                        ? 'trainer-planning-day--outside'
                        : '',

                      sameDay(
                        date,
                        today,
                      )
                        ? 'trainer-planning-day--today'
                        : '',

                      selected
                        ? 'trainer-planning-day--selected'
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' ');


                    return (
                      <button
                        type="button"
                        key={iso}
                        className={
                          classes
                        }
                        onClick={() => {
                          if (dayItems.length) setSelectedDay(iso);
                        }}
                      >

                        <span className="trainer-planning-day__number">
                          {date.getDate()}
                        </span>


                        <div className="trainer-planning-day__items">

                          {dayItems
                            .slice(
                              0,
                              2,
                            )
                            .map(
                              (item) => (
                                <div
                                  key={
                                    item.id
                                  }
                                  className={`trainer-planning-mini trainer-planning-mini--${
                                    item.status ===
                                    'affecte'
                                      ? 'mission'
                                      : 'option'
                                  }`}
                                >

                                  <span>
                                    {item.startTime
                                      ? formatTime(
                                          item.startTime,
                                        )
                                      : ''}
                                  </span>

                                  <strong>
                                    {
                                      item.formation ||
                                      item.title
                                    }
                                  </strong>

                                  {item.organizationName ? (
                                    <span style={{ fontSize: 8, opacity: .8 }}>
                                      {item.organizationName}
                                    </span>
                                  ) : null}

                                </div>
                              ),
                            )}


                          {dayItems.length >
                          2 ? (
                            <div className="trainer-planning-day__more">
                              +
                              {dayItems.length -
                                2}{' '}
                              autre
                              {dayItems.length -
                                2 >
                              1
                                ? 's'
                                : ''}
                            </div>
                          ) : null}

                        </div>

                      </button>
                    );
                  },
                )}

            </div>
          )}

        </div>


        {selectedDay && selectedItems.length ? (
          <PlanningDayModal
            title={formatLongDate(selectedDay)}
            subtitle={`${selectedItems.length} engagement${selectedItems.length > 1 ? 's' : ''} sur cette journée`}
            onClose={() => setSelectedDay('')}
          >
            <div className="planning-day-modal__list">
              {selectedItems.map((item) => (
                <article
                  className={`planning-day-summary planning-day-summary--${item.status === 'affecte' ? 'mission' : 'option'}`}
                  key={item.id}
                >
                  <div className="planning-day-summary__top">
                    <span className={`planning-day-summary__status planning-day-summary__status--${item.status === 'affecte' ? 'mission' : 'option'}`}>
                      {getStatusLabel(item.status)}
                    </span>
                    {item.startTime ? <strong>{formatTime(item.startTime)}</strong> : null}
                  </div>
                  <h3>{item.formation || item.title}</h3>
                  <div className="planning-day-summary__meta">
                    {item.organizationName ? <p><span>Organisme</span><strong>{item.organizationName}</strong></p> : null}
                    {item.client ? <p><span>Client</span><strong>{item.client}</strong></p> : null}
                    {item.location ? <p><span>Lieu</span><strong>{item.location}</strong></p> : null}
                    {(item.startTime || item.endTime) ? (
                      <p><span>Horaires</span><strong>{[formatTime(item.startTime), formatTime(item.endTime)].filter(Boolean).join(' – ')}</strong></p>
                    ) : null}
                  </div>
                  <Link
                    to={`/formateur/missions/${item.missionId}`}
                    className="button button--primary planning-day-summary__action"
                  >
                    Voir la mission
                  </Link>
                </article>
              ))}
            </div>
          </PlanningDayModal>
        ) : null}


      </div>

    </div>
  );
}