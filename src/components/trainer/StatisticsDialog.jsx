import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function StatisticsDialog({ title, onClose, children }) {
  const dialog = useRef(null), close = useRef(null), titleId = useId();
  useEffect(() => {
    const element = dialog.current, opener = document.activeElement, overflow = document.body.style.overflow;
    element.showModal(); close.current.focus({ preventScroll: true }); document.body.style.overflow = 'hidden';
    return () => { element.close(); document.body.style.overflow = overflow; if (opener?.isConnected) opener.focus({ preventScroll: true }); };
  }, []);
  return createPortal(<dialog ref={dialog} className="activity-help-dialog statistics-dialog" aria-labelledby={titleId} onClose={event => { if (!event.currentTarget.open) onClose(); }} onClick={event => {
    if (event.target !== event.currentTarget) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
  }}><div className="activity-help-content"><header className="activity-help-header"><h2 id={titleId}>{title}</h2><button ref={close} type="button" onClick={onClose}>Fermer ×</button></header><div className="activity-help-body" tabIndex={0}>{children}</div></div></dialog>, document.body);
}
