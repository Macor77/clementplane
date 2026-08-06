import { NavLink, Route, Routes } from 'react-router-dom';

import Listing from './pages/Listing';
import FormateurForm from './pages/FormateurForm';
import FormateurView from './pages/FormateurView';
import Missions from './pages/Missions';
import MissionDetail from './pages/MissionDetail';
import MissionForm from './pages/MissionForm';
import MigrateLocal from './pages/MigrateLocal';
import EnvCheck from './pages/EnvCheck';
import Dashboard from './pages/Dashboard';
import Planning from './pages/Planning';
import MapPage from './pages/MapPage';
import Settings from './pages/Settings';

import UserCard from './components/layout/UserCard';

import './App.css';

const navigationItems = [
  { to: '/', label: 'Accueil', icon: '⌂', end: true },
  { to: '/planning', label: 'Planning', icon: '▦' },
  { to: '/missions', label: 'Missions', icon: '▣' },
  { to: '/listing', label: 'Formateurs', icon: '♙' },
  { to: '/carte', label: 'Carte', icon: '⌖' },
  { to: '/parametres', label: 'Paramètres', icon: '⚙' },
];

export default function App() {
  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-brand">
          <span className="app-brand__icon">▦</span>
          <span>
            Time<span>Forma</span>
          </span>
        </div>

        <nav className="app-nav" aria-label="Navigation principale">
          {navigationItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `app-nav__link${isActive ? ' app-nav__link--active' : ''}`
              }
            >
              <span className="app-nav__icon" aria-hidden="true">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="app-sidebar__footer">
          <UserCard />
        </div>
      </aside>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/planning" element={<Planning />} />

          <Route path="/listing" element={<Listing />} />
          <Route path="/formateur/view/:id" element={<FormateurView />} />
          <Route path="/formateur/edit/:id" element={<FormateurForm />} />
          <Route path="/formateur/new" element={<FormateurForm />} />

          <Route path="/missions" element={<Missions />} />
          <Route path="/missions/new" element={<MissionForm />} />
          <Route path="/missions/:id" element={<MissionDetail />} />
          <Route path="/missions/edit/:id" element={<MissionForm />} />

          <Route path="/carte" element={<MapPage />} />
          <Route path="/parametres" element={<Settings />} />

          <Route path="/migrate-local" element={<MigrateLocal />} />
          <Route path="/env-check" element={<EnvCheck />} />
        </Routes>
      </main>
    </div>
  );
}
