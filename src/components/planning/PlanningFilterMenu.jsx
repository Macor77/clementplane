import { useEffect, useRef, useState } from 'react';

export default function PlanningFilterMenu({ label, options, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    const close = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const toggle = (id) => {
    onChange(selected.includes(id) ? selected.filter((value) => value !== id) : [...selected, id]);
  };

  return (
    <div className="planning-filter" ref={rootRef}>
      <button
        type="button"
        className={`planning-filter__trigger${selected.length ? ' planning-filter__trigger--active' : ''}`}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        {label}
        {selected.length ? <span className="planning-filter__count">{selected.length}</span> : null}
        <span aria-hidden="true">⌄</span>
      </button>
      {open ? (
        <div className="planning-filter__menu">
          <div className="planning-filter__menu-title">{label}</div>
          {options.map((option) => (
            <label className="planning-filter__option" key={option.id}>
              <input
                type="checkbox"
                checked={selected.includes(option.id)}
                onChange={() => toggle(option.id)}
              />
              <span>{option.label}</span>
            </label>
          ))}
          {options.length === 0 ? <p className="planning-filter__empty">Aucun choix disponible.</p> : null}
        </div>
      ) : null}
    </div>
  );
}
