export default function ListingFilters({
  lieu,
  setLieu,
  recognizedPlace,
  handleCalculateDistances,
  distanceLoading,
  distanceError,
  filters,
  setFilters,
  handleStatutChange,
  resetFilters,
  resultCount,
  totalCount,
  availabilityLoading,
  availabilityError,
}) {
  const active =
    filters.recherche.trim() ||
    filters.competence.trim() ||
    filters.materiel.trim() ||
    filters.statuts.length ||
    filters.disponibilite !== 'all';

  const update = (key, value) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const availabilityChange = (event) => {
    const value = event.target.value;

    setFilters((prev) => ({
      ...prev,
      disponibilite: value,
      dateDisponibilite:
        value === 'date' ? prev.dateDisponibilite : '',
    }));
  };

  const submitPlace = (event) => {
    if (event.key !== 'Enter' || distanceLoading) return;

    event.preventDefault();
    event.currentTarget.blur();
  };

  return (
    <section className="listing-filters">
      <div className="listing-place-search">
        <input
          className="compact-control listing-filters__place"
          type="search"
          placeholder="Lieu de formation : ville ou code postal"
          value={lieu ?? ''}
          onChange={(event) => setLieu(event.target.value)}
          onKeyDown={submitPlace}
          onBlur={() => {
            if (!distanceLoading && String(lieu ?? '').trim()) {
              handleCalculateDistances();
            }
          }}
          disabled={distanceLoading}
        />
        <span className="listing-place-search__state" aria-live="polite">
          {distanceLoading ? 'Calcul en cours…' : 'Entrée ou sortie du champ pour calculer'}
        </span>
      </div>

      {recognizedPlace?.label && !distanceLoading && !distanceError && (
        <div className="listing-message listing-message--success">
          <strong>Lieu reconnu :</strong> {recognizedPlace.label}
        </div>
      )}

      {distanceError && (
        <div className="listing-message listing-message--error">
          {distanceError}
        </div>
      )}

      <div className="listing-filters__row listing-filters__row--search">
        <input
          className="compact-control"
          type="search"
          placeholder="Nom, prénom, ville ou code postal"
          value={filters.recherche}
          onChange={(event) => update('recherche', event.target.value)}
        />
        <input
          className="compact-control"
          type="search"
          placeholder="Compétence"
          value={filters.competence}
          onChange={(event) => update('competence', event.target.value)}
        />
        <input
          className="compact-control"
          type="search"
          placeholder="Matériel"
          value={filters.materiel}
          onChange={(event) => update('materiel', event.target.value)}
        />
        <select
          className="compact-control"
          value={filters.disponibilite}
          onChange={availabilityChange}
        >
          <option value="all">Toutes les disponibilités</option>
          <option value="today">Disponible aujourd’hui</option>
          <option value="week">Disponible cette semaine</option>
          <option value="date">Disponible à une date précise</option>
        </select>
        {filters.disponibilite === 'date' && (
          <input
            className="compact-control"
            type="date"
            value={filters.dateDisponibilite}
            onChange={(event) => update('dateDisponibilite', event.target.value)}
          />
        )}
      </div>

      <div className="listing-filters__footer">
        <div className="listing-statuses">
          {['Premium', 'Standard', 'Inactif', 'Black'].map((status) => (
            <label
              key={status}
              className={`listing-status-filter listing-status-filter--${status.toLowerCase()}`}
            >
              <input
                type="checkbox"
                value={status}
                checked={filters.statuts.includes(status)}
                onChange={handleStatutChange}
              />
              <span>{status}</span>
            </label>
          ))}
        </div>

        <div className="listing-filters__summary">
          {availabilityLoading && <span>Vérification des disponibilités…</span>}
          {availabilityError && <span className="text-error">{availabilityError}</span>}
          {active && (
            <button
              className="button button--compact"
              type="button"
              onClick={resetFilters}
            >
              Effacer les filtres
            </button>
          )}
          <strong>
            {resultCount} formateur{resultCount > 1 ? 's' : ''}
            {resultCount !== totalCount ? ` sur ${totalCount}` : ''}
          </strong>
        </div>
      </div>
    </section>
  );
}
