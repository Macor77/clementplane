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

import {
  createOrganizationTrainerRelation,
  getOrganizationTrainerRelation,
  updateOrganizationTrainerRelation,
} from '../services/formateursService';


const EMPTY = {
  prenom: '',
  nom: '',
  ville: '',
  codePostal: '',
  competences: [],
  materiel: [],
  statut: 'Inactif',
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


        setForm({
          prenom:
            data.prenom ??
            '',

          nom:
            data.nom ??
            '',

          ville:
            data.ville ??
            '',

          codePostal:
            data.code_postal ??
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
            'Inactif',

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
  }) {
    const [
      input,
      setInput,
    ] = useState('');

    const inputRef =
      useRef(null);


    const addValue =
      (value) => {
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
        if (input) {
          addValue(
            input,
          );
        }
      };


    const handlePaste =
      (event) => {
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
          onClick={() =>
            inputRef.current?.focus()
          }
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
              placeholder
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


      const trainerPayload = {
        prenom:
          form.prenom ||
          null,

        nom:
          form.nom ||
          null,

        ville:
          form.ville ||
          null,

        code_postal:
          form.codePostal ||
          null,

        competences:
          form.competences ??
          [],

        materiel:
          form.materiel ??
          [],

        telephone:
          form.telephone ||
          null,

        email:
          form.email ||
          null,

        adresse:
          form.adresse ||
          null,
      };


      const relationPayload = {
        organizationId:
          currentOrganization.id,

        statut:
          form.statut ||
          'Inactif',

        tarif:
          form.tarif,

        notes:
          form.notes,
      };


      try {
        if (id) {
          const {
            error:
              trainerError,
          } =
            await supabase
              .from(
                'trainers',
              )
              .update(
                trainerPayload,
              )
              .eq(
                'id',
                id,
              );


          if (
            trainerError
          ) {
            throw trainerError;
          }


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


        const {
          data,
          error:
            trainerError,
        } =
          await supabase
            .from(
              'trainers',
            )
            .insert([
              trainerPayload,
            ])
            .select()
            .single();


        if (
          trainerError
        ) {
          throw trainerError;
        }


        try {
          await createOrganizationTrainerRelation({
            ...relationPayload,
            trainerId:
              data.id,
          });
        } catch (
          relationError
        ) {
          /*
           * Si le rattachement échoue pendant
           * la création, on évite de laisser
           * une fiche orpheline créée par erreur.
           */
          await supabase
            .from(
              'trainers',
            )
            .delete()
            .eq(
              'id',
              data.id,
            );

          throw relationError;
        }


        navigate(
          `/formateur/view/${data.id}`,
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
        />


        <input
          name="ville"
          placeholder="Ville"
          value={
            form.ville
          }
          onChange={
            onChange
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
        />


        <ChipsInput
          label="Compétences"
          values={
            form.competences
          }
          onChangeValues={(
            values,
          ) =>
            setForm(
              (previous) => ({
                ...previous,
                competences:
                  values,
              }),
            )
          }
          placeholder="Tape et appuie sur Entrée ou une virgule…"
        />


        <ChipsInput
          label="Matériel"
          values={
            form.materiel
          }
          onChangeValues={(
            values,
          ) =>
            setForm(
              (previous) => ({
                ...previous,
                materiel:
                  values,
              }),
            )
          }
          placeholder="Tape et appuie sur Entrée ou une virgule…"
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
        />


        <input
          name="adresse"
          placeholder="Adresse"
          value={
            form.adresse
          }
          onChange={
            onChange
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

          <option value="Black">
            Black
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
