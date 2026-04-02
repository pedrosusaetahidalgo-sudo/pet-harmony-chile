import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  Crown,
  Check,
  Sparkles,
  TrendingUp,
  Star,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { PremiumBadge } from "@/components/PremiumBadge";
import { track, EVENTS } from "@/lib/analytics";

const Premium = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly" | null>(null);

  useEffect(() => {
    track({ event: EVENTS.PREMIUM_VIEWED });
  }, []);

  // Get user's premium status
  const { data: profile, isError, refetch } = useQuery({
    queryKey: ["user-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("is_premium, premium_plan, premium_end_date")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Create subscription mutation — routes through webpay-init for payment validation
  const createSubscriptionMutation = useMutation({
    mutationFn: async (planType: "monthly" | "yearly") => {
      if (!user) throw new Error("User not authenticated");

      const price = planType === "monthly" ? 3990 : 39900;

      // Step 1: Invoke webpay-init Edge Function to process payment
      const { data, error } = await supabase.functions.invoke('webpay-init', {
        body: {
          items: [{
            service_type: 'premium_subscription',
            plan: planType,
            unit_price_clp: price,
          }],
          user_id: user.id,
        }
      });

      if (error || !data?.success) {
        throw new Error("No se pudo procesar el pago");
      }

      // Step 2: Only after payment succeeds, create subscription
      const startDate = new Date();
      const endDate = new Date();
      if (planType === "monthly") {
        endDate.setMonth(endDate.getMonth() + 1);
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      const { data: subscription, error: subError } = await supabase
        .from("subscriptions")
        .insert({
          user_id: user.id,
          plan_type: planType,
          status: "active",
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          payment_amount_clp: price,
          auto_renew: true,
        })
        .select()
        .maybeSingle();

      if (subError) throw subError;

      // Update profile premium status
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          is_premium: true,
          premium_start_date: startDate.toISOString(),
          premium_end_date: endDate.toISOString(),
          premium_plan: planType,
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      return subscription;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile", user?.id] });
      track({ event: EVENTS.PREMIUM_CONVERTED, properties: { plan: selectedPlan } });
      toast({
        title: "¡Bienvenido a Premium!",
        description: "Tu suscripción Premium ha sido activada",
      });
      setSelectedPlan(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo procesar la suscripción",
        variant: "destructive",
      });
    },
  });

  const plans = [
    {
      id: "monthly",
      name: "Mensual",
      price: 3990,
      priceLabel: "$3.990 CLP/mes",
      savings: null,
      features: [
        "5% descuento en comisiones",
        "2x puntos en el Paw Game",
        "Badge Premium exclusivo",
        "Soporte prioritario",
      ],
    },
    {
      id: "yearly",
      name: "Anual",
      price: 39900,
      priceLabel: "$39.900 CLP/año",
      savings: "Ahorra 2 meses",
      features: [
        "5% descuento en comisiones",
        "2x puntos en el Paw Game",
        "Badge Premium exclusivo",
        "Soporte prioritario",
        "Destacado en búsquedas (proveedores)",
        "Acceso a analytics avanzados (proveedores)",
      ],
    },
  ];

  const formatCLP = (amount: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (isError) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <p className="text-muted-foreground">No pudimos cargar la información de Premium. Intenta de nuevo.</p>
          <Button variant="outline" onClick={() => refetch()} className="mt-4">Reintentar</Button>
        </div>
      </AppLayout>
    );
  }

  const isPremium = profile?.is_premium;
  const premiumEndDate = profile?.premium_end_date
    ? new Date(profile.premium_end_date)
    : null;

  return (
    <AppLayout>
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 mb-4">
            <Crown className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4">PawFriend Premium</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Desbloquea beneficios exclusivos y apoya el crecimiento de la plataforma
          </p>
        </div>

        {isPremium && premiumEndDate && (
          <Card className="mb-8 border-yellow-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <PremiumBadge size="lg" />
                    <span className="font-semibold">Tu suscripción Premium está activa</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Renueva el {premiumEndDate.toLocaleDateString("es-CL", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Activo
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Benefits Overview */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Para Dueños de Mascotas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">5% descuento en comisiones</p>
                  <p className="text-sm text-muted-foreground">
                    Ahorra en cada reserva de servicio
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">2x puntos en el Paw Game</p>
                  <p className="text-sm text-muted-foreground">
                    Sube de nivel más rápido
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Badge Premium exclusivo</p>
                  <p className="text-sm text-muted-foreground">
                    Destácate en la comunidad
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Para Proveedores
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Destacado en búsquedas</p>
                  <p className="text-sm text-muted-foreground">
                    Aparece primero en resultados
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Analytics avanzados</p>
                  <p className="text-sm text-muted-foreground">
                    Clientes recurrentes, tendencias de ingresos
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Pin destacado en mapas</p>
                  <p className="text-sm text-muted-foreground">
                    Mayor visibilidad en el mapa
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pricing Plans */}
        {!isPremium && (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative ${
                  selectedPlan === plan.id
                    ? "border-primary ring-2 ring-primary"
                    : ""
                }`}
              >
                {plan.savings && (
                  <div className="absolute -top-3 right-4">
                    <Badge className="bg-green-500">{plan.savings}</Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>
                    <div className="mt-2">
                      <span className="text-3xl font-bold">
                        {formatCLP(plan.price)}
                      </span>
                      <span className="text-muted-foreground ml-2">
                        {plan.id === "monthly" ? "/mes" : "/año"}
                      </span>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={selectedPlan === plan.id ? "default" : "outline"}
                    onClick={() => {
                      setSelectedPlan(plan.id as "monthly" | "yearly");
                      createSubscriptionMutation.mutate(
                        plan.id as "monthly" | "yearly"
                      );
                    }}
                    disabled={createSubscriptionMutation.isPending}
                  >
                    {createSubscriptionMutation.isPending &&
                    selectedPlan === plan.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <Star className="h-4 w-4 mr-2" />
                        Suscribirse
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle>Preguntas Frecuentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium mb-1">¿Puedo cancelar en cualquier momento?</p>
              <p className="text-sm text-muted-foreground">
                Sí, puedes cancelar tu suscripción en cualquier momento. Tu acceso Premium
                continuará hasta el final del período pagado.
              </p>
            </div>
            <div>
              <p className="font-medium mb-1">¿Cómo se aplica el descuento del 5%?</p>
              <p className="text-sm text-muted-foreground">
                El descuento se aplica automáticamente a la comisión de la plataforma en cada
                reserva. Verás el ahorro reflejado en el checkout.
              </p>
            </div>
            <div>
              <p className="font-medium mb-1">¿Los puntos se multiplican automáticamente?</p>
              <p className="text-sm text-muted-foreground">
                Sí, una vez que eres Premium, todos los puntos que ganes se multiplican por 2
                automáticamente.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Premium;

