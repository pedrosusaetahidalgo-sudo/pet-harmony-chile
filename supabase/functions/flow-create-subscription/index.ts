/**
 * Edge Function: flow-create-subscription
 * Crea un pago en Flow.cl para Premium B2C ($3.990 mensual o $39.900 anual).
 * Devuelve la URL de pago a la que redirigir al usuario.
 *
 * Body: { plan: 'monthly' | 'yearly' }
 * Resp: { url: string, token: string } | { error }
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://pawfriend.cl",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FLOW_BASE_URL = Deno.env.get("FLOW_BASE_URL") ?? "https://www.flow.cl/api";
const SITE_URL = "https://pawfriend.cl";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;

const PRICES: Record<string, number> = {
  monthly: 3990,
  yearly: 39900,
};

/** Firma HMAC-SHA256 sobre params alfabéticamente concatenados (key1value1key2value2…) */
async function signFlowParams(params: Record<string, string>, secret: string): Promise<string> {
  const sortedKeys = Object.keys(params).sort();
  const toSign = sortedKeys.map((k) => `${k}${params[k]}`).join("");
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuffer = await crypto.subtle.sign("HMAC", key, enc.encode(toSign));
  return Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FLOW_API_KEY = Deno.env.get("FLOW_API_KEY");
    const FLOW_SECRET_KEY = Deno.env.get("FLOW_SECRET_KEY");
    if (!FLOW_API_KEY || !FLOW_SECRET_KEY) {
      throw new Error("Flow credentials not configured");
    }

    const supabase = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false },
    });

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("User not authenticated");

    const userId = userData.user.id;
    const userEmail = userData.user.email;
    if (!userEmail) throw new Error("User has no email");

    // Rate limit: 10 req/h por user (suficiente para retries legítimos)
    const { data: quotaData, error: quotaError } = await supabase.rpc(
      "check_and_increment_payment_quota",
      { p_user_id: userId, p_limit: 10, p_window_seconds: 3600 }
    );
    if (quotaError) {
      console.error("[flow-create-subscription] quota check failed", quotaError);
      throw new Error("No se pudo verificar el cupo de pagos");
    }
    const quotaRow = Array.isArray(quotaData) ? quotaData[0] : quotaData;
    if (quotaRow && quotaRow.allowed === false) {
      return new Response(
        JSON.stringify({
          error: "Demasiados intentos de pago. Espera unos minutos e intenta de nuevo.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 429 }
      );
    }

    // Body
    const body = await req.json();
    const plan = body?.plan as string | undefined;
    if (!plan || (plan !== "monthly" && plan !== "yearly")) {
      throw new Error("Invalid plan: must be 'monthly' or 'yearly'");
    }
    const amount = PRICES[plan];

    // Idempotencia: si ya existe una subscription pendiente reciente (<5 min), reutilizar
    const { data: existingPending } = await supabase
      .from("subscriptions")
      .select("payment_provider_id")
      .eq("user_id", userId)
      .eq("plan_type", plan)
      .eq("status", "pending")
      .gt("start_date", new Date(Date.now() - 5 * 60 * 1000).toISOString())
      .order("start_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingPending?.payment_provider_id) {
      console.log("[flow-create-subscription] reusing pending subscription", existingPending.payment_provider_id);
      return new Response(
        JSON.stringify({
          url: `https://www.flow.cl/app/web/pay.php?token=${existingPending.payment_provider_id}`,
          token: existingPending.payment_provider_id,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const commerceOrder = `PF-${userId.slice(0, 8)}-${Date.now()}`;

    // Optional contexto que se nos devuelve en el callback
    const optional = JSON.stringify({ user_id: userId, plan });

    const params: Record<string, string> = {
      apiKey: FLOW_API_KEY,
      commerceOrder,
      subject: plan === "yearly" ? "Paw Friend Premium (anual)" : "Paw Friend Premium (mensual)",
      currency: "CLP",
      amount: String(amount),
      email: userEmail,
      paymentMethod: "9", // 9 = todas las opciones
      urlConfirmation: `${SUPABASE_URL}/functions/v1/flow-webhook`,
      urlReturn: `${SITE_URL}/upgrade/success`,
      optional,
    };

    const signature = await signFlowParams(params, FLOW_SECRET_KEY);
    params.s = signature;

    // POST x-www-form-urlencoded (con timeout de 15s)
    const formBody = new URLSearchParams(params).toString();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    let resp: Response;
    try {
      resp = await fetch(`${FLOW_BASE_URL}/payment/create`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formBody,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    const flowJson = await resp.json();
    if (!resp.ok || !flowJson?.url || !flowJson?.token) {
      console.error("[flow-create-subscription] Flow API error", { status: resp.status, flowJson });
      throw new Error("Flow API rejected the request");
    }

    // Registramos un subscription pendiente para tener trazabilidad
    await supabase.from("subscriptions").insert({
      user_id: userId,
      plan_type: plan,
      status: "pending",
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 5).toISOString(), // placeholder; el webhook lo corrige
      payment_amount_clp: amount,
      payment_provider_id: flowJson.token,
      auto_renew: true,
    });

    return new Response(
      JSON.stringify({
        url: `${flowJson.url}?token=${flowJson.token}`,
        token: flowJson.token,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[flow-create-subscription] error", msg);
    return new Response(
      JSON.stringify({ error: "No se pudo iniciar el pago. Intenta de nuevo en unos minutos." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
