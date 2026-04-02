import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getPaymentGateway } from "../_shared/payment-gateway.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://pawfriend.cl",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authorization required" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "User not authenticated" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;
    const body = await req.json();
    const { payment_id, token: payToken } = body;

    if (!payment_id) {
      return new Response(JSON.stringify({ error: "payment_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find payment
    const { data: payment } = await supabase
      .from("payment_history")
      .select("*")
      .eq("id", payment_id)
      .eq("user_id", userId)
      .maybeSingle();

    if (!payment) {
      return new Response(JSON.stringify({ error: "Payment not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (payment.status === "completed") {
      return new Response(JSON.stringify({ success: true, already_processed: true }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Confirm via gateway
    const gateway = getPaymentGateway();
    const result = await gateway.confirmTransaction({ token: payToken || payment.payment_reference });

    if (!result.success) {
      await supabase
        .from("payment_history")
        .update({ status: "failed" })
        .eq("id", payment.id);

      return new Response(JSON.stringify({ success: false, error: "Payment was declined" }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark payment completed
    await supabase
      .from("payment_history")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        webpay_response: result,
      })
      .eq("id", payment.id);

    // Process based on payment_type
    if (payment.payment_type === "subscription") {
      const periodEnd = new Date();
      if (payment.description?.includes("anual")) {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }

      const planId = payment.description?.includes("premium_plus") ? "premium_plus" : "premium";
      const cycle = payment.description?.includes("anual") ? "yearly" : "monthly";

      await supabase.from("subscriptions").insert({
        user_id: userId,
        plan_id: planId,
        billing_cycle: cycle,
        status: "active",
        price: payment.amount,
        current_period_end: periodEnd.toISOString(),
        last_payment_at: new Date().toISOString(),
        last_payment_reference: payment.payment_reference,
      });
      // The trigger sync_user_plan will update profiles automatically
    } else if (payment.payment_type === "booking" && payment.reference_id) {
      await supabase
        .from("bookings")
        .update({
          payment_status: "paid",
          status: "confirmed",
          payment_reference: payment.payment_reference,
          confirmed_at: new Date().toISOString(),
        })
        .eq("id", payment.reference_id);
    } else if (payment.payment_type === "provider_subscription") {
      // Handle provider subscription similarly
      const periodEnd = new Date();
      if (payment.description?.includes("anual")) {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }

      const planId = payment.description?.includes("provider_premium") ? "provider_premium" : "provider_pro";

      // Get provider_id for this user
      const { data: provider } = await supabase
        .from("service_providers")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (provider) {
        await supabase.from("provider_subscriptions").insert({
          provider_id: provider.id,
          user_id: userId,
          plan_id: planId,
          billing_cycle: payment.description?.includes("anual") ? "yearly" : "monthly",
          status: "active",
          price: payment.amount,
          current_period_end: periodEnd.toISOString(),
        });
      }
    }

    // Award points for subscription
    if (payment.payment_type === "subscription") {
      await supabase.from("paw_point_transactions").insert({
        user_id: userId,
        points_amount: 50,
        transaction_type: "earned",
        source_type: "subscribe_premium",
      });
    }

    return new Response(JSON.stringify({ success: true, payment }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("payment-confirm error:", error);
    return new Response(JSON.stringify({ error: "An internal error occurred" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
