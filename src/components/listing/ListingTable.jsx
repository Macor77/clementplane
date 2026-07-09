import SortHeader from "./SortHeader";

export default function ListingTable({
  filteredFormateurs,
  distances,
  sort,
  toggleSort,
  renderList,
  navigate,
  handleDelete,
}) {
  return (
    <table>
      <thead>
        <tr>
          <th>
            <SortHeader
              label="Prénom"
              colKey="prenom"
              sort={sort}
              onToggleSort={toggleSort}
            />
          </th>

          <th>
            <SortHeader
              label="Nom"
              colKey="nom"
              sort={sort}
              onToggleSort={toggleSort}
            />
          </th>

          <th>Compétences</th>
          <th>Matériel</th>

          <th>
            <SortHeader
              label="Statut"
              colKey="statut"
              sort={sort}
              onToggleSort={toggleSort}
            />
          </th>

          <th>
            <SortHeader
              label="Code Postal"
              colKey="codePostal"
              sort={sort}
              onToggleSort={toggleSort}
            />
          </th>

          <th>
            <SortHeader
              label="Distance (km)"
              colKey="distance"
              sort={sort}
              onToggleSort={toggleSort}
            />
          </th>

          <th>Actions</th>
        </tr>
      </thead>

      <tbody>
        {filteredFormateurs.map((f) => {
          const d = distances.get(f);

          return (
            <tr key={f.id}>
              <td>{f.prenom}</td>
              <td>{f.nom}</td>
              <td>{renderList(f.competences)}</td>
              <td>{renderList(f.materiel)}</td>
              <td>{f.statut}</td>
              <td>{f.codePostal}</td>
              <td>{typeof d === "number" ? d.toFixed(2) : d || "-"}</td>

              <td>
                <button
                  onClick={() => navigate(`/formateur/view/${f.id}`)}
                  disabled={!f.id}
                >
                  Voir
                </button>{" "}

                <button
                  onClick={() => navigate(`/formateur/edit/${f.id}`)}
                  disabled={!f.id}
                >
                  Modifier
                </button>{" "}

                <button
                  onClick={() => handleDelete(f.id)}
                  disabled={!f.id}
                >
                  Supprimer
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}