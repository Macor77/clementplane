import {
  Routes,
  Route,
  Link,
} from 'react-router-dom';

import Listing from './pages/Listing';
import FormateurForm from './pages/FormateurForm';
import FormateurView from './pages/FormateurView';
import Missions from './pages/Missions';
import MissionForm from './pages/MissionForm';
import MigrateLocal from './pages/MigrateLocal';
import EnvCheck from './pages/EnvCheck';

export default function App() {
  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '16px',
        boxSizing: 'border-box',
        fontFamily: 'Arial, sans-serif',
        background: '#f8fafc',
      }}
    >
      <nav
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 8,
          maxWidth: 1400,
          margin: '0 auto 24px',
          padding: 10,
          border: '1px solid #e4e7ec',
          borderRadius: 10,
          background: '#ffffff',
        }}
      >
        <Link
          to="/listing"
          style={navigationLinkStyle}
        >
          Formateurs
        </Link>

        <Link
          to="/formateur/new"
          style={navigationLinkStyle}
        >
          Ajouter un formateur
        </Link>

        <Link
          to="/missions"
          style={navigationLinkStyle}
        >
          Missions
        </Link>

        <Link
          to="/missions/new"
          style={navigationLinkStyle}
        >
          Créer une mission
        </Link>

        <Link
          to="/env-check"
          style={{
            ...navigationLinkStyle,
            marginLeft: 'auto',
            color: '#067647',
          }}
        >
          🧩 Vérifier Supabase
        </Link>
      </nav>

      <Routes>
        <Route
          path="/"
          element={<Listing />}
        />

        <Route
          path="/listing"
          element={<Listing />}
        />

        <Route
          path="/formateur/view/:id"
          element={<FormateurView />}
        />

        <Route
          path="/formateur/edit/:id"
          element={<FormateurForm />}
        />

        <Route
          path="/formateur/new"
          element={<FormateurForm />}
        />

        <Route
          path="/missions"
          element={<Missions />}
        />

        <Route
          path="/missions/new"
          element={<MissionForm />}
        />

        <Route
          path="/missions/edit/:id"
          element={<MissionForm />}
        />

        <Route
          path="/migrate-local"
          element={<MigrateLocal />}
        />

        <Route
          path="/env-check"
          element={<EnvCheck />}
        />
      </Routes>
    </div>
  );
}

const navigationLinkStyle = {
  padding: '8px 11px',
  borderRadius: 7,
  color: '#344054',
  fontSize: 14,
  fontWeight: 600,
  textDecoration: 'none',
};
