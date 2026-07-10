// src/pages/FormateurView.jsx
import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

// ---- Helpers dates
function startOfMonth(d){ const x=new Date(d); x.setDate(1); x.setHours(0,0,0,0); return x; }
function endOfMonth(d){ const x=new Date(d); x.setMonth(x.getMonth()+1,0); x.setHours(23,59,59,999); return x; }
function addMonths(d,n){ const x=new Date(d); x.setMonth(x.getMonth()+n); return x; }
function toISODate(d){ const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const da=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${da}`; }

function getMonthMatrix(refDate){
  const first = startOfMonth(refDate);
  const last = endOfMonth(refDate);
  const start = new Date(first);
  const weekday = (first.getDay()+6)%7;
  start.setDate(first.getDate() - weekday);

  const end = new Date(last);
  const weekdayEnd = (end.getDay()+6)%7;
  end.setDate(end.getDate() + (6-weekdayEnd));

  const days = [];
  const c = new Date(start);
  while (c <= end){ days.push(new Date(c)); c.setDate(c.getDate()+1); }

  const rows = [];
  for (let i=0; i<days.length; i+=7) rows.push(days.slice(i,i+7));
  return rows;
}

const STATUS_ORDER = ['', 'dispo', 'indispo'];

const STATUS_LABEL = {
  '': '—',
  dispo: 'Disponible',
  indispo: 'Indisponible',
  mission: 'En mission',
};

const STATUS_BG = {
  '': '#f8fafc',
  dispo: '#eaffea',
  indispo: '#ffe3e3',
  mission: '#fff3cd',
};

const STATUS_BORDER = {
  '': '#e5e7eb',
  dispo: '#c7f0c7',
  indispo: '#ffb3b3',
  mission: '#ffe08a',
};

export default function FormateurView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [f, setF] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [refDate, setRefDate] = useState(() => new Date());
  const [avail, setAvail] = useState({});
  const [globalUpdatedAt, setGlobalUpdatedAt] = useState(null);

  const [noteModal, setNoteModal] = useState({
    open: false,
    iso: null,
    text: '',
  });

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);

      const { data, error } = await supabase
        .from('trainers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        setErr(error.message);
        setLoading(false);
        return;
      }

      setF({
        id: data.id,
        prenom: data.prenom ?? '',
        nom: data.nom ?? '',
        ville: data.ville ?? '',
        codePostal: data.code_postal ?? '',
        competences: Array.isArray(data.competences) ? data.competences : (data.competences ?? []),
        materiel: Array.isArray(data.materiel) ? data.materiel : (data.materiel ?? []),
        statut: data.statut ?? 'Inactif',
        tarif: data.tarif ?? null,
        notes: data.notes ?? '',
        telephone: data.telephone ?? '',
        email: data.email ?? '',
        adresse: data.adresse ?? '',
        created_at: data.created_at,
      });

      await fetchMonth(id, refDate, setAvail, setGlobalUpdatedAt);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!f?.id) return;
    fetchMonth(f.id, refDate, setAvail, setGlobalUpdatedAt);
  }, [refDate, f?.id]);

  const matrix = useMemo(() => getMonthMatrix(refDate), [refDate]);

  if (loading) return <div style={{ padding: '1rem' }}>Chargement…</div>;
  if (err) return <div style={{ padding: '1rem', color: 'crimson' }}>Erreur : {err}</div>;
  if (!f) return <div style={{ padding: '1rem' }}>Introuvable.</div>;

  const title = `${f.prenom} ${f.nom}`.trim();

  const updateLocalAvailability = (iso, data) => {
    setAvail((prev) => ({
      ...prev,
      [iso]: {
        status: data.status,
        note: data.note ?? '',
        updated_at: data.updated_at,
        id: data.id,
      },
    }));

    setGlobalUpdatedAt((prev) => {
      const now = new Date(data.updated_at).getTime();
      return prev ? (now > new Date(prev).getTime() ? data.updated_at : prev) : data.updated_at;
    });
  };

  const saveAvailability = async (iso, status, note) => {
    const payload = {
      trainer_id: f.id,
      day: iso,
      status,
      note,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('trainer_availability')
      .upsert(payload, { onConflict: 'trainer_id,day' })
      .select()
      .single();

    if (error) {
      console.error(error);
      alert("Enregistrement impossible.");
      return null;
    }

    updateLocalAvailability(iso, data);
    return data;
  };

  const handleCellClick = async (d) => {
    const iso = toISODate(d);
    const current = avail[iso]?.status ?? '';
    const next = STATUS_ORDER[(STATUS_ORDER.indexOf(current) + 1) % STATUS_ORDER.length];

    await saveAvailability(
      iso,
      next,
      avail[iso]?.note ?? ''
    );
  };

  const handleNoteClick = (e, d) => {
    e.stopPropagation();

    const iso = toISODate(d);

    setNoteModal({
      open: true,
      iso,
      text: avail[iso]?.note ?? '',
    });
  };

  const handleSaveNotes = async () => {
    const iso = noteModal.iso;
    if (!iso) return;

    await saveAvailability(
      iso,
      avail[iso]?.status ?? '',
      noteModal.text.trim()
    );

    setNoteModal({
      open: false,
      iso: null,
      text: '',
    });
  };

  const handleDeleteNotes = async () => {
    const iso = noteModal.iso;
    if (!iso) return;

    await saveAvailability(
      iso,
      avail[iso]?.status ?? '',
      ''
    );

    setNoteModal({
      open: false,
      iso: null,
      text: '',
    });
  };

  const frenchMonth = refDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const weekdays = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];

  return (
    <div style={{ padding: '1rem', display:'grid', gap:14, maxWidth:920 }}>
      <h2>Fiche formateur</h2>

      <div style={{display:'grid', gap:8, gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))'}}>
        <Info label="Prénom" value={f.prenom}/>
        <Info label="Nom" value={f.nom}/>
        <Info label="Ville" value={f.ville}/>
        <Info label="Code postal" value={f.codePostal}/>
        <Info label="Statut" value={f.statut}/>
        <Info label="Tarif" value={f.tarif != null ? `${f.tarif} €` : '—'}/>
        <Info label="Téléphone" value={f.telephone || '—'}/>
        <Info label="Email" value={f.email || '—'}/>
        <Info label="Adresse" value={f.adresse || '—'}/>
      </div>

      <Info label="Compétences" value={(f.competences||[]).join(', ') || '—'}/>
      <Info label="Matériel" value={(f.materiel||[]).join(', ') || '—'}/>

      <div>
        <strong>Notes :</strong>
        <div style={{ whiteSpace:'pre-wrap', border:'1px solid #ddd', borderRadius:8, padding:8, marginTop:6 }}>
          {f.notes || '—'}
        </div>
      </div>

      <div style={{display:'flex', gap:8, flexWrap:'wrap', marginTop:8}}>
        <button onClick={() => navigate(`/formateur/edit/${f.id}`)}>Modifier</button>
        <button onClick={() => navigate('/listing')}>Retour</button>
      </div>

      <hr />

      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:8}}>
        <h3 style={{margin:0}}>Disponibilités — {title}</h3>
        <div style={{opacity:0.8, fontSize:13}}>
          Dernière mise à jour : {globalUpdatedAt ? new Date(globalUpdatedAt).toLocaleString('fr-FR') : '—'}
        </div>
      </div>

      <div style={{display:'flex', alignItems:'center', gap:8}}>
        <button onClick={() => setRefDate((d)=>addMonths(d,-1))}>◀️ Mois précédent</button>
        <div style={{minWidth:180, textAlign:'center', fontWeight:600, textTransform:'capitalize'}}>{frenchMonth}</div>
        <button onClick={() => setRefDate((d)=>addMonths(d, 1))}>Mois suivant ▶️</button>
        <button onClick={() => setRefDate(new Date())} style={{marginLeft:'auto'}}>Aujourd’hui</button>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:6}}>
        {weekdays.map((w)=>(
          <div key={w} style={{textAlign:'center', fontWeight:600, padding:'6px 0'}}>{w}</div>
        ))}

        {matrix.flat().map((d)=>{
          const iso = toISODate(d);
          const inMonth = d.getMonth() === refDate.getMonth();
          const cell = avail[iso];
          const status = cell?.status ?? '';
          const note = cell?.note ?? '';
          const bg = STATUS_BG[status] ?? STATUS_BG[''];
          const bd = STATUS_BORDER[status] ?? STATUS_BORDER[''];

          return (
            <button
              key={iso}
              onClick={() => handleCellClick(d)}
              title={`${iso} — ${STATUS_LABEL[status] ?? '—'}${note ? ` — Note : ${note}` : ''}`}
              style={{
                textAlign:'left',
                border:`1px solid ${bd}`,
                background:bg,
                borderRadius:8,
                padding:8,
                minHeight:92,
                opacity: inMonth ? 1 : 0.5,
                cursor:'pointer'
              }}
            >
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline'}}>
                <span style={{fontSize:12, opacity:0.7}}>{iso.slice(-2)}/{iso.slice(5,7)}</span>
                <span style={{fontSize:11, opacity:0.6}}>{STATUS_LABEL[status] ?? '—'}</span>
              </div>

              {note && (
                <div style={{
                  marginTop:6,
                  fontSize:11,
                  lineHeight:1.3,
                  color:'#374151'
                }}>
                  {note.split('\n').filter((line) => line.trim() !== '').map((line, index) => (
                    <div key={index}>📝 {line}</div>
                  ))}
                </div>
              )}

              <div style={{marginTop:8, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <span style={{fontSize:10, opacity:0.55}}>
                  {cell?.updated_at ? `MAJ ${new Date(cell.updated_at).toLocaleDateString('fr-FR')}` : ''}
                </span>

                <span
  onClick={(e) => handleNoteClick(e, d)}
  style={{
    fontSize:11,
    border:'1px solid #d1d5db',
    borderRadius:6,
    padding:'2px 5px',
    background: note ? '#fef3c7' : '#fff',
    color:'#374151',
    fontWeight: note ? 600 : 400
  }}
  title={note ? 'Modifier ou supprimer les notes' : 'Ajouter une note'}
>
  {note
    ? `📝 ${note.split('\n').filter((line) => line.trim() !== '').length} note${note.split('\n').filter((line) => line.trim() !== '').length > 1 ? 's' : ''}`
    : '➕ Note'}
</span>
              </div>
            </button>
          );
        })}
      </div>

      <Legend />

      {noteModal.open && (
        <div
          onClick={() => setNoteModal({ open:false, iso:null, text:'' })}
          style={{
            position:'fixed',
            inset:0,
            background:'rgba(0,0,0,0.35)',
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
            zIndex:9999,
            padding:20
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background:'#fff',
              borderRadius:12,
              padding:18,
              width:'min(520px, 100%)',
              boxShadow:'0 10px 30px rgba(0,0,0,0.2)',
              display:'grid',
              gap:12
            }}
          >
            <h3 style={{margin:0}}>
              Notes du {noteModal.iso ? new Date(noteModal.iso).toLocaleDateString('fr-FR') : ''}
            </h3>

            <div
  style={{
    fontSize:13,
    lineHeight:1.5,
    background:'#f8fafc',
    border:'1px solid #e5e7eb',
    borderRadius:8,
    padding:'10px 12px',
    color:'#374151'
  }}
>
  <strong>💡 Conseils</strong>

  <div style={{marginTop:6}}>
    Une ligne = une information.
  </div>

  <div style={{marginTop:8}}>
    Exemples :
  </div>

  <ul style={{margin:'6px 0 0 18px', padding:0}}>
    <li>Disponible uniquement l'après-midi</li>
    <li>Disponible en distanciel</li>
    <li>Préférer les missions en Île-de-France</li>
  </ul>

  <div style={{marginTop:8}}>
    Pour supprimer une information, il suffit d'effacer sa ligne.
  </div>
</div>

            <textarea
              value={noteModal.text}
              onChange={(e) => setNoteModal((prev) => ({ ...prev, text: e.target.value }))}
              rows={8}
              placeholder={`Exemples :
Disponible uniquement l'après-midi
Préférer secteur Paris
Pas après 17h`}
              style={{
                width:'100%',
                resize:'vertical',
                border:'1px solid #d1d5db',
                borderRadius:8,
                padding:10,
                fontFamily:'inherit',
                fontSize:14
              }}
            />

            <div style={{display:'flex', gap:8, justifyContent:'space-between', flexWrap:'wrap'}}>
              <button
                onClick={handleDeleteNotes}
                style={{
                  border:'1px solid #fecaca',
                  background:'#fee2e2',
                  color:'#991b1b',
                  borderRadius:8,
                  padding:'8px 10px'
                }}
              >
                Supprimer toutes les notes
              </button>

              <div style={{display:'flex', gap:8}}>
                <button
                  onClick={() => setNoteModal({ open:false, iso:null, text:'' })}
                  style={{
                    border:'1px solid #d1d5db',
                    background:'#fff',
                    borderRadius:8,
                    padding:'8px 10px'
                  }}
                >
                  Annuler
                </button>

                <button
                  onClick={handleSaveNotes}
                  style={{
                    border:'1px solid #bbf7d0',
                    background:'#dcfce7',
                    color:'#166534',
                    borderRadius:8,
                    padding:'8px 10px',
                    fontWeight:600
                  }}
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Info({label, value}) {
  return (
    <div style={{display:'grid', gap:4}}>
      <div style={{fontSize:12, opacity:0.7}}>{label}</div>
      <div>{value}</div>
    </div>
  );
}

function Legend(){
  const items = [
    {k:'', label:'Non renseigné', detail:'Aucun statut défini'},
    {k:'dispo', label:'Disponible', detail:'Le formateur est disponible'},
    {k:'indispo', label:'Indisponible', detail:"Le formateur n'est pas disponible"},
  ];

  return (
    <div style={{
      display:'grid',
      gap:12,
      marginTop:8,
      border:'1px solid #d1d5db',
      borderRadius:10,
      padding:14
    }}>
      <strong>Légende :</strong>

      <div style={{display:'flex', gap:12, alignItems:'stretch', flexWrap:'wrap'}}>
        {items.map(({k,label,detail})=>(
          <span key={k} style={{
            display:'grid',
            gap:4,
            border:`1px solid ${STATUS_BORDER[k]}`,
            background: STATUS_BG[k],
            padding:'10px 14px',
            borderRadius:10,
            minWidth:160,
            fontSize:13
          }}>
            <span style={{display:'flex', alignItems:'center', gap:8, fontWeight:600}}>
              <span style={{
                width:12,
                height:12,
                borderRadius:999,
                background:STATUS_BORDER[k]
              }} />
              {label}
            </span>
            <span style={{opacity:0.75}}>{detail}</span>
          </span>
        ))}
      </div>

      <div style={{
        border:'1px solid #bfdbfe',
        background:'#eff6ff',
        borderRadius:8,
        padding:10,
        fontSize:13,
        color:'#1e3a8a'
      }}>
        La mention “En mission” apparaîtra automatiquement lorsqu’une mission sera affectée.
        Le formateur n’a rien à faire : son planning se mettra à jour tout seul.
      </div>

      <div style={{opacity:0.75, fontSize:12}}>
        • Cliquer une case pour changer l’état • Cliquer sur 📝 Note pour ajouter, modifier ou supprimer des notes
      </div>
    </div>
  );
}

async function fetchMonth(trainerId, refDate, setAvail, setGlobalUpdatedAt){
  const from = startOfMonth(refDate);
  const to = endOfMonth(refDate);
  const fromISO = toISODate(from);
  const toISO = toISODate(to);

  const { data, error } = await supabase
    .from('trainer_availability')
    .select('*')
    .eq('trainer_id', trainerId)
    .gte('day', fromISO)
    .lte('day', toISO);

  if (error) {
    console.error('Load availability error:', error);
    return;
  }

  const map = {};
  let maxUpdated = null;

  for (const row of (data || [])){
    map[row.day] = {
      status: row.status,
      note: row.note ?? '',
      updated_at: row.updated_at,
      id: row.id,
    };

    if (!maxUpdated || new Date(row.updated_at) > new Date(maxUpdated)) {
      maxUpdated = row.updated_at;
    }
  }

  setAvail(map);
  setGlobalUpdatedAt(maxUpdated);
}