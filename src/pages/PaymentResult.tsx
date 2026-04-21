import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Calendar, ArrowRight, ArrowLeft, RefreshCw } from '@/lib/icons';
import { AppLayout } from '@/components/AppLayout';
import { LINKS } from '@/lib/links';
import { haptics } from '@/lib/haptics';

/**
 * Pagina unificada de resultado de pago.
 *
 * Estados (query param `status`):
 *  - "success" → muestra confirmacion verde con numero de orden
 *  - "failed"  → muestra error rojo con boton de reintentar
 *  - sin status → fallback a "failed" (los pagos vivos hoy son via Flow,
 *                 que redirige siempre con status explicito)
 *
 * Webpay esta deprecado (Premium B2C y B2B usan Flow). El edge function
 * webpay-confirm fue eliminado en commit chore.
 */
type PaymentStatus = 'success' | 'failed';

const PaymentResult = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialStatus = (searchParams.get('status') as PaymentStatus | null) ?? 'failed';
  const [status] = useState<PaymentStatus>(initialStatus);
  const orderNumber = searchParams.get('order');

  useEffect(() => {
    // Sin lifecycle de procesamiento: Flow siempre vuelve con ?status=...
    // Haptic feedback coherente con el resultado (QW-5 auditoría top-tier).
    if (initialStatus === 'success') haptics.success();
    else haptics.error();
  }, [initialStatus]);

  // === Render por estado ===
  if (status === 'success') {
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
