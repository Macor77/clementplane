import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { profile, displayName, loading } = useAuth();
  const firstName = profile?.first_name || displayName?.split(' ')[0] || null;
  const greeting = loading ? 'Bonjour' : `Bonjour${firstName ? ` ${firstName}` : ''}`;

  return (
    <div className="page-container of-dashboard-page">
      <header className="page-heading">
        <div>
          <p className="page-eyebrow">Accueil</p>
          <h1>{greeting}</h1>
          <p>Le tableau de bord détaillé sera développé au mini-sprint 7.3.</p>
        </div>
        <Link className="button button--primary" to="/missions/new">
          + Nouvelle mission
        </Link>
      </header>

      <section className="dashboard-grid">
        <article className="dashboard-card dashboard-card--accent">
          <span className="dashboard-card__label">Planning opérationnel</span>
          <h2>Visualiser le mois</h2>
          <p>
            Consulte les missions, les formateurs affectés et les informations
            manquantes depuis la nouvelle vue mensuelle.
          </p>
          <Link to="/planning">Ouvrir le planning →</Link>
        </article>

        <article className="dashboard-card">
          <span className="dashboard-card__label">Missions</span>
          <h2>Gérer les missions</h2>
          <p>Recherche, ouvre, modifie ou crée une mission.</p>
          <Link to="/missions">Voir toutes les missions →</Link>
        </article>

        <article className="dashboard-card">
          <span className="dashboard-card__label">Formateurs</span>
          <h2>Rechercher un formateur</h2>
          <p>Retrouve le listing, les disponibilités et les distances.</p>
          <Link to="/listing">Voir les formateurs →</Link>
        </article>
      </section>
    </div>
  );
}
