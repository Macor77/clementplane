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
          "Clementplane/1.0 (contact@clementplane.fr)",
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
