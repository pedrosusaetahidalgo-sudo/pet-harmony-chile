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
  X as XIcon,
  Sparkles,
  TrendingUp,
  Star,
  Loader2,
  AlertCircle,
  Brain,
  FileText,
  ShoppingBag,
  Gamepad2,
  Users,
  Shield,
} from "lucide-react";
import { PremiumBadge } from "@/components/PremiumBadge";
import { track, EVENTS } from "@/lib/analytics";

const featureComparison = [
  {
    category: "Inteligencia Artificial",
    icon: Brain,
    features: [
      { name: "Asistente de Mascota (IA)", free: "3 consultas/dia", premium: "Ilimitado" },
      { name: "Tips de Raza personalizados", free: false, premium: true },
      { name: "Analisis de Comportamiento", free: false, premium: true },
    ],
  },
  {
    category: "Registros Clinicos",
    icon: FileText,
    features: [
      { name: "Historial medico basico", free: true, premium: true },
      { name: "Exportar PDF de registros", free: false, premium: true },
      { name: "Compartir con veterinario", free: false, premium: true },
    ],
  },
  {
    category: "Marketplace de Servicios",
    icon: ShoppingBag,
    features: [
      { name: "Reservar servicios", free: true, premium: true },
      { name: "5% descuento en comisiones", free: false, premium: true },
      { name: "Reserva prioritaria", free: false, premium: true },
    ],
  },
  {
    category: "Gamificacion",
    icon: Gamepad2,
    features: [
      { name: "Paw Game (puntos basicos)", free: true, premium: true },
      { name: "2x puntos en todo", free: false, premium: true },
      { name: "Badges exclusivos", free: false, premium: true },
    ],
  },
  {
    category: "Social",
    icon: Users,
    features: [
      { name: "Perfil y feed social", free: true, premium: true },
      { name: "Badge verificado Premium", free: false, premium: true },
      { name: "Perfil destacado", free: false, premium: true },
    ],
  },
];

