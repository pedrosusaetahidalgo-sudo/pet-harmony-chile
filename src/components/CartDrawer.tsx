import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Trash2, Calendar, Clock, MapPin, PawPrint, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const SERVICE_LABELS: Record<string, string> = {
  dog_walker: "Paseo",
  dogsitter: "Cuidado",
  veterinarian: "Veterinario",
  trainer: "Entrenamiento",
};

export const CartDrawer = () => {
  const navigate = useNavigate();
  const {
    items,
    isLoading,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    getSubtotal,
    getPlatformFee,
    getTotal,
    feeConfig,
  } = useCart();

  const formatCLP = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleCheckout = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Carrito de Servicios
            {items.length > 0 && (
              <Badge variant="secondary">{items.length}</Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">Tu carrito está vacío</h3>
            <p className="text-muted-foreground mb-4">
              Agrega servicios para tus mascotas y procede al pago
            </p>
            <Button onClick={() => setIsCartOpen(false)}>
              Explorar servicios
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-4 py-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-muted/50 rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={item.provider_avatar} />
                          <AvatarFallback>
                            {item.provider_name?.charAt(0) || 'P'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{item.provider_name}</p>
                          <Badge variant="outline" className="text-xs">
                            {SERVICE_LABELS[item.service_type] || item.service_type}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => removeFromCart(item.id)}
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="text-sm space-y-1 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          {format(new Date(item.scheduled_date), "PPP 'a las' HH:mm", { locale: es })}
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

                    <div className="text-right">
                      <span className="font-semibold text-primary">
                        {formatCLP(item.unit_price_clp)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="border-t pt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatCLP(getSubtotal())}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>
                  Comisión de servicio ({feeConfig?.percentage || 5}%)
                </span>
                <span>{formatCLP(getPlatformFee())}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span className="text-primary">{formatCLP(getTotal())}</span>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleCheckout}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Ir al pago
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Pago seguro con Webpay
              </p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};
