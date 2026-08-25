import React from 'react';
import { reportClientError } from './services/monitoringService';

export default class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    void reportClientError(error, 'react.error_boundary', {
      component_stack: String(info?.componentStack || '').slice(0, 3000),
    });
  }

  render() {
    if (this.state.error) {
      return (
        <main style={{ maxWidth: 720, margin: '80px auto', padding: 24, fontFamily: 'system-ui' }}>
          <h1>Un problème est survenu</h1>
          <p>Formaplane a rencontré une erreur inattendue. Rechargez la page pour réessayer.</p>
          <button type="button" onClick={() => window.location.reload()}>
            Recharger la page
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}
