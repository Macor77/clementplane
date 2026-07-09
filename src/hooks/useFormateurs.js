import { useEffect, useState } from "react";
import { getFormateurs, deleteFormateur } from "../services/formateursService";

export default function useFormateurs() {
  const [formateurs, setFormateurs] = useState([]);

  useEffect(() => {
    (async () => {
      const data = await getFormateurs();

      const mapped = (data || []).map((r) => ({
        id: r.id,
        prenom: r.prenom ?? "",
        nom: r.nom ?? "",
        ville: r.ville ?? "",
        codePostal: r.code_postal ?? "",
        adresse: r.adresse ?? "",
        competences: Array.isArray(r.competences)
          ? r.competences
          : r.competences ?? [],
        materiel: Array.isArray(r.materiel)
          ? r.materiel
          : r.materiel ?? [],
        statut: r.statut ?? "Inactif",
        latitude: r.latitude ?? undefined,
        longitude: r.longitude ?? undefined,
        created_at: r.created_at,
      }));

      setFormateurs(mapped);
    })();
  }, []);

  const removeFormateur = async (id) => {
    if (!id) return;

    await deleteFormateur(id);

    setFormateurs((prev) => prev.filter((formateur) => formateur.id !== id));
  };

  const updateFormateurCoords = (id, coords) => {
    setFormateurs((prev) =>
      prev.map((formateur) =>
        formateur.id === id
          ? {
              ...formateur,
              latitude: coords.latitude,
              longitude: coords.longitude,
            }
          : formateur
      )
    );
  };

  return {
    formateurs,
    setFormateurs,
    removeFormateur,
    updateFormateurCoords,
  };
}