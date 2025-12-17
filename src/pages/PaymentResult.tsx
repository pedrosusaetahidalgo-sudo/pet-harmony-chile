import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { Loader2 } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";

const PaymentResult = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');

  useEffect(() => {
    const confirmPayment = async () => {
      const token = searchParams.get('token_ws');
      const orderId = searchParams.get('order_id');

      if (!token && !orderId) {
        // User cancelled payment
        navigate('/checkout');
        return;
      }

      try {
        // Confirm payment with Webpay
        const { data, error } = await supabase.functions.invoke('webpay-confirm', {
          body: { token, order_id: orderId },
        });

        if (error) throw error;

        if (data?.success) {
          await clearCart();
          setStatus('success');
          navigate(`/payment-success?order=${data.order_number || ''}`);
        } else {
          setStatus('error');
          navigate('/payment-failed');
        }
      } catch (error) {
        console.error('Payment confirmation error:', error);
        setStatus('error');
        navigate('/payment-failed');
      }
    };

    confirmPayment();
  }, [searchParams, navigate, clearCart]);

  return (
    <AppLayout>
      <div className="container max-w-lg mx-auto px-4 py-16 text-center">
        <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
        <h2 className="text-xl font-semibold mb-2">Procesando tu pago...</h2>
        <p className="text-muted-foreground">
          Por favor espera mientras confirmamos tu transacción
        </p>
      </div>
    </AppLayout>
  );
};

export default PaymentResult;
