import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Clock, Dog, Home, Stethoscope, GraduationCap, Bell } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import CreateReviewForm from "./CreateReviewForm";

interface PendingBooking {
  id: string;
  type: "walk" | "dogsitter" | "vet" | "training";
  provider_id: string;
  provider_name: string;
  provider_avatar: string | null;
  completed_at: string;
  has_review: boolean;
}

const PendingReviewsList = () => {
  const { user } = useAuth();
  const [pendingBookings, setPendingBookings] = useState<PendingBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<PendingBooking | null>(null);

  useEffect(() => {
    if (user) {
      loadPendingReviews();
    }
  }, [user]);

  const loadPendingReviews = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const pending: PendingBooking[] = [];

      // Check walk bookings
      const { data: walkBookings } = await supabase
        .from("walk_bookings")
        .select("id, walker_id, scheduled_date, status")
        .eq("owner_id", user.id)
        .eq("status", "completado")
        .order("scheduled_date", { ascending: false })
        .limit(10);

      if (walkBookings) {
        for (const booking of walkBookings) {
          const { data: review } = await supabase
            .from("walk_reviews")
            .select("id")
            .eq("booking_id", booking.id)
            .maybeSingle();

          if (!review) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("display_name, avatar_url")
              .eq("id", booking.walker_id)
              .maybeSingle();

            pending.push({
              id: booking.id,
              type: "walk",
              provider_id: booking.walker_id,
              provider_name: profile?.display_name || "Paseador",
              provider_avatar: profile?.avatar_url || null,
              completed_at: booking.scheduled_date,
              has_review: false
            });
          }
        }
      }

      // Check dogsitter bookings
      const { data: sitterBookings } = await supabase
        .from("dogsitter_bookings")
        .select("id, dogsitter_id, end_date, status")
        .eq("owner_id", user.id)
        .eq("status", "completado")
        .order("end_date", { ascending: false })
        .limit(10);

      if (sitterBookings) {
        for (const booking of sitterBookings) {
          const { data: review } = await supabase
            .from("dogsitter_reviews")
            .select("id")
            .eq("booking_id", booking.id)
            .maybeSingle();

          if (!review) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("display_name, avatar_url")
              .eq("id", booking.dogsitter_id)
              .maybeSingle();

            pending.push({
              id: booking.id,
              type: "dogsitter",
              provider_id: booking.dogsitter_id,
              provider_name: profile?.display_name || "Cuidador",
              provider_avatar: profile?.avatar_url || null,
              completed_at: booking.end_date,
              has_review: false
            });
          }
        }
      }

      // Check vet bookings
      const { data: vetBookings } = await supabase
        .from("vet_bookings")
        .select("id, vet_id, scheduled_date, status")
        .eq("owner_id", user.id)
        .eq("status", "completado")
        .order("scheduled_date", { ascending: false })
        .limit(10);

      if (vetBookings) {
        for (const booking of vetBookings) {
          const { data: review } = await supabase
            .from("vet_reviews")
            .select("id")
            .eq("booking_id", booking.id)
            .maybeSingle();

          if (!review) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("display_name, avatar_url")
              .eq("id", booking.vet_id)
              .maybeSingle();

            pending.push({
              id: booking.id,
              type: "vet",
              provider_id: booking.vet_id,
              provider_name: profile?.display_name || "Veterinario",
              provider_avatar: profile?.avatar_url || null,
              completed_at: booking.scheduled_date,
              has_review: false
            });
          }
        }
      }

      // Check training bookings
      const { data: trainingBookings } = await supabase
        .from("training_bookings")
        .select("id, trainer_id, scheduled_date, status")
        .eq("owner_id", user.id)
        .eq("status", "completado")
        .order("scheduled_date", { ascending: false })
        .limit(10);

      if (trainingBookings) {
        for (const booking of trainingBookings) {
          const { data: review } = await supabase
            .from("training_reviews")
            .select("id")
            .eq("booking_id", booking.id)
            .maybeSingle();

          if (!review) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("display_name, avatar_url")
              .eq("id", booking.trainer_id)
              .maybeSingle();

            pending.push({
              id: booking.id,
              type: "training",
              provider_id: booking.trainer_id,
              provider_name: profile?.display_name || "Entrenador",
              provider_avatar: profile?.avatar_url || null,
              completed_at: booking.scheduled_date,
              has_review: false
            });
          }
        }
      }

      // Sort by date
      pending.sort((a, b) => 
        new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
      );

      setPendingBookings(pending);
    } catch (error) {
      console.error("Error loading pending reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const getServiceIcon = (type: PendingBooking["type"]) => {
    switch (type) {
      case "walk":
        return <Dog className="h-4 w-4" />;
      case "dogsitter":
        return <Home className="h-4 w-4" />;
      case "vet":
        return <Stethoscope className="h-4 w-4" />;
      case "training":
        return <GraduationCap className="h-4 w-4" />;
    }
  };

  const getServiceLabel = (type: PendingBooking["type"]) => {
    switch (type) {
      case "walk":
        return "Paseo";
      case "dogsitter":
        return "Cuidado";
      case "vet":
        return "Veterinario";
      case "training":
        return "Entrenamiento";
    }
  };

  const getReviewType = (type: PendingBooking["type"]): "walk" | "dogsitter" | "vet" => {
    if (type === "training") return "vet"; // Use vet type for training temporarily
    return type;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4 text-center">
          <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground animate-pulse" />
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </CardContent>
      </Card>
    );
  }

  if (pendingBookings.length === 0) {
    return null; // Don't show if no pending reviews
  }

  return (
    <>
      <Card className="border-yellow-500/50 bg-yellow-500/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="h-5 w-5 text-yellow-500" />
            <h3 className="font-semibold">Reseñas Pendientes</h3>
            <Badge className="bg-yellow-500 text-white">{pendingBookings.length}</Badge>
          </div>
          
          <p className="text-xs text-muted-foreground mb-4">
            Ayuda a otros usuarios dejando tu opinión sobre estos servicios
          </p>

          <div className="space-y-2">
            {pendingBookings.slice(0, 3).map((booking) => (
              <div
                key={`${booking.type}-${booking.id}`}
                className="flex items-center justify-between p-3 rounded-lg bg-background border"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={booking.provider_avatar || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {booking.provider_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{booking.provider_name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {getServiceIcon(booking.type)}
                      <span>{getServiceLabel(booking.type)}</span>
                      <span>•</span>
                      <span>{format(new Date(booking.completed_at), "d MMM", { locale: es })}</span>
                    </div>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => setSelectedBooking(booking)}
                  className="gap-1"
                >
                  <Star className="h-3 w-3" />
                  Calificar
                </Button>
              </div>
            ))}
          </div>

          {pendingBookings.length > 3 && (
            <p className="text-xs text-center text-muted-foreground mt-3">
              Y {pendingBookings.length - 3} más pendientes...
            </p>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Calificar Servicio
            </DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <CreateReviewForm
              reviewType={getReviewType(selectedBooking.type)}
              bookingId={selectedBooking.id}
              providerId={selectedBooking.provider_id}
              onSuccess={() => {
                setSelectedBooking(null);
                loadPendingReviews();
              }}
              onCancel={() => setSelectedBooking(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PendingReviewsList;
