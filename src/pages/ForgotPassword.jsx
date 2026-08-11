import { useState } from 'react';
import { Link } from 'react-router-dom';
import { requestPasswordReset } from '../services/authService';
import './Auth.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (resetError) {
      console.error(resetError);
      setError("Impossible d'envoyer l'e-mail de réinitialisation pour le moment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-brand">Time<span>Forma</span></div>
        <p className="auth-eyebrow">Mot de passe oublié</p>
        <h1>Réinitialiser votre mot de passe</h1>
        <p className="auth-muted">
          Indiquez l'adresse e-mail utilisée pour votre compte TimeForma. Nous vous enverrons un lien sécurisé.
        </p>

        {sent ? (
          <>
            <div className="auth-alert auth-alert--success">
              Si un compte TimeForma correspond à cette adresse, un e-mail de réinitialisation vient d'être envoyé.
            </div>
            <div className="auth-footer">
              <Link to="/connexion">Retour à la connexion</Link>
            </div>
          </>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              Adresse e-mail
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
                autoFocus
              />
            </label>

            {error ? <div className="auth-alert auth-alert--error">{error}</div> : null}

            <button className="auth-button" type="submit" disabled={submitting}>
              {submitting ? 'Envoi…' : 'Envoyer le lien de réinitialisation'}
            </button>
          </form>
        )}

        {!sent ? (
          <div className="auth-footer">
            <Link to="/connexion">Retour à la connexion</Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
