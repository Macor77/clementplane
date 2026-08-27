import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  createMyAvailabilityContact,
  deleteMyAvailabilityContact,
  formatNextInvitationLabel,
  getMyTrainerOrganizations,
  sendTrainerOrganizationInvitation,
  updateMyAvailabilityContact,
} from '../../services/trainerOrganizationsService';

const EMPTY_FORM = {
  organizationName: '',
  contactName: '',
  email: '',
  phone: '',
};

function StatusPill({ children, tone = 'neutral' }) {
  const palette = {
    success: ['#dcfce7', '#166534'],
    info: ['#dbeafe', '#1d4ed8'],
    warning: ['#fff7ed', '#9a3412'],
    neutral: ['#f1f5f9', '#475569'],
  };
  const [background, color] = palette[tone] || palette.neutral;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        minHeight: 26,
        padding: '3px 9px',
        borderRadius: 999,
        background,
        color,
        fontSize: 12,
        fontWeight: 800,
      }}
    >
      {children}
    </span>
  );
}

export default function TrainerOrganizations() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingId, setSendingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [formOpen, setFormOpen] = useState(searchParams.get('ajouter') === '1');
  const [form, setForm] = useState(EMPTY_FORM);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadContacts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getMyTrainerOrganizations();
      setContacts(data);
    } catch (loadError) {
      console.error(loadError);
      setError(loadError?.message || "Impossible de charger vos organismes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  useEffect(() => {
    if (searchParams.get('ajouter') === '1') {
      setFormOpen(true);
    }
  }, [searchParams]);

  const registeredCount = useMemo(
    () => contacts.filter((contact) => contact.is_on_formaplane).length,
    [contacts],
  );

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormOpen(false);
    const next = new URLSearchParams(searchParams);
    next.delete('ajouter');
    setSearchParams(next, { replace: true });
  };

  const startCreate = () => {
    setMessage('');
    setError('');
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormOpen(true);
  };

  const startEdit = (contact) => {
    setMessage('');
    setError('');
    setEditingId(contact.id);
    setForm({
      organizationName: contact.organization_name || '',
      contactName: contact.contact_name || '',
      email: contact.email || '',
      phone: contact.phone || '',
    });
    setFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const change = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      if (editingId) {
        await updateMyAvailabilityContact({ contactId: editingId, ...form });
        setMessage("L'organisme a bien été mis à jour.");
      } else {
        await createMyAvailabilityContact(form);
        setMessage("L'organisme a bien été ajouté à Mes OF.");
      }
      resetForm();
      await loadContacts();
    } catch (saveError) {
      console.error(saveError);
      setError(saveError?.message || "Impossible d'enregistrer cet organisme.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (contact) => {
    if (!window.confirm(`Supprimer ${contact.organization_name} de Mes OF ?`)) return;
    setDeletingId(contact.id);
    setMessage('');
    setError('');
    try {
      await deleteMyAvailabilityContact(contact.id);
      setMessage("L'organisme a été supprimé.");
      await loadContacts();
    } catch (deleteError) {
      console.error(deleteError);
      setError(deleteError?.message || "Impossible de supprimer cet organisme.");
    } finally {
      setDeletingId(null);
    }
  };

  const invite = async (contact) => {
    setSendingId(contact.id);
    setMessage('');
    setError('');
    try {
      await sendTrainerOrganizationInvitation(contact.id);
      setMessage(`Invitation envoyée à ${contact.email}.`);
      await loadContacts();
    } catch (inviteError) {
      console.error(inviteError);
      setError(inviteError?.message || "Impossible d'envoyer l'invitation.");
      await loadContacts();
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="page-container trainer-organizations-page">
      <div className="page-heading">
        <div>
          <p className="page-eyebrow">MON RÉSEAU D’ORGANISMES</p>
          <h1>Mes OF</h1>
          <p>
            Centralisez ici vos organismes partenaires. Cette liste alimente automatiquement
            « Partager mes disponibilités ».
          </p>
        </div>
        <button type="button" className="button" onClick={startCreate}>
          Ajouter un organisme
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 10,
          marginBottom: 14,
        }}
      >
        <div className="panel-card" style={{ padding: 14 }}>
          <div style={{ color: '#64748b', fontSize: 12, fontWeight: 700 }}>Organismes enregistrés</div>
          <div style={{ marginTop: 4, fontSize: 24, fontWeight: 900 }}>{contacts.length}</div>
        </div>
        <div className="panel-card" style={{ padding: 14 }}>
          <div style={{ color: '#64748b', fontSize: 12, fontWeight: 700 }}>Déjà sur Clementplane</div>
          <div style={{ marginTop: 4, fontSize: 24, fontWeight: 900 }}>{registeredCount}</div>
        </div>
      </div>

      {formOpen ? (
        <div className="panel-card" style={{ marginBottom: 14 }}>
          <h2 style={{ marginTop: 0 }}>{editingId ? "Modifier l'organisme" : 'Ajouter un organisme'}</h2>
          <form onSubmit={submit}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                gap: 10,
              }}
            >
              <label style={{ display: 'grid', gap: 5, fontWeight: 700 }}>
                Organisme de formation
                <input name="organizationName" value={form.organizationName} onChange={change} required />
              </label>
              <label style={{ display: 'grid', gap: 5, fontWeight: 700 }}>
                Nom du contact
                <input name="contactName" value={form.contactName} onChange={change} />
              </label>
              <label style={{ display: 'grid', gap: 5, fontWeight: 700 }}>
                Adresse e-mail
                <input type="email" name="email" value={form.email} onChange={change} required />
              </label>
              <label style={{ display: 'grid', gap: 5, fontWeight: 700 }}>
                Téléphone
                <input type="tel" name="phone" value={form.phone} onChange={change} />
              </label>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
              <button className="button" type="submit" disabled={saving}>
                {saving ? 'Enregistrement…' : editingId ? 'Enregistrer' : "Ajouter l'organisme"}
              </button>
              <button className="button button--soft" type="button" onClick={resetForm} disabled={saving}>
                Annuler
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {message ? <div className="auth-alert auth-alert--success" style={{ marginBottom: 12 }}>{message}</div> : null}
      {error ? <div className="auth-alert auth-alert--error" style={{ marginBottom: 12 }}>{error}</div> : null}

      <div className="panel-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0 }}>Mes organismes partenaires</h2>
            <p style={{ margin: '5px 0 0' }}>Le statut Clementplane est actualisé automatiquement.</p>
          </div>
          <button className="button button--soft" type="button" onClick={loadContacts} disabled={loading}>
            Actualiser
          </button>
        </div>

        {loading ? <p>Chargement…</p> : null}
        {!loading && contacts.length === 0 ? (
          <div style={{ marginTop: 14, padding: 18, border: '1px dashed #cbd5e1', borderRadius: 12, color: '#64748b' }}>
            Aucun organisme enregistré pour le moment.
          </div>
        ) : null}

        {!loading && contacts.length > 0 ? (
          <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
            {contacts.map((contact) => {
              const status = contact.invitation_status || {};
              const coolingDown = !contact.is_on_formaplane && status.canInvite === false;
              return (
                <div
                  key={contact.id}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    padding: 14,
                    display: 'grid',
                    gap: 10,
                    background: '#fff',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontWeight: 900, fontSize: 16 }}>{contact.organization_name}</div>
                      <div style={{ marginTop: 4, color: '#64748b', fontSize: 13 }}>
                        {[contact.contact_name, contact.email, contact.phone].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                      <StatusPill tone={contact.is_on_formaplane ? 'success' : 'neutral'}>
                        {contact.is_on_formaplane ? '● Sur Clementplane' : '○ Pas encore sur Clementplane'}
                      </StatusPill>
                      {contact.is_on_formaplane ? (
                        <StatusPill tone={contact.is_referenced ? 'info' : 'warning'}>
                          {contact.is_referenced ? 'Dans son réseau' : 'Pas encore dans son réseau'}
                        </StatusPill>
                      ) : null}
                    </div>
                  </div>

                  {coolingDown && status.nextInvitationAt ? (
                    <div style={{ padding: '9px 11px', borderRadius: 9, background: '#fff7ed', color: '#9a3412', fontSize: 12, fontWeight: 700 }}>
                      Une invitation a été envoyée il y a moins de 7 jours. Nouvel envoi possible le {formatNextInvitationLabel(status.nextInvitationAt)}.
                    </div>
                  ) : null}

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {!contact.is_on_formaplane ? (
                      <button
                        className="button"
                        type="button"
                        disabled={sendingId === contact.id || status.canInvite === false}
                        onClick={() => invite(contact)}
                      >
                        {sendingId === contact.id ? 'Envoi…' : status.canInvite === false ? 'Invitation récente' : 'Inviter sur Clementplane'}
                      </button>
                    ) : null}
                    <button className="button button--soft" type="button" onClick={() => startEdit(contact)}>
                      Modifier
                    </button>
                    <button
                      className="button button--soft"
                      type="button"
                      onClick={() => remove(contact)}
                      disabled={deletingId === contact.id}
                      style={{ color: '#b42318' }}
                    >
                      {deletingId === contact.id ? 'Suppression…' : 'Supprimer'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
