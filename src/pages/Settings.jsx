import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateCurrentUserProfile } from '../services/currentUserService';
import { requestCurrentUserEmailChange } from '../services/authService';
import { getMyAccountDeletionStatus, deleteMyAccount } from '../services/accountDeletionService';
import { sendInfrastructureTestEmail } from '../services/emailService';

export default function Settings() {
  const {
    signOut,
    profile,
    user,
    currentOrganization,
    refreshUserContext,
  } = useAuth();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [saveError, setSaveError] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');
  const [emailError, setEmailError] = useState('');
  const [testEmailSending, setTestEmailSending] = useState(false);
  const [testEmailMessage, setTestEmailMessage] = useState('');
  const [testEmailError, setTestEmailError] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    setForm({
      firstName: profile?.first_name || '',
      lastName: profile?.last_name || '',
      phone: profile?.phone || '',
    });
  }, [profile]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
    setMessage('');
    setSaveError('');
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (!user?.id || saving) return;

    setSaving(true);
    setMessage('');
    setSaveError('');

    try {
      await updateCurrentUserProfile(user.id, form);
      await refreshUserContext();
      setMessage('Vos informations ont bien été enregistrées.');
    } catch (error) {
      console.error('Modification du compte impossible :', error);
      setSaveError("Impossible d'enregistrer vos informations pour le moment.");
    } finally {
      setSaving(false);
    }
  };

  const handleEmailChange = async (event) => {
    event.preventDefault();

    const normalizedEmail = newEmail.trim().toLowerCase();
    const currentEmail = String(user?.email || '').trim().toLowerCase();

    setEmailMessage('');
    setEmailError('');

    if (!normalizedEmail) {
      setEmailError('Saisissez votre nouvelle adresse e-mail.');
      return;
    }

    if (normalizedEmail === currentEmail) {
      setEmailError("Cette adresse est déjà l'adresse e-mail de votre compte.");
      return;
    }

    setEmailSaving(true);

    try {
      await requestCurrentUserEmailChange(normalizedEmail);
      setNewEmail('');
      setEmailMessage(
        `Un e-mail de confirmation a été envoyé à ${normalizedEmail}. Votre adresse actuelle restera utilisée tant que la nouvelle adresse n'aura pas été confirmée.`,
      );
    } catch (error) {
      console.error("Changement d'adresse e-mail impossible :", error);
      setEmailError(
        error?.message || "Impossible de demander le changement d'adresse e-mail pour le moment.",
      );
    } finally {
      setEmailSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (testEmailSending) return;

    setTestEmailSending(true);
    setTestEmailMessage('');
    setTestEmailError('');

    try {
      const result = await sendInfrastructureTestEmail();
      setTestEmailMessage(
        `E-mail de test envoyé avec succès. Journal : ${result.logId}.`,
      );
    } catch (error) {
      console.error("Test du moteur d'e-mails impossible :", error);
      setTestEmailError(
        error?.message ||
          "Impossible d'envoyer l'e-mail de test pour le moment.",
      );
    } finally {
      setTestEmailSending(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteBusy || deleteConfirmation !== 'SUPPRIMER') return;
    setDeleteBusy(true);
    setDeleteError('');
    try {
      const status = await getMyAccountDeletionStatus();
      if (!status?.allowed) {
        const org = status?.organization_name ? ` « ${status.organization_name} »` : '';
        setDeleteError(
          status?.reason === 'last_active_owner'
            ? `Vous êtes le dernier propriétaire actif de l’organisme${org}. Transférez d’abord la propriété à un autre utilisateur ou contactez Formaplane.`
            : `Vous êtes le dernier utilisateur actif de l’organisme${org}. Ajoutez d’abord un autre utilisateur ou contactez Formaplane.`,
        );
        return;
      }
      await deleteMyAccount();
      sessionStorage.clear();
      try { await signOut(); } catch (error) { console.warn(error); }
      window.location.assign('/connexion');
    } catch (error) {
      console.error('Suppression du compte impossible :', error);
      setDeleteError(error?.message || 'Impossible de supprimer votre compte pour le moment.');
    } finally {
      setDeleteBusy(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erreur lors de la déconnexion :', error);
      alert("Impossible de vous déconnecter pour le moment.");
    }
  };

  const inputStyle = {
    width: '100%',
    boxSizing: 'border-box',
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    padding: '11px 12px',
    font: 'inherit',
    background: '#fff',
  };

  const labelStyle = {
    display: 'grid',
    gap: '7px',
    fontWeight: 700,
    color: '#334155',
  };

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

          <div style={{ color: '#64748b' }}>
            {currentOrganization?.name || 'Aucune organisation'}
          </div>
        </div>

        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gap: '16px' }}>
            <label style={labelStyle}>
              Prénom
              <input
                type="text"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                autoComplete="given-name"
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Nom
              <input
                type="text"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                autoComplete="family-name"
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Téléphone
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                autoComplete="tel"
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Adresse e-mail de connexion
              <input
                type="email"
                value={user?.email || ''}
                readOnly
                style={{
                  ...inputStyle,
                  background: '#f8fafc',
                  color: '#64748b',
                }}
              />
            </label>

            {message ? (
              <div style={{ color: '#15803d', fontWeight: 700 }}>
                {message}
              </div>
            ) : null}

            {saveError ? (
              <div style={{ color: '#b42318', fontWeight: 700 }}>
                {saveError}
              </div>
            ) : null}

            <div>
              <button
                type="submit"
                disabled={saving}
                style={{
                  border: 'none',
                  background: '#2563eb',
                  color: '#fff',
                  borderRadius: '10px',
                  padding: '11px 16px',
                  fontWeight: 700,
                  cursor: saving ? 'wait' : 'pointer',
                }}
              >
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </form>

        <div
          style={{
            borderTop: '1px solid #e5e7eb',
            paddingTop: '24px',
            marginTop: '28px',
          }}
        >
          <h3 style={{ marginTop: 0 }}>Changer mon adresse e-mail</h3>

          <p style={{ color: '#64748b', marginBottom: '18px' }}>
            Saisissez votre nouvelle adresse. Elle ne remplacera votre adresse actuelle qu’après confirmation via l’e-mail reçu.
          </p>

          <form onSubmit={handleEmailChange}>
            <div style={{ display: 'grid', gap: '12px' }}>
              <label style={labelStyle}>
                Nouvelle adresse e-mail
                <input
                  type="email"
                  value={newEmail}
                  onChange={(event) => {
                    setNewEmail(event.target.value);
                    setEmailMessage('');
                    setEmailError('');
                  }}
                  autoComplete="email"
                  placeholder="nouvelle-adresse@exemple.fr"
                  style={inputStyle}
                />
              </label>

              {emailMessage ? (
                <div style={{ color: '#15803d', fontWeight: 700 }}>
                  {emailMessage}
                </div>
              ) : null}

              {emailError ? (
                <div style={{ color: '#b42318', fontWeight: 700 }}>
                  {emailError}
                </div>
              ) : null}

              <div>
                <button
                  type="submit"
                  disabled={emailSaving}
                  style={{
                    border: '1px solid #bfdbfe',
                    background: '#eff6ff',
                    color: '#1d4ed8',
                    borderRadius: '10px',
                    padding: '11px 16px',
                    fontWeight: 700,
                    cursor: emailSaving ? 'wait' : 'pointer',
                  }}
                >
                  {emailSaving ? 'Envoi…' : 'Changer mon adresse e-mail'}
                </button>
              </div>
            </div>
          </form>
        </div>

        <div
          style={{
            borderTop: '1px solid #e5e7eb',
            paddingTop: '24px',
            marginTop: '28px',
          }}
        >
          <h3 style={{ marginTop: 0 }}>Test technique des e-mails</h3>

          <p style={{ color: '#64748b', marginBottom: '18px' }}>
            Ce bouton envoie un e-mail technique uniquement à l’adresse de votre compte connecté. Il sert à valider le moteur transactionnel centralisé de Formaplane.
          </p>

          {testEmailMessage ? (
            <div style={{ color: '#15803d', fontWeight: 700, marginBottom: '12px' }}>
              {testEmailMessage}
            </div>
          ) : null}

          {testEmailError ? (
            <div style={{ color: '#b42318', fontWeight: 700, marginBottom: '12px' }}>
              {testEmailError}
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleTestEmail}
            disabled={testEmailSending}
            style={{
              border: '1px solid #bfdbfe',
              background: '#eff6ff',
              color: '#1d4ed8',
              borderRadius: '10px',
              padding: '11px 16px',
              fontWeight: 700,
              cursor: testEmailSending ? 'wait' : 'pointer',
            }}
          >
            {testEmailSending ? 'Envoi du test…' : 'Envoyer un e-mail de test'}
          </button>
        </div>

        <div
          style={{
            borderTop: '1px solid #e5e7eb',
            paddingTop: '24px',
            marginTop: '28px',
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

        <div style={{ borderTop: '1px solid #fecaca', paddingTop: '24px', marginTop: '28px' }}>
          <h3 style={{ marginTop: 0, color: '#b42318' }}>Zone de danger</h3>
          <p style={{ color: '#64748b', marginBottom: '18px' }}>La suppression ferme définitivement votre compte Formaplane. Elle ne supprime pas automatiquement les données métier appartenant à votre organisme. Si vous êtes le dernier utilisateur actif ou le dernier propriétaire de votre organisme, la suppression autonome sera bloquée.</p>
          {!deleteOpen ? (
            <button type="button" onClick={() => setDeleteOpen(true)} style={{ border: '1px solid #fecaca', background: '#fff', color: '#b42318', borderRadius: '10px', padding: '11px 16px', fontWeight: 700, cursor: 'pointer' }}>Supprimer mon compte</button>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              <p style={{ margin: 0 }}>Pour confirmer, saisissez <strong>SUPPRIMER</strong>.</p>
              <input value={deleteConfirmation} onChange={(e) => { setDeleteConfirmation(e.target.value); setDeleteError(''); }} placeholder="SUPPRIMER" style={inputStyle} />
              {deleteError ? <div style={{ color: '#b42318', fontWeight: 700 }}>{deleteError}</div> : null}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button type="button" onClick={() => { setDeleteOpen(false); setDeleteConfirmation(''); setDeleteError(''); }} style={{ border: '1px solid #cbd5e1', background: '#fff', borderRadius: '10px', padding: '11px 16px', fontWeight: 700 }}>Annuler</button>
                <button type="button" disabled={deleteBusy || deleteConfirmation !== 'SUPPRIMER'} onClick={handleDeleteAccount} style={{ border: 'none', background: '#b42318', color: '#fff', borderRadius: '10px', padding: '11px 16px', fontWeight: 700, opacity: deleteConfirmation === 'SUPPRIMER' ? 1 : .55 }}>
                  {deleteBusy ? 'Suppression…' : 'Supprimer définitivement mon compte'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
