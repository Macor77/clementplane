import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signOutCurrentUser, updateCurrentUserPassword } from '../services/authService';
import './Auth.css';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    if (password !== confirmation) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setSubmitting(true);

    try {
      await updateCurrentUserPassword(password);
      await signOutCurrentUser();

      setSuccess(true);

      window.setTimeout(
        () =>
          navigate(
            '/connexion',
            { replace: true },
          ),
        1200,
      );
    } catch (updateError) {
      console.error(updateError);

      const message =
        String(
          updateError?.message || '',
        ).toLowerCase();

      if (
        message.includes(
          'new password should be different from the old password',
        ) ||
        message.includes(
          'different from the old password',
        )
      ) {
        setError(
          'Ce mot de passe est identique à votre mot de passe actuel. Veuillez en choisir un nouveau.',
        );
      } else if (
        message.includes('expired') ||
        message.includes('invalid') ||
        message.includes('session')
      ) {
        setError(
          "Le lien de réinitialisation n'est plus valide. Demandez-en un nouveau.",
        );
      } else {
        setError(
          "Impossible de modifier le mot de passe pour le moment. Réessayez dans quelques instants.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="auth-screen">
        <div className="auth-card auth-card--compact">
          <div className="auth-brand">
          <img src="/brand/clementplane-logo.svg" alt="Clementplane" />
        </div>

          <p className="auth-muted">
            Validation du lien sécurisé…
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !success) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <div className="auth-brand">
          <img src="/brand/clementplane-logo.svg" alt="Clementplane" />
        </div>

          <p className="auth-eyebrow">
            Lien invalide
          </p>

          <h1>
            Ce lien n'est plus utilisable
          </h1>

          <p className="auth-muted">
            Le lien de réinitialisation est invalide ou a expiré.
            Vous pouvez demander un nouvel e-mail.
          </p>

          <Link
            className="auth-button auth-button--link"
            to="/mot-de-passe-oublie"
          >
            Demander un nouveau lien
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-brand">
          <img src="/brand/clementplane-logo.svg" alt="Clementplane" />
        </div>

        <p className="auth-eyebrow">
          Sécurité
        </p>

        <h1>
          Choisissez un nouveau mot de passe
        </h1>

        <p className="auth-muted">
          Votre nouveau mot de passe doit contenir au moins 8 caractères.
        </p>

        {success ? (
          <div className="auth-alert auth-alert--success">
            Votre mot de passe a été modifié. Redirection vers la connexion…
          </div>
        ) : (
          <form
            className="auth-form"
            onSubmit={handleSubmit}
          >
            <label>
              Nouveau mot de passe

              <div className="auth-password-field">
                <input
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  autoComplete="new-password"
                  minLength={8}
                  required
                  autoFocus
                />

                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (current) => !current,
                    )
                  }
                  aria-label={
                    showPassword
                      ? 'Masquer le mot de passe'
                      : 'Afficher le mot de passe'
                  }
                  title={
                    showPassword
                      ? 'Masquer le mot de passe'
                      : 'Afficher le mot de passe'
                  }
                >
                  {showPassword ? '◉' : '◌'}
                </button>
              </div>
            </label>

            <label>
              Confirmer le mot de passe

              <div className="auth-password-field">
                <input
                  type={
                    showConfirmation
                      ? 'text'
                      : 'password'
                  }
                  value={confirmation}
                  onChange={(event) =>
                    setConfirmation(event.target.value)
                  }
                  autoComplete="new-password"
                  minLength={8}
                  required
                />

                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() =>
                    setShowConfirmation(
                      (current) => !current,
                    )
                  }
                  aria-label={
                    showConfirmation
                      ? 'Masquer la confirmation du mot de passe'
                      : 'Afficher la confirmation du mot de passe'
                  }
                  title={
                    showConfirmation
                      ? 'Masquer la confirmation du mot de passe'
                      : 'Afficher la confirmation du mot de passe'
                  }
                >
                  {showConfirmation ? '◉' : '◌'}
                </button>
              </div>
            </label>

            {error ? (
              <div className="auth-alert auth-alert--error">
                {error}
              </div>
            ) : null}

            <button
              className="auth-button"
              type="submit"
              disabled={submitting}
            >
              {submitting
                ? 'Modification…'
                : 'Enregistrer le nouveau mot de passe'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
