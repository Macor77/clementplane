import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyTrainerMissions } from '../../services/trainerProposalService';

function sortedDates(mission) {
  return [...(Array.isArray(mission?.dates) ? mission.dates : [])]
    .filter((item) => item?.date)
    .sort((a, b) => a.date.localeCompare(b.date));
}

function formatLongDate(value) {
  if (!value) return 'Date à confirmer';
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    .format(new Date(`${value}T12:00:00`));
}

function formatPeriod(mission) {
  const dates = sortedDates(mission);
  if (!dates.length) return 'Dates à confirmer';
  const first = dates[0].date;
  const last = dates[dates.length - 1].date;
  return `${formatLongDate(first)} → ${formatLongDate(last)} · ${dates.length} journée${dates.length > 1 ? 's' : ''}`;
}

function monthKey(mission) {
  return sortedDates(mission)[0]?.date?.slice(0, 7) || 'sans-date';
}

function monthLabel(key) {
  if (key === 'sans-date') return 'Dates à confirmer';
  const [year, month] = key.split('-');
  const label = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' })
    .format(new Date(Number(year), Number(month) - 1, 1));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function statusLabel(status) {
  return ({ accepte: 'Acceptée · en attente de confirmation OF', affecte: 'Mission confirmée', annule: 'Annulée', mission_pourvue: 'Mission pourvue', indisponible_affecte_ailleurs: 'Plus disponible', desiste: 'Désistement' })[status] || status;
}

export default function TrainerMissions() {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const rows = await getMyTrainerMissions();
        if (active) setMissions(rows);
      } catch (e) {
        console.error(e);
        if (active) setError('Impossible de charger vos missions.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const grouped = useMemo(() => {
    const rows = [...missions].sort((a, b) => {
      const ad = sortedDates(a)[0]?.date || '9999-12-31';
      const bd = sortedDates(b)[0]?.date || '9999-12-31';
      return ad.localeCompare(bd);
    });
    const groups = [];
    for (const mission of rows) {
      const key = monthKey(mission);
      let group = groups.find((item) => item.key === key);
      if (!group) { group = { key, missions: [] }; groups.push(group); }
      group.missions.push(mission);
    }
    return groups;
  }, [missions]);

  return <div style={styles.page}>
    <div className="page-heading">
      <div><p className="page-eyebrow">MISSIONS</p><h1>Mes missions</h1>
        <p>Retrouvez les missions que vous avez acceptées et celles confirmées par l’organisme de formation.</p></div>
    </div>
    {error ? <div className="alert alert--error">{error}</div> : null}
    {loading ? <div style={styles.empty}>Chargement de vos missions…</div> : null}
    {!loading && !error && missions.length === 0 ? <div style={styles.empty}><strong>Aucune mission pour le moment.</strong><span>Les missions acceptées ou confirmées apparaîtront ici.</span></div> : null}
    {!loading && grouped.map((group) => <section key={group.key} style={styles.monthSection}>
      <div style={styles.monthSeparator}><span>{monthLabel(group.key)}</span><div /></div>
      <div style={styles.list}>{group.missions.map((mission) => {
        const place = [mission.location, mission.postal_code, mission.city].filter(Boolean).join(' ');
        return <article key={mission.mission_formateur_id} style={styles.row}>
          <div style={styles.main}>
            <strong style={styles.period}>{formatPeriod(mission)}</strong>
            <div style={styles.meta}>
              <span>{mission.mission_title || 'Mission de formation'}</span>
              {mission.organization_name ? (
                <span style={styles.organization}>
                  OF : <strong>{mission.organization_name}</strong>
                  {' · '}
                  <Link
                    to={`/formateur/missions/${mission.mission_id}/organisme`}
                    style={styles.organizationLink}
                  >
                    Voir le contact
                  </Link>
                </span>
              ) : null}
              {mission.client ? <span>Client : {mission.client}</span> : null}
              {place ? <span>📍 {place}</span> : null}
            </div>
          </div>
          <span style={{...styles.status, ...(mission.status === 'affecte' ? styles.confirmed : mission.status === 'accepte' ? styles.waiting : styles.cancelled)}}>{statusLabel(mission.status)}</span>
          <Link className="button button--soft" to={`/formateur/missions/${mission.mission_id}`}>Ouvrir</Link>
        </article>;
      })}</div>
    </section>)}
  </div>;
}

const styles = {
  page: { width: '100%', maxWidth: 1500, margin: '0 auto', paddingBottom: 28 },
  monthSection: { marginTop: 20 }, monthSeparator: { display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 12, alignItems: 'center', marginBottom: 8, color: '#475467', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em' },
  list: { display: 'grid', gap: 7 }, row: { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto auto', gap: 14, alignItems: 'center', padding: '11px 13px', border: '1px solid #e4e7ec', borderRadius: 9, background: '#fff' },
  main: { minWidth: 0, display: 'grid', gap: 5 }, organization: { color: '#344054' }, organizationLink: { color: '#2563eb', fontWeight: 750, textDecoration: 'none' }, period: { color: '#101828', fontSize: 12 }, meta: { display: 'flex', flexWrap: 'wrap', gap: '4px 12px', color: '#667085', fontSize: 10 },
  status: { padding: '5px 8px', borderRadius: 999, fontSize: 9, fontWeight: 750, whiteSpace: 'nowrap' }, confirmed: { background: '#ecfdf3', color: '#027a48' }, waiting: { background: '#fffaeb', color: '#b54708' }, cancelled: { background: '#f2f4f7', color: '#667085' },
  empty: { display: 'grid', gap: 5, padding: 22, border: '1px solid #e4e7ec', borderRadius: 10, background: '#fff', color: '#667085', fontSize: 12 },
};
