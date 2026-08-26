import EmailCopyToSenderOption from './EmailCopyToSenderOption';

export default function TrainerInvitationModal({
  open,
  trainerName,
  trainerEmail,
  sending = false,
  recentInvitation = null,
  copyToSender = false,
  onCopyToSenderChange,
  onCancel,
  onConfirm,
}) {
  if (!open) return null;

  return (
    <div
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !sending) onCancel?.();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        background: 'rgba(15, 39, 71, 0.42)',
        backdropFilter: 'blur(2px)',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="trainer-invitation-title"
        style={{
          width: 'min(520px, 100%)',
          background: '#ffffff',
          border: '1px solid #dbe3ef',
          borderRadius: 18,
          boxShadow: '0 24px 70px rgba(15, 39, 71, 0.22)',
          padding: 28,
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '1.4px',
            textTransform: 'uppercase',
            color: '#2563eb',
            marginBottom: 10,
          }}
        >
          Invitation formateur
        </div>

        <h2
          id="trainer-invitation-title"
          style={{ margin: '0 0 14px', fontSize: 23, lineHeight: 1.3, color: '#0f2747' }}
        >
          Inviter {trainerName || 'ce formateur'} à rejoindre Clementplane ?
        </h2>

        <p style={{ margin: '0 0 12px', color: '#5b6b82', lineHeight: 1.6, fontSize: 15 }}>
          Vous pouvez continuer à gérer vous-même ses disponibilités, ses missions et ses informations.
        </p>

        <p style={{ margin: '0 0 12px', color: '#334155', lineHeight: 1.6, fontSize: 15 }}>
          <strong>En l’invitant, votre formateur pourra renseigner et mettre à jour lui-même ses disponibilités.</strong>{' '}
          Vous disposez ainsi d’un planning plus fiable et à jour, sans avoir à le solliciter régulièrement.
        </p>

        <p style={{ margin: 0, color: '#7b8798', lineHeight: 1.55, fontSize: 13 }}>
          L’invitation reste entièrement à votre choix{trainerEmail ? ` et sera envoyée à ${trainerEmail}.` : '.'}
        </p>

        {recentInvitation?.sent_at ? (
          <div
            style={{
              marginTop: 16,
              padding: '11px 12px',
              borderRadius: 10,
              background: '#fff7ed',
              border: '1px solid #fed7aa',
              color: '#9a3412',
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            Une invitation a déjà été envoyée récemment, le{' '}
            <strong>
              {new Date(recentInvitation.sent_at).toLocaleString('fr-FR')}
            </strong>.
            {' '}Vous pouvez tout de même la renvoyer depuis cette fiche.
          </div>
        ) : null}

        <EmailCopyToSenderOption
          checked={copyToSender}
          onChange={onCopyToSenderChange}
          disabled={sending}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={sending}
            style={{
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155',
              borderRadius: 9,
              padding: '10px 14px',
              fontWeight: 700,
              cursor: sending ? 'not-allowed' : 'pointer',
            }}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={sending}
            style={{
              border: '1px solid #2563eb',
              background: '#2563eb',
              color: '#ffffff',
              borderRadius: 9,
              padding: '10px 15px',
              fontWeight: 800,
              cursor: sending ? 'wait' : 'pointer',
            }}
          >
            {sending ? 'Envoi…' : 'Envoyer l’invitation'}
          </button>
        </div>
      </div>
    </div>
  );
}
