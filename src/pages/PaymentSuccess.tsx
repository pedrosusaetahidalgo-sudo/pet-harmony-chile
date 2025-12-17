import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Calendar, ArrowRight } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get('order');

  return (
    <AppLayout>
      <div className="container max-w-lg mx-auto px-4 py-16">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl">¡Pago exitoso!</CardTitle>
            <CardDescription>
              Tu reserva ha sido confirmada
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {orderNumber && (
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Número de orden</p>
                <p className="font-mono font-semibold text-lg">{orderNumber}</p>
              </div>
            )}

            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                Hemos enviado un correo de confirmación con los detalles de tu reserva.
              </p>
              <p>
                El proveedor ha sido notificado y se pondrá en contacto contigo si es necesario.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button onClick={() => navigate('/my-bookings')} className="w-full">
                <Calendar className="h-4 w-4 mr-2" />
                Ver mis reservas
              </Button>
              <Button variant="outline" onClick={() => navigate('/feed')} className="w-full">
                Volver al inicio
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default PaymentSuccess;
