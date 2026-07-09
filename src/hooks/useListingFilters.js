import { useEffect, useState } from "react";

export default function useListingFilters({ formateurs, sortList }) {
  const [filteredFormateurs, setFilteredFormateurs] = useState([]);

  const [filters, setFilters] = useState({
    prenom: "",
    nom: "",
    ville: "",
    competence: "",
    materiel: "",
    statuts: [],
  });

  useEffect(() => {
    const f = formateurs.filter((formateur) => {
      const compStr = (
        Array.isArray(formateur.competences)
          ? formateur.competences.join(", ")
          : formateur.competences || ""
      ).toLowerCase();

      const matStr = (
        Array.isArray(formateur.materiel)
          ? formateur.materiel.join(", ")
          : formateur.materiel || ""
      ).toLowerCase();

      return (
        (formateur.prenom ?? "").toLowerCase().includes(filters.prenom.toLowerCase()) &&
        (formateur.nom ?? "").toLowerCase().includes(filters.nom.toLowerCase()) &&
        (formateur.ville ?? "").toLowerCase().includes(filters.ville.toLowerCase()) &&
        compStr.includes(filters.competence.toLowerCase()) &&
        matStr.includes(filters.materiel.toLowerCase()) &&
        (filters.statuts.length === 0 || filters.statuts.includes(formateur.statut))
      );
    });

    setFilteredFormateurs(sortList(f));
  }, [filters, formateurs, sortList]);

  const handleStatutChange = (e) => {
    const value = e.target.value;

    setFilters((prev) => {
      const statuts = prev.statuts.includes(value)
        ? prev.statuts.filter((s) => s !== value)
        : [...prev.statuts, value];

      return { ...prev, statuts };
    });
  };

  return {
    filters,
    setFilters,
    filteredFormateurs,
    handleStatutChange,
  };
}