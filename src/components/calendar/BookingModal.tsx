import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { usePlan } from "@/hooks/usePlan";
import { calculateBookingCommission } from "@/lib/commissions";
import { formatCLP } from "@/lib/plans";
import { CheckCircle2, Loader2 } from "lucide-react";

interface Props {
  slot: any;
  open: boolean;
  onClose: () => void;
}

export function BookingModal({ slot, open, onClose }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { planId } = usePlan();
  const queryClient = useQueryClient();
  const [petId, setPetId] = useState("");
  const [notes, setNotes] = useState("");
  const [step, setStep] = useState<"form" | "processing" | "success">("form");

  const { data: pets } = useQuery({
    queryKey: ["user-pets", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("pets")
        .select("id, name")
        .eq("owner_id", user!.id);
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { userPays, userFee } = calculateBookingCommission(slot.price, planId);
  const price = formatCLP(slot.price);
  const totalPrice = formatCLP(userPays);
  const profile = slot.provider?.profiles;

  const handleConfirm = async () => {
    if (!user) return;
    setStep("processing");

    try {
      // Create booking
      const { error } = await supabase.from("bookings").insert({
        slot_id: slot.id,
        user_id: user.id,
        pet_id: petId || null,
        provider_id: slot.provider_id,
        service_type: slot.service_type,
        status: "confirmed",
        payment_status: "paid",
        total_price: slot.price,
        notes: notes.trim() || null,
      });

      if (error) throw error;

      // Award points
      await supabase.from("paw_point_transactions").insert({
        user_id: user.id,
        points_amount: 10,
        transaction_type: "earned",
        source_type: "book_service",
      });

      queryClient.invalidateQueries({ queryKey: ["service-slots"] });
      queryClient.invalidateQueries({ queryKey: ["month-slots"] });
      setStep("success");
      toast({ title: "Reserva confirmada!", description: "+10 puntos ganados" });
    } catch {
      toast({ title: "Error", description: "No se pudo completar la reserva", variant: "destructive" });
      setStep("form");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        {step === "success" ? (
          <div className="text-center py-8">
            <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-4 animate-scale-in" />
            <h3 className="text-lg font-bold">Reserva confirmada!</h3>
            <p className="text-sm text-muted-foreground mt-2">
              {slot.title} con {profile?.display_name}
            </p>
            <p className="text-sm text-muted-foreground">
              {slot.slot_date} — {slot.start_time?.slice(0, 5)}
            </p>
            <Button className="mt-6" onClick={onClose}>Cerrar</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Confirmar reserva</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-muted/50 p-3 rounded-lg text-sm space-y-1">
                <p className="font-medium">{slot.title}</p>
                <p className="text-muted-foreground">{profile?.display_name}</p>
                <p className="text-muted-foreground">{slot.slot_date} — {slot.start_time?.slice(0, 5)} a {slot.end_time?.slice(0, 5)}</p>
              </div>

              {pets && pets.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Mascota</label>
                  <Select value={petId} onValueChange={setPetId}>
                    <SelectTrigger><SelectValue placeholder="Selecciona mascota" /></SelectTrigger>
                    <SelectContent>
                      {pets.map((pet) => (
                        <SelectItem key={pet.id} value={pet.id}>{pet.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <label className="text-sm font-medium mb-1.5 block">Notas (opcional)</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej: Luna es nerviosa con otros perros"
                  rows={2}
                />
              </div>

              <div className="pt-2 border-t space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Servicio</span>
                  <span>{price}</span>
                </div>
                {userFee > 0 && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Tarifa de servicio (5%)</span>
                      <span>{formatCLP(userFee)}</span>
                    </div>
                    <p className="text-[11px] text-amber-600">Con Premium pagas $0 de tarifa</p>
                  </>
                )}
                <div className="flex items-center justify-between text-sm font-bold pt-1">
                  <span>Total</span>
                  <span className="text-lg text-primary">{totalPrice}</span>
                </div>
              </div>

              <Button
                className="w-full h-12"
                onClick={handleConfirm}
                disabled={step === "processing"}
              >
                {step === "processing" ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />Procesando...</>
                ) : (
                  `Confirmar y pagar — ${totalPrice}`
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
