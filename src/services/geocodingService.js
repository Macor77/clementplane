const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const hasValidCoords = (lat, lon) =>
  Number.isFinite(Number(lat)) &&
  Number.isFinite(Number(lon));

const buildGeocodeQueries = (formateur) => {
  const adresse = String(
    formateur.adresse ?? ''
  ).trim();

  const codePostal = String(
    formateur.codePostal ??
      formateur.code_postal ??
      ''
  ).trim();

  const ville = String(
    formateur.ville ?? ''
  ).trim();

  const queries = [
    [adresse, codePostal, ville, 'France'],
    [codePostal, ville, 'France'],
    [ville, codePostal, 'France'],
    [ville, 'France'],
  ]
    .map((parts) =>
      parts
        .map((value) => String(value ?? '').trim())
        .filter(Boolean)
        .join(', ')
    )
    .filter(Boolean);

  return [...new Set(queries)];
};

const getSupabaseConfiguration = () => {
  const supabaseUrl =
    import.meta.env.VITE_SUPABASE_URL;

  const supabaseKey =
    import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Configuration Supabase manquante.'
    );
  }

  return {
    supabaseUrl: supabaseUrl.replace(/\/$/, ''),
    supabaseKey,
  };
};

export async function geocodeQuery(query) {
  const normalizedQuery = String(
    query ?? ''
  ).trim();

  if (!normalizedQuery) return null;

  const {
    supabaseUrl,
    supabaseKey,
  } = getSupabaseConfiguration();

  const response = await fetch(
    `${supabaseUrl}/functions/v1/geocode`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        query: normalizedQuery,
      }),
    }
  );

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      data?.error ||
        'Le service de géocodage est indisponible.'
    );
  }

  if (
    !data ||
    !hasValidCoords(
      data.latitude,
      data.longitude
    )
  ) {
    return null;
  }

  return {
    latitude: Number(data.latitude),
    longitude: Number(data.longitude),
    displayName: String(
      data.displayName ?? ''
    ).trim(),
    city: String(data.city ?? '').trim(),
    postcode: String(
      data.postcode ?? ''
    ).trim(),
    department: String(
      data.department ?? ''
    ).trim(),
  };
}

export async function geocodeTrainer(formateur) {
  const queries =
    buildGeocodeQueries(formateur);

  for (const query of queries) {
    const result = await geocodeQuery(query);

    if (
      result &&
      hasValidCoords(
        result.latitude,
        result.longitude
      )
    ) {
      return result;
    }

    await sleep(250);
  }

  return null;
}

export { sleep };