const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const hasValidCoords = (lat, lon) =>
  Number.isFinite(Number(lat)) && Number.isFinite(Number(lon));

const buildGeocodeQueries = (f) => {
  const adresse = (f.adresse || "").toString().trim();
  const codePostal = (f.codePostal || f.code_postal || "").toString().trim();
  const ville = (f.ville || "").toString().trim();

  const queries = [
    [adresse, codePostal, ville, "France"],
    [codePostal, ville, "France"],
    [ville, codePostal, "France"],
    [ville, "France"],
  ]
    .map((parts) =>
      parts.map((v) => (v || "").toString().trim()).filter(Boolean).join(", ")
    )
    .filter(Boolean);

  return [...new Set(queries)];
};

export async function geocodeQuery(query) {
  if (!query.trim()) return null;

  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=fr&q=${encodeURIComponent(
    query
  )}`;

  const res = await fetch(url);

  if (!res.ok) throw new Error("Géocodage impossible");

  const data = await res.json();

  if (!Array.isArray(data) || data.length === 0) return null;

  return {
    latitude: Number(data[0].lat),
    longitude: Number(data[0].lon),
  };
}

export async function geocodeTrainer(formateur) {
  const queries = buildGeocodeQueries(formateur);

  for (const query of queries) {
    const coords = await geocodeQuery(query);

    if (coords && hasValidCoords(coords.latitude, coords.longitude)) {
      return coords;
    }

    await sleep(1100);
  }

  return null;
}

export { sleep };