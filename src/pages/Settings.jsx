import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { signOut, profile, currentOrganization } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erreur lors de la déconnexion :', error);
      alert("Impossible de vous déconnecter pour le moment.");
    }
  };

  const fullName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
    'Utilisateur Formaplane';

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">PARAMÈTRES</div>
          <h1>Mon compte</h1>
        </div>
      </div>

      <div
        style={{
          maxWidth: '680px',
          background: '#fff',
          border: '1px solid #dde4ef',
          borderRadius: '18px',
          padding: '28px',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)',
        }}
      >
        <div style={{ marginBottom: '28px' }}>
          <div
            style={{
              fontSize: '12px',
              fontWeight: 800,
              letterSpacing: '0.08em',
              color: '#2563eb',
              marginBottom: '8px',
            }}
          >
            COMPTE UTILISATEUR
          </div>

          <h2 style={{ margin: '0 0 6px' }}>{fullName}</h2>

          <div style={{ color: '#64748b' }}>
            {currentOrganization?.name || 'Aucune organisation'}
          </div>
        </div>

        <div
          style={{
            borderTop: '1px solid #e5e7eb',
            paddingTop: '24px',
          }}
        >
          <h3 style={{ marginTop: 0 }}>Session</h3>

          <p style={{ color: '#64748b', marginBottom: '18px' }}>
            Vous pouvez fermer votre session Formaplane sur cet appareil.
          </p>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              border: '1px solid #fecaca',
              background: '#fff',
              color: '#dc2626',
              borderRadius: '10px',
              padding: '11px 16px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}