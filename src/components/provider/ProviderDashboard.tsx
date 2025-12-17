import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  DollarSign, 
  CreditCard, 
  Calendar,
  Loader2,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const ProviderDashboard = () => {
  const { user } = useAuth();

  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ["provider-dashboard", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      // Get provider balance
      const { data: balance, error: balanceError } = await supabase
        .from("provider_balances")
        .select("*")
        .eq("provider_id", user.id)
        .single();

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
      <div>
        <h2 className="text-2xl font-bold">Dashboard de Proveedor</h2>
        <p className="text-muted-foreground">
          Resumen de tus ingresos y reservas
        </p>
      </div>

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

