export default function EmailCopyToSenderOption({
  checked = false,
  onChange,
  disabled = false,
  multiple = false,
  compact = false,
}) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 9,
        marginTop: compact ? 10 : 12,
        padding: compact ? '9px 10px' : '10px 11px',
        border: '1px solid #dbeafe',
        borderRadius: 8,
        background: '#f8fbff',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.65 : 1,
      }}
    >
      <input
        type="checkbox"
        checked={Boolean(checked)}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.checked)}
        style={{ marginTop: 2 }}
      />
      <span
        style={{
          color: '#334155',
          fontSize: compact ? 10.5 : 11.5,
          lineHeight: 1.45,
        }}
      >
        <strong>Recevoir une copie de {multiple ? 'chaque e-mail' : 'cet e-mail'}</strong>
        <span
          style={{
            display: 'block',
            marginTop: 2,
            color: '#64748b',
            fontWeight: 500,
          }}
        >
          {multiple
            ? 'Une copie de chaque e-mail envoyé sera adressée à l’adresse e-mail de votre compte Formaplane.'
            : 'La copie sera envoyée à l’adresse e-mail de votre compte Formaplane.'}
        </span>
      </span>
    </label>
  );
}
