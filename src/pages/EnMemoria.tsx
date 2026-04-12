import { useNavigate } from 'react-router-dom';
import { LINKS } from '@/lib/links';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Heart, Undo2, MessageCircle } from '@/lib/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { MemorialCard } from '@/components/memorial/MemorialCard';
import { BereavementChat } from '@/components/memorial/BereavementChat';
import { toast } from 'sonner';
import { useState } from 'react';

export default function EnMemoria() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [chatOpen, setChatOpen] = useState(false);
  const [chatPet, setChatPet] = useState<{ id: string; name: string } | null>(null);

  const { data: memorialPets = [], isLoading } = useQuery({
    queryKey: ['memorial-pets', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('pets')
        .select(
          'id, name, species, photo_url, memorial_photo_url, birth_date, passed_away_at, memorial_message, memorial_undo_until'
        )
        .eq('owner_id', user.id)
        .eq('lifecycle_status', 'memorial')
        .order('passed_away_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const undoMutation = useMutation({
    mutationFn: async (petId: string) => {
      const { error } = await supabase
        .from('pets')
        .update({
          lifecycle_status: 'active',
          passed_away_at: null,
          passed_away_registered_at: null,
          passed_away_cause: null,
          memorial_message: null,
          memorial_undo_until: null,
          memorial_visibility: null,
          memorial_remembrance_enabled: false,
        })
        .eq('id', petId);
      if (error) throw error;

      // Restore reminders (undo can't fully restore, but un-complete them)
      await supabase
        .from('pet_reminders')
        .update({ is_completed: false, completed_at: null })
        .eq('pet_id', petId)
        .eq('is_completed', true);
    },
    onSuccess: () => {
      toast.success('Se restauró correctamente. Tu mascota está de vuelta en tu lista.');
      qc.invalidateQueries({ queryKey: ['memorial-pets'] });
      qc.invalidateQueries({ queryKey: ['user-pets'] });
    },
    onError: () => {
      toast.error('No pudimos restaurar. Intenta de nuevo.');
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
      <div className="container max-w-4xl mx-auto p-6 text-center py-20 space-y-4">
        <Heart className="h-16 w-16 mx-auto mb-4 text-purple-300" />
        <h1 className="text-xl font-semibold mb-2">En memoria</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Este es un espacio para honrar a las mascotas que ya no nos acompañan. Puedes registrar su
          despedida desde la ficha clínica de tu mascota.
        </p>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Su historial médico se conservará para siempre y los recordatorios pendientes se
          cancelarán automáticamente.
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
            <MemorialCard pet={pet} onClick={() => navigate(LINKS.petClinical(pet.id))} />
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 text-xs text-purple-500"
                onClick={() => {
                  setChatPet({ id: pet.id, name: pet.name });
                  setChatOpen(true);
                }}
              >
                <MessageCircle className="h-3 w-3 mr-1" />
                Conversar
              </Button>
              {canUndo(pet) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 text-xs text-muted-foreground"
                  onClick={() => undoMutation.mutate(pet.id)}
                  disabled={undoMutation.isPending}
                >
                  <Undo2 className="h-3 w-3 mr-1" />
                  Deshacer
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Card de apoyo */}
      <Card className="border-purple-100 bg-purple-50/30">
        <CardContent className="p-4 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Si necesitas hablar con alguien ahora, llama a Salud Responde:{' '}
            <strong>600 360 7777</strong> (24h, gratis)
          </p>
        </CardContent>
      </Card>

      {/* Bereavement chat dialog */}
      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent className="max-w-lg p-0">
          <BereavementChat
            petId={chatPet?.id}
            petName={chatPet?.name}
            onClose={() => setChatOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
