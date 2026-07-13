import {
  getNotes,
  getPlanningCellAppearance,
  getPlanningTooltip,
  isTodayInPlanningMonth,
} from './planningUtils';

export default function PlanningCell({
  day,
  planningDate,
  monthLabel,
  fullName,
  availability,
  planningLoading,
}) {
  const appearance = getPlanningCellAppearance(
    availability?.status
  );
  const hasNote = getNotes(availability?.note).length > 0;
  const isToday = isTodayInPlanningMonth(
    planningDate,
    day
  );

  return (
    <div
      title={getPlanningTooltip({
        fullName,
        day,
        monthLabel,
        availability,
      })}
      style={{
        ...planningCellStyle,
        background: appearance.background,
        border: `${isToday ? 2 : 1}px solid ${
          isToday ? '#2563eb' : appearance.border
        }`,
        opacity: planningLoading ? 0.55 : 1,
      }}
    >
      {hasNote && (
        <span
          aria-hidden="true"
          style={noteIndicatorStyle}
        />
      )}
    </div>
  );
}

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
