import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Calendar,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
} from "@/lib/icons";
import { AppLayout } from "@/components/AppLayout";
import { LINKS } from "@/lib/links";

/**
 * Página unificada de resultado de pago.
 * Reemplaza a PaymentSuccess + PaymentResult + PaymentFailed.
 *
 * Estados (query param `status`):
 *  - "success" → muestra confirmación verde con número de orden
 *  - "failed"  → muestra error rojo con botón de reintentar
 *  - sin status → procesa el callback de Webpay (token_ws), llama webpay-confirm
 *                 y redirige a sí misma con `?status=success` o `?status=failed`
 *
 * Las rutas legacy /payment-success y /payment-failed siguen apuntando acá.
 */
type PaymentStatus = "processing" | "success" | "failed";

const PaymentResult = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialStatus = (searchParams.get("status") as PaymentStatus | null) ?? "processing";
  const [status, setStatus] = useState<PaymentStatus>(initialStatus);
  const orderNumber = searchParams.get("order");

  useEffect(() => {
    // Si ya viene con status explícito, no procesar.
    if (initialStatus !== "processing") return;

    const confirmPayment = async () => {
      const token = searchParams.get("token_ws");
      const orderId = searchParams.get("order_id");

      if (!token && !orderId) {
        // Usuario canceló el pago en Webpay → directo a fallido
        setStatus("failed");
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke("webpay-confirm", {
          body: { token, order_id: orderId },
        });
        if (error) throw error;

        if (data?.success) {
          // Redirigir a sí misma con status=success y el número de orden
          navigate(`/payment-result?status=success&order=${data.order_number ?? ""}`, {
            replace: true,
          });
        } else {
          setStatus("failed");
        }
      } catch (err) {
        console.error("Payment confirmation error:", err);
        setStatus("failed");
      }
    };

    void confirmPayment();
  }, [searchParams, navigate, initialStatus]);

  // === Render por estado ===
  if (status === "processing") {
    return (
      <AppLayout>
        <div className="container max-w-lg mx-auto px-4 py-16 text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <h2 className="text-xl font-semibold mb-2">Procesando tu pago…</h2>
          <p className="text-muted-foreground">
            Por favor espera mientras confirmamos tu transacción.
          </p>
        </div>
      </AppLayout>
    );
  }

  if (status === "success") {
    return (
      <AppLayout>
        <div className="container max-w-lg mx-auto px-4 py-16">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <CardTitle className="text-2xl">¡Pago exitoso!</CardTitle>
              <CardDescription>Tu reserva ha sido confirmada</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {orderNumber && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Número de orden</p>
                  <p className="font-mono font-semibold text-lg">{orderNumber}</p>
                </div>
              )}

              <div className="text-sm text-muted-foreground space-y-2">
                <p>Hemos enviado un correo de confirmación con los detalles de tu reserva.</p>
                <p>
                  El proveedor ha sido notificado y se pondrá en contacto contigo si es necesario.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <Button onClick={() => navigate(LINKS.bookings())} className="w-full">
                  <Calendar className="h-4 w-4 mr-2" />
                  Ver mis reservas
                </Button>
                <Button variant="outline" onClick={() => navigate(LINKS.home())} className="w-full">
                  Volver al inicio
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // status === "failed"
  return (
    <AppLayout>
      <div className="container max-w-lg mx-auto px-4 py-16">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <CardTitle className="text-2xl">Pago no completado</CardTitle>
            <CardDescription>No pudimos procesar tu pago</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-sm text-muted-foreground space-y-2">
              <p>El pago fue rechazado o cancelado.</p>
              <p>Por favor verifica los datos de tu tarjeta e intenta nuevamente.</p>
            </div>

            <div className="flex flex-col gap-3">
              <Button onClick={() => navigate(-1)} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Intentar de nuevo
              </Button>
              <Button variant="outline" onClick={() => navigate(LINKS.home())} className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al inicio
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default PaymentResult;
