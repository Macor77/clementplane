import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import PlanningFilterMenu from '../components/planning/PlanningFilterMenu';
import PlanningDayModal from '../components/planning/PlanningDayModal';
import { filterOrganizationMissions, getOrganizationDayOccurrences, getOrganizationTrainerOptions } from '../utils/planningFilters';

import { getMissions } from '../services/missionsService';

const WEEK_DAYS = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'];
const MAX_VISIBLE_MISSIONS = 1;

export default function Planning() {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDayKey, setSelectedDayKey] = useState('');
  const [selectedTrainerIds, setSelectedTrainerIds] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);

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

  const trainerOptions = useMemo(
    () => getOrganizationTrainerOptions(activeMissions),
    [activeMissions],
  );

  const filteredMissions = useMemo(
    () => filterOrganizationMissions(activeMissions, { trainerIds: selectedTrainerIds, statuses: selectedStatuses }),
    [activeMissions, selectedTrainerIds, selectedStatuses],
  );

  const missionOccurrences = useMemo(
    () => createMissionOccurrences(filteredMissions),
    [filteredMissions],
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

  const selectedDayOccurrences = useMemo(
    () => getOrganizationDayOccurrences(missionOccurrences, selectedDayKey),
    [missionOccurrences, selectedDayKey],
  );

  const openDay = (dayKey, dayOccurrences) => {
    if (!dayOccurrences.length) return;
    setSelectedDayKey(dayKey);
  };

  const changeMonth = (offset) => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1),
    );
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(startOfMonth(today));
    setSelectedDayKey('');
  };

  return (
    <div className="planning-page">
      {error && <div className="alert alert--error">{error}</div>}

      <div className="planning-main">
        <div className="planning-toolbar">
          <div className="planning-toolbar__navigation">
            <button type="button" className="icon-button" onClick={() => changeMonth(-1)} aria-label="Mois précédent">‹</button>
            <button type="button" className="icon-button" onClick={() => changeMonth(1)} aria-label="Mois suivant">›</button>
            <strong className="planning-month-label">{formatMonthLabel(currentMonth)}</strong>
            <button type="button" className="button button--soft" onClick={goToToday}>Aujourd’hui</button>
          </div>
          <div className="planning-toolbar__filters">
            <PlanningFilterMenu label="Formateurs" options={trainerOptions} selected={selectedTrainerIds} onChange={setSelectedTrainerIds} />
            <PlanningFilterMenu
              label="Statut"
              options={[{ id: 'assigned', label: 'Affectée' }, { id: 'unassigned', label: 'À affecter' }]}
              selected={selectedStatuses}
              onChange={setSelectedStatuses}
            />
            <button
              type="button"
              className="planning-reset"
              disabled={!selectedTrainerIds.length && !selectedStatuses.length}
              onClick={() => { setSelectedTrainerIds([]); setSelectedStatuses([]); }}
            >
              Réinitialiser
            </button>
          </div>
        </div>
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
                  onClick={() => openDay(dayKey, dayOccurrences)}
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
                          openDay(dayKey, dayOccurrences);
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
      </div>

      {selectedDayKey && selectedDayOccurrences.length ? (
        <PlanningDayModal
          title={formatLongDate(selectedDayKey)}
          subtitle={`${selectedDayOccurrences.length} mission${selectedDayOccurrences.length > 1 ? 's' : ''} sur cette journée`}
          onClose={() => setSelectedDayKey('')}
        >
          <div className="planning-day-modal__list">
            {selectedDayOccurrences.map((occurrence) => {
              const { mission, dateRow } = occurrence;
              const visualState = getMissionVisualState(mission);
              const trainer = getAssignedTrainer(mission);
              return (
                <article key={`${mission.id}-${dateRow.id || occurrence.date}`} className={`planning-day-summary planning-day-summary--${visualState.tone}`}>
                  <div className="planning-day-summary__top">
                    <span className={`planning-day-summary__status planning-day-summary__status--${visualState.tone}`}>{visualState.label}</span>
                    {dateRow.heure_debut ? <strong>{formatTime(dateRow.heure_debut)}</strong> : null}
                  </div>
                  <h3>{mission.formation || mission.intitule || 'Formation non renseignée'}</h3>
                  <div className="planning-day-summary__meta">
                    <p><span>Client</span><strong>{mission.client || 'Client non renseigné'}</strong></p>
                    <p><span>Formateur</span><strong>{trainer ? `${trainer.prenom || ''} ${trainer.nom || ''}`.trim() : 'À affecter'}</strong></p>
                    {(mission.ville || mission.lieu) ? <p><span>Lieu</span><strong>{mission.ville || mission.lieu}</strong></p> : null}
                  </div>
                  <button type="button" className="button button--primary planning-day-summary__action" onClick={() => navigate(`/missions/${mission.id}`)}>
                    Voir la mission
                  </button>
                </article>
              );
            })}
          </div>
        </PlanningDayModal>
      ) : null}
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
  const affectedRelation = (mission.mission_formateurs || []).find(
    (item) => item.statut === 'affecte',
  );

  const pending = (mission.pending_change?.trainer_responses || []).find(
    (item) =>
      item.response_status === 'pending' &&
      item.previous_status === 'affecte' &&
      (!affectedRelation ||
        item.trainer_id === affectedRelation.formateur_id),
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
  const trainer = getAssignedTrainer(mission);

  return trainer
    ? { tone: 'complete', label: 'Affectée' }
    : { tone: 'blocking', label: 'À affecter' };
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

function formatLongDate(value) {
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(parseLocalDate(value));
}

function formatMonthLabel(date) {
  return new Intl.DateTimeFormat('fr-FR', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatTime(value) {
  return value ? String(value).slice(0, 5) : '--:--';
}
