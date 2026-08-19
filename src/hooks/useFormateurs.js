import {
  useEffect,
  useState,
} from 'react';

import {
  getFormateurs,
  removeFormateurFromOrganization,
} from '../services/formateursService';


export default function useFormateurs({
  organizationId,
} = {}) {
  const [
    formateurs,
    setFormateurs,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState(null);


  useEffect(() => {
    let active = true;

    async function load() {
      if (!organizationId) {
        if (active) {
          setFormateurs([]);
          setLoading(false);
          setError(null);
        }

        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data =
          await getFormateurs(
            organizationId,
          );

        if (!active) {
          return;
        }

        const mapped =
          (data || []).map(
            (row) => ({
              id:
                row.id,

              prenom:
                row.prenom ??
                '',

              nom:
                row.nom ??
                '',

              ville:
                row.ville ??
                '',

              codePostal:
                row.code_postal ??
                '',

              adresse:
                row.adresse ??
                '',

              competences:
                Array.isArray(
                  row.competences,
                )
                  ? row.competences
                  : row.competences ??
                    [],

              materiel:
                Array.isArray(
                  row.materiel,
                )
                  ? row.materiel
                  : row.materiel ??
                    [],

              statut:
                row.statut ??
                'Inactif',

              tarif:
                row.tarif ??
                null,

              notes:
                row.notes ??
                '',

              telephone:
                row.telephone ??
                '',

              email:
                row.email ??
                '',

              latitude:
                row.latitude ??
                undefined,

              longitude:
                row.longitude ??
                undefined,

              created_at:
                row.created_at,

              organizationTrainerId:
                row.organizationTrainerId,

              claimed:
                Boolean(
                  row.claimed,
                ),
            }),
          );

        setFormateurs(
          mapped,
        );
      } catch (
        loadError
      ) {
        console.error(
          'Impossible de charger le réseau de formateurs',
          loadError,
        );

        if (active) {
          setError(
            loadError,
          );

          setFormateurs([]);
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
    organizationId,
  ]);


  const removeFormateur =
    async (trainerId) => {
      if (
        !organizationId ||
        !trainerId
      ) {
        return;
      }

      await removeFormateurFromOrganization(
        organizationId,
        trainerId,
      );

      setFormateurs(
        (previous) =>
          previous.filter(
            (formateur) =>
              formateur.id !==
              trainerId,
          ),
      );
    };


  const updateFormateurCoords =
    (
      id,
      coords,
    ) => {
      setFormateurs(
        (previous) =>
          previous.map(
            (formateur) =>
              formateur.id ===
              id
                ? {
                    ...formateur,
                    latitude:
                      coords.latitude,
                    longitude:
                      coords.longitude,
                  }
                : formateur,
          ),
      );
    };


  return {
    formateurs,
    setFormateurs,
    removeFormateur,
    updateFormateurCoords,
    loading,
    error,
  };
}
