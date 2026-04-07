
-- Add missing RLS policies for order_items (insert for authenticated users via orders)
CREATE POLICY "Users can insert order items for their orders"
ON public.order_items FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  )
);

-- Add missing RLS policies for balance_transactions (system inserts via service role)
CREATE POLICY "System can insert balance transactions"
ON public.balance_transactions FOR INSERT
TO authenticated
WITH CHECK (true);

-- Add policy for provider_balances insert
CREATE POLICY "System can manage provider balances"
ON public.provider_balances FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
