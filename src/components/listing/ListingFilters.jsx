export default function ListingFilters({
  lieu,
  setLieu,
  handleRechercheProximite,
  handleCompleteGps,
  gpsLoading,
  gpsStatus,
  filters,
  setFilters,
  handleStatutChange,
}) {
  return (
    <>
      <div style={{ marginBottom: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Lieu de formation (ville)"
          value={lieu}
          onChange={(e) => setLieu(e.target.value)}
        />

        <button onClick={handleRechercheProximite}>
          Recherche proximité
        </button>

        <button
          type="button"
          onClick={handleCompleteGps}
          disabled={gpsLoading}
        >
          {gpsLoading
            ? "Géolocalisation..."
            : "🔄 Compléter les coordonnées GPS manquantes"}
        </button>
      </div>

      {gpsStatus && (
        <div style={{ marginBottom: 12 }}>
          {gpsStatus}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <input
          type="text"
          placeholder="Filtrer par prénom"
          value={filters.prenom}
          onChange={(e) =>
            setFilters({ ...filters, prenom: e.target.value })
          }
        />

        <input
          type="text"
          placeholder="Filtrer par nom"
          value={filters.nom}
          onChange={(e) =>
            setFilters({ ...filters, nom: e.target.value })
          }
        />

        <input
          type="text"
          placeholder="Filtrer par ville"
          value={filters.ville}
          onChange={(e) =>
            setFilters({ ...filters, ville: e.target.value })
          }
        />

        <input
          type="text"
          placeholder="Filtrer par compétence"
          value={filters.competence}
          onChange={(e) =>
            setFilters({ ...filters, competence: e.target.value })
          }
        />

        <input
          type="text"
          placeholder="Filtrer par matériel"
          value={filters.materiel}
          onChange={(e) =>
            setFilters({ ...filters, materiel: e.target.value })
          }
        />
      </div>

      <fieldset style={{ marginBottom: 12 }}>
        <legend>Filtrer par statut :</legend>

        {["Premium", "Standard", "Inactif", "Black"].map((statut) => (
          <label key={statut} style={{ marginRight: "1rem" }}>
            <input
              type="checkbox"
              value={statut}
              checked={filters.statuts.includes(statut)}
              onChange={handleStatutChange}
            />{" "}
            {statut}
          </label>
        ))}
      </fieldset>
    </>
  );
}