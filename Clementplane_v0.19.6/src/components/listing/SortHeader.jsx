export default function SortHeader({ label, colKey, sort, onToggleSort }) {
  const active = sort.key === colKey;
  const arrow = !active ? '↕' : sort.dir === 'asc' ? '▲' : '▼';

  return (
    <button
      type="button"
      onClick={() => onToggleSort(colKey)}
      style={{ background: 'none', border: 'none', cursor: 'pointer' }}
      title={`Trier par ${label.toLowerCase()}`}
    >
      {label} {arrow}
    </button>
  );
}