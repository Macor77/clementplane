import { useEffect } from 'react';

export default function PlanningDayModal({ title, subtitle, onClose, children }) {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="planning-day-modal" role="presentation" onMouseDown={onClose}>
      <section
        className="planning-day-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="planning-day-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="planning-day-modal__header">
          <div>
            <p className="page-eyebrow">JOURNÉE</p>
            <h2 id="planning-day-modal-title">{title}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <button type="button" className="planning-day-modal__close" onClick={onClose} aria-label="Fermer">
            ×
          </button>
        </header>
        <div className="planning-day-modal__body">{children}</div>
      </section>
    </div>
  );
}
