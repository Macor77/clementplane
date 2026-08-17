import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { updateCurrentUserProfile } from '../../services/currentUserService';
import { requestCurrentUserEmailChange } from '../../services/authService';
import { getMyAccountDeletionStatus, deleteMyAccount } from '../../services/accountDeletionService';

const ACTIVE_SPACE_KEY = 'timeforma_active_space';

export default function TrainerSettings() {
  const navigate = useNavigate();

  const {
    memberships,
    signOut,
    profile,
    user,
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

  const handleChangeSpace = () => {
    sessionStorage.removeItem(ACTIVE_SPACE_KEY);
    navigate('/choisir-espace');
  };

  const handleLogout = async () => {
    sessionStorage.removeItem(ACTIVE_SPACE_KEY);
    await signOut();
    navigate('/connexion', { replace: true });
  };

  return (
    <div className="page-container">
      <div className="page-heading">
        <div>
          <p className="page-eyebrow">PARAMÈTRES</p>
          <h1>Mon compte</h1>
          <p>Gérez vos informations personnelles, votre session et vos espaces Formaplane.</p>
        </div>
      </div>

      <div className="panel-card trainer-settings-card">
        <h2>Informations personnelles</h2>

        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gap: 16, maxWidth: 560 }}>
            <label style={{ display: 'grid', gap: 6, fontWeight: 700 }}>
              Prénom
              <input
                type="text"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                autoComplete="given-name"
              />
            </label>

            <label style={{ display: 'grid', gap: 6, fontWeight: 700 }}>
              Nom
              <input
                type="text"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                autoComplete="family-name"
              />
            </label>

            <label style={{ display: 'grid', gap: 6, fontWeight: 700 }}>
              Téléphone
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                autoComplete="tel"
              />
            </label>

            <label style={{ display: 'grid', gap: 6, fontWeight: 700 }}>
              Adresse e-mail de connexion
              <input
                type="email"
                value={user?.email || ''}
                readOnly
                style={{ background: '#f8fafc', color: '#64748b' }}
              />
            </label>


            {message ? (
              <div style={{ color: '#15803d', fontWeight: 700 }}>{message}</div>
            ) : null}

            {saveError ? (
              <div style={{ color: '#b42318', fontWeight: 700 }}>{saveError}</div>
            ) : null}

            <div>
              <button className="button" type="submit" disabled={saving}>
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="panel-card trainer-settings-card" style={{ marginTop: 20 }}>
        <h2>Changer mon adresse e-mail</h2>

        <p>
          Saisissez votre nouvelle adresse. Elle ne remplacera votre adresse actuelle qu’après confirmation via l’e-mail reçu.
        </p>

        <form onSubmit={handleEmailChange}>
          <div style={{ display: 'grid', gap: 12, maxWidth: 560 }}>
            <label style={{ display: 'grid', gap: 6, fontWeight: 700 }}>
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
              />
            </label>

            {emailMessage ? (
              <div style={{ color: '#15803d', fontWeight: 700 }}>{emailMessage}</div>
            ) : null}

            {emailError ? (
              <div style={{ color: '#b42318', fontWeight: 700 }}>{emailError}</div>
            ) : null}

            <div>
              <button className="button button--soft" type="submit" disabled={emailSaving}>
                {emailSaving ? 'Envoi…' : 'Changer mon adresse e-mail'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="panel-card trainer-settings-card" style={{ marginTop: 20 }}>
        <h2>Session</h2>

        <p>Vous êtes connecté à votre espace Formateur.</p>

        <div className="trainer-settings-actions">
          {memberships.length > 0 && (
            <button
              className="button button--soft"
              type="button"
              onClick={handleChangeSpace}
            >
              Changer d’espace
            </button>
          )}

          <button className="button" type="button" onClick={handleLogout}>
            Se déconnecter
          </button>
        </div>
      </div>
      <div className="panel-card trainer-settings-card" style={{ marginTop: 20, border: '1px solid #fecaca' }}>
        <h2 style={{ color: '#b42318' }}>Zone de danger</h2>
        <p>La suppression ferme définitivement votre compte Formaplane. Les données métier nécessaires aux organismes avec lesquels vous avez collaboré peuvent être conservées. Votre fiche formateur peut rester dans leur réseau sans être rattachée à un compte utilisateur.</p>
        {!deleteOpen ? (
          <button className="button button--soft" type="button" onClick={() => setDeleteOpen(true)}>Supprimer mon compte</button>
        ) : (
          <div style={{ display: 'grid', gap: 12, maxWidth: 560 }}>
            <p style={{ marginBottom: 0 }}>Pour confirmer, saisissez <strong>SUPPRIMER</strong>.</p>
            <input value={deleteConfirmation} onChange={(e) => { setDeleteConfirmation(e.target.value); setDeleteError(''); }} placeholder="SUPPRIMER" />
            {deleteError ? <div style={{ color: '#b42318', fontWeight: 700 }}>{deleteError}</div> : null}
            <div className="trainer-settings-actions">
              <button className="button button--soft" type="button" onClick={() => { setDeleteOpen(false); setDeleteConfirmation(''); setDeleteError(''); }}>Annuler</button>
              <button className="button" type="button" disabled={deleteBusy || deleteConfirmation !== 'SUPPRIMER'} onClick={handleDeleteAccount} style={{ background: '#b42318' }}>
                {deleteBusy ? 'Suppression…' : 'Supprimer définitivement mon compte'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
