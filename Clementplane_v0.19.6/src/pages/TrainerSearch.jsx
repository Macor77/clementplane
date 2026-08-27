import {
  useEffect,
  useState,
} from 'react';

import {
  useNavigate,
  useSearchParams,
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

  const [
    searchParams,
  ] = useSearchParams();

  const initialQuery =
    String(
      searchParams.get('q') ||
      '',
    ).trim();

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


  const [
    autoSearchDone,
    setAutoSearchDone,
  ] = useState(false);


  const validateSearch =
    (value) => {
      const normalized =
        value
          .trim()
          .replace(
            /\s+/g,
            ' ',
          );

      if (!normalized) {
        return {
          valid: false,
          message:
            'Saisissez le prénom et le nom complets du formateur, ou son adresse e-mail exacte.',
        };
      }

      const looksLikeEmail =
        normalized.includes(
          '@',
        );

      if (looksLikeEmail) {
        const emailPattern =
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (
          !emailPattern.test(
            normalized,
          )
        ) {
          return {
            valid: false,
            message:
              "Saisissez l'adresse e-mail complète du formateur.",
          };
        }

        return {
          valid: true,
          normalized,
        };
      }

      const identityParts =
        normalized
          .split(' ')
          .filter(Boolean);

      if (
        identityParts.length < 2
      ) {
        return {
          valid: false,
          message:
            'La recherche par identité nécessite le prénom et le nom complets du formateur.',
        };
      }

      return {
        valid: true,
        normalized,
      };
    };


  const handleQueryChange =
    (event) => {
      setQuery(
        event.target.value,
      );

      setError(null);
      setSearched(false);
      setResults([]);
    };


  const runSearch =
    async (value) => {
      const validation =
        validateSearch(
          value,
        );

      if (
        !validation.valid
      ) {
        setResults([]);
        setSearched(false);
        setError(
          validation.message,
        );
        return;
      }

      if (
        !currentOrganization?.id
      ) {
        setResults([]);
        setSearched(false);
        setError(
          "Aucun organisme n'est actuellement sélectionné.",
        );
        return;
      }

      setLoading(true);
      setError(null);
      setSearched(true);
      setResults([]);

      try {
        const data =
          await searchGlobalTrainers({
            organizationId:
              currentOrganization.id,
            query:
              validation.normalized,
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


  const handleSearch =
    async (event) => {
      event.preventDefault();
      await runSearch(query);
    };


  useEffect(() => {
    if (
      autoSearchDone ||
      !initialQuery ||
      !currentOrganization?.id
    ) {
      return;
    }

    setQuery(initialQuery);
    setAutoSearchDone(true);
    runSearch(initialQuery);
  }, [
    autoSearchDone,
    initialQuery,
    currentOrganization?.id,
  ]);


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
      className="of-trainer-search-page"
      style={{
        padding: 28,
        maxWidth: 980,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent:
            'space-between',
          gap: 16,
          alignItems:
            'flex-start',
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
              marginBottom: 0,
              color: '#64748b',
            }}
          >
            Retrouvez un formateur que vous connaissez déjà à l'aide de son prénom et de son nom complets, ou de son adresse e-mail exacte.
          </p>

          <p
            style={{
              marginTop: 6,
              marginBottom: 0,
              color: '#94a3b8',
              fontSize: 14,
            }}
          >
            Les coordonnées des formateurs qui ne font pas encore partie de votre réseau restent confidentielles.
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
          onChange={
            handleQueryChange
          }
          placeholder="Prénom Nom ou adresse e-mail exacte…"
          autoFocus
          autoComplete="off"
          style={{
            flex: 1,
            minHeight: 42,
            padding: '0 12px',
            border:
              '1px solid #cbd5e1',
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
            border:
              '1px solid #fecaca',
            borderRadius: 8,
            background:
              '#fef2f2',
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
            border:
              '1px solid #e2e8f0',
            borderRadius: 10,
            background: '#fff',
          }}
        >
          <strong>
            Aucun formateur correspondant trouvé.
          </strong>

          <p
            style={{
              marginTop: 8,
              marginBottom: 0,
              color: '#64748b',
            }}
          >
            Vérifiez l'identité ou l'adresse e-mail saisie. Si ce formateur n'utilise pas encore Clementplane, vous pourrez prochainement l'inviter à rejoindre votre réseau.
          </p>
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
                    display:
                      'flex',
                    justifyContent:
                      'space-between',
                    alignItems:
                      'center',
                    gap: 18,
                    padding: 16,
                    border:
                      '1px solid #e2e8f0',
                    borderRadius: 10,
                    background:
                      '#fff',
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

                    {trainer
                      .already_in_network ? (
                      <>
                        {location ? (
                          <div
                            style={{
                              marginTop: 4,
                              color:
                                '#64748b',
                            }}
                          >
                            {location}
                          </div>
                        ) : null}

                        {trainer.email ? (
                          <div
                            style={{
                              marginTop: 3,
                              color:
                                '#64748b',
                              fontSize: 14,
                            }}
                          >
                            {
                              trainer.email
                            }
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <div
                        style={{
                          marginTop: 4,
                          color:
                            '#64748b',
                          fontSize: 14,
                        }}
                      >
                        Présent sur Clementplane · Coordonnées confidentielles
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="button button--soft button--compact"
                      onClick={() =>
                        navigate(`/formateur/view/${trainer.id}?space=organization`)
                      }
                    >
                      Voir la fiche
                    </button>

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
                        disabled={addingId === trainer.id}
                        onClick={() => handleAdd(trainer.id)}
                      >
                        {addingId === trainer.id ? 'Ajout…' : 'Ajouter à mon réseau'}
                      </button>
                    )}
                  </div>
                </div>
              );
            },
          )}
        </div>
      ) : null}
    </div>
  );
}