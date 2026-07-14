export default function ListingFilters({
  lieu,
  setLieu,
  recognizedPlace,
  handleCalculateDistances,
  handleCompleteGps,
  gpsLoading,
  gpsStatus,
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
  const hasActiveFilters =
    filters.recherche.trim() !== '' ||
    filters.competence.trim() !== '' ||
    filters.materiel.trim() !== '' ||
    filters.statuts.length > 0 ||
    filters.disponibilite !== 'all';

  const updateFilter = (key, value) => {
    setFilters((previousFilters) => ({
      ...previousFilters,
      [key]: value,
    }));
  };

  const handleAvailabilityChange = (
    event
  ) => {
    const value = event.target.value;

    setFilters((previousFilters) => ({
      ...previousFilters,
      disponibilite: value,
      dateDisponibilite:
        value === 'date'
          ? previousFilters.dateDisponibilite
          : '',
    }));
  };

  const handlePlaceKeyDown = (event) => {
    if (
      event.key === 'Enter' &&
      !distanceLoading
    ) {
      event.preventDefault();
      handleCalculateDistances();
    }
  };

  return (
    <>
      <div
        style={{
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <input
          type="search"
          placeholder="Lieu de formation : ville ou code postal"
          aria-label="Lieu de formation"
          value={lieu ?? ''}
          onChange={(event) =>
            setLieu(event.target.value)
          }
          onKeyDown={handlePlaceKeyDown}
          disabled={distanceLoading}
          style={{
            minWidth: 280,
            flex: '1 1 340px',
            maxWidth: 500,
          }}
        />

        <button
          type="button"
          onClick={handleCalculateDistances}
          disabled={
            distanceLoading ||
            String(lieu ?? '').trim() === ''
          }
        >
          {distanceLoading
            ? 'Calcul des distances...'
            : 'Calculer les distances'}
        </button>

        <button
          type="button"
          onClick={handleCompleteGps}
          disabled={
            gpsLoading || distanceLoading
          }
        >
          {gpsLoading
            ? 'Géolocalisation...'
            : '🔄 Compléter les coordonnées GPS manquantes'}
        </button>
      </div>

      {recognizedPlace?.label &&
        !distanceLoading &&
        !distanceError && (
          <div
            style={{
              marginBottom: 12,
              padding: '10px 12px',
              border: '1px solid #bbf7d0',
              borderRadius: 8,
              background: '#f0fdf4',
              color: '#166534',
              fontSize: 14,
              lineHeight: 1.45,
              maxWidth: 620,
            }}
          >
            <div
              style={{
                fontWeight: 600,
              }}
            >
              📍 Lieu reconnu :
            </div>

            <div
              style={{
                fontWeight: 700,
              }}
            >
              {recognizedPlace.label}
            </div>
          </div>
        )}

      {distanceError && (
        <div
          role="alert"
          style={{
            marginBottom: 12,
            padding: '10px 12px',
            border: '1px solid #fecaca',
            borderRadius: 8,
            background: '#fef2f2',
            color: '#b91c1c',
            fontSize: 13,
            lineHeight: 1.45,
            maxWidth: 620,
          }}
        >
          {distanceError}
        </div>
      )}

      {gpsStatus && (
        <div style={{ marginBottom: 12 }}>
          {gpsStatus}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
          marginBottom: 12,
        }}
      >
        <input
          type="search"
          placeholder="Nom, prénom, ville ou code postal"
          aria-label="Filtrer par nom, prénom, ville ou code postal"
          value={filters.recherche}
          onChange={(event) =>
            updateFilter(
              'recherche',
              event.target.value
            )
          }
          style={{
            minWidth: 260,
            flex: '1 1 300px',
            maxWidth: 420,
          }}
        />

        <input
          type="search"
          placeholder="Compétence"
          aria-label="Filtrer par compétence"
          value={filters.competence}
          onChange={(event) =>
            updateFilter(
              'competence',
              event.target.value
            )
          }
          style={{
            minWidth: 180,
            flex: '1 1 220px',
            maxWidth: 300,
          }}
        />

        <input
          type="search"
          placeholder="Matériel"
          aria-label="Filtrer par matériel"
          value={filters.materiel}
          onChange={(event) =>
            updateFilter(
              'materiel',
              event.target.value
            )
          }
          style={{
            minWidth: 180,
            flex: '1 1 220px',
            maxWidth: 300,
          }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
          marginBottom: 12,
        }}
      >
        <label htmlFor="availability-filter">
          <strong>Disponibilité :</strong>
        </label>

        <select
          id="availability-filter"
          value={filters.disponibilite}
          onChange={handleAvailabilityChange}
        >
          <option value="all">
            Toutes
          </option>

          <option value="today">
            Disponible aujourd’hui
          </option>

          <option value="week">
            Disponible cette semaine
          </option>

          <option value="date">
            Disponible à une date précise
          </option>
        </select>

        {filters.disponibilite ===
          'date' && (
          <input
            type="date"
            aria-label="Date de disponibilité recherchée"
            value={
              filters.dateDisponibilite
            }
            onChange={(event) =>
              updateFilter(
                'dateDisponibilite',
                event.target.value
              )
            }
          />
        )}

        {availabilityLoading && (
          <span
            style={{
              fontSize: 13,
              color: '#6b7280',
            }}
          >
            Vérification des disponibilités…
          </span>
        )}

        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
          >
            Effacer les filtres
          </button>
        )}

        <strong
          style={{
            whiteSpace: 'nowrap',
          }}
        >
          {resultCount} formateur
          {resultCount > 1 ? 's' : ''}

          {resultCount !== totalCount
            ? ` sur ${totalCount}`
            : ''}
        </strong>
      </div>

      {availabilityError && (
        <div
          style={{
            marginBottom: 12,
            color: '#b91c1c',
            fontSize: 13,
          }}
        >
          {availabilityError}
        </div>
      )}

      <fieldset style={{ marginBottom: 12 }}>
        <legend>
          Filtrer par statut :
        </legend>

        {[
          'Premium',
          'Standard',
          'Inactif',
          'Black',
        ].map((statut) => (
          <label
            key={statut}
            style={{
              marginRight: '1rem',
            }}
          >
            <input
              type="checkbox"
              value={statut}
              checked={filters.statuts.includes(
                statut
              )}
              onChange={
                handleStatutChange
              }
            />{' '}
            {statut}
          </label>
        ))}
      </fieldset>
    </>
  );
}