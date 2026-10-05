import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const authorization = req.headers.get("Authorization") || "";

    if (!supabaseUrl || !anonKey) {
      console.error("Configuration Supabase manquante pour geocode.");
      return jsonResponse(
        { error: "Configuration serveur incomplète." },
        500
      );
    }

    if (!authorization.startsWith("Bearer ")) {
      return jsonResponse(
        { error: "Authentification requise." },
        401
      );
    }

    const supabase = createClient(
      supabaseUrl,
      anonKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        global: {
          headers: {
            Authorization: authorization,
          },
        },
      }
    );

    const token = authorization.slice("Bearer ".length).trim();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return jsonResponse(
        { error: "Authentification requise." },
        401
      );
    }

    const body = await req.json().catch(() => ({}));

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

    if (query.length > 250) {
      return jsonResponse(
        {
          error: "Le lieu saisi est trop long.",
        },
        400
      );
    }

    // Service français IGN / Base Adresse Nationale.
    // Le client ajoute « France » pour l'ancien fournisseur international.
    const addressQuery = query.replace(/(?:,\s*|\s+)France\s*$/i, '').trim();
    if (!addressQuery || /^France$/i.test(addressQuery)) {
      return jsonResponse({ error: "Précisez une ville ou une adresse." }, 400);
    }

    const url = new URL("https://data.geopf.fr/geocodage/search");

    url.searchParams.set("q", addressQuery);
    url.searchParams.set("index", "address");
    url.searchParams.set("limit", "1");

    const response = await fetch(url.toString(), {
      signal: AbortSignal.timeout(10000),
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Erreur IGN : ${response.status}`
      );
    }

    const payload = await response.json();
    const results = payload?.features;

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
    const properties = result.properties ?? {};
    if (typeof properties.score !== 'number' || properties.score < 0.4) {
      return jsonResponse({ error: "Lieu introuvable ou trop imprécis." }, 404);
    }

    // GeoJSON utilise l'ordre longitude, latitude.
    const [longitude, latitude] = result.geometry?.coordinates ?? [];

    if (
      result.geometry?.type !== 'Point' ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      Math.abs(latitude) > 90 ||
      Math.abs(longitude) > 180
    ) {
      throw new Error(
        "Coordonnées invalides reçues."
      );
    }

    const city = properties.city ?? properties.municipality ?? "";
    const postcode = properties.postcode ?? "";
    const department = String(properties.context ?? '').split(',')[1]?.trim() ?? "";

    return jsonResponse({
      latitude,
      longitude,
      displayName: properties.label ?? query,
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
