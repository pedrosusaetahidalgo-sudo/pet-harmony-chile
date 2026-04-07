
-- Platform configuration table for fees and settings
CREATE TABLE public.platform_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  config_key TEXT NOT NULL UNIQUE,
  config_value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default fee configuration (5% platform fee)
INSERT INTO public.platform_config (config_key, config_value, description) VALUES
('platform_fee', '{"percentage": 5, "min_fee_clp": 500, "max_fee_clp": 50000}', 'Platform fee configuration for transactions'),
('payment_methods', '{"webpay": true, "khipu": false, "servipag": false}', 'Enabled payment methods');

-- Shopping cart items table
CREATE TABLE public.cart_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL CHECK (service_type IN ('dog_walker', 'dogsitter', 'veterinarian', 'trainer')),
  provider_id UUID NOT NULL,
  pet_ids UUID[] NOT NULL,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  service_details JSONB,
  unit_price_clp INTEGER NOT NULL,
  address TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  special_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Orders table for completed purchases
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  order_number TEXT NOT NULL UNIQUE,
  subtotal_clp INTEGER NOT NULL,
  platform_fee_clp INTEGER NOT NULL,
  total_clp INTEGER NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'webpay',
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled')),
  webpay_token TEXT,
  webpay_order_id TEXT,
  webpay_response JSONB,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Order items table
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  provider_id UUID NOT NULL,
  pet_ids UUID[] NOT NULL,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL,
  service_details JSONB,
  unit_price_clp INTEGER NOT NULL,
  platform_fee_clp INTEGER NOT NULL,
  provider_amount_clp INTEGER NOT NULL,
  address TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  special_instructions TEXT,
  booking_id UUID,
  booking_created BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Provider balances table
CREATE TABLE public.provider_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES auth.users(id),
  pending_balance_clp INTEGER NOT NULL DEFAULT 0,
  available_balance_clp INTEGER NOT NULL DEFAULT 0,
  total_earned_clp INTEGER NOT NULL DEFAULT 0,
  total_withdrawn_clp INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(provider_id)
);

-- Provider balance transactions
CREATE TABLE public.balance_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES auth.users(id),
  order_item_id UUID REFERENCES public.order_items(id),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earning', 'release', 'withdrawal', 'refund')),
  amount_clp INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  release_date TIMESTAMP WITH TIME ZONE,
  processed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balance_transactions ENABLE ROW LEVEL SECURITY;

-- Platform config policies (read-only for all authenticated)
CREATE POLICY "Platform config is viewable by authenticated users"
ON public.platform_config FOR SELECT
TO authenticated
USING (true);

-- Cart items policies
CREATE POLICY "Users can view their own cart items"
ON public.cart_items FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cart items"
ON public.cart_items FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cart items"
ON public.cart_items FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cart items"
ON public.cart_items FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Orders policies
CREATE POLICY "Users can view their own orders"
ON public.orders FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own orders"
ON public.orders FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders"
ON public.orders FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Order items policies
CREATE POLICY "Users can view their own order items"
ON public.order_items FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  )
);

CREATE POLICY "Providers can view order items assigned to them"
ON public.order_items FOR SELECT
TO authenticated
USING (provider_id = auth.uid());

-- Provider balances policies
CREATE POLICY "Providers can view their own balance"
ON public.provider_balances FOR SELECT
TO authenticated
USING (provider_id = auth.uid());

CREATE POLICY "System can insert provider balances"
ON public.provider_balances FOR INSERT
TO authenticated
WITH CHECK (provider_id = auth.uid());

-- Balance transactions policies
CREATE POLICY "Providers can view their own transactions"
ON public.balance_transactions FOR SELECT
TO authenticated
USING (provider_id = auth.uid());

-- Function to generate order number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_number TEXT;
BEGIN
  new_number := 'PF-' || to_char(now(), 'YYYYMMDD') || '-' || 
                LPAD(floor(random() * 10000)::TEXT, 4, '0');
  RETURN new_number;
END;
$$;

-- Function to calculate platform fee
CREATE OR REPLACE FUNCTION public.calculate_platform_fee(amount_clp INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fee_config JSONB;
  percentage NUMERIC;
  min_fee INTEGER;
  max_fee INTEGER;
  calculated_fee INTEGER;
BEGIN
  SELECT config_value INTO fee_config
  FROM public.platform_config
  WHERE config_key = 'platform_fee';
  
  percentage := (fee_config->>'percentage')::NUMERIC;
  min_fee := (fee_config->>'min_fee_clp')::INTEGER;
  max_fee := (fee_config->>'max_fee_clp')::INTEGER;
  
  calculated_fee := ROUND(amount_clp * percentage / 100);
  
  IF calculated_fee < min_fee THEN
    RETURN min_fee;
  ELSIF calculated_fee > max_fee THEN
    RETURN max_fee;
  ELSE
    RETURN calculated_fee;
  END IF;
END;
$$;

-- Trigger to update timestamps
CREATE TRIGGER update_cart_items_updated_at
BEFORE UPDATE ON public.cart_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_provider_balances_updated_at
BEFORE UPDATE ON public.provider_balances
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
