/**
 * Card de una mascota real de refugio (tabla pets, NO adoption_posts).
 * Renderiza foto + datos básicos + botón "Me interesa" que dispara mutation.
 *
 * Ver REFACTOR_ADOPCION_2026_04_24.md §2.5 (Botón "Me interesa").
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Heart, CheckCircle2, Loader2, PawPrint } from 'lucide-react';
import { toast } from 'sonner';
import { trackRefactor, RefactorEvent } from '@/lib/refactorAnalytics';

export type ShelterPet = {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  gender: string | null;
  size: string | null;
  photo_url: string | null;
  bio: string | null;
  birth_date: string | null;
  /** Historia narrativa del rescate, visible en el dialog de "Me interesa" */
  rescue_story?: string | null;
};

interface ShelterPetCardProps {
  pet: ShelterPet;
  shelterSlug: string;
}

function formatAge(birthDate: string | null): string | null {
  if (!birthDate) return null;
  const months = Math.floor(
    (Date.now() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44)
  );
  if (months < 12) return `${months} ${months === 1 ? 'mes' : 'meses'}`;
  const years = Math.floor(months / 12);
  return `${years} ${years === 1 ? 'año' : 'años'}`;
}

export function ShelterPetCard({ pet, shelterSlug }: ShelterPetCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [message, setMessage] = useState('');

  // Verificar si el user ya expresó interés (idempotencia + UI)
  const { data: existingInterest } = useQuery({
    queryKey: ['adoption-interest', pet.id, user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('adoption_interests')
        .select('id, status')
        .eq('pet_id', pet.id)
        .eq('interested_user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  const { mutate: expressInterest, isPending } = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Login required');
      const { error } = await supabase.from('adoption_interests').insert({
        pet_id: pet.id,
        interested_user_id: user.id,
        message: message.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      trackRefactor(RefactorEvent.adoptionInterestExpressed, {
        source: 'shelter_pet',
        species: pet.species,
      });
      toast.success('¡Listo! El refugio te va a contactar.');
      queryClient.invalidateQueries({ queryKey: ['adoption-interest', pet.id, user?.id] });
      setShowDialog(false);
      setMessage('');
    },
    onError: (err: Error & { code?: string }) => {
      // Unique violation = ya expresó interés (idempotencia silenciosa)
      if (err.code === '23505') {
        toast.info('Ya marcaste interés en esta mascota.');
        queryClient.invalidateQueries({ queryKey: ['adoption-interest', pet.id, user?.id] });
        setShowDialog(false);
      } else {
        toast.error(err.message || 'No pudimos guardar tu interés. Intentá de nuevo.');
      }
    },
  });

  const handleClick = () => {
    if (!user) {
      // Redirect a auth con next al refugio
      navigate(`/auth?next=/refugios/${shelterSlug}%23pet-${pet.id}`);
      return;
    }
    setShowDialog(true);
  };

  const age = formatAge(pet.birth_date);
  const alreadyInterested = !!existingInterest;

  return (
    <>
      <div
        id={`pet-${pet.id}`}
        className="rounded-xl overflow-hidden border bg-card hover:shadow-md transition-shadow"
      >
        <div className="aspect-square bg-muted relative">
          {pet.photo_url ? (
            <img
              src={pet.photo_url}
              alt={pet.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <PawPrint className="h-10 w-10 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm leading-tight">{pet.name}</h3>
            {pet.size && (
              <Badge variant="outline" className="text-[10px] shrink-0">
                {pet.size}
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
            {pet.species && <span className="capitalize">{pet.species}</span>}
            {pet.breed && <span>· {pet.breed}</span>}
            {age && <span>· {age}</span>}
          </div>

          {pet.bio && <p className="text-xs text-muted-foreground line-clamp-2">{pet.bio}</p>}

          {alreadyInterested ? (
            <Button variant="outline" size="sm" className="w-full mt-1 gap-1" disabled>
              <CheckCircle2 className="h-3 w-3 text-green-600" /> Interés enviado
            </Button>
          ) : (
            <Button
              onClick={handleClick}
              size="sm"
              className="w-full mt-1 bg-purple-600 hover:bg-purple-700 gap-1"
            >
              <Heart className="h-3 w-3" /> Me interesa
            </Button>
          )}
        </div>
      </div>

      {/* Dialog para escribir mensaje opcional */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Expresar interés en {pet.name}</DialogTitle>
            <DialogDescription>
              El refugio va a recibir una notificación con tu interés y se va a contactar contigo.
              Podés agregar un mensaje (opcional).
            </DialogDescription>
          </DialogHeader>

          {pet.rescue_story && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm">
              <p className="text-xs font-semibold text-amber-900 uppercase tracking-wider mb-1">
                Historia de {pet.name}
              </p>
              <p className="text-amber-900 leading-relaxed">{pet.rescue_story}</p>
            </div>
          )}

          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Contale al refugio por qué te interesa esta mascota, dónde vivís, si tenés otras mascotas, etc."
            rows={4}
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground -mt-2">{message.length}/500</p>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button
              onClick={() => expressInterest()}
              disabled={isPending}
              className="bg-purple-600 hover:bg-purple-700 gap-1"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" /> Enviando...
                </>
              ) : (
                <>
                  <Heart className="h-3 w-3" /> Confirmar interés
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
