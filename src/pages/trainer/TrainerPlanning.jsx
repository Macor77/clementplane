import {
  useEffect,
  useMemo,
  useState,
} from 'react';

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
  ] = useState(
    () => toISODate(
      new Date(),
    ),
  );


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


  const itemsByDay =
    useMemo(() => {
      const map = {};

      for (
        const item of
        planningItems
      ) {
        if (!map[item.date]) {
          map[item.date] = [];
        }

        map[item.date].push(
          item,
        );
      }

      return map;
    }, [planningItems]);


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
    itemsByDay[
      selectedDay
    ] || [];


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

    setSelectedDay(
      toISODate(
        today,
      ),
    );
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
            >
              ‹
            </button>


            <div className="trainer-planning-month">
              {monthLabel}
            </div>


            <button
              type="button"
              className="icon-button"
              onClick={() =>
                changeMonth(1)
              }
            >
              ›
            </button>


            <button
              type="button"
              className="button button--soft"
              onClick={
                goToday
              }
            >
              Aujourd’hui
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
                        onClick={() =>
                          setSelectedDay(
                            iso,
                          )
                        }
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


        <aside className="trainer-planning-sidebar">

          <div className="panel-card trainer-planning-selected">

            <p className="page-eyebrow">
              JOURNÉE
            </p>

            <h2>
              {formatLongDate(
                selectedDay,
              )}
            </h2>


            {selectedItems.length ===
            0 ? (
              <p className="trainer-planning-empty">
                Aucun engagement sur
                cette journée.
              </p>
            ) : (
              <div className="trainer-planning-selected__list">

                {selectedItems.map(
                  (item) => (
                    <article
                      className={`trainer-planning-detail-card trainer-planning-detail-card--${
                        item.status ===
                        'affecte'
                          ? 'mission'
                          : 'option'
                      }`}
                      key={item.id}
                    >

                      <span className="trainer-planning-detail-card__status">
                        {getStatusLabel(
                          item.status,
                        )}
                      </span>


                      <h3>
                        {
                          item.formation ||
                          item.title
                        }
                      </h3>


                      {item.client ? (
                        <div>
                          <span>
                            Client
                          </span>

                          <strong>
                            {
                              item.client
                            }
                          </strong>
                        </div>
                      ) : null}


                      {item.location ? (
                        <div>
                          <span>
                            Lieu
                          </span>

                          <strong>
                            {
                              item.location
                            }
                          </strong>
                        </div>
                      ) : null}


                      {item.startTime ||
                      item.endTime ? (
                        <div>
                          <span>
                            Horaires
                          </span>

                          <strong>
                            {[
                              formatTime(
                                item.startTime,
                              ),

                              formatTime(
                                item.endTime,
                              ),
                            ]
                              .filter(
                                Boolean,
                              )
                              .join(
                                ' – ',
                              )}
                          </strong>
                        </div>
                      ) : null}


                      {item.offeredFee !=
                      null ? (
                        <div>
                          <span>
                            Rémunération
                          </span>

                          <strong>
                            {
                              item.offeredFee
                            }{' '}
                            €
                          </strong>
                        </div>
                      ) : null}


                      {item.notes ? (
                        <div className="trainer-planning-detail-card__notes">

                          <span>
                            Informations
                          </span>

                          <strong>
                            {
                              item.notes
                            }
                          </strong>

                        </div>
                      ) : null}

                    </article>
                  ),
                )}

              </div>
            )}

          </div>


          <div className="trainer-planning-legend">

            <div>
              <span className="trainer-planning-dot trainer-planning-dot--option" />

              <span>
                Option : proposition
                acceptée, en attente de
                confirmation.
              </span>
            </div>

            <div>
              <span className="trainer-planning-dot trainer-planning-dot--mission" />

              <span>
                Mission confirmée :
                vous êtes affecté à la
                mission.
              </span>
            </div>

          </div>

        </aside>


      </div>

    </div>
  );
}