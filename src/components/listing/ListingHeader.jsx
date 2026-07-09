export default function ListingHeader({ onAdd }) {
  return (
    <>
      <h2>Liste des formateurs</h2>

      <div style={{ marginBottom: 12 }}>
        <button onClick={onAdd}>Ajouter un formateur</button>
      </div>
    </>
  );
}