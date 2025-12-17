import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";

const PaymentFailed = () => {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="container max-w-lg mx-auto px-4 py-16">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <CardTitle className="text-2xl">Pago no completado</CardTitle>
            <CardDescription>
              No pudimos procesar tu pago
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                El pago fue rechazado o cancelado. Tus servicios siguen en el carrito.
              </p>
              <p>
                Por favor verifica los datos de tu tarjeta e intenta nuevamente.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button onClick={() => navigate('/checkout')} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Intentar de nuevo
              </Button>
              <Button variant="outline" onClick={() => navigate(-1)} className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default PaymentFailed;
