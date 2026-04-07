import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://pawfriend.cl",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[WEBPAY-CONFIRM] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const authToken = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(authToken);
    if (userError || !userData.user) throw new Error("User not authenticated");

    logStep("User authenticated", { userId: userData.user.id });

    const { token, order_id } = await req.json();

    // Input validation
    if (!token && !order_id) {
      throw new Error("Either token or order_id is required");
    }
    if (token && typeof token !== "string") {
      throw new Error("token must be a string");
    }
    if (order_id && typeof order_id !== "string") {
      throw new Error("order_id must be a string");
    }

    logStep("Confirming payment", { token: token?.slice(0, 10), order_id });

    // In production, confirm with Transbank Webpay API
    // const webpayResult = await confirmWebpayTransaction(token);

    // For demo, find the order and mark as completed
    let order;
    if (order_id) {
      const { data } = await supabaseClient
        .from('orders')
        .select('*')
        .eq('id', order_id)
        .single();
      order = data;
    } else if (token) {
      const { data } = await supabaseClient
        .from('orders')
        .select('*')
        .eq('webpay_token', token)
        .single();
      order = data;
    }

    if (!order) {
      throw new Error("Order not found");
    }

    logStep("Order found", { orderId: order.id, status: order.payment_status });

    // If already completed, return success
    if (order.payment_status === 'completed') {
      return new Response(
        JSON.stringify({ 
          success: true, 
          order_number: order.order_number,
          already_processed: true 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Update order status
    await supabaseClient
      .from('orders')
      .update({
        payment_status: 'completed',
        paid_at: new Date().toISOString(),
        webpay_response: { confirmed: true, confirmed_at: new Date().toISOString() },
      })
      .eq('id', order.id);

    logStep("Order updated to completed");

    // Mark order items as booking created
    await supabaseClient
      .from('order_items')
      .update({ booking_created: true })
      .eq('order_id', order.id);

    // Award points for booking completion
    try {
      await supabaseClient.rpc('award_points', {
        p_user_id: order.user_id,
        p_points: 50, // Points for booking completion
        p_action_type: 'booking',
        p_action_id: order.id,
        p_description: 'Reserva completada',
      });
    } catch (pointsError) {
      console.error('Error awarding points for booking:', pointsError);
      // Don't fail payment confirmation if points fail
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        order_number: order.order_number,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ success: false, error: "An internal error occurred while confirming the payment." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
