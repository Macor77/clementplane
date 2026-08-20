import { useCallback, useEffect, useState } from 'react';
import {
  createMyAvailabilityContact,
  deleteMyAvailabilityContact,
  getMyAvailabilityContacts,
  updateMyAvailabilityContact,
} from '../../services/trainerAvailabilityContactsService';

const EMPTY_FORM = {
  organizationName: '',
  contactName: '',
  email: '',
  phone: '',
};

function StatusBadge({ children, tone = 'neutral' }) {
  const palette = {
    success: { background: '#dcfce7', color: '#15803d' },
    info: { background: '#dbeafe', color: '#1d4ed8' },
    neutral: { background: '#f1f5f9', color: '#64748b' },
  };
  const colors = palette[tone] || palette.neutral;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 8px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 800,
        ...colors,
      }}
    >
      {children}
    </span>
  );
}

export default function TrainerAvailabilityShare() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [contactToDelete, setContactToDelete] = useState(null);

  const loadContacts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setContacts(await getMyAvailabilityContacts());
    } catch (loadError) {
      setError(
        loadError?.message ||
          "Impossible de charger votre carnet d'organismes.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError('');
  };

  const change = (event) => {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
    setError('');
    setMessage('');
  };

  const sortContacts = (rows) =>
    [...rows].sort((a, b) =>
      String(a.organization_name || '').localeCompare(
        String(b.organization_name || ''),
        'fr',
      ),
    );

  const submit = async (event) => {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setError('');
    setMessage('');

    try {
      if (editingId) {
        const updated = await updateMyAvailabilityContact({
          contactId: editingId,
          ...form,
        });
        setContacts((rows) =>
          sortContacts(
            rows.map((row) => (row.id === editingId ? updated : row)),
          ),
        );
        setMessage('Le contact a bien été modifié.');
      } else {
        const created = await createMyAvailabilityContact(form);
        setContacts((rows) => sortContacts([...rows, created]));
        setMessage("L'organisme a bien été ajouté à votre carnet.");
      }

      setForm(EMPTY_FORM);
      setEditingId(null);
    } catch (saveError) {
      setError(
        saveError?.message ||
          "Impossible d'enregistrer ce contact.",
      );
    } finally {
      setSaving(false);
    }
  };

  const edit = (contact) => {
    setEditingId(contact.id);
    setForm({
      organizationName: contact.organization_name || '',
      contactName: contact.contact_name || '',
      email: contact.email || '',
      phone: contact.phone || '',
    });
    setError('');
    setMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const askDelete = (contact) => {
    if (deletingId) return;
    setContactToDelete(contact);
    setError('');
    setMessage('');
  };

  const cancelDelete = () => {
    if (deletingId) return;
    setContactToDelete(null);
  };

  const confirmDelete = async () => {
    const contact = contactToDelete;
    if (!contact?.id || deletingId) return;

    setDeletingId(contact.id);
    setError('');
    setMessage('');

    try {
      await deleteMyAvailabilityContact(contact.id);
      setContacts((rows) => rows.filter((row) => row.id !== contact.id));
      if (editingId === contact.id) resetForm();
      setContactToDelete(null);
      setMessage('Le contact a bien été supprimé.');
    } catch (deleteError) {
      setError(
        deleteError?.message ||
          'Impossible de supprimer ce contact.',
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="page-container">
      <div className="page-heading">
        <div>
          <p className="page-eyebrow">PARTAGE DES DISPONIBILITÉS</p>
          <h1>Partager mes disponibilités</h1>
          <p>
            Gérez les organismes avec lesquels vous souhaitez partager votre planning.
          </p>
        </div>
      </div>

      <div className="panel-card">
        <h2>Mon carnet d'organismes</h2>
        <p>
          Ajoutez vos contacts OF. Formaplane vous indique si l'organisme
          possède déjà un compte et, lorsqu'il est inscrit, s'il vous a déjà
          ajouté à son réseau de formateurs.
        </p>

        <form onSubmit={submit} style={{ marginTop: 20 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 14,
            }}
          >
            <label style={{ display: 'grid', gap: 6, fontWeight: 700 }}>
              Organisme de formation
              <input
                name="organizationName"
                value={form.organizationName}
                onChange={change}
                placeholder="Ex. Alter Prévention"
                required
              />
            </label>

            <label style={{ display: 'grid', gap: 6, fontWeight: 700 }}>
              Nom du contact
              <input
                name="contactName"
                value={form.contactName}
                onChange={change}
                placeholder="Ex. Sophie Martin"
              />
            </label>

            <label style={{ display: 'grid', gap: 6, fontWeight: 700 }}>
              Adresse e-mail
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={change}
                placeholder="contact@organisme.fr"
                required
              />
            </label>

            <label style={{ display: 'grid', gap: 6, fontWeight: 700 }}>
              Téléphone
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={change}
                placeholder="Optionnel"
              />
            </label>
          </div>

          {error ? (
            <div style={{ marginTop: 14, color: '#b42318', fontWeight: 700 }}>
              {error}
            </div>
          ) : null}

          {message ? (
            <div style={{ marginTop: 14, color: '#15803d', fontWeight: 700 }}>
              {message}
            </div>
          ) : null}

          <div
            style={{
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
              marginTop: 18,
            }}
          >
            <button className="button" type="submit" disabled={saving}>
              {saving
                ? 'Enregistrement…'
                : editingId
                  ? 'Enregistrer les modifications'
                  : "Ajouter l'organisme"}
            </button>

            {editingId ? (
              <button
                className="button button--soft"
                type="button"
                onClick={resetForm}
              >
                Annuler
              </button>
            ) : null}
          </div>
        </form>
      </div>

      <div className="panel-card" style={{ marginTop: 20 }}>
        <h2 style={{ marginBottom: 4 }}>Mes contacts</h2>
        <p style={{ margin: 0 }}>
          {contacts.length} contact{contacts.length > 1 ? 's' : ''}
        </p>

        {loading ? <p style={{ marginTop: 18 }}>Chargement du carnet…</p> : null}

        {!loading && contacts.length === 0 ? (
          <div
            style={{
              marginTop: 18,
              padding: 18,
              border: '1px dashed #cbd5e1',
              borderRadius: 12,
              background: '#f8fafc',
              color: '#64748b',
            }}
          >
            Votre carnet est vide. Ajoutez votre premier organisme ci-dessus.
          </div>
        ) : null}

        {!loading && contacts.length > 0 ? (
          <div style={{ display: 'grid', gap: 12, marginTop: 18 }}>
            {contacts.map((contact) => (
              <div
                key={contact.id}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: 16,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 16,
                  flexWrap: 'wrap',
                  background: '#fff',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      flexWrap: 'wrap',
                    }}
                  >
                    <strong>{contact.organization_name}</strong>
                    <StatusBadge tone={contact.organization_id ? 'success' : 'neutral'}>
                      {contact.organization_id
                        ? 'Inscrit sur Formaplane'
                        : 'Non inscrit'}
                    </StatusBadge>

                    {contact.organization_id ? (
                      <StatusBadge tone={contact.is_referenced ? 'info' : 'neutral'}>
                        {contact.is_referenced
                          ? 'Vous êtes dans son réseau'
                          : 'Pas encore dans son réseau'}
                      </StatusBadge>
                    ) : null}
                  </div>

                  {contact.contact_name ? (
                    <div style={{ marginTop: 6, color: '#475569' }}>
                      {contact.contact_name}
                    </div>
                  ) : null}

                  <div style={{ marginTop: 4, color: '#64748b', fontSize: 14 }}>
                    {contact.email}
                  </div>

                  {contact.phone ? (
                    <div style={{ marginTop: 2, color: '#64748b', fontSize: 14 }}>
                      {contact.phone}
                    </div>
                  ) : null}
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="button button--soft"
                    type="button"
                    onClick={() => edit(contact)}
                  >
                    Modifier
                  </button>

                  <button
                    className="button button--soft"
                    type="button"
                    disabled={deletingId === contact.id}
                    onClick={() => askDelete(contact)}
                    style={{ color: '#b42318' }}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {contactToDelete ? (
        <div
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) cancelDelete();
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'grid',
            placeItems: 'center',
            padding: 20,
            background: 'rgba(15, 23, 42, 0.55)',
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-contact-title"
            style={{
              width: 'min(100%, 480px)',
              background: '#ffffff',
              borderRadius: 16,
              boxShadow: '0 24px 70px rgba(15, 23, 42, 0.28)',
              padding: 24,
            }}
          >
            <p className="page-eyebrow" style={{ marginTop: 0 }}>
              CARNET D'ORGANISMES
            </p>
            <h2 id="delete-contact-title" style={{ marginTop: 6 }}>
              Supprimer ce contact ?
            </h2>
            <p style={{ color: '#475569', lineHeight: 1.55 }}>
              <strong>{contactToDelete.organization_name}</strong> sera retiré
              de votre carnet. Cette action ne supprime aucun compte Formaplane
              et ne modifie pas votre éventuel référencement auprès de cet organisme.
            </p>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 10,
                flexWrap: 'wrap',
                marginTop: 22,
              }}
            >
              <button
                className="button button--soft"
                type="button"
                onClick={cancelDelete}
                disabled={Boolean(deletingId)}
              >
                Annuler
              </button>
              <button
                className="button"
                type="button"
                onClick={confirmDelete}
                disabled={Boolean(deletingId)}
                style={{ background: '#b42318' }}
              >
                {deletingId ? 'Suppression…' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
