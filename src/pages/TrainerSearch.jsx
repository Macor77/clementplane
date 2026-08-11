import {
  useState,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import {
  useAuth,
} from '../context/AuthContext';

import {
  addTrainerToOrganization,
  searchGlobalTrainers,
} from '../services/trainerSearchService';


export default function TrainerSearch() {
  const navigate =
    useNavigate();

  const {
    currentOrganization,
  } = useAuth();

  const [
    query,
    setQuery,
  ] = useState('');

  const [
    results,
    setResults,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    searched,
    setSearched,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState(null);

  const [
    addingId,
    setAddingId,
  ] = useState(null);


  const handleSearch =
    async (event) => {
      event.preventDefault();

      const normalized =
        query.trim();

      if (
        normalized.length < 2
      ) {
        setError(
          'Saisissez au moins 2 caractères.',
        );
        return;
      }

      setLoading(true);
      setError(null);
      setSearched(true);

      try {
        const data =
          await searchGlobalTrainers({
            organizationId:
              currentOrganization?.id,
            query:
              normalized,
          });

        setResults(
          data,
        );
      } catch (
        searchError
      ) {
        console.error(
          'Erreur recherche formateurs :',
          searchError,
        );

        setError(
          'Impossible de rechercher les formateurs pour le moment.',
        );
      } finally {
        setLoading(false);
      }
    };


  const handleAdd =
    async (trainerId) => {
      setAddingId(
        trainerId,
      );
      setError(null);

      try {
        await addTrainerToOrganization({
          organizationId:
            currentOrganization?.id,
          trainerId,
        });

        setResults(
          (previous) =>
            previous.map(
              (trainer) =>
                trainer.id ===
                trainerId
                  ? {
                      ...trainer,
                      already_in_network:
                        true,
                    }
                  : trainer,
            ),
        );
      } catch (
        addError
      ) {
        console.error(
          'Erreur ajout formateur :',
          addError,
        );

        setError(
          "Impossible d'ajouter ce formateur à votre réseau.",
        );
      } finally {
        setAddingId(
          null,
        );
      }
    };


  return (
    <div
      style={{
        padding: 28,
        maxWidth: 980,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 16,
          alignItems: 'flex-start',
          marginBottom: 24,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
            }}
          >
            Rechercher un formateur
          </h1>

          <p
            style={{
              marginTop: 8,
              color: '#64748b',
            }}
          >
            Recherchez un formateur déjà présent sur TimeForma par nom, prénom ou e-mail.
          </p>
        </div>

        <button
          type="button"
          className="button button--compact"
          onClick={() =>
            navigate(
              '/listing',
            )
          }
        >
          Retour
        </button>
      </div>


      <form
        onSubmit={
          handleSearch
        }
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 20,
        }}
      >
        <input
          type="search"
          value={
            query
          }
          onChange={(
            event,
          ) =>
            setQuery(
              event.target.value,
            )
          }
          placeholder="Nom, prénom ou e-mail…"
          autoFocus
          style={{
            flex: 1,
            minHeight: 42,
            padding: '0 12px',
            border: '1px solid #cbd5e1',
            borderRadius: 8,
            fontSize: 15,
          }}
        />

        <button
          type="submit"
          className="button button--primary"
          disabled={
            loading
          }
        >
          {loading
            ? 'Recherche…'
            : 'Rechercher'}
        </button>
      </form>


      {error ? (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            border: '1px solid #fecaca',
            borderRadius: 8,
            background: '#fef2f2',
            color: '#b91c1c',
          }}
        >
          {error}
        </div>
      ) : null}


      {!loading &&
      searched &&
      results.length === 0 ? (
        <div
          style={{
            padding: 20,
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            background: '#fff',
          }}
        >
          <strong>
            Aucun formateur trouvé.
          </strong>

          <p
            style={{
              marginBottom: 14,
              color: '#64748b',
            }}
          >
            Vous pouvez créer une nouvelle fiche formateur.
          </p>

          <button
            type="button"
            className="button button--primary"
            onClick={() =>
              navigate(
                '/formateur/new',
              )
            }
          >
            + Créer un formateur
          </button>
        </div>
      ) : null}


      {results.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gap: 10,
          }}
        >
          {results.map(
            (trainer) => {
              const fullName =
                [
                  trainer.prenom,
                  trainer.nom,
                ]
                  .filter(Boolean)
                  .join(' ');

              const location =
                [
                  trainer.ville,
                  trainer.code_postal,
                ]
                  .filter(Boolean)
                  .join(' · ');

              return (
                <div
                  key={
                    trainer.id
                  }
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 18,
                    padding: 16,
                    border: '1px solid #e2e8f0',
                    borderRadius: 10,
                    background: '#fff',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 16,
                      }}
                    >
                      {fullName ||
                        'Formateur'}
                    </div>

                    {location ? (
                      <div
                        style={{
                          marginTop: 4,
                          color: '#64748b',
                        }}
                      >
                        {location}
                      </div>
                    ) : null}

                    {trainer.email ? (
                      <div
                        style={{
                          marginTop: 3,
                          color: '#64748b',
                          fontSize: 14,
                        }}
                      >
                        {trainer.email}
                      </div>
                    ) : null}
                  </div>

                  {trainer.already_in_network ? (
                    <span
                      style={{
                        padding: '7px 10px',
                        borderRadius: 999,
                        background: '#ecfdf5',
                        color: '#047857',
                        fontWeight: 700,
                        fontSize: 13,
                      }}
                    >
                      Déjà dans mon réseau
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="button button--primary button--compact"
                      disabled={
                        addingId ===
                        trainer.id
                      }
                      onClick={() =>
                        handleAdd(
                          trainer.id,
                        )
                      }
                    >
                      {addingId ===
                      trainer.id
                        ? 'Ajout…'
                        : 'Ajouter à mon réseau'}
                    </button>
                  )}
                </div>
              );
            },
          )}
        </div>
      ) : null}
    </div>
  );
}
