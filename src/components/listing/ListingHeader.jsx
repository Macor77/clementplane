import { Link } from 'react-router-dom';
export default function ListingHeader() {
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
        <Link
          className="button button--compact"
          to="/formateurs/recherche"
        >
          Rechercher un formateur
        </Link>

        <Link
          className="button button--compact"
          to="/formateurs/import"
        >
          Importer des formateurs
        </Link>

        <Link
          className="button button--primary button--compact"
          to="/formateur/new"
        >
          + Ajouter un formateur
        </Link>
      </div>
    </div>
  );
}
