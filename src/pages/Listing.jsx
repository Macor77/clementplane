import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const hasValidCoords = (lat, lon) =>
  Number.isFinite(Number(lat)) && Number.isFinite(Number(lon));

const buildGeocodeQueries = (f) => {
  const adresse = (f.adresse || '').toString().trim();
  const codePostal = (f.codePostal || f.code_postal || '').toString().trim();
  const ville = (f.ville || '').toString().trim();

  const queries = [
    [adresse, codePostal, ville, 'France'],
    [codePostal, ville, 'France'],
    [ville, codePostal, 'France'],
    [ville, 'France'],
  ]
    .map((parts) => parts.map((v) => (v || '').toString().trim()).filter(Boolean).join(', '))
    .filter(Boolean);

  return [...new Set(queries)];
};

async function geocodeQuery(query) {
  if (!query.trim()) return null;
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=fr&q=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Géocodage impossible');
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  return { latitude: Number(data[0].lat), longitude: Number(data[0].lon) };
}

async function geocodeTrainer(f) {
  const queries = buildGeocodeQueries(f);

  for (const query of queries) {
    const coords = await geocodeQuery(query);
    if (coords && hasValidCoords(coords.latitude, coords.longitude)) {
      return coords;
    }
    await sleep(1100);
  }

  return null;
}

