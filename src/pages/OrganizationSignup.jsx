import {
  useEffect,
  useState,
} from 'react';

import {
  Link,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';

import {
  signUpOrganization,
} from '../services/organizationSignupService';

import {
  getPublicTrainerOrganizationInvitation,
} from '../services/trainerOrganizationsService';

import { getSignupErrorMessage } from '../utils/authErrorMessages';

import './Auth.css';


export default function OrganizationSignup() {
  const navigate =
    useNavigate();

  const [searchParams] =
    useSearchParams();

  const invitationToken =
    String(searchParams.get('invitation') || '').trim();

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

  const [legalAccepted, setLegalAccepted] = useState(false);

  const [
    invitationTrainerName,
    setInvitationTrainerName,
  ] = useState('');


  useEffect(() => {
    let active = true;

    async function loadInvitation() {
      if (!invitationToken) return;

      try {
        const invitation =
          await getPublicTrainerOrganizationInvitation(
            invitationToken,
          );

        if (!active || !invitation) return;

        setInvitationTrainerName(
          [
            invitation.trainer_first_name,
            invitation.trainer_last_name,
          ]
            .filter(Boolean)
            .join(' ')
            .trim(),
        );

        setForm((current) => ({
          ...current,
          email:
            current.email ||
            invitation.recipient_email ||
            '',
          organizationName:
            current.organizationName ||
            invitation.organization_name ||
            '',
        }));
      } catch (invitationError) {
        console.warn(
          "Invitation OF non chargée pour préremplissage :",
          invitationError,
        );
      }
    }

    loadInvitation();

    return () => {
      active = false;
    };
  }, [invitationToken]);


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


      if (!legalAccepted) {
        setError(
          "Vous devez accepter les Conditions générales d’utilisation et avoir pris connaissance de la Politique de confidentialité.",
        );
        return;
      }


      setSubmitting(
        true,
      );


      try {
        const data =
          await signUpOrganization({
            ...form,
            emailRedirectTo:
              invitationToken
                ? `${window.location.origin}/invitation-of/${encodeURIComponent(invitationToken)}`
                : null,
            legalAccepted,
          });


        if (
          data.session
        ) {
          sessionStorage.setItem(
            'timeforma_active_space',
            'organization',
          );

          navigate(
            invitationToken
              ? `/invitation-of/${encodeURIComponent(invitationToken)}`
              : '/',
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


        const signupMessage = getSignupErrorMessage(
          signupError,
          "Impossible de créer l'organisme pour le moment. Réessayez dans quelques instants.",
        );
        setError(
          signupMessage === 'Un compte existe déjà avec cette adresse e-mail.'
            ? 'Un compte existe déjà avec cette adresse e-mail. Connectez-vous avec ce compte pour ajouter ensuite un espace organisme.'
            : signupMessage,
        );
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
          <img src="/brand/clementplane-logo.svg" alt="Clementplane" />
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
            Après confirmation, Clementplane vous ramènera dans le parcours d’invitation
            {invitationTrainerName ? ` de ${invitationTrainerName}` : ''}. Votre organisme sera déjà rattaché à votre compte.
          </p>


          <Link
            className="auth-button auth-button--link"
            to={invitationToken ? `/connexion?invitation=${encodeURIComponent(invitationToken)}` : '/connexion'}
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
          ESPACE ORGANISME
        </p>


        <h1>
          Créer mon organisme
        </h1>


        <p className="auth-muted">
          Créez votre espace Clementplane pour gérer vos formateurs,
          vos missions et votre planning.
        </p>

        {invitationTrainerName ? (
          <div className="auth-alert" style={{ background: '#eff6ff', color: '#1e3a8a', border: '1px solid #bfdbfe' }}>
            Invitation de <strong>{invitationTrainerName}</strong> : après votre inscription, vous arriverez directement sur sa fiche.
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

          {error && invitationToken ? (
            <Link
              to={`/connexion?invitation=${encodeURIComponent(invitationToken)}`}
              style={{ color: '#2563eb', fontWeight: 800, textDecoration: 'none' }}
            >
              J’ai déjà un compte : me connecter
            </Link>
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
