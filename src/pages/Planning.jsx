import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { getMissions } from '../services/missionsService';

const WEEK_DAYS = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'];
const MAX_VISIBLE_MISSIONS = 1;

export default function Planning() {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDayKey, setSelectedDayKey] = useState(formatDateKey(new Date()));

  const loadMissions = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      setMissions(await getMissions());
    } catch (loadError) {
      console.error('Erreur chargement planning :', loadError);
      setError(loadError?.message || 'Impossible de charger le planning.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMissions();
  }, [loadMissions]);

  const calendarDays = useMemo(
    () => buildCalendarDays(currentMonth),
    [currentMonth],
  );

  const activeMissions = useMemo(
    () => missions.filter((mission) => mission.statut !== 'annulee'),
    [missions],
  );

  const missionOccurrences = useMemo(
    () => createMissionOccurrences(activeMissions),
    [activeMissions],
  );

  const occurrencesByDay = useMemo(() => {
    const grouped = new Map();

    for (const occurrence of missionOccurrences) {
      if (!grouped.has(occurrence.date)) {
        grouped.set(occurrence.date, []);
      }

      grouped.get(occurrence.date).push(occurrence);
    }

    for (const dayOccurrences of grouped.values()) {
      dayOccurrences.sort(compareOccurrences);
    }

    return grouped;
  }, [missionOccurrences]);

  const monthOccurrences = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    return missionOccurrences.filter((occurrence) => {
      const date = parseLocalDate(occurrence.date);
      return date.getFullYear() === year && date.getMonth() === month;
    });
  }, [currentMonth, missionOccurrences]);

  const selectedDayOccurrences = occurrencesByDay.get(selectedDayKey) || [];
  const monthSummary = summarizeMonth(monthOccurrences);

  const changeMonth = (offset) => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1),
    );
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(startOfMonth(today));
    setSelectedDayKey(formatDateKey(today));
  };

  return (
    <div className="planning-page">
      {error && <div className="alert alert--error">{error}</div>}

      <div className="planning-layout">
        <section className="calendar-card" aria-busy={loading}>
          <div className="calendar-weekdays">
            {WEEK_DAYS.map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          <div className="calendar-grid">
            {calendarDays.map((day) => {
              const dayKey = formatDateKey(day);
              const dayOccurrences = occurrencesByDay.get(dayKey) || [];
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
              const isToday = dayKey === formatDateKey(new Date());
              const isSelected = dayKey === selectedDayKey;

              return (
                <div
                  key={dayKey}
                  className={[
                    'calendar-day',
                    !isCurrentMonth ? 'calendar-day--outside' : '',
                    isToday ? 'calendar-day--today' : '',
                    isSelected ? 'calendar-day--selected' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => setSelectedDayKey(dayKey)}
                >
                  <div className="calendar-day__number">{day.getDate()}</div>

                  {dayOccurrences.length > 1 && (
                    <span
                      className="calendar-day__mission-count"
                      aria-label={`${dayOccurrences.length} missions ce jour`}
                      title={`${dayOccurrences.length} missions ce jour`}
                    >
                      {dayOccurrences.length}
                    </span>
                  )}

                  <div className="calendar-day__missions">
                    {dayOccurrences.slice(0, MAX_VISIBLE_MISSIONS).map((occurrence) => (
                      <MissionCard
                        key={`${occurrence.mission.id}-${occurrence.dateRow.id || occurrence.date}`}
                        occurrence={occurrence}
                        compact
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate(`/missions/${occurrence.mission.id}`);
                        }}
                      />
                    ))}
                  </div>

                </div>
              );
            })}
          </div>

          {loading && <div className="calendar-loading">Chargement des missions…</div>}

          <div className="calendar-legend">
            <LegendItem tone="complete" label="Affectée" />
            <LegendItem tone="blocking" label="À affecter" />
          </div>
        </section>

        <aside className="planning-sidebar-panel">
          <div className="planning-sidebar-header">
            <h1>Planning des missions</h1>

            <div className="planning-header__actions">
              <div className="planning-month-switcher" aria-label="Navigation entre les mois">
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => changeMonth(-1)}
                  aria-label="Mois précédent"
                >
                  ‹
                </button>
                <strong className="planning-month-label">
                  {formatMonthLabel(currentMonth)}
                </strong>
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => changeMonth(1)}
                  aria-label="Mois suivant"
                >
                  ›
                </button>
              </div>
              <button type="button" className="button button--soft" onClick={goToToday}>
                Aujourd’hui
              </button>
            </div>
          </div>

          <section className="panel-card">
            <h2>Synthèse du mois</h2>
            <p className="section-subtitle" style={{ marginTop: -4, marginBottom: 10 }}>
              Seules les missions ayant au moins une date dans le mois affiché sont comptées.
            </p>
            <SummaryRow value={monthSummary.total} label="Missions ce mois" tone="blue" />
            <SummaryRow value={monthSummary.assigned} label="Affectées" tone="green" />
            <SummaryRow value={monthSummary.unassigned} label="À affecter" tone="orange" />
          </section>

          <section className="panel-card">
            <div className="panel-card__heading">
              <div>
                <p className="panel-card__eyebrow">Journée sélectionnée</p>
                <h2>{formatSelectedDay(selectedDayKey)}</h2>
              </div>
              <span className="count-badge">{selectedDayOccurrences.length}</span>
            </div>

            {selectedDayOccurrences.length === 0 ? (
              <p className="empty-text">Aucune mission ce jour.</p>
            ) : (
              <div className="selected-day-list">
                {selectedDayOccurrences.map((occurrence) => (
                  <MissionCard
                    key={`detail-${occurrence.mission.id}-${occurrence.dateRow.id || occurrence.date}`}
                    occurrence={occurrence}
                    onClick={() => navigate(`/missions/${occurrence.mission.id}`)}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="panel-card">
            <h2>Actions rapides</h2>
            <div className="quick-actions">
              <Link className="button button--primary" to="/missions/new">
                + Nouvelle mission
              </Link>
              <Link className="button" to="/missions">
                Toutes les missions
              </Link>
              <Link className="button" to="/listing">
                Formateurs
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function MissionCard({ occurrence, compact = false, onClick }) {
  const { mission, dateRow } = occurrence;
  const visualState = getMissionVisualState(mission);
  const trainer = getAssignedTrainer(mission);
  const pendingRevalidation = getPendingRevalidationTrainer(mission);

  return (
    <button
      type="button"
      className={`mission-calendar-card mission-calendar-card--${visualState.tone}${compact ? ' mission-calendar-card--compact' : ''}`}
      onClick={onClick}
      title={`${mission.client || 'Client non renseigné'} — ${mission.formation || mission.intitule || 'Formation non renseignée'}`}
    >
      <div className="mission-calendar-card__topline">
        {!compact && (
          <span className="mission-calendar-card__time">{formatTime(dateRow.heure_debut)}</span>
        )}
        <span className="mission-calendar-card__state">
          <span className="mission-calendar-card__dot" aria-hidden="true" />
          {!compact && visualState.label}
        </span>
      </div>
      <span className="mission-calendar-card__training">
        {mission.formation || mission.intitule || 'Formation non renseignée'}
      </span>
      <span className="mission-calendar-card__client">
        {mission.client || 'Client non renseigné'}
      </span>
      <span className="mission-calendar-card__trainer">
        <span aria-hidden="true">{trainer ? '●' : '○'}</span>
        {pendingRevalidation
          ? `${pendingRevalidation.trainer_name || 'Formateur'} · revalidation attendue`
          : trainer
            ? `${trainer.prenom || ''} ${trainer.nom || ''}`.trim()
            : 'Formateur à affecter'}
      </span>
      {!compact && (mission.ville || mission.lieu) && (
        <span className="mission-calendar-card__location">
          {mission.ville || mission.lieu}
        </span>
      )}
    </button>
  );
}

function LegendItem({ tone, label }) {
  return (
    <span className="legend-item">
      <span className={`legend-dot legend-dot--${tone}`} />
      {label}
    </span>
  );
}

function SummaryRow({ value, label, tone }) {
  return (
    <div className="summary-row">
      <strong className={`summary-row__value summary-row__value--${tone}`}>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function createMissionOccurrences(missions) {
  return missions.flatMap((mission) =>
    (mission.mission_dates || []).map((dateRow) => ({
      mission,
      dateRow,
      date: dateRow.date,
    })),
  );
}

function compareOccurrences(left, right) {
  return String(left.dateRow.heure_debut || '').localeCompare(
    String(right.dateRow.heure_debut || ''),
  );
}

function getPendingRevalidationTrainer(mission) {
  const pending = (mission.pending_change?.trainer_responses || []).find(
    (item) =>
      item.response_status === 'pending' &&
      item.previous_status === 'affecte',
  );

  return pending || null;
}

function getAssignedTrainer(mission) {
  // Une affectation antérieure n'est plus considérée comme confirmée
  // tant que le formateur n'a pas revalidé les nouvelles conditions.
  if (getPendingRevalidationTrainer(mission)) {
    return null;
  }

  const relation = (mission.mission_formateurs || []).find(
    (item) => item.statut === 'affecte',
  );

  return relation?.trainer || null;
}

function getMissionVisualState(mission) {
  if (mission.pending_change) {
    return { tone: 'blocking', label: 'À affecter' };
  }

  const trainer = getAssignedTrainer(mission);

  return trainer
    ? { tone: 'complete', label: 'Affectée' }
    : { tone: 'blocking', label: 'À affecter' };
}

function summarizeMonth(occurrences) {
  const missions = new Map();

  for (const occurrence of occurrences) {
    missions.set(occurrence.mission.id, occurrence.mission);
  }

  const values = [...missions.values()];
  const assigned = values.filter((mission) => Boolean(getAssignedTrainer(mission))).length;

  return {
    total: values.length,
    assigned,
    unassigned: values.length - assigned,
  };
}

function buildCalendarDays(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - mondayOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseLocalDate(value) {
  const [year, month, day] = String(value).split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatMonthLabel(date) {
  return new Intl.DateTimeFormat('fr-FR', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatSelectedDay(dayKey) {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(parseLocalDate(dayKey));
}

function formatTime(value) {
  return value ? String(value).slice(0, 5) : '--:--';
}
