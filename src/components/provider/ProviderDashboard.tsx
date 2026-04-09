import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserCog, Eye, Stethoscope, Star, Users, FileText, BarChart3 } from "@/lib/icons";
import { ProviderDirectoryCard } from "./ProviderDirectoryCard";
import { SharedFichasCard } from "./SharedFichasCard";
import {
  TrendingUp,
  DollarSign,
  CreditCard,
  Calendar,
  Loader2,
  AlertCircle,
} from "@/lib/icons";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const ProviderDashboard = () => {
  const { user } = useAuth();

  // Slug del provider para "Ver como me ven los duenos" (preview publico)
  const { data: providerInfo } = useQuery({
    queryKey: ["provider-self", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("service_providers")
        .select("id, slug, is_directory_visible, directory_views, avg_rating, total_reviews")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ["provider-dashboard", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      // Get provider balance
      const { data: balance, error: balanceError } = await supabase
        .from("provider_balances")
        .select("*")
        .eq("provider_id", user.id)
        .maybeSingle();

      if (balanceError && balanceError.code !== "PGRST116") {
        throw balanceError;
      }

      // Get order items for this provider
      const { data: orderItems, error: itemsError } = await supabase
        .from("order_items")
        .select(`
          *,
          orders!inner (
            id,
            order_number,
            payment_status,
            paid_at,
            created_at
          )
        `)
        .eq("provider_id", user.id)
        .order("created_at", { ascending: false });

      if (itemsError) throw itemsError;

      // Calculate statistics
      const completedItems = orderItems?.filter(
        item => item.orders?.payment_status === "completed"
      ) || [];

      const grossRevenue = completedItems.reduce(
        (sum, item) => sum + item.unit_price_clp,
        0
      );

      const platformFees = completedItems.reduce(
        (sum, item) => sum + item.platform_fee_clp,
        0
      );

      const netPayouts = completedItems.reduce(
        (sum, item) => sum + item.provider_amount_clp,
        0
      );

      // Recent bookings (last 10)
      const recentBookings = completedItems.slice(0, 10).map(item => ({
        id: item.id,
        orderNumber: item.orders?.order_number,
        serviceType: item.service_type,
        scheduledDate: item.scheduled_date,
        unitPrice: item.unit_price_clp,
        platformFee: item.platform_fee_clp,
        providerPayout: item.provider_amount_clp,
        paidAt: item.orders?.paid_at,
      }));

      return {
        balance: balance || {
          pending_balance_clp: 0,
          available_balance_clp: 0,
          total_earned_clp: 0,
          total_withdrawn_clp: 0,
        },
        stats: {
          totalBookings: completedItems.length,
          grossRevenue,
          platformFees,
          netPayouts,
        },
        recentBookings,
      };
    },
    enabled: !!user,
  });

  const formatCLP = (amount: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getServiceTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      dog_walker: "Paseo",
      dogsitter: "Cuidado",
      veterinarian: "Veterinaria",
      trainer: "Entrenamiento",
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-8 w-8 text-destructive mb-2" />
        <p className="text-muted-foreground">
          Error al cargar el dashboard
        </p>
      </div>
    );
  }

  const { balance, stats, recentBookings } = dashboardData || {
    balance: {
      pending_balance_clp: 0,
      available_balance_clp: 0,
      total_earned_clp: 0,
      total_withdrawn_clp: 0,
    },
    stats: {
      totalBookings: 0,
      grossRevenue: 0,
      platformFees: 0,
      netPayouts: 0,
    },
    recentBookings: [],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold">Dashboard de Proveedor</h2>
          <p className="text-muted-foreground">
            Resumen de tus ingresos y reservas
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {providerInfo?.slug && (
            <Link to={`/veterinarios/${providerInfo.slug}`}>
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-1" /> Ver cómo me ven los dueños
              </Button>
            </Link>
          )}
          <Link to="/provider/profile-edit">
            <Button variant="outline">
              <UserCog className="h-4 w-4 mr-1" /> Editar mi perfil público
            </Button>
          </Link>
        </div>
      </div>

      {/* Fichas compartidas con este vet en los ultimos 7 dias */}
      <SharedFichasCard providerId={providerInfo?.id} />

      {/* Onboarding state: vet recien creado, sin reservas y sin perfil completo */}
      {stats.totalBookings === 0 && (
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-amber-50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-purple-600" />
              Aún no recibes reservas. Vamos a cambiarlo.
            </CardTitle>
            <CardDescription>
              3 pasos para que los dueños te encuentren en tu comuna.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link to="/provider/profile-edit" className="block">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-purple-200 hover:shadow-sm transition">
                <div>
                  <p className="text-sm font-semibold">1. Completa tu perfil público</p>
                  <p className="text-xs text-muted-foreground">
                    Foto, bio, especialidades, comuna y precio.
                  </p>
                </div>
                <Button size="sm" variant="ghost">→</Button>
              </div>
            </Link>
            {providerInfo?.slug && (
              <Link to={`/veterinarios/${providerInfo.slug}`} className="block">
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-purple-200 hover:shadow-sm transition">
                  <div>
                    <p className="text-sm font-semibold">2. Revisa cómo te ven los dueños</p>
                    <p className="text-xs text-muted-foreground">
                      Abre tu perfil público en una pestaña nueva.
                    </p>
                  </div>
                  <Button size="sm" variant="ghost">→</Button>
                </div>
              </Link>
            )}
            <Link to="/veterinarios" className="block">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-purple-200 hover:shadow-sm transition">
                <div>
                  <p className="text-sm font-semibold">3. Comparte tu URL en Instagram y WhatsApp</p>
                  <p className="text-xs text-muted-foreground">
                    Las primeras reservas casi siempre vienen de tu propia red.
                  </p>
                </div>
                <Button size="sm" variant="ghost">→</Button>
              </div>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Tarjeta del directorio público */}
      <ProviderDirectoryCard />

      {/* Balance Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Balance Disponible
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCLP(balance.available_balance_clp)}
            </div>
            <p className="text-xs text-muted-foreground">
              Listo para retirar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Balance Pendiente
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCLP(balance.pending_balance_clp)}
            </div>
            <p className="text-xs text-muted-foreground">
              En proceso de liberación
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Ganado
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCLP(balance.total_earned_clp)}
            </div>
            <p className="text-xs text-muted-foreground">
              Histórico total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Retirado
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCLP(balance.total_withdrawn_clp)}
            </div>
            <p className="text-xs text-muted-foreground">
              Retiros realizados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Business Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Visitas al perfil
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {providerInfo?.directory_views ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Total desde tu registro
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Calificacion
            </CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {providerInfo?.avg_rating
                ? Number(providerInfo.avg_rating).toFixed(1)
                : "—"}
            </div>
            <p className="text-xs text-muted-foreground">
              {providerInfo?.total_reviews ?? 0} resenas verificadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Clientes unicos
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(() => {
                const uniqueClients = new Set(
                  recentBookings.map((b) => b.orderNumber?.split("-")[0])
                );
                return uniqueClients.size;
              })()}
            </div>
            <p className="text-xs text-muted-foreground">
              En tus ultimas reservas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Fichas compartidas
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalBookings > 0
                ? `${((stats.netPayouts / stats.grossRevenue) * 100).toFixed(0)}%`
                : "—"}
            </div>
            <p className="text-xs text-muted-foreground">
              Margen neto despues de comisiones
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Ingresos Brutos</CardTitle>
            <CardDescription>Total de todas las reservas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCLP(stats.grossRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalBookings} reserva{stats.totalBookings !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Comisiones Pagadas</CardTitle>
            <CardDescription>Comisiones de la plataforma</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCLP(stats.platformFees)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.grossRevenue > 0
                ? `${((stats.platformFees / stats.grossRevenue) * 100).toFixed(1)}% del total`
                : "0%"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Pagos Netos</CardTitle>
            <CardDescription>Lo que has recibido</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCLP(stats.netPayouts)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Después de comisiones
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings */}
      <Card>
        <CardHeader>
          <CardTitle>Reservas Recientes</CardTitle>
          <CardDescription>
            Últimas {recentBookings.length} reservas completadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentBookings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No hay reservas completadas aún</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">
                        {getServiceTypeLabel(booking.serviceType)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {booking.orderNumber}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(
                        new Date(booking.scheduledDate),
                        "EEEE d 'de' MMMM, HH:mm",
                        { locale: es }
                      )}
                    </p>
                    {booking.paidAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Pagado: {format(new Date(booking.paidAt), "d MMM yyyy", { locale: es })}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {formatCLP(booking.providerPayout)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Comisión: {formatCLP(booking.platformFee)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Total: {formatCLP(booking.unitPrice)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProviderDashboard;

