const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonResponse = (
  body: Record<string, unknown>,
  status = 200
) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return jsonResponse(
      {
        error: "Méthode non autorisée.",
      },
      405
    );
  }

  try {
    const body = await req.json();

    const query =
      typeof body?.query === "string"
        ? body.query.trim()
        : "";

    if (!query) {
      return jsonResponse(
        {
          error: "Le lieu est obligatoire.",
        },
        400
      );
    }

    const url = new URL(
      "https://nominatim.openstreetmap.org/search"
    );

    url.searchParams.set("q", query);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "1");
    url.searchParams.set("countrycodes", "fr");
    url.searchParams.set("addressdetails", "1");

    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent":
          "TimeForma/1.0 (contact@alter-prevention.fr)",
        "Accept-Language": "fr",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Erreur Nominatim : ${response.status}`
      );
    }

    const results = await response.json();

    if (
      !Array.isArray(results) ||
      results.length === 0
    ) {
      return jsonResponse(
        {
          error: "Lieu introuvable.",
        },
        404
      );
    }

    const result = results[0];

    const latitude = Number(result.lat);
    const longitude = Number(result.lon);

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      throw new Error(
        "Coordonnées invalides reçues."
      );
    }

    const address = result.address ?? {};

    const city =
      address.city ??
      address.town ??
      address.village ??
      address.municipality ??
      address.hamlet ??
      "";

    const postcode = address.postcode ?? "";

    const department =
      address.county ??
      address.state_district ??
      "";

    return jsonResponse({
      latitude,
      longitude,
      displayName: result.display_name ?? query,
      city,
      postcode,
      department,
    });
  } catch (error) {
    console.error(
      "Erreur de géocodage :",
      error
    );

    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erreur interne de géocodage.",
      },
      500
    );
  }
});