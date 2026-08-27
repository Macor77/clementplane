export default function ListingHeader({
  onAdd,
  onSearch,
  onImport,
}) {
  return (
    <div className="listing-page__header">
      <div>
        <h1>Formateurs</h1>
        <p>Retrouvez, filtrez et planifiez vos formateurs.</p>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 8,
          alignItems: 'center',
        }}
      >
        <button
          type="button"
          className="button button--compact"
          onClick={onSearch}
        >
          Rechercher un formateur
        </button>

        <button
          type="button"
          className="button button--compact"
          onClick={onImport}
        >
          Importer des formateurs
        </button>

        <button
          type="button"
          className="button button--primary button--compact"
          onClick={onAdd}
        >
          + Ajouter un formateur
        </button>
      </div>
    </div>
  );
}
