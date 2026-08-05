export default function ListingHeader({ onAdd }) {
  return (
    <div className="listing-page__header">
      <div>
        <h1>Formateurs</h1>
        <p>Retrouvez, filtrez et planifiez vos formateurs.</p>
      </div>
      <button className="button button--primary button--compact" onClick={onAdd}>
        + Ajouter un formateur
      </button>
    </div>
  );
}
