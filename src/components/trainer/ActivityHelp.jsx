import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/** Native modal dialog keeps the form inert and contains keyboard focus. */
export default function ActivityHelp({ title, children }) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const trigger = useRef(null);
  const dialog = useRef(null);
  const close = useRef(null);

  useEffect(() => {
    if (!open) return;
    const modal = dialog.current;
    const opener = trigger.current;
    const previousOverflow = document.body.style.overflow;
    modal.showModal();
    close.current.focus({ preventScroll: true });
    document.body.style.overflow = 'hidden';
    return () => {
      modal.close();
      document.body.style.overflow = previousOverflow;
      if (opener?.isConnected && !opener.disabled) opener.focus({ preventScroll: true });
    };
  }, [open]);

  function closeOnBackdrop(event) {
    if (event.target !== event.currentTarget) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) setOpen(false);
  }

  return <>
    <button ref={trigger} type="button" className="activity-help-button" aria-label={`Aide : ${title}`} aria-haspopup="dialog" onClick={() => setOpen(true)}>
      <span aria-hidden="true">?</span>
    </button>
    {open && createPortal(<dialog ref={dialog} className="activity-help-dialog" aria-labelledby={titleId} onClose={() => setOpen(false)} onClick={closeOnBackdrop}>
      <div className="activity-help-content">
        <header className="activity-help-header">
          <h2 id={titleId}>{title}</h2>
          <button ref={close} type="button" onClick={() => setOpen(false)}>Fermer <span aria-hidden="true">×</span></button>
        </header>
        <div className="activity-help-body" tabIndex={0}>{children}</div>
      </div>
    </dialog>, document.body)}
  </>;
}
