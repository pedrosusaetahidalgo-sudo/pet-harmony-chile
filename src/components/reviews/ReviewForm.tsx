import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StarRating } from "./StarRating";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Sparkles } from "lucide-react";

interface Props {
  bookingId: string;
  providerId: string;
  providerName: string;
  serviceType: string;
  petName?: string;
  serviceDate?: string;
  onSuccess?: () => void;
}

export function ReviewForm({ bookingId, providerId, providerName, serviceType, petName, serviceDate, onSuccess }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!user || rating === 0) return;
    setIsSubmitting(true);

    const { error } = await supabase.from("service_reviews").insert({
      booking_id: bookingId,
      reviewer_id: user.id,
      provider_id: providerId,
      service_type: serviceType,
      rating,
      title: title.trim() || null,
      comment: comment.trim() || null,
    });

    if (error) {
      toast({ title: "Error", description: "No se pudo publicar la reseña", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }

    // Award points
    await supabase.from("paw_point_transactions").insert({
      user_id: user.id,
      points_amount: 10,
      transaction_type: "earned",
      source_type: "leave_review",
    });

    queryClient.invalidateQueries({ queryKey: ["provider-reviews"] });
    setSubmitted(true);
    toast({ title: "¡Reseña publicada!", description: "+10 puntos ganados" });
    onSuccess?.();
  };

  if (submitted) {
    return (
      <Card className="border-primary/20 text-center py-8">
        <CardContent>
          <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-3 animate-scale-in" />
          <p className="font-medium">¡Gracias por tu reseña!</p>
          <p className="text-sm text-muted-foreground mt-1">Tu opinión ayuda a otros dueños de mascotas</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">¿Cómo fue tu experiencia?</CardTitle>
        <div className="text-xs text-muted-foreground space-y-0.5">
          <p>Servicio: {serviceType} — {providerName}</p>
          {serviceDate && <p>Fecha: {serviceDate}</p>}
          {petName && <p>Mascota: {petName}</p>}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <StarRating rating={rating} onChange={setRating} size="lg" showLabel />
          {rating === 0 && <p className="text-xs text-muted-foreground mt-1">Toca para calificar</p>}
        </div>
        <Input
          placeholder="Título (opcional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
        />
        <Textarea
          placeholder="Cuéntanos más sobre tu experiencia..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={500}
          rows={3}
        />
        <Button
          onClick={handleSubmit}
          disabled={rating === 0 || isSubmitting}
          className="w-full"
        >
          {isSubmitting ? "Publicando..." : "Publicar reseña"}
        </Button>
        <p className="text-[10px] text-center text-muted-foreground">
          Tu reseña ayuda a otros dueños de mascotas a elegir mejor 🐾
        </p>
      </CardContent>
    </Card>
  );
}