export default function Listing() {
  const navigate = useNavigate();

  // Données
  const [formateurs, setFormateurs] = useState([]);
  const [filteredFormateurs, setFilteredFormateurs] = useState([]);

  // Filtres / tri / proximité
  const [lieu, setLieu] = useState('');
  const [filters, setFilters] = useState({
    prenom: '',
    nom: '',
    ville: '',
    competence: '',
    materiel: '',
    statuts: [], // Premium, Standard, Inactif, Black (multi)
  });
  const [sort, setSort] = useState({ key: null, dir: 'asc' });

  // Distances
  const [distances, setDistances] = useState(new Map());
  const [gpsStatus, setGpsStatus] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);

  // ---------- CHARGEMENT DEPUIS SUPABASE ----------
  useEffect(() => {
    (async () => {
      console.log('📡 Chargement depuis Supabase...');
      const { data, error } = await supabase
        .from('trainers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erreur Supabase (load):', error);
        return;
      }

      const mapped = (data || []).map((r) => ({
        id: r.id,
        prenom: r.prenom ?? '',
        nom: r.nom ?? '',
        ville: r.ville ?? '',
        codePostal: r.code_postal ?? '',
        adresse: r.adresse ?? '',
        competences: Array.isArray(r.competences) ? r.competences : (r.competences ?? []),
        materiel: Array.isArray(r.materiel) ? r.materiel : (r.materiel ?? []),
        statut: r.statut ?? 'Inactif',
        latitude: r.latitude ?? undefined,
        longitude: r.longitude ?? undefined,
        created_at: r.created_at,
      }));

      setFormateurs(mapped);
      setFilteredFormateurs(mapped);
      setDistances(new Map());
    })();
  }, []);

  // ---------- TRI ----------
  const compareValues = (a, b, key) => {
    const read = (obj) => {
      switch (key) {
        case 'codePostal': return obj.codePostal ?? '';
        case 'prenom': return (obj.prenom ?? '').toLowerCase();
        case 'nom': return (obj.nom ?? '').toLowerCase();
        case 'ville': return (obj.ville ?? '').toLowerCase();
        case 'statut': return (obj.statut ?? '').toLowerCase();
        case 'distance': {
          const d = distances.get(obj);
          return d === '-' || d === undefined ? null : Number(d);
        }
        default: return (obj[key] ?? '').toString().toLowerCase();
      }
    };

    const va = read(a), vb = read(b);
    const empty = (v) => v === null || v === undefined || v === '';
    if (empty(va) && !empty(vb)) return 1;
    if (!empty(va) && empty(vb)) return -1;
    if (empty(va) && empty(vb)) return 0;
    if (typeof va === 'number' && typeof vb === 'number') return va - vb;
    return String(va).localeCompare(String(vb), 'fr', { sensitivity: 'base' });
  };

  const sortList = (list) => {
    if (!sort.key) return list;
    const arr = [...list].sort((a, b) => compareValues(a, b, sort.key));
    return sort.dir === 'asc' ? arr : arr.reverse();
  };

  const toggleSort = (key) => {
    setSort((prev) => ({
      key,
      dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc',
    }));
  };

  // ---------- FILTRES + TRI ----------
  useEffect(() => {
    const f = formateurs.filter((f) => {
      const compStr = (Array.isArray(f.competences) ? f.competences.join(', ') : (f.competences || '')).toLowerCase();
      const matStr  = (Array.isArray(f.materiel)    ? f.materiel.join(', ')    : (f.materiel    || '')).toLowerCase();

      return (
        (f.prenom ?? '').toLowerCase().includes(filters.prenom.toLowerCase()) &&
        (f.nom ?? '').toLowerCase().includes(filters.nom.toLowerCase()) &&
        (f.ville ?? '').toLowerCase().includes(filters.ville.toLowerCase()) &&
        compStr.includes(filters.competence.toLowerCase()) &&
        matStr.includes(filters.materiel.toLowerCase()) &&
        (filters.statuts.length === 0 || filters.statuts.includes(f.statut))
      );
    });

    setFilteredFormateurs(sortList(f));
  }, [filters, formateurs, sort, distances]);

  // ---------- SUPPRIMER ----------
  const handleDelete = async (id) => {
    if (!id) return;
    const f = formateurs.find((x) => x.id === id);
    const label = f ? `${f.prenom || ''} ${f.nom || ''}`.trim() : 'ce formateur';

    const ok = window.confirm(`Voulez-vous vraiment supprimer ${label} ?\nCette action est définitive.`);
    if (!ok) return;

    const { error } = await supabase.from('trainers').delete().eq('id', id);
    if (error) {
      console.error('❌ Erreur Supabase (delete):', error);
      alert("Suppression échouée (voir console).");
      return;
    }

    const updated = formateurs.filter((x) => x.id !== id);
    setFormateurs(updated);
    setDistances(new Map());
  };

  // ---------- PROXIMITÉ ----------
  const distanceKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  const computeDistances = async (city) => {
    if (!city) { setDistances(new Map()); return; }

    const target = await geocodeQuery(`${city}, France`);
    if (!target || !hasValidCoords(target.latitude, target.longitude)) {
      alert("Lieu de formation introuvable. Essaie avec 'Ville + code postal'.");
      return;
    }

    const newMap = new Map();
    for (const f of formateurs) {
      if (hasValidCoords(f.latitude, f.longitude)) {
        const d = distanceKm(
          Number(target.latitude),
          Number(target.longitude),
          Number(f.latitude),
          Number(f.longitude)
        );
        newMap.set(f, Number(d.toFixed(2)));
      } else {
        newMap.set(f, '-');
      }
    }
    setDistances(new Map(newMap));
  };

  const handleRechercheProximite = async () => {
    await computeDistances(lieu);
    if (sort.key === 'distance') setSort((prev) => ({ ...prev }));
  };

  const handleCompleteGps = async () => {
    const missing = formateurs.filter((f) => !hasValidCoords(f.latitude, f.longitude));

    if (missing.length === 0) {
      alert('Tous les formateurs ont déjà des coordonnées GPS.');
      setGpsStatus('Tous les formateurs ont déjà des coordonnées GPS.');
      return;
    }

    const ok = window.confirm(
      `Compléter les coordonnées GPS de ${missing.length} formateur(s) ?\n\n` +
      `Le logiciel va utiliser l’adresse, le code postal et/ou la ville.\n` +
      `L’opération peut prendre quelques minutes.`
    );

    if (!ok) return;

    setGpsLoading(true);
    setGpsStatus(`Géocodage en cours : 0 / ${missing.length}`);

    let updatedCount = 0;
    let notFoundCount = 0;
    const notFound = [];

    for (let i = 0; i < missing.length; i += 1) {
      const f = missing[i];
      setGpsStatus(`Géocodage en cours : ${i + 1} / ${missing.length} — ${f.prenom || ''} ${f.nom || ''}`);

      try {
        const coords = await geocodeTrainer(f);

        if (!coords || !hasValidCoords(coords.latitude, coords.longitude)) {
          notFoundCount += 1;
          notFound.push(`${f.prenom || ''} ${f.nom || ''}`.trim());
        } else {
          const { error } = await supabase
            .from('trainers')
            .update({
              latitude: coords.latitude,
              longitude: coords.longitude,
            })
            .eq('id', f.id);

          if (error) {
            console.error('Erreur MAJ GPS Supabase:', f, error);
            notFoundCount += 1;
            notFound.push(`${f.prenom || ''} ${f.nom || ''}`.trim());
          } else {
            updatedCount += 1;

            setFormateurs((prev) => prev.map((x) => (
              x.id === f.id
                ? { ...x, latitude: coords.latitude, longitude: coords.longitude }
                : x
            )));
          }
        }
      } catch (error) {
        console.error('Erreur géocodage:', f, error);
        notFoundCount += 1;
        notFound.push(`${f.prenom || ''} ${f.nom || ''}`.trim());
      }

      await sleep(1100);
    }

    setGpsLoading(false);
    setGpsStatus(`Terminé : ${updatedCount} coordonnée(s) ajoutée(s), ${notFoundCount} introuvable(s).`);

    let message = `Coordonnées GPS ajoutées : ${updatedCount}\nIntrouvables : ${notFoundCount}`;

    if (notFound.length > 0) {
      message += `\n\nÀ vérifier manuellement :\n- ${notFound.join('\n- ')}`;
    }

    alert(message);
  };

  useEffect(() => { if (lieu) computeDistances(lieu); }, [formateurs]); // eslint-disable-line

  // ---------- UI HELPERS ----------
  const handleStatutChange = (e) => {
    const value = e.target.value;
    setFilters((prev) => {
      const statuts = prev.statuts.includes(value)
        ? prev.statuts.filter((s) => s !== value)
        : [...prev.statuts, value];
      return { ...prev, statuts };
    });
  };

  const SortHeader = ({ label, colKey }) => {
    const active = sort.key === colKey;
    const arrow = !active ? '↕' : sort.dir === 'asc' ? '▲' : '▼';
    return (
      <button
        type="button"
        onClick={() => toggleSort(colKey)}
        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        title={`Trier par ${label.toLowerCase()}`}
      >
        {label} {arrow}
      </button>
    );
  };

  const renderList = (value) => Array.isArray(value) ? value.join(', ') : (value || '');

  // ---------- RENDER ----------
  return (
    <div style={{ padding: '1rem' }}>
      <h2>Liste des formateurs</h2>

      {/* Bouton ajouter */}
      <div style={{ marginBottom: 12 }}>
        <button onClick={() => navigate('/formateur/new')}>Ajouter un formateur</button>
      </div>

      {/* Proximité */}
      <div style={{ marginBottom: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Lieu de formation (ville)"
          value={lieu}
          onChange={(e) => setLieu(e.target.value)}
        />
        <button onClick={handleRechercheProximite}>Recherche proximité</button>
        <button
  type="button"
  onClick={handleCompleteGps}
  disabled={gpsLoading}
>
  {gpsLoading ? "Géolocalisation..." : "🔄 Compléter les coordonnées GPS manquantes"}
</button>
</div>
      {gpsStatus && (
        <div style={{ marginBottom: 12 }}>
          {gpsStatus}
        </div>
      )}

      {/* Filtres texte */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <input type="text" placeholder="Filtrer par prénom" onChange={(e) => setFilters({ ...filters, prenom: e.target.value })} />
        <input type="text" placeholder="Filtrer par nom" onChange={(e) => setFilters({ ...filters, nom: e.target.value })} />
        <input type="text" placeholder="Filtrer par ville" onChange={(e) => setFilters({ ...filters, ville: e.target.value })} />
        <input type="text" placeholder="Filtrer par compétence" onChange={(e) => setFilters({ ...filters, competence: e.target.value })} />
        <input type="text" placeholder="Filtrer par matériel" onChange={(e) => setFilters({ ...filters, materiel: e.target.value })} />
      </div>

      {/* Filtre multi-statuts */}
      <fieldset style={{ marginBottom: 12 }}>
        <legend>Filtrer par statut :</legend>
        {['Premium', 'Standard', 'Inactif', 'Black'].map((statut) => (
          <label key={statut} style={{ marginRight: '1rem' }}>
            <input
              type="checkbox"
              value={statut}
              checked={filters.statuts.includes(statut)}
              onChange={handleStatutChange}
            />{' '}
            {statut}
          </label>
        ))}
      </fieldset>

      {/* Tableau */}
      <table>
        <thead>
          <tr>
            <th><SortHeader label="Prénom" colKey="prenom" /></th>
            <th><SortHeader label="Nom" colKey="nom" /></th>
            <th>Compétences</th>
            <th>Matériel</th>
            <th><SortHeader label="Statut" colKey="statut" /></th>
            <th><SortHeader label="Code Postal" colKey="codePostal" /></th>
            <th><SortHeader label="Distance (km)" colKey="distance" /></th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredFormateurs.map((f) => {
            const d = distances.get(f);
            return (
              <tr key={f.id}>
                <td>{f.prenom}</td>
                <td>{f.nom}</td>
                <td>{renderList(f.competences)}</td>
                <td>{renderList(f.materiel)}</td>
                <td>{f.statut}</td>
                <td>{f.codePostal}</td>
                <td>{typeof d === 'number' ? d.toFixed(2) : d || '-'}</td>
                <td>
                  <button onClick={() => navigate(`/formateur/view/${f.id}`)} disabled={!f.id}>Voir</button>{' '}
                  <button onClick={() => navigate(`/formateur/edit/${f.id}`)} disabled={!f.id}>Modifier</button>{' '}
                  <button onClick={() => handleDelete(f.id)} disabled={!f.id}>Supprimer</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
