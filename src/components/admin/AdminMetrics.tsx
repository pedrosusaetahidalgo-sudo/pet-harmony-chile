import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, PawPrint, Calendar, TrendingUp, Stethoscope, Star } from "@/lib/icons";
import { Skeleton } from "@/components/ui/skeleton";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  loading?: boolean;
}

function MetricCard({ title, value, icon: Icon, description, loading }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminMetrics() {
  const { data: userCount, isLoading: loadingUsers } = useQuery({
    queryKey: ["admin-metric-users"],
    queryFn: async () => {
      const { count } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const { data: petCount, isLoading: loadingPets } = useQuery({
    queryKey: ["admin-metric-pets"],
    queryFn: async () => {
      const { count } = await supabase
        .from("pets")
        .select("*", { count: "exact", head: true })
        .eq("lifecycle_status", "active");
      return count ?? 0;
    },
  });

  const { data: bookingCount, isLoading: loadingBookings } = useQuery({
    queryKey: ["admin-metric-bookings-week"],
    queryFn: async () => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { count } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .gte("created_at", weekAgo.toISOString());
      return count ?? 0;
    },
  });

  const { data: postCount, isLoading: loadingPosts } = useQuery({
    queryKey: ["admin-metric-posts-week"],
    queryFn: async () => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { count } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .gte("created_at", weekAgo.toISOString());
      return count ?? 0;
    },
  });

  const { data: providerCount, isLoading: loadingProviders } = useQuery({
    queryKey: ["admin-metric-providers"],
    queryFn: async () => {
      const { count } = await (supabase
        .from("service_providers") as any)
        .select("id", { count: "exact", head: true })
        .eq("verified", true);
      return (count as number | null) ?? 0;
    },
  });

  const { data: reviewCount, isLoading: loadingReviews } = useQuery({
    queryKey: ["admin-metric-reviews"],
    queryFn: async () => {
      const { count } = await supabase
        .from("service_reviews")
        .select("id", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">Métricas generales</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <MetricCard
            title="Usuarios registrados"
            value={userCount ?? 0}
            icon={Users}
            loading={loadingUsers}
          />
          <MetricCard
            title="Mascotas activas"
            value={petCount ?? 0}
            icon={PawPrint}
            loading={loadingPets}
          />
          <MetricCard
            title="Proveedores verificados"
            value={providerCount ?? 0}
            icon={Stethoscope}
            loading={loadingProviders}
          />
          <MetricCard
            title="Reservas (7 días)"
            value={bookingCount ?? 0}
            icon={Calendar}
            description="Últimos 7 días"
            loading={loadingBookings}
          />
          <MetricCard
            title="Publicaciones (7 días)"
            value={postCount ?? 0}
            icon={TrendingUp}
            description="Últimos 7 días"
            loading={loadingPosts}
          />
          <MetricCard
            title="Reseñas totales"
            value={reviewCount ?? 0}
            icon={Star}
            loading={loadingReviews}
          />
        </div>
      </div>
    </div>
  );
}
