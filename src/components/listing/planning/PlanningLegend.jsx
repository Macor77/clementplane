import { getPlanningCellAppearance } from './planningUtils';

const statuses = ['dispo', 'indispo', 'mission', ''];

export default function PlanningLegend() {
  const items = statuses.map((status) =>
    getPlanningCellAppearance(status)
  );

  return (
    <div style={legendStyle}>
      <strong>Légende :</strong>

      {items.map((item) => (
        <div key={item.label} style={legendItemStyle}>
          <span
            style={{
              width: 16,
              height: 16,
              borderRadius: 4,
              background: item.background,
              border: `1px solid ${item.border}`,
              boxSizing: 'border-box',
            }}
          />

          <span>{item.label}</span>
        </div>
      ))}

      <div style={legendItemStyle}>
        <span style={noteIndicatorStyle} />
        <span>Note présente</span>
      </div>
    </div>
  );
}

const legendStyle = {
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 16,
  marginTop: 12,
  padding: '10px 12px',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  background: '#ffffff',
  fontSize: 12,
};

const legendItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};

const noteIndicatorStyle = {
  width: 7,
  height: 7,
  borderRadius: '50%',
  background: '#111827',
  display: 'inline-block',
};
