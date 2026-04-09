import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Heart, Undo2 } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { MemorialCard } from "@/components/memorial/MemorialCard";
import { toast } from "sonner";

export default function EnMemoria() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  // Memorial columns added via migration 20260420000000 — cast until types regenerated
  const { data: memorialPets = [], isLoading } = useQuery({
    queryKey: ["memorial-pets", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await (supabase
        .from("pets") as any)
        .select("id, name, species, photo_url, memorial_photo_url, birth_date, passed_away_at, memorial_message, memorial_undo_until")
        .eq("owner_id", user.id)
        .eq("lifecycle_status", "memorial")
        .order("passed_away_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Array<{
        id: string;
        name: string;
        species: string;
        photo_url: string | null;
        memorial_photo_url?: string | null;
        birth_date?: string | null;
        passed_away_at?: string | null;
        memorial_message?: string | null;
        memorial_undo_until?: string | null;
      }>;
    },
    enabled: !!user?.id,
  });

  const undoMutation = useMutation({
    mutationFn: async (petId: string) => {
      const { error } = await (supabase
        .from("pets") as any)
        .update({
          lifecycle_status: "active",
          passed_away_at: null,
          passed_away_registered_at: null,
          passed_away_cause: null,
          memorial_message: null,
          memorial_undo_until: null,
          memorial_visibility: null,
          memorial_remembrance_enabled: false,
        })
        .eq("id", petId);
      if (error) throw error;

      // Restore reminders (undo can't fully restore, but un-complete them)
      await supabase
        .from("pet_reminders")
        .update({ is_completed: false, completed_at: null })
        .eq("pet_id", petId)
        .eq("is_completed", true);
    },
    onSuccess: () => {
      toast.success("Se restauró correctamente. Tu mascota está de vuelta en tu lista.");
      qc.invalidateQueries({ queryKey: ["memorial-pets"] });
      qc.invalidateQueries({ queryKey: ["user-pets"] });
    },
    onError: () => {
      toast.error("No pudimos restaurar. Intenta de nuevo.");
    },
  });

  const canUndo = (pet: { memorial_undo_until?: string | null }) => {
    if (!pet.memorial_undo_until) return false;
    return new Date(pet.memorial_undo_until) > new Date();
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-52 bg-muted rounded-lg" />
            <div className="h-52 bg-muted rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (memorialPets.length === 0) {
    return (
      <div className="container max-w-4xl mx-auto p-6 text-center py-20">
        <Heart className="h-16 w-16 mx-auto mb-4 text-purple-200" />
        <h1 className="text-xl font-semibold text-slate-800 mb-2">En memoria</h1>
        <p className="text-muted-foreground">
          Aquí guardaremos los recuerdos de quienes nos acompañaron.
        </p>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Quienes nos acompañaron</h1>
        <p className="text-sm text-muted-foreground">Aquí guardamos sus recuerdos</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {memorialPets.map((pet) => (
          <div key={pet.id} className="space-y-1">
            <MemorialCard
              pet={pet}
              onClick={() => navigate(`/pet/${pet.id}/clinical`)}
            />
            {canUndo(pet) && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-muted-foreground"
                onClick={() => undoMutation.mutate(pet.id)}
                disabled={undoMutation.isPending}
              >
                <Undo2 className="h-3 w-3 mr-1" />
                Deshacer (fue un error)
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
