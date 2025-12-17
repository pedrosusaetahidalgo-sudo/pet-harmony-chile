import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  PawPrint, 
  CreditCard, 
  Shield, 
  Loader2,
  CheckCircle,
  AlertCircle 
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AppLayout } from "@/components/AppLayout";

const SERVICE_LABELS: Record<string, string> = {
  dog_walker: "Paseo de perros",
  dogsitter: "Cuidado de mascotas",
  veterinarian: "Visita veterinaria",
  trainer: "Entrenamiento",
};

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, getSubtotal, getPlatformFee, getTotal, feeConfig, clearCart, isPremium } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const formatCLP = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handlePayment = async () => {
    if (!user || items.length === 0) return;

    setIsProcessing(true);
    setPaymentError(null);

    try {
      // Call the Webpay init edge function
      const { data, error } = await supabase.functions.invoke('webpay-init', {
        body: {
          items: items.map(item => ({
            service_type: item.service_type,
            provider_id: item.provider_id,
            pet_ids: item.pet_ids,
            scheduled_date: item.scheduled_date,
            duration_minutes: item.duration_minutes,
            service_details: item.service_details,
            unit_price_clp: item.unit_price_clp,
            address: item.address,
            latitude: item.latitude,
            longitude: item.longitude,
            special_instructions: item.special_instructions,
          })),
          return_url: `${window.location.origin}/payment-result`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        // Redirect to Webpay
        window.location.href = data.url;
      } else if (data?.success) {
        // For demo/testing - simulate successful payment
        toast({
          title: "Pago procesado",
          description: "Tu pedido ha sido confirmado exitosamente",
        });
        await clearCart();
        navigate('/payment-success');
      } else {
        throw new Error('No se pudo iniciar el pago');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      setPaymentError(error.message || 'Error al procesar el pago');
      toast({
        title: "Error en el pago",
        description: error.message || "No se pudo procesar el pago",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <AppLayout>
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Carrito vacío</h2>
              <p className="text-muted-foreground mb-4">
                No tienes servicios en tu carrito
              </p>
              <Button onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Order Summary */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Resumen del pedido</CardTitle>
                <CardDescription>
                  {items.length} servicio{items.length > 1 ? 's' : ''} en tu carrito
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 p-4 bg-muted/50 rounded-lg"
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={item.provider_avatar} />
                      <AvatarFallback>
                        {item.provider_name?.charAt(0) || 'P'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{item.provider_name}</p>
                          <Badge variant="outline" className="text-xs">
                            {SERVICE_LABELS[item.service_type]}
                          </Badge>
                        </div>
                        <span className="font-semibold text-primary">
                          {formatCLP(item.unit_price_clp)}
                        </span>
                      </div>

                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>
                            {format(new Date(item.scheduled_date), "EEEE d 'de' MMMM, HH:mm", { locale: es })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{item.duration_minutes} minutos</span>
                        </div>
                        {item.address && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5" />
                            <span className="truncate">{item.address}</span>
                          </div>
                        )}
                        {item.pet_names && item.pet_names.length > 0 && (
                          <div className="flex items-center gap-2">
                            <PawPrint className="h-3.5 w-3.5" />
                            <span>{item.pet_names.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Payment Card */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Pago
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatCLP(getSubtotal())}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Comisión ({feeConfig?.percentage || 5}%)</span>
                    <div className="flex items-center gap-2">
                      {isPremium && (
                        <Badge variant="secondary" className="text-xs">
                          -5% Premium
                        </Badge>
                      )}
                      <span>{formatCLP(getPlatformFee())}</span>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span className="text-primary">{formatCLP(getTotal())}</span>
                  </div>
                </div>

                {paymentError && (
                  <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {paymentError}
                  </div>
                )}

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handlePayment}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pagar con Webpay
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  Pago seguro con Transbank
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Pago seguro</p>
                      <p className="text-muted-foreground text-xs">
                        Tus datos están protegidos con cifrado SSL
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Confirmación inmediata</p>
                      <p className="text-muted-foreground text-xs">
                        Recibirás un correo de confirmación
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Pago liberado al completar</p>
                      <p className="text-muted-foreground text-xs">
                        El proveedor recibe el pago después del servicio
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Checkout;
