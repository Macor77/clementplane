import {
  useEffect,
  useState,
} from 'react';

import {
  Link,
  useParams,
} from 'react-router-dom';

import {
  getMyMissionOrganizationContact,
} from '../../services/trainerProposalService';

export default function TrainerOrganizationContact() {
  const { id } = useParams();
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const row = await getMyMissionOrganizationContact(id);
        if (active) setContact(row);
      } catch (loadError) {
        console.error(loadError);
        if (active) {
          setError(
            loadError?.message ||
              'Impossible de charger les coordonnées de l’organisme.',
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return <div style={styles.state}>Chargement du contact…</div>;
  }

  if (error || !contact) {
    return (
      <div style={styles.state}>
        <strong>Contact indisponible</strong>
        <span>{error || 'Aucune information disponible.'}</span>
        <Link to={`/formateur/missions/${id}`} style={styles.back}>
          ← Retour à la mission
        </Link>
      </div>
    );
  }

  const address = [
    contact.address,
    [contact.postal_code, contact.city]
      .filter(Boolean)
      .join(' '),
    contact.country,
  ]
    .filter(Boolean)
    .join('\n');

  return (
    <div className="trainer-organization-contact-page" style={styles.page}>
      <Link to={`/formateur/missions/${id}`} style={styles.back}>
        ← Retour à la mission
      </Link>

      <div style={styles.heading}>
        <div>
          <p className="page-eyebrow">ORGANISME DE FORMATION</p>
          <h1 style={styles.title}>{contact.organization_name}</h1>
          <p style={styles.subtitle}>
            Coordonnées utiles de l’organisme qui vous propose ou vous confie cette mission.
          </p>
        </div>
      </div>

      <section style={styles.card}>
        <div style={styles.grid}>
          <Info label="Organisme" value={contact.organization_name} />
          {contact.legal_name && contact.legal_name !== contact.organization_name ? (
            <Info label="Raison sociale" value={contact.legal_name} />
          ) : null}
          <Info label="Adresse" value={address || 'Non renseignée'} multiline />
          <Info label="Contact" value={contact.contact_name || 'Non renseigné'} />
          <Info
            label="E-mail"
            value={contact.contact_email || 'Non renseigné'}
            href={contact.contact_email ? `mailto:${contact.contact_email}` : ''}
          />
          <Info
            label="Téléphone"
            value={contact.contact_phone || 'Non renseigné'}
            href={contact.contact_phone ? `tel:${contact.contact_phone}` : ''}
          />
        </div>
      </section>

      <section style={styles.notice}>
        <strong>À propos des échanges</strong>
        <span>
          Cette fiche prépare le futur espace d’échanges directement lié à la mission.
          Pour le moment, utilisez les coordonnées habituelles de l’organisme si vous devez le contacter rapidement.
        </span>
      </section>
    </div>
  );
}

function Info({ label, value, href = '', multiline = false }) {
  return (
    <div style={styles.info}>
      <span style={styles.label}>{label}</span>
      {href ? (
        <a href={href} style={styles.valueLink}>{value}</a>
      ) : (
        <strong style={{ ...styles.value, whiteSpace: multiline ? 'pre-line' : 'normal' }}>
          {value}
        </strong>
      )}
    </div>
  );
}

const styles = {
  page: { width: '100%', maxWidth: 900, margin: '0 auto', paddingBottom: 28 },
  back: { display: 'inline-block', marginBottom: 12, color: '#2563eb', fontSize: 11, fontWeight: 750, textDecoration: 'none' },
  heading: { marginBottom: 14 },
  title: { margin: '4px 0', color: '#101828', fontSize: 26 },
  subtitle: { margin: 0, color: '#667085', fontSize: 11 },
  card: { padding: 16, border: '1px solid #e4e7ec', borderRadius: 11, background: '#fff' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 9 },
  info: { display: 'grid', gap: 4, padding: '10px 11px', border: '1px solid #eef1f5', borderRadius: 8, background: '#f9fafb' },
  label: { color: '#667085', fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em' },
  value: { color: '#344054', fontSize: 12, lineHeight: 1.45 },
  valueLink: { color: '#2563eb', fontSize: 12, fontWeight: 750, textDecoration: 'none' },
  notice: { display: 'grid', gap: 4, marginTop: 10, padding: '11px 12px', border: '1px solid #bfdbfe', borderRadius: 9, background: '#eff6ff', color: '#1e40af', fontSize: 10, lineHeight: 1.45 },
  state: { display: 'grid', gap: 7, maxWidth: 700, margin: '20px auto', padding: 24, border: '1px solid #e4e7ec', borderRadius: 10, background: '#fff', color: '#667085' },
};
