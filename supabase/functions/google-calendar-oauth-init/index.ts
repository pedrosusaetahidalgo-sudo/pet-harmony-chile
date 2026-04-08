/**
 * Edge Function: google-calendar-oauth-init
 *
 * Devuelve la URL de autorización OAuth de Google para que el frontend
 * redirija al usuario. El callback recibe el `code` y lo procesa la
 * function `google-calendar-callback`.
 *
 * Auth: requiere user logueado (Bearer token).
 *
 * Secrets requeridos:
 *   GOOGLE_OAUTH_CLIENT_ID
 *   GOOGLE_OAUTH_REDIRECT_URI  (debe coincidir EXACTO con el configurado en GCP)
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://pawfriend.cl",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const clientId = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID");
    const redirectUri = Deno.env.get("GOOGLE_OAUTH_REDIRECT_URI");
    if (!clientId || !redirectUri) {
      throw new Error("Google OAuth not configured");
    }

    // Auth manual (verify_jwt=false en config.toml)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user) throw new Error("User not authenticated");

    // El state lleva el user_id firmado simple (es chequeo, no auth fuerte)
    const state = btoa(JSON.stringify({
      user_id: userData.user.id,
      ts: Date.now(),
    }));

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: SCOPES.join(" "),
      access_type: "offline", // crítico: para obtener refresh_token
      prompt: "consent",      // fuerza re-consent para garantizar refresh_token
      state,
    });

    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    return new Response(JSON.stringify({ url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[google-calendar-oauth-init] error", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
