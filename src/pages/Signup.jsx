import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { signUpTrainer } from '../services/authService';
import { getSignupErrorMessage } from '../utils/authErrorMessages';

import './Auth.css';


export default function Signup() {
  const navigate =
    useNavigate();

  const [searchParams] =
    useSearchParams();

  const invitedEmail =
    String(searchParams.get('email') || '')
      .trim()
      .toLowerCase();

  const isTrainerInvitation =
    searchParams.get('invitation') === 'trainer' &&
    Boolean(invitedEmail);

  const [
    form,
    setForm,
  ] = useState({
    firstName: '',
    lastName: '',
    email: invitedEmail,
    password: '',
    confirmPassword: '',
  });

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState('');

  const [
    confirmationRequired,
    setConfirmationRequired,
  ] = useState(false);

  const [legalAccepted, setLegalAccepted] = useState(false);


  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showConfirmation,
    setShowConfirmation,
  ] = useState(false);


  const updateField =
    (field) =>
      (event) => {
        setForm(
          (current) => ({
            ...current,
            [field]:
              event.target.value,
          }),
        );
      };


  const handleSubmit =
    async (event) => {
      event.preventDefault();
      setError('');

      if (
        form.password.length <
        8
      ) {
        setError(
          'Le mot de passe doit contenir au moins 8 caractères.',
        );
        return;
      }

      if (
        form.password !==
        form.confirmPassword
      ) {
        setError(
          'Les deux mots de passe ne correspondent pas.',
        );
        return;
      }

      if (!legalAccepted) {
        setError(
          "Vous devez accepter les Conditions générales d’utilisation et avoir pris connaissance de la Politique de confidentialité.",
        );
        return;
      }

      setSubmitting(true);

      try {
        const data =
          await signUpTrainer({
            ...form,
            legalAccepted,
          });

        if (data.session) {
          navigate(
            '/formateur/revendication',
            {
              replace: true,
            },
          );
        } else {
          setConfirmationRequired(
            true,
          );
        }
      } catch (
        signupError
      ) {
        console.error(
          signupError,
        );

        setError(
          getSignupErrorMessage(signupError),
        );
      } finally {
        setSubmitting(false);
      }
    };


  if (
    confirmationRequired
  ) {
    return (
      <div className="auth-screen">
        <div className="auth-card">

          <div className="auth-brand">
          <img src="/brand/clementplane-logo.svg" alt="Clementplane" />
        </div>

          <p className="auth-eyebrow">
            Compte créé
          </p>

          <h1>
            Vérifiez votre e-mail
          </h1>

          <p className="auth-muted">
            Un message de confirmation a été envoyé à{' '}
            <strong>
              {form.email}
            </strong>.
            {' '}
            Après confirmation, revenez sur Clementplane pour vous connecter.
          </p>

          <Link
            className="auth-button auth-button--link"
            to="/connexion"
          >
            Retour à la connexion
          </Link>

        </div>
      </div>
    );
  }


  return (
    <div className="auth-screen">
      <div className="auth-card auth-card--wide">

        <div className="auth-brand">
          <img src="/brand/clementplane-logo.svg" alt="Clementplane" />
        </div>


        <p className="auth-eyebrow">
          ESPACE FORMATEUR
        </p>


        <h1>
          Créer mon compte formateur
        </h1>


        <p className="auth-muted">
          Créez votre compte pour gérer vos disponibilités,
          vos propositions et vos missions.
        </p>

        {isTrainerInvitation ? (
          <div className="auth-alert" style={{ marginBottom: 18 }}>
            <strong>Une fiche Clementplane existe déjà pour vous.</strong>
            <div style={{ marginTop: 6 }}>
              Créez votre compte avec l’adresse <strong>{invitedEmail}</strong>. Après confirmation, Clementplane vous proposera de revendiquer votre fiche existante.
            </div>
          </div>
        ) : null}


        <form
          className="auth-form"
          onSubmit={
            handleSubmit
          }
        >

          <div className="auth-grid">

            <label>
              Prénom

              <input
                value={
                  form.firstName
                }
                onChange={
                  updateField(
                    'firstName',
                  )
                }
                autoComplete="given-name"
                required
              />
            </label>


            <label>
              Nom

              <input
                value={
                  form.lastName
                }
                onChange={
                  updateField(
                    'lastName',
                  )
                }
                autoComplete="family-name"
                required
              />
            </label>

          </div>


          <label>
            Adresse e-mail

            <input
              type="email"
              value={
                form.email
              }
              onChange={
                updateField(
                  'email',
                )
              }
              readOnly={
                isTrainerInvitation
              }
              autoComplete="email"
              required
            />
          </label>


          <div className="auth-grid">

            <label>
              Mot de passe

              <div className="auth-password-field">
                <input
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  value={
                    form.password
                  }
                  onChange={
                    updateField(
                      'password',
                    )
                  }
                  autoComplete="new-password"
                  minLength={
                    8
                  }
                  required
                />

                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (current) =>
                        !current,
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
                  {showPassword
                    ? '◉'
                    : '◌'}
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
                  value={
                    form.confirmPassword
                  }
                  onChange={
                    updateField(
                      'confirmPassword',
                    )
                  }
                  autoComplete="new-password"
                  minLength={
                    8
                  }
                  required
                />

                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() =>
                    setShowConfirmation(
                      (current) =>
                        !current,
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
                  {showConfirmation
                    ? '◉'
                    : '◌'}
                </button>
              </div>
            </label>

          </div>


          {error ? (
            <div className="auth-alert auth-alert--error">
              {error}
            </div>
          ) : null}


          <label className="auth-legal-consent">
            <input
              type="checkbox"
              checked={legalAccepted}
              onChange={(event) => setLegalAccepted(event.target.checked)}
              disabled={submitting}
              required
            />
            <span>
              J’accepte les <Link to="/cgu" target="_blank">Conditions générales d’utilisation</Link>{' '}
              et reconnais avoir pris connaissance de la{' '}
              <Link to="/confidentialite" target="_blank">Politique de confidentialité</Link>.
            </span>
          </label>

          <button
            className="auth-button"
            type="submit"
            disabled={
              submitting
            }
          >
            {submitting
              ? 'Création…'
              : 'Créer mon compte formateur'}
          </button>

        </form>


        <div
          style={{
            marginTop: 18,
            padding: 12,
            border:
              '1px solid #dbeafe',
            borderRadius: 10,
            background:
              '#eff6ff',
            color:
              '#475569',
            fontSize: 13,
            lineHeight: 1.55,
          }}
        >
          <strong
            style={{
              color:
                '#1e3a8a',
            }}
          >
            Vous gérez aussi un organisme de formation ?
          </strong>
          {' '}
          Vous n’aurez pas besoin d’un second compte utilisateur :
          l’espace organisme pourra être rattaché à ce même compte.
        </div>


        <div className="auth-footer">
          <span>
            Vous avez déjà un compte ?
          </span>

          <Link to="/connexion">
            Se connecter
          </Link>
        </div>

      </div>
    </div>
  );
}
