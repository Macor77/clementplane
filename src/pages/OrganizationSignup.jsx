import {
  useState,
} from 'react';

import {
  Link,
  useNavigate,
} from 'react-router-dom';

import {
  signUpOrganization,
} from '../services/organizationSignupService';

import './Auth.css';


export default function OrganizationSignup() {
  const navigate =
    useNavigate();

  const [
    form,
    setForm,
  ] = useState({
    firstName: '',
    lastName: '',
    email: '',
    organizationName: '',
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
        !form.organizationName.trim()
      ) {
        setError(
          "Le nom de l'organisme est obligatoire.",
        );

        return;
      }


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


      setSubmitting(
        true,
      );


      try {
        const data =
          await signUpOrganization(
            form,
          );


        if (
          data.session
        ) {
          sessionStorage.setItem(
            'timeforma_active_space',
            'organization',
          );

          navigate(
            '/',
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


        if (
          signupError?.message
            ?.toLowerCase()
            .includes(
              'already registered',
            )
        ) {
          setError(
            'Un compte existe déjà avec cette adresse e-mail. Connectez-vous avec ce compte pour ajouter ensuite un espace organisme.',
          );
        } else {
          setError(
            "Impossible de créer l'organisme pour le moment. Réessayez dans quelques instants.",
          );
        }
      } finally {
        setSubmitting(
          false,
        );
      }
    };


  if (
    confirmationRequired
  ) {
    return (
      <div className="auth-screen">
        <div className="auth-card">

          <div className="auth-brand">
          <img src="/brand/formaplane-logo.svg" alt="Formaplane" />
        </div>


          <p className="auth-eyebrow">
            COMPTE CRÉÉ
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
            Après confirmation, connectez-vous à Formaplane :
            votre organisme sera déjà rattaché à votre compte.
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
          <img src="/brand/formaplane-logo.svg" alt="Formaplane" />
        </div>


        <p className="auth-eyebrow">
          ESPACE ORGANISME
        </p>


        <h1>
          Créer mon organisme
        </h1>


        <p className="auth-muted">
          Créez votre espace Formaplane pour gérer vos formateurs,
          vos missions et votre planning.
        </p>


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
            Nom de l'organisme

            <input
              value={
                form.organizationName
              }
              onChange={
                updateField(
                  'organizationName',
                )
              }
              autoComplete="organization"
              placeholder="Ex. OF Test"
              required
            />
          </label>


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


          <button
            className="auth-button"
            type="submit"
            disabled={
              submitting
            }
          >
            {submitting
              ? 'Création…'
              : 'Créer mon organisme'}
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
            Vous êtes également formateur ?
          </strong>
          {' '}
          Vous n’aurez pas besoin de créer un second compte utilisateur :
          votre espace formateur pourra ensuite être ajouté ou rattaché
          à ce même compte.
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
