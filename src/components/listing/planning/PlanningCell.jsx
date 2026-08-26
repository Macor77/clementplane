import { useState } from 'react';

import {
  getPlanningCellAppearance,
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
  const [hovered, setHovered] = useState(false);

  const appearance = getPlanningCellAppearance(
    availability?.status,
  );

  const isToday = isTodayInPlanningMonth(
    planningDate,
    day,
  );

  const notes = Array.isArray(availability?.notes)
    ? availability.notes
    : [];

  const trainerNotes = notes.filter(
    (note) => note.source === 'trainer',
  );

  const organizationNotes = notes.filter(
    (note) => note.source === 'organization',
  );

  const hasNotes = notes.length > 0;

  const statusLabel = getStatusLabel(
    availability?.status,
  );

  const showTooltip =
    hovered &&
    !planningLoading &&
    (hasNotes || Boolean(availability?.status));

  return (
    <div
      style={{
        ...cellWrapperStyle,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        aria-label={`${fullName} — ${day} ${monthLabel}`}
        style={{
          ...planningCellStyle,
          background: appearance.background,
          border: `${isToday ? 2 : 1}px solid ${
            isToday ? '#2563eb' : appearance.border
          }`,
          opacity: planningLoading ? 0.55 : 1,
        }}
      >
        <span
          className="listing-planning-cell__day-number"
          aria-hidden="true"
          style={dayNumberStyle}
        >
          {day}
        </span>

        {hasNotes && (
          <span
            aria-hidden="true"
            style={noteIndicatorStyle}
          />
        )}
      </div>

      {showTooltip && (
        <div
          role="tooltip"
          style={tooltipStyle}
        >
          <div style={tooltipHeaderStyle}>
            <strong>{day} {monthLabel}</strong>

            {statusLabel && (
              <span style={tooltipStatusStyle}>
                {statusLabel}
              </span>
            )}
          </div>

          {trainerNotes.length > 0 && (
            <div style={tooltipSectionStyle}>
              <div style={trainerTitleStyle}>
                Note{trainerNotes.length > 1 ? 's' : ''} du formateur
              </div>

              <div style={notesListStyle}>
                {trainerNotes.map((note) => (
                  <div
                    key={note.id}
                    style={noteRowStyle}
                  >
                    <span style={bulletStyle}>•</span>
                    <span>{note.content}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {organizationNotes.length > 0 && (
            <div style={tooltipSectionStyle}>
              <div style={organizationTitleStyle}>
                Note{organizationNotes.length > 1 ? 's' : ''} interne{organizationNotes.length > 1 ? 's' : ''}
              </div>

              <div style={notesListStyle}>
                {organizationNotes.map((note) => (
                  <div
                    key={note.id}
                    style={noteRowStyle}
                  >
                    <span style={bulletStyle}>•</span>
                    <span>{note.content}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


function getStatusLabel(status) {
  switch (status) {
    case 'dispo':
      return 'Disponible';

    case 'indispo':
      return 'Indisponible';

    case 'option':
      return 'Option';

    case 'mission':
      return 'Mission';

    default:
      return '';
  }
}


const cellWrapperStyle = {
  position: 'relative',
  width: 14,
  height: 18,
};


const planningCellStyle = {
  width: 14,
  height: 18,
  borderRadius: 4,
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition:
    'background 120ms ease, border 120ms ease',
  cursor: 'default',
};


const dayNumberStyle = {
  position: 'absolute',
  inset: 0,
  display: 'grid',
  placeItems: 'center',
  color: '#0f172a',
  fontSize: 7,
  lineHeight: 1,
  fontWeight: 800,
  fontVariantNumeric: 'tabular-nums',
  pointerEvents: 'none',
};


const noteIndicatorStyle = {
  position: 'absolute',
  right: 1,
  bottom: 1,
  width: 3,
  height: 3,
  borderRadius: '50%',
  background: '#111827',
  display: 'block',
  pointerEvents: 'none',
  boxShadow:
    '0 0 0 1px rgba(255, 255, 255, 0.65)',
};


const tooltipStyle = {
  position: 'absolute',
  zIndex: 1000,

  left: '50%',
  bottom: 'calc(100% + 8px)',
  transform: 'translateX(-50%)',

  width: 280,
  maxWidth: 'min(280px, 80vw)',

  padding: 12,

  border: '1px solid #dbe4ef',
  borderRadius: 10,

  background: '#ffffff',
  color: '#0f172a',

  boxShadow:
    '0 10px 30px rgba(15, 23, 42, 0.18)',

  fontSize: 11,
  lineHeight: 1.45,

  pointerEvents: 'none',
};


const tooltipHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 10,

  paddingBottom: 8,
  marginBottom: 8,

  borderBottom: '1px solid #e5e7eb',
};


const tooltipStatusStyle = {
  padding: '2px 6px',

  borderRadius: 999,

  background: '#f1f5f9',
  color: '#475569',

  fontSize: 9,
  fontWeight: 700,

  whiteSpace: 'nowrap',
};


const tooltipSectionStyle = {
  display: 'grid',
  gap: 5,
  marginTop: 8,
};


const trainerTitleStyle = {
  color: '#2563eb',
  fontSize: 10,
  fontWeight: 800,
};


const organizationTitleStyle = {
  color: '#92400e',
  fontSize: 10,
  fontWeight: 800,
};


const notesListStyle = {
  display: 'grid',
  gap: 4,
};


const noteRowStyle = {
  display: 'grid',
  gridTemplateColumns: '8px 1fr',
  gap: 3,

  color: '#334155',

  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere',
};


const bulletStyle = {
  fontWeight: 900,
};