const Premium = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly" | null>(null);

  useEffect(() => {
    track({ event: EVENTS.PREMIUM_VIEWED });
  }, []);

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

  const createSubscriptionMutation = useMutation({
    mutationFn: async (planType: "monthly" | "yearly") => {
      if (!user) throw new Error("User not authenticated");

      const price = planType === "monthly" ? 3990 : 39900;

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
      queryClient.invalidateQueries({ queryKey: ["user-premium-status", user?.id] });
      track({ event: EVENTS.PREMIUM_CONVERTED, properties: { plan: selectedPlan } });
      toast({
        title: "Bienvenido a Premium!",
        description: "Tu suscripcion Premium ha sido activada",
      });
      setSelectedPlan(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo procesar la suscripcion",
        variant: "destructive",
      });
    },
  });

  const plans = [
    {
      id: "monthly" as const,
      name: "Mensual",
      price: 3990,
      monthlyPrice: 3990,
      badge: null,
      features: [
        "Asistente IA ilimitado",
        "5% descuento en comisiones",
        "2x puntos en el Paw Game",
        "Badge Premium exclusivo",
        "Exportar registros en PDF",
        "Soporte prioritario",
      ],
    },
    {
      id: "yearly" as const,
      name: "Anual",
      price: 39900,
      monthlyPrice: 3325,
      badge: "Mas popular",
      features: [
        "Todo lo del plan Mensual",
        "Ahorra 2 meses completos",
        "Perfil destacado en busquedas",
        "Analytics avanzados (proveedores)",
        "Pin destacado en mapas",
        "Acceso anticipado a nuevas funciones",
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
          <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No pudimos cargar la informacion de Premium. Intenta de nuevo.</p>
          <Button variant="outline" onClick={() => refetch()} className="mt-4">Reintentar</Button>
        </div>
      </AppLayout>
    );
  }

  const isPremium = profile?.is_premium;
  const premiumPlan = profile?.premium_plan;
  const premiumEndDate = profile?.premium_end_date
    ? new Date(profile.premium_end_date)
    : null;

  return (
    <AppLayout>
      <div className="container max-w-6xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 mb-6 shadow-lg shadow-amber-500/25">
            <Crown className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 bg-clip-text text-transparent">
            Paw Premium
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Desbloquea el maximo potencial de Paw Friend para ti y tus mascotas.
            IA avanzada, registros completos y beneficios exclusivos.
          </p>
        </div>

        {/* Current Plan Status (if premium) */}
        {isPremium && premiumEndDate && (
          <Card className="mb-10 border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <PremiumBadge size="lg" />
                    <span className="font-semibold text-lg">Tu suscripcion Premium esta activa</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Plan <strong className="capitalize">{premiumPlan || "Premium"}</strong> &middot; Renueva el{" "}
                    {premiumEndDate.toLocaleDateString("es-CL", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <Badge className="bg-green-500 hover:bg-green-600 text-white px-3 py-1">
                  <Shield className="h-3 w-3 mr-1" />
                  Activo
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pricing Plans - Side by Side */}
        {!isPremium && (
          <div className="grid md:grid-cols-2 gap-6 mb-16 max-w-4xl mx-auto">
            {plans.map((plan) => {
              const isYearly = plan.id === "yearly";
              return (
                <Card
                  key={plan.id}
                  className={`relative overflow-hidden transition-all ${
                    isYearly
                      ? "border-amber-400 ring-2 ring-amber-400 shadow-lg shadow-amber-100 dark:shadow-amber-900/20"
                      : "border-border"
                  } ${
                    selectedPlan === plan.id
                      ? "border-primary ring-2 ring-primary"
                      : ""
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute top-0 right-0">
                      <div className="bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                        <Sparkles className="h-3 w-3 inline mr-1" />
                        {plan.badge}
                      </div>
                    </div>
                  )}
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>
                      <div className="mt-3">
                        <span className="text-4xl font-bold text-foreground">
                          {formatCLP(plan.price)}
                        </span>
                        <span className="text-muted-foreground ml-1">
                          /{plan.id === "monthly" ? "mes" : "ano"}
                        </span>
                      </div>
                      {isYearly && (
                        <p className="text-sm text-amber-600 dark:text-amber-400 font-medium mt-1">
                          Equivale a {formatCLP(plan.monthlyPrice)}/mes &middot; Ahorra 2 meses
                        </p>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2.5">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={`w-full ${
                        isYearly
                          ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                          : ""
                      }`}
                      variant={isYearly ? "default" : "outline"}
                      size="lg"
                      onClick={() => {
                        setSelectedPlan(plan.id);
                        createSubscriptionMutation.mutate(plan.id);
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
                          {isYearly ? "Suscribirse al Anual" : "Suscribirse al Mensual"}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Feature Comparison Table */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">
            Comparacion de funciones
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full max-w-4xl mx-auto">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-sm w-1/2">Funcion</th>
                  <th className="text-center py-3 px-4 font-semibold text-sm w-1/4">Gratis</th>
                  <th className="text-center py-3 px-4 font-semibold text-sm w-1/4">
                    <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <Crown className="h-4 w-4" />
                      Premium
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {featureComparison.map((group) => (
                  <FeatureGroup key={group.category} group={group} />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Benefits Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Para Duenos de Mascotas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <BenefitItem
                title="Asistente IA sin limites"
                description="Consulta todo sobre tu mascota con IA avanzada"
              />
              <BenefitItem
                title="Registros clinicos completos"
                description="Exporta PDF y comparte con tu veterinario"
              />
              <BenefitItem
                title="Ahorra en servicios"
                description="5% descuento en comisiones + reserva prioritaria"
              />
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
              <BenefitItem
                title="Destacado en busquedas"
                description="Aparece primero en resultados y mapas"
              />
              <BenefitItem
                title="Analytics avanzados"
                description="Clientes recurrentes, tendencias de ingresos"
              />
              <BenefitItem
                title="Badge verificado"
                description="Mayor confianza de los clientes"
              />
            </CardContent>
          </Card>
        </div>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle>Preguntas Frecuentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium mb-1">Puedo cancelar en cualquier momento?</p>
              <p className="text-sm text-muted-foreground">
                Si, puedes cancelar tu suscripcion en cualquier momento. Tu acceso Premium
                continuara hasta el final del periodo pagado.
              </p>
            </div>
            <div>
              <p className="font-medium mb-1">Como se aplica el descuento del 5%?</p>
              <p className="text-sm text-muted-foreground">
                El descuento se aplica automaticamente a la comision de la plataforma en cada
                reserva. Veras el ahorro reflejado en el checkout.
              </p>
            </div>
            <div>
              <p className="font-medium mb-1">Los puntos se multiplican automaticamente?</p>
              <p className="text-sm text-muted-foreground">
                Si, una vez que eres Premium, todos los puntos que ganes se multiplican por 2
                automaticamente.
              </p>
            </div>
            <div>
              <p className="font-medium mb-1">Que incluye el Asistente IA?</p>
              <p className="text-sm text-muted-foreground">
                El asistente IA Premium ofrece consultas ilimitadas sobre comportamiento, salud,
                nutricion y entrenamiento personalizado para tu mascota.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

function FeatureGroup({ group }: { group: typeof featureComparison[number] }) {
  const Icon = group.icon;
  return (
    <>
      <tr className="bg-muted/50">
        <td colSpan={3} className="py-2.5 px-4 font-semibold text-sm">
          <span className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-primary" />
            {group.category}
          </span>
        </td>
      </tr>
      {group.features.map((feature) => (
        <tr key={feature.name} className="border-b border-border/50">
          <td className="py-2.5 px-4 text-sm">{feature.name}</td>
          <td className="py-2.5 px-4 text-center">
            <FeatureCell value={feature.free} />
          </td>
          <td className="py-2.5 px-4 text-center">
            <FeatureCell value={feature.premium} isPremium />
          </td>
        </tr>
      ))}
    </>
  );
}

function FeatureCell({ value, isPremium = false }: { value: boolean | string; isPremium?: boolean }) {
  if (typeof value === "string") {
    return (
      <span className={`text-xs font-medium ${isPremium ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}>
        {value}
      </span>
    );
  }
  if (value) {
    return <Check className={`h-4 w-4 mx-auto ${isPremium ? "text-amber-500" : "text-green-500"}`} />;
  }
  return <XIcon className="h-4 w-4 mx-auto text-muted-foreground/40" />;
}

function BenefitItem({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export default Premium;
