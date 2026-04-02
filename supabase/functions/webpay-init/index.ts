import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://pawfriend.cl",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CartItem {
  service_type: string;
  provider_id: string;
  pet_ids: string[];
  scheduled_date: string;
  duration_minutes: number;
  service_details?: Record<string, any>;
  unit_price_clp: number;
  address?: string;
  latitude?: number;
  longitude?: number;
  special_instructions?: string;
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[WEBPAY-INIT] ${step}${detailsStr}`);
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
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error("User not authenticated");
    
    const user = userData.user;
    logStep("User authenticated", { userId: user.id });

    // Parse request body
    const body = await req.json();
    const { items, return_url, user_id } = body as {
      items: (CartItem | { service_type: string; plan?: string; unit_price_clp: number })[];
      return_url?: string;
      user_id?: string;
    };

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error("No items in cart");
    }

    // Check if this is a premium subscription request
    const isPremiumSubscription = items.length === 1 && items[0].service_type === 'premium_subscription';

    if (isPremiumSubscription) {
      const item = items[0];
      if (typeof item.unit_price_clp !== "number" || item.unit_price_clp <= 0) {
        throw new Error("Premium subscription must have a valid unit_price_clp");
      }
      logStep("Premium subscription payment", { plan: (item as any).plan, price: item.unit_price_clp });

      // For demo: simulate successful payment for premium subscription
      // In production, integrate with Transbank Webpay Plus SDK here
      return new Response(
        JSON.stringify({
          success: true,
          payment_type: 'premium_subscription',
          // In production, return Webpay redirect URL
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    if (!return_url || typeof return_url !== "string") {
      throw new Error("return_url is required and must be a string");
    }

    // Validate each cart item has required fields
    for (const item of items) {
      if (!item.service_type || typeof item.service_type !== "string") {
        throw new Error("Each item must have a valid service_type");
      }
      if (!('provider_id' in item) || !item.provider_id || typeof item.provider_id !== "string") {
        throw new Error("Each item must have a valid provider_id");
      }
      if (typeof item.unit_price_clp !== "number" || item.unit_price_clp <= 0) {
        throw new Error("Each item must have a valid unit_price_clp");
      }
    }

    logStep("Cart items received", { count: items.length });

    // Get platform fee config
    const { data: configData } = await supabaseClient
      .from('platform_config')
      .select('config_value')
      .eq('config_key', 'platform_fee')
      .single();

    const feeConfig = configData?.config_value as { percentage: number; min_fee_clp: number; max_fee_clp: number } 
      || { percentage: 5, min_fee_clp: 500, max_fee_clp: 50000 };

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.unit_price_clp, 0);
    let platformFee = Math.round(subtotal * feeConfig.percentage / 100);
    if (platformFee < feeConfig.min_fee_clp) platformFee = feeConfig.min_fee_clp;
    if (platformFee > feeConfig.max_fee_clp) platformFee = feeConfig.max_fee_clp;
    const total = subtotal + platformFee;

    logStep("Totals calculated", { subtotal, platformFee, total });

    // Generate order number
    const orderNumber = `PF-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

    // Create order
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .insert({
        user_id: user.id,
        order_number: orderNumber,
        subtotal_clp: subtotal,
        platform_fee_clp: platformFee,
        total_clp: total,
        payment_method: 'webpay',
        payment_status: 'pending',
      })
      .select()
      .single();

    if (orderError) {
      logStep("Order creation failed", { error: orderError });
      throw new Error("Failed to create order");
    }

    logStep("Order created", { orderId: order.id, orderNumber });

    // Create order items
    const orderItems = items.map(item => {
      const itemFee = Math.round(item.unit_price_clp * feeConfig.percentage / 100);
      return {
        order_id: order.id,
        service_type: item.service_type,
        provider_id: item.provider_id,
        pet_ids: item.pet_ids,
        scheduled_date: item.scheduled_date,
        duration_minutes: item.duration_minutes,
        service_details: item.service_details,
        unit_price_clp: item.unit_price_clp,
        platform_fee_clp: itemFee,
        provider_amount_clp: item.unit_price_clp - itemFee,
        address: item.address,
        latitude: item.latitude,
        longitude: item.longitude,
        special_instructions: item.special_instructions,
      };
    });

    const { error: itemsError } = await supabaseClient
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      logStep("Order items creation failed", { error: itemsError });
      // Rollback order
      await supabaseClient.from('orders').delete().eq('id', order.id);
      throw new Error("Failed to create order items");
    }

    logStep("Order items created");

    // For demo purposes, simulate successful payment
    // In production, integrate with Transbank Webpay Plus SDK
    // const webpayToken = await initWebpayTransaction(total, orderNumber, return_url);
    
    // Update order with webpay info (simulated)
    await supabaseClient
      .from('orders')
      .update({
        payment_status: 'completed',
        paid_at: new Date().toISOString(),
        webpay_response: { simulated: true, status: 'AUTHORIZED' },
      })
      .eq('id', order.id);

    // Clear user's cart
    await supabaseClient
      .from('cart_items')
      .delete()
      .eq('user_id', user.id);

    logStep("Payment simulated successfully");

    // Create balance transactions for providers
    for (const item of orderItems) {
      // Ensure provider balance record exists
      const { data: existingBalance } = await supabaseClient
        .from('provider_balances')
        .select('id')
        .eq('provider_id', item.provider_id)
        .single();

      if (!existingBalance) {
        await supabaseClient
          .from('provider_balances')
          .insert({
            provider_id: item.provider_id,
            pending_balance_clp: item.provider_amount_clp,
            total_earned_clp: item.provider_amount_clp,
          });
      } else {
        await supabaseClient
          .from('provider_balances')
          .update({
            pending_balance_clp: supabaseClient.rpc('increment', { value: item.provider_amount_clp }),
            total_earned_clp: supabaseClient.rpc('increment', { value: item.provider_amount_clp }),
          })
          .eq('provider_id', item.provider_id);
      }

      // Get order item ID
      const { data: savedItem } = await supabaseClient
        .from('order_items')
        .select('id')
        .eq('order_id', order.id)
        .eq('provider_id', item.provider_id)
        .single();

      // Create balance transaction
      const releaseDate = new Date(item.scheduled_date);
      releaseDate.setDate(releaseDate.getDate() + 1); // Release day after service

      await supabaseClient
        .from('balance_transactions')
        .insert({
          provider_id: item.provider_id,
          order_item_id: savedItem?.id,
          transaction_type: 'earning',
          amount_clp: item.provider_amount_clp,
          status: 'pending',
          release_date: releaseDate.toISOString(),
        });
    }

    logStep("Provider balances updated");

    return new Response(
      JSON.stringify({ 
        success: true,
        order_number: orderNumber,
        // In production, return Webpay redirect URL
        // url: webpayUrl,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: "An internal error occurred while processing the payment." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
