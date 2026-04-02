import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getPaymentGateway } from "../_shared/payment-gateway.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://pawfriend.cl",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PLAN_PRICES: Record<string, Record<string, number>> = {
  premium: { monthly: 3990, yearly: 39900 },
  premium_plus: { monthly: 6990, yearly: 69900 },
  provider_pro: { monthly: 9990, yearly: 99900 },
  provider_premium: { monthly: 19990, yearly: 199900 },
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
    const { payment_type, plan_id, billing_cycle, booking_id, return_url } = body;

    if (!payment_type || !["subscription", "booking", "provider_subscription"].includes(payment_type)) {
      return new Response(JSON.stringify({ error: "Invalid payment_type" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let amount = 0;
    let description = "";

    if (payment_type === "subscription" || payment_type === "provider_subscription") {
      if (!plan_id || !billing_cycle) {
        return new Response(JSON.stringify({ error: "plan_id and billing_cycle required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const prices = PLAN_PRICES[plan_id];
      if (!prices || !prices[billing_cycle]) {
        return new Response(JSON.stringify({ error: "Invalid plan or billing cycle" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      amount = prices[billing_cycle];
      description = `${plan_id} ${billing_cycle === "monthly" ? "mensual" : "anual"}`;
    } else if (payment_type === "booking") {
      if (!booking_id) {
        return new Response(JSON.stringify({ error: "booking_id required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: booking } = await supabase
        .from("bookings")
        .select("total_price, service_type")
        .eq("id", booking_id)
        .eq("user_id", userId)
        .maybeSingle();
      if (!booking) {
        return new Response(JSON.stringify({ error: "Booking not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      amount = booking.total_price;
      description = `Reserva ${booking.service_type}`;
    }

    // Create payment_history record
    const { data: payment, error: payError } = await supabase
      .from("payment_history")
      .insert({
        user_id: userId,
        payment_type,
        reference_id: booking_id || null,
        description,
        amount,
        commission: payment_type === "booking" ? Math.round(amount * 12 / 100) : 0,
        net_amount: payment_type === "booking" ? amount - Math.round(amount * 12 / 100) : amount,
        status: "pending",
      })
      .select()
      .single();

    if (payError || !payment) {
      console.error("Payment creation error:", payError);
      return new Response(JSON.stringify({ error: "Failed to create payment" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create transaction via gateway
    const gateway = getPaymentGateway();
    const result = await gateway.createTransaction({
      amount,
      orderId: payment.id,
      returnUrl: return_url || "https://pawfriend.cl/payment-result",
      description,
    });

    // Update payment with token
    await supabase
      .from("payment_history")
      .update({ payment_reference: result.token })
      .eq("id", payment.id);

    return new Response(JSON.stringify({
      payment_id: payment.id,
      redirect_url: result.redirectUrl,
      token: result.token,
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("payment-create error:", error);
    return new Response(JSON.stringify({ error: "An internal error occurred" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
