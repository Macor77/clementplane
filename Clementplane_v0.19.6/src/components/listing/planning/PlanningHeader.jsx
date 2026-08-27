import {
  isCurrentMonth,
  isTodayInPlanningMonth,
  planningGridStyle,
} from './planningUtils';

export default function PlanningHeader({
  days,
  planningDate,
  monthLabel,
  onPreviousMonth,
  onNextMonth,
  onCurrentMonth,
  planningLoading,
  planningError,
}) {
  return (
    <div style={{ display: 'grid', gap: 8 }}>
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
            minWidth: 118,
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

      <div className="listing-planning-grid" style={planningGridStyle(days.length)}>
        {days.map((day) => {
          const isToday = isTodayInPlanningMonth(
            planningDate,
            day
          );

          return (
            <div
              key={day}
              title={`${day} ${monthLabel}`}
              style={{
                ...dayHeaderStyle,
                ...(isToday ? todayHeaderStyle : {}),
              }}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const monthButtonStyle = {
  border: '1px solid #d1d5db',
  borderRadius: 6,
  background: '#ffffff',
  cursor: 'pointer',
  padding: '4px 7px',
  fontSize: 12,
};

const dayHeaderStyle = {
  width: 14,
  height: 18,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 5,
  fontSize: 8,
  color: '#4b5563',
  boxSizing: 'border-box',
};

const todayHeaderStyle = {
  border: '2px solid #2563eb',
  background: '#dbeafe',
  color: '#1d4ed8',
  fontWeight: 700,
};

const planningMessageStyle = {
  textAlign: 'center',
  fontSize: 11,
  fontWeight: 400,
  color: '#6b7280',
};
