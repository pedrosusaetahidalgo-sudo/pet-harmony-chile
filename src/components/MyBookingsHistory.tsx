import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  History,
  Filter
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Booking {
  id: string;
  status: string;
  scheduled_date: string;
  total_price: number;
  provider_name?: string;
  provider_avatar?: string;
  service_type?: string;
  address?: string;
}

interface MyBookingsHistoryProps {
  serviceType: "dog_walker" | "dogsitter" | "veterinarian" | "trainer" | "all";
  onBookingClick?: (booking: Booking) => void;
  className?: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pendiente: { label: "Pendiente", color: "bg-yellow-500/10 text-yellow-700", icon: AlertCircle },
  confirmado: { label: "Confirmado", color: "bg-blue-500/10 text-blue-700", icon: Calendar },
  en_curso: { label: "En Curso", color: "bg-green-500/10 text-green-700", icon: Clock },
  en_progreso: { label: "En Progreso", color: "bg-green-500/10 text-green-700", icon: Clock },
  completado: { label: "Completado", color: "bg-purple-500/10 text-purple-700", icon: CheckCircle },
  cancelado: { label: "Cancelado", color: "bg-red-500/10 text-red-700", icon: XCircle }
};

export const MyBookingsHistory = ({
  serviceType,
  onBookingClick,
  className = ""
}: MyBookingsHistoryProps) => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("upcoming");

  useEffect(() => {
    if (user) {
      loadBookings();
    }
  }, [user, serviceType]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      let allBookings: Booking[] = [];

      // Load dog walker bookings
      if (serviceType === "all" || serviceType === "dog_walker") {
        const { data: walkData } = await supabase
          .from('walk_bookings')
          .select('id, status, scheduled_date, total_price, pickup_address, walker_id, service_type')
          .eq('owner_id', user?.id)
          .order('scheduled_date', { ascending: false });

        if (walkData) {
          const providerIds = walkData.map(b => b.walker_id);
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url')
            .in('id', providerIds);

          const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

          allBookings.push(...walkData.map(b => ({
            id: b.id,
            status: b.status,
            scheduled_date: b.scheduled_date,
            total_price: b.total_price,
            address: b.pickup_address,
            service_type: `Paseo - ${b.service_type || 'Regular'}`,
            provider_name: profileMap.get(b.walker_id)?.display_name,
            provider_avatar: profileMap.get(b.walker_id)?.avatar_url
          })));
        }
      }

      // Load dogsitter bookings
      if (serviceType === "all" || serviceType === "dogsitter") {
        const { data: dogsitterData } = await supabase
          .from('dogsitter_bookings')
          .select('id, status, start_date, total_price, drop_off_address, dogsitter_id')
          .eq('owner_id', user?.id)
          .order('start_date', { ascending: false });

        if (dogsitterData) {
          const providerIds = dogsitterData.map(b => b.dogsitter_id);
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url')
            .in('id', providerIds);

          const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

          allBookings.push(...dogsitterData.map(b => ({
            id: b.id,
            status: b.status,
            scheduled_date: b.start_date,
            total_price: b.total_price,
            address: b.drop_off_address,
            service_type: "Cuidador",
            provider_name: profileMap.get(b.dogsitter_id)?.display_name,
            provider_avatar: profileMap.get(b.dogsitter_id)?.avatar_url
          })));
        }
      }

      // Load vet bookings
      if (serviceType === "all" || serviceType === "veterinarian") {
        const { data: vetData } = await supabase
          .from('vet_bookings')
          .select('id, status, scheduled_date, total_price, visit_address, vet_id, service_type')
          .eq('owner_id', user?.id)
          .order('scheduled_date', { ascending: false });

        if (vetData) {
          const providerIds = vetData.map(b => b.vet_id);
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url')
            .in('id', providerIds);

          const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

          allBookings.push(...vetData.map(b => ({
            id: b.id,
            status: b.status,
            scheduled_date: b.scheduled_date,
            total_price: b.total_price,
            address: b.visit_address,
            service_type: `Veterinario - ${b.service_type}`,
            provider_name: profileMap.get(b.vet_id)?.display_name,
            provider_avatar: profileMap.get(b.vet_id)?.avatar_url
          })));
        }
      }

      // Load training bookings
      if (serviceType === "all" || serviceType === "trainer") {
        const { data: trainingData } = await supabase
          .from('training_bookings')
          .select('id, status, scheduled_date, total_price, training_address, trainer_id, training_type')
          .eq('owner_id', user?.id)
          .order('scheduled_date', { ascending: false });

        if (trainingData) {
          const providerIds = trainingData.map(b => b.trainer_id);
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url')
            .in('id', providerIds);

          const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

          allBookings.push(...trainingData.map(b => ({
            id: b.id,
            status: b.status,
            scheduled_date: b.scheduled_date,
            total_price: b.total_price,
            address: b.training_address,
            service_type: `Entrenador - ${b.training_type}`,
            provider_name: profileMap.get(b.trainer_id)?.display_name,
            provider_avatar: profileMap.get(b.trainer_id)?.avatar_url
          })));
        }
      }

      // Sort by date
      allBookings.sort((a, b) => 
        new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime()
      );

      setBookings(allBookings);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const bookingDate = new Date(booking.scheduled_date);
    const now = new Date();
    
    if (filter === "upcoming") {
      return bookingDate >= now || booking.status === "en_curso" || booking.status === "en_progreso";
    } else if (filter === "past") {
      return bookingDate < now && booking.status !== "en_curso" && booking.status !== "en_progreso";
    }
    return true;
  });

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Mis Reservas
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant={filter === "upcoming" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter("upcoming")}
            >
              Próximas
            </Button>
            <Button
              variant={filter === "past" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter("past")}
            >
              Pasadas
            </Button>
            <Button
              variant={filter === "all" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              Todas
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredBookings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No tienes reservas {filter === "upcoming" ? "próximas" : filter === "past" ? "pasadas" : ""}</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredBookings.map((booking) => {
              const config = statusConfig[booking.status] || statusConfig.pendiente;
              const StatusIcon = config.icon;

              return (
                <div
                  key={booking.id}
                  className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => onBookingClick?.(booking)}
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={booking.provider_avatar} />
                    <AvatarFallback className="bg-primary/10">
                      {booking.provider_name?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium truncate">
                        {booking.provider_name || "Proveedor"}
                      </p>
                      <Badge className={config.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {config.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {booking.service_type}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(booking.scheduled_date), "d MMM yyyy", { locale: es })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(booking.scheduled_date), "HH:mm")}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-primary">
                      ${booking.total_price?.toLocaleString('es-CL')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MyBookingsHistory;
