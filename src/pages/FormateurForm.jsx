import {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  useNavigate,
  useParams,
} from 'react-router-dom';

import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import CompetencyInput from '../components/CompetencyInput';
import EquipmentInput from '../components/EquipmentInput';

import {
  createTrainerForOrganization,
  getOrganizationTrainerRelation,
  updateOrganizationTrainerRelation,
  updateUnclaimedTrainerForOrganization,
} from '../services/formateursService';

import {
  geocodeTrainer,
  hasValidCoords,
} from '../services/geocodingService';


const EMPTY = {
  prenom: '',
  nom: '',
  ville: '',
  codePostal: '',
  competences: [],
  materiel: [],
  statut: 'Standard',
  tarif: '',
  telephone: '',
  email: '',
  adresse: '',
  notes: '',
};


export default function FormateurForm() {
  const {
    id,
  } = useParams();

  const navigate =
    useNavigate();

  const {
    currentOrganization,
  } = useAuth();


  const [
    form,
    setForm,
  ] = useState(
    EMPTY,
  );

  const [
    loading,
    setLoading,
  ] = useState(
    Boolean(id),
  );

  const [
    err,
    setErr,
  ] = useState(null);

  const [
    isClaimed,
    setIsClaimed,
  ] = useState(false);


  const norm =
    (value) =>
      value.trim();


  const splitToArray =
    (text) =>
      text
        .split(/[,\n;]+/)
        .map(norm)
        .filter(Boolean);


  useEffect(() => {
    if (!id) {
      return;
    }

    let active = true;

    async function load() {
      setLoading(true);
      setErr(null);

      try {
        const [
          trainerResult,
          relation,
        ] =
          await Promise.all([
            supabase
              .from('trainers')
              .select('*')
              .eq('id', id)
              .single(),

            getOrganizationTrainerRelation({
              organizationId:
                currentOrganization?.id,

              trainerId:
                id,
            }),
          ]);


        if (
          trainerResult.error
        ) {
          throw trainerResult.error;
        }


        if (!relation) {
          throw new Error(
            "Ce formateur n'appartient pas au réseau de votre organisme.",
          );
        }


        if (!active) {
          return;
        }


        const data =
          trainerResult.data;

        const claimed =
          Boolean(
            data.user_id,
          );

        setIsClaimed(
          claimed,
        );


        setForm({
          prenom:
            data.prenom ??
            '',

          nom:
            data.nom ??
            '',

          ville:
            claimed
              ? data.ville ??
                ''
              : relation.ville ??
                '',

          codePostal:
            claimed
              ? data.code_postal ??
                ''
              : relation.code_postal ??
                '',

          competences:
            Array.isArray(
              data.competences,
            )
              ? data.competences
              : data.competences ??
                [],

          materiel:
            Array.isArray(
              data.materiel,
            )
              ? data.materiel
              : data.materiel ??
                [],

          statut:
            relation.statut ??
            'Standard',

          tarif:
            relation.tarif ??
            '',

          telephone:
            data.telephone ??
            '',

          email:
            data.email ??
            '',

          adresse:
            data.adresse ??
            '',

          notes:
            relation.notes ??
            '',
        });
      } catch (
        loadError
      ) {
        if (active) {
          setErr(
            loadError.message,
          );
        }
      } finally {
        if (active) {
          setLoading(
            false,
          );
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [
    id,
    currentOrganization?.id,
  ]);


  const onChange =
    (event) => {
      const {
        name,
        value,
      } = event.target;

      setForm(
        (previous) => ({
          ...previous,
          [name]:
            value,
        }),
      );
    };


  function ChipsInput({
    label,
    values,
    onChangeValues,
    placeholder,
    disabled = false,
  }) {
    const [
      input,
      setInput,
    ] = useState('');

    const inputRef =
      useRef(null);


    const addValue =
      (value) => {
        if (disabled) {
          return;
        }

        const normalized =
          norm(value);

        if (
          !normalized ||
          values.includes(
            normalized,
          )
        ) {
          return;
        }

        onChangeValues([
          ...values,
          normalized,
        ]);

        setInput('');
      };


    const removeAt =
      (index) => {
        if (disabled) {
          return;
        }

        const next =
          [...values];

        next.splice(
          index,
          1,
        );

        onChangeValues(
          next,
        );
      };


    const handleKeyDown =
      (event) => {
        if (disabled) {
          return;
        }

        if (
          event.key ===
            'Enter' ||
          event.key ===
            ',' ||
          event.key ===
            ';'
        ) {
          event.preventDefault();

          if (input) {
            addValue(
              input,
            );
          }
        } else if (
          event.key ===
            'Backspace' &&
          !input &&
          values.length > 0
        ) {
          removeAt(
            values.length -
              1,
          );
        }
      };


    const handleBlur =
      () => {
        if (disabled) {
          return;
        }

        if (input) {
          addValue(
            input,
          );
        }
      };


    const handlePaste =
      (event) => {
        if (disabled) {
          return;
        }

        const text =
          event.clipboardData.getData(
            'text',
          );

        if (
          text &&
          /[,;\n]/.test(
            text,
          )
        ) {
          event.preventDefault();

          const valuesToAdd =
            splitToArray(
              text,
            );

          if (
            valuesToAdd.length
          ) {
            onChangeValues([
              ...values,
              ...valuesToAdd.filter(
                (value) =>
                  !values.includes(
                    value,
                  ),
              ),
            ]);
          }

          setInput('');
        }
      };


    return (
      <div
        style={{
          display:
            'grid',
          gap: 6,
        }}
      >

        <label
          style={{
            fontSize: 14,
          }}
        >
          {label}
        </label>


        <div
          style={{
            display:
              'flex',

            flexWrap:
              'wrap',

            gap:
              6,

            border:
              '1px solid #ccc',

            borderRadius:
              8,

            padding:
              6,

            minHeight:
              40,

            alignItems:
              'center',
          }}
          onClick={() => {
            if (!disabled) {
              inputRef.current?.focus();
            }
          }}
        >

          {values.map(
            (
              value,
              index,
            ) => (
              <span
                key={`${value}-${index}`}
                style={{
                  display:
                    'inline-flex',

                  alignItems:
                    'center',

                  gap:
                    6,

                  padding:
                    '4px 8px',

                  borderRadius:
                    12,

                  background:
                    '#eef2ff',

                  fontSize:
                    13,
                }}
              >
                {value}

                {!disabled ? (
                  <button
                    type="button"
                    onClick={() =>
                      removeAt(
                        index,
                      )
                    }
                    aria-label={`Supprimer ${value}`}
                    title="Supprimer"
                    style={{
                      border:
                        'none',

                      background:
                        'transparent',

                      cursor:
                        'pointer',

                      fontSize:
                        14,

                      lineHeight:
                        1,
                    }}
                  >
                    ×
                  </button>
                ) : null}
              </span>
            ),
          )}


          <input
            ref={
              inputRef
            }
            value={
              input
            }
            onChange={(
              event,
            ) =>
              setInput(
                event.target.value,
              )
            }
            onKeyDown={
              handleKeyDown
            }
            onBlur={
              handleBlur
            }
            onPaste={
              handlePaste
            }
            placeholder={
              disabled
                ? ''
                : placeholder
            }
            disabled={
              disabled
            }
            style={{
              flex: 1,
              minWidth: 160,
              border: 'none',
              outline: 'none',
              fontSize: 14,
              padding: '6px 4px',
            }}
          />

        </div>

      </div>
    );
  }


  const handleSubmit =
    async (event) => {
      event.preventDefault();
      setErr(null);


      if (
        !currentOrganization?.id
      ) {
        setErr(
          "Aucun organisme actif n'est sélectionné.",
        );

        return;
      }


      const relationPayload = {
        organizationId:
          currentOrganization.id,

        statut:
          form.statut ||
          'Standard',

        tarif:
          form.tarif,

        notes:
          form.notes,
      };


      try {
        /*
         * Profil revendiqué :
         * l'OF ne modifie plus aucune donnée globale de trainers.
         * Il ne peut gérer que ses données privées de relation :
         * statut, tarif et notes.
         */
        if (
          id &&
          isClaimed
        ) {
          await updateOrganizationTrainerRelation({
            ...relationPayload,
            trainerId:
              id,
          });

          navigate(
            `/formateur/view/${id}`,
          );

          return;
        }


        /*
         * Profil non revendiqué :
         * la localisation appartient à cet OF.
         * Elle est géocodée à chaque enregistrement.
         * En cas d'échec, le GPS est volontairement neutralisé.
         */
        let latitude = null;
        let longitude = null;

        try {
          const coords =
            await geocodeTrainer({
              ville:
                form.ville,

              codePostal:
                form.codePostal,
            });

          if (
            coords &&
            hasValidCoords(
              coords.latitude,
              coords.longitude,
            )
          ) {
            latitude =
              coords.latitude;

            longitude =
              coords.longitude;
          }
        } catch (
          geocodingError
        ) {
          console.error(
            'Géocodage de la localisation du formateur impossible :',
            geocodingError,
          );
        }


        const commonPayload = {
          organizationId:
            currentOrganization.id,

          prenom:
            form.prenom,

          nom:
            form.nom,

          competences:
            form.competences ??
            [],

          materiel:
            form.materiel ??
            [],

          telephone:
            form.telephone,

          email:
            form.email,

          ville:
            form.ville,

          codePostal:
            form.codePostal,

          latitude,

          longitude,

          statut:
            form.statut ||
            'Standard',

          tarif:
            form.tarif,

          notes:
            form.notes,
        };


        if (id) {
          await updateUnclaimedTrainerForOrganization({
            ...commonPayload,
            trainerId:
              id,
          });

          navigate(
            `/formateur/view/${id}`,
          );

          return;
        }


        const trainerId =
          await createTrainerForOrganization(
            commonPayload,
          );


        navigate(
          `/formateur/view/${trainerId}`,
        );
      } catch (
        submitError
      ) {
        console.error(
          submitError,
        );

        setErr(
          submitError.message,
        );
      }
    };

  if (loading) {
    return (
      <div
        style={{
          padding: '1rem',
        }}
      >
        Chargement…
      </div>
    );
  }


  return (
    <div
      style={{
        padding: '1rem',
      }}
    >

      <h2>
        {id
          ? 'Modifier'
          : 'Créer'}{' '}
        un formateur
      </h2>


      {err ? (
        <div
          style={{
            color:
              'crimson',

            marginBottom:
              12,
          }}
        >
          Erreur : {err}
        </div>
      ) : null}


      <form
        onSubmit={
          handleSubmit
        }
        style={{
          display:
            'grid',

          gap:
            12,

          maxWidth:
            600,
        }}
      >

        <input
          name="prenom"
          placeholder="Prénom"
          value={
            form.prenom
          }
          onChange={
            onChange
          }
          required
                  disabled={
            isClaimed
          }
/>


        <input
          name="nom"
          placeholder="Nom"
          value={
            form.nom
          }
          onChange={
            onChange
          }
          required
                  disabled={
            isClaimed
          }
/>


        {isClaimed ? (
          <div
            style={{
              padding: 10,
              borderRadius: 8,
              background: '#f8fafc',
              color: '#475569',
              fontSize: 14,
            }}
          >
            Profil géré par le formateur. Ses informations globales (identité, coordonnées, localisation, compétences et matériel) sont en lecture seule. Votre organisme peut toujours gérer son statut, son tarif et ses notes privées.
          </div>
        ) : null}


        <input
          name="ville"
          placeholder="Ville"
          value={
            form.ville
          }
          onChange={
            onChange
          }
          disabled={
            isClaimed
          }
        />


        <input
          name="codePostal"
          placeholder="Code postal"
          value={
            form.codePostal
          }
          onChange={
            onChange
          }
          disabled={
            isClaimed
          }
        />


        <CompetencyInput
          label="Compétences"
          values={form.competences}
          onChange={(values) =>
            setForm(
              (previous) => ({
                ...previous,
                competences:
                  values,
              }),
            )
          }
          placeholder="Rechercher ou ajouter une compétence…"
          disabled={
            isClaimed
          }
        />


        <EquipmentInput
          label="Matériel"
          values={form.materiel}
          onChange={(values) =>
            setForm(
              (previous) => ({
                ...previous,
                materiel:
                  values,
              }),
            )
          }
          placeholder="Rechercher ou ajouter du matériel…"
          disabled={
            isClaimed
          }
        />


        <input
          name="tarif"
          type="number"
          step="0.01"
          placeholder="Tarif négocié pour votre organisme (€)"
          value={
            form.tarif
          }
          onChange={
            onChange
          }
        />


        <input
          name="telephone"
          placeholder="Téléphone"
          value={
            form.telephone
          }
          onChange={
            onChange
          }
                  disabled={
            isClaimed
          }
/>


        <input
          name="email"
          type="email"
          placeholder="Email"
          value={
            form.email
          }
          onChange={
            onChange
          }
                  disabled={
            isClaimed
          }
/>


        <label>
          Notes internes à votre organisme
        </label>


        <textarea
          name="notes"
          rows={5}
          placeholder="Notes privées sur ce formateur…"
          value={
            form.notes
          }
          onChange={
            onChange
          }
        />


        <select
          name="statut"
          value={
            form.statut
          }
          onChange={
            onChange
          }
        >
          <option value="Premium">
            Premium
          </option>

          <option value="Standard">
            Standard
          </option>

          <option value="Inactif">
            Inactif
          </option>

          <option value="Exclu">
            Exclu
          </option>
        </select>


        <div
          style={{
            display:
              'flex',

            gap:
              8,
          }}
        >

          <button
            type="submit"
          >
            {id
              ? 'Enregistrer'
              : 'Créer'}
          </button>


          <button
            type="button"
            onClick={() =>
              navigate(
                '/listing',
              )
            }
          >
            Annuler
          </button>

        </div>

      </form>

    </div>
  );
}
