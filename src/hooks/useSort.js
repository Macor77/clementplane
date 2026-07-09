import { useCallback, useState } from "react";

export default function useSort({ distances }) {
  const [sort, setSort] = useState({ key: null, dir: "asc" });

  const compareValues = useCallback(
    (a, b, key) => {
      const read = (obj) => {
        switch (key) {
          case "codePostal":
            return obj.codePostal ?? "";
          case "prenom":
            return (obj.prenom ?? "").toLowerCase();
          case "nom":
            return (obj.nom ?? "").toLowerCase();
          case "ville":
            return (obj.ville ?? "").toLowerCase();
          case "statut":
            return (obj.statut ?? "").toLowerCase();
          case "distance": {
            const d = distances.get(obj);
            return d === "-" || d === undefined ? null : Number(d);
          }
          default:
            return (obj[key] ?? "").toString().toLowerCase();
        }
      };

      const va = read(a);
      const vb = read(b);

      const empty = (v) => v === null || v === undefined || v === "";

      if (empty(va) && !empty(vb)) return 1;
      if (!empty(va) && empty(vb)) return -1;
      if (empty(va) && empty(vb)) return 0;
      if (typeof va === "number" && typeof vb === "number") return va - vb;

      return String(va).localeCompare(String(vb), "fr", {
        sensitivity: "base",
      });
    },
    [distances]
  );

  const sortList = useCallback(
    (list) => {
      if (!sort.key) return list;

      const arr = [...list].sort((a, b) => compareValues(a, b, sort.key));

      return sort.dir === "asc" ? arr : arr.reverse();
    },
    [sort, compareValues]
  );

  const toggleSort = (key) => {
    setSort((prev) => ({
      key,
      dir: prev.key === key && prev.dir === "asc" ? "desc" : "asc",
    }));
  };

  const refreshSort = () => {
    setSort((prev) => ({ ...prev }));
  };

  return {
    sort,
    sortList,
    toggleSort,
    refreshSort,
  };
}