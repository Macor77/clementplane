import { useState } from 'react';
import {
  Link,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import { supabase } from '../lib/supabaseClient';
import './Auth.css';


export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');


  const handleSubmit =
    async (event) => {
      event.preventDefault();

      setLoading(true);
      setError('');

      try {
        const {
          error: signInError,
        } =
          await supabase.auth.signInWithPassword({
            email:
              email.trim(),
            password,
          });

        if (signInError) {
          throw signInError;
        }

        const destination =
          typeof location.state?.from === 'string' &&
          location.state.from.startsWith('/')
            ? location.state.from
            : '/';

        navigate(
          destination,
          {
            replace: true,
          },
        );
      } catch (
        signInError
      ) {
        console.error(
          signInError,
        );

        setError(
          'Adresse e-mail ou mot de passe incorrect.',
        );
      } finally {
        setLoading(false);
      }
    };


  return (
    <div className="auth-screen">
      <div className="auth-card">

        <div className="auth-brand">
          <img src="/brand/formaplane-logo.svg" alt="Formaplane" />
        </div>


        <p className="auth-eyebrow">
          CONNEXION
        </p>


        <h1>
          Bienvenue
        </h1>


        <p className="auth-muted">
          Connectez-vous à votre espace Formaplane.
        </p>


        {error ? (
          <div className="auth-alert auth-alert--error">
            {error}
          </div>
        ) : null}


        <form
          className="auth-form"
          onSubmit={
            handleSubmit
          }
        >

          <label>
            Adresse e-mail

            <input
              type="email"
              value={
                email
              }
              onChange={(
                event,
              ) =>
                setEmail(
                  event.target.value,
                )
              }
              autoComplete="email"
              required
            />
          </label>


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
                  password
                }
                onChange={(
                  event,
                ) =>
                  setPassword(
                    event.target.value,
                  )
                }
                autoComplete="current-password"
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


          <div className="auth-form__helper">
            <Link to="/mot-de-passe-oublie">
              Mot de passe oublié ?
            </Link>
          </div>


          <button
            className="auth-button"
            type="submit"
            disabled={
              loading
            }
          >
            {loading
              ? 'Connexion…'
              : 'Se connecter'}
          </button>

        </form>


        <div
          style={{
            marginTop: 28,
            paddingTop: 22,
            borderTop:
              '1px solid #e2e8f0',
          }}
        >

          <p
            style={{
              margin:
                '0 0 14px',
              fontWeight: 800,
              color: '#0f172a',
            }}
          >
            Nouveau sur Formaplane ?
          </p>


          <div
            style={{
              display: 'grid',
              gap: 10,
            }}
          >

            <Link
              className="auth-button auth-button--link"
              to="/inscription-organisme"
            >
              Créer mon organisme
            </Link>


            <Link
              to="/inscription"
              style={{
                minHeight: 44,
                display:
                  'inline-flex',
                alignItems:
                  'center',
                justifyContent:
                  'center',
                padding:
                  '0 16px',
                border:
                  '1px solid #2563eb',
                borderRadius:
                  10,
                color:
                  '#2563eb',
                fontWeight:
                  800,
                textDecoration:
                  'none',
                boxSizing:
                  'border-box',
              }}
            >
              Créer mon compte formateur
            </Link>

          </div>


          <div
            style={{
              marginTop: 16,
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
              Vous êtes à la fois organisme de formation et formateur ?
            </strong>
            {' '}
            Formaplane fonctionne avec un seul compte utilisateur.
            Commencez par créer l’un de vos espaces ; votre second
            espace pourra ensuite être ajouté ou rattaché au même compte.
          </div>

        </div>

      </div>
    </div>
  );
}
