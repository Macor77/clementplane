import { Link } from 'react-router-dom';

export default function MapPage() {
  return (
    <div className="page-container">
      <header className="page-heading">
        <div>
          <p className="page-eyebrow">Carte</p>
          <h1>Carte des missions</h1>
          <p>Cette vue sera développée au mini-sprint 7.4.</p>
        </div>
      </header>

      <section className="placeholder-card">
        <div className="placeholder-card__icon">⌖</div>
        <h2>Vue géographique à venir</h2>
        <p>
          La carte affichera d’abord les missions, puis pourra accueillir des
          couches supplémentaires pour les formateurs et les clients.
        </p>
        <Link className="button" to="/missions">
          Voir les missions
        </Link>
      </section>
    </div>
  );
}
