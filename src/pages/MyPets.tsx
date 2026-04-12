import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LINKS } from '@/lib/links';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Heart, PawPrint, ChevronDown, MessageCircle } from '@/lib/icons';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { describeSupabaseError } from '@/lib/supabaseErrors';
import { useGoToAddPet } from '@/hooks/useCanAddPet';
import { PetCardCompact } from '@/components/PetCardCompact';

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  birth_date: string | null;
  photo_url: string | null;
  size: string | null;
  color: string | null;
  personality: string[] | null;
  gender: string | null;
  weight: number | null;
  bio: string | null;
}

/* ── Pagination dots (mobile only) ── */
function CarouselDots({ count, activeIndex }: { count: number; activeIndex: number }) {
  if (count <= 1) return null;
  return (
    <div className="flex justify-center gap-1.5 mt-3 md:hidden">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all ${
            i === activeIndex ? 'w-6 bg-purple-500' : 'w-1.5 bg-muted-foreground/30'
          }`}
        />
      ))}
    </div>
  );
}

/* ── Ghost card to incentivize adding another pet ── */
function AddPetGhostCard({ onClick }: { onClick: () => void }) {
  return (
    <div
      role="button"
      tabIndex={0}
      className="pet-card-holo h-full cursor-pointer opacity-60 hover:opacity-100 transition-opacity"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick();
      }}
      style={{
        background:
          'linear-gradient(135deg, hsl(271 81% 56% / 0.25), hsl(290 65% 60% / 0.2), hsl(250 72% 62% / 0.25))',
      }}
    >
      <div className="pet-card-holo-inner h-full">
        <div className="relative z-10 pt-6 pb-5 px-5 text-center flex flex-col items-center justify-center gap-3 h-full min-h-[260px]">
          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center ring-2 ring-purple-300/30 ring-dashed">
            <Plus className="h-10 w-10 text-purple-400" />
          </div>
          <div>
            <p className="pet-card-name font-bold text-sm">Agrega otra mascota</p>
            <p className="text-xs text-muted-foreground mt-0.5">Lleva su ficha clínica al día</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const MyPets = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [memorialPets, setMemorialPets] = useState<
    {
      id: string;
      name: string;
      species: string;
      photo_url: string | null;
      passed_away_at: string | null;
    }[]
  >([]);
  const [petScores, setPetScores] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [memorialOpen, setMemorialOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const goToAddPet = useGoToAddPet();
  const carouselRef = useRef<HTMLDivElement>(null);

  const fetchPets = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('pets')
        .select('*')
        .eq('owner_id', user?.id)
        .eq('lifecycle_status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPets(data || []);
    } catch (error: unknown) {
      toast({
        title: 'Error al cargar mascotas',
        description: describeSupabaseError(error as Parameters<typeof describeSupabaseError>[0]),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const fetchMemorialPets = useCallback(async () => {
    const { data } = await supabase
      .from('pets')
      .select('id, name, species, photo_url, passed_away_at')
      .eq('owner_id', user?.id)
      .eq('lifecycle_status', 'memorial')
      .order('passed_away_at', { ascending: false });
    setMemorialPets(data || []);
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      fetchPets();
      fetchMemorialPets();
    }
  }, [user, fetchPets, fetchMemorialPets]);

  /* Fetch pet_paw_progress scores once we have pets */
  useEffect(() => {
    if (pets.length === 0) return;
    const fetchScores = async () => {
      const { data } = await supabase
        .from('pet_paw_progress')
        .select('pet_id, health_score, activity_score, happiness_score, social_score')
        .in(
          'pet_id',
          pets.map((p) => p.id)
        );
      if (data) {
        const scores: Record<string, number> = {};
        data.forEach((row) => {
          scores[row.pet_id] = Math.round(
            (row.health_score + row.activity_score + row.happiness_score + row.social_score) / 4
          );
        });
        setPetScores(scores);
      }
    };
    fetchScores();
  }, [pets]);

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase.from('pets').delete().eq('id', deleteId);

      if (error) throw error;

      toast({
        title: 'Mascota eliminada',
        description: 'La mascota ha sido eliminada exitosamente',
      });

      fetchPets();
    } catch (error: unknown) {
      toast({
        title: 'Error al eliminar',
        description: describeSupabaseError(error as Parameters<typeof describeSupabaseError>[0]),
        variant: 'destructive',
      });
    } finally {
      setDeleteId(null);
    }
  };

  /* ── Track active card via scroll position ── */
  const handleScroll = useCallback(() => {
    const el = carouselRef.current;
    if (!el) return;
    const scrollLeft = el.scrollLeft;
    const cardWidth = el.firstElementChild ? (el.firstElementChild as HTMLElement).offsetWidth : 1;
    const gap = 16; // gap-4 = 16px
    const idx = Math.round(scrollLeft / (cardWidth + gap));
    setActiveIndex(Math.max(0, Math.min(idx, pets.length)));
  }, [pets.length]);

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="container px-4 py-8 max-w-6xl mx-auto animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-2">
            <div className="h-8 w-40 skeleton" />
            <div className="h-4 w-64 skeleton" />
          </div>
          <div className="h-10 w-40 skeleton" />
        </div>
        {/* Mobile skeleton */}
        <div className="flex gap-4 md:hidden">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="shrink-0 w-[75vw] max-w-[280px] rounded-xl border border-border"
            >
              <div className="p-6 flex flex-col items-center gap-3">
                <div className="h-24 w-24 rounded-full skeleton" />
                <div className="h-5 w-28 skeleton" />
                <div className="h-4 w-36 skeleton" />
                <div className="h-8 w-full skeleton mt-2" />
                <div className="flex gap-2 w-full">
                  <div className="h-8 flex-1 skeleton" />
                  <div className="h-8 flex-1 skeleton" />
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Desktop skeleton */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-border">
              <div className="p-6 flex flex-col items-center gap-3">
                <div className="h-24 w-24 rounded-full skeleton" />
                <div className="h-5 w-28 skeleton" />
                <div className="h-4 w-36 skeleton" />
                <div className="h-8 w-full skeleton mt-2" />
                <div className="flex gap-2 w-full">
                  <div className="h-8 flex-1 skeleton" />
                  <div className="h-8 flex-1 skeleton" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* Total items in carousel = pets + ghost card */
  const totalCards = pets.length + 1;

  return (
    <div className="container px-4 py-8 max-w-6xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Mis Mascotas</h1>
          <p className="text-muted-foreground">Gestiona los perfiles de tus mascotas</p>
        </div>
        <Button
          onClick={goToAddPet}
          className="bg-purple-600 hover:bg-purple-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
        >
          <Plus className="mr-2 h-5 w-5" />
          Agregar Mascota
        </Button>
      </div>

      {pets.length === 0 ? (
        <EmptyState
          icon={PawPrint}
          title="Agrega tu primera mascota"
          description="Crea el perfil de tu mascota para llevar su ficha clínica, recibir recordatorios automáticos y reservar con veterinarios."
          action={
            <Button onClick={goToAddPet} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="mr-2 h-5 w-5" />
              Agregar Mi Primera Mascota
            </Button>
          }
        />
      ) : (
        <>
          {/* ── Mobile: horizontal carousel ── */}
          <div
            ref={carouselRef}
            onScroll={handleScroll}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 scrollbar-hide md:hidden"
          >
            {pets.map((pet, index) => (
              <div
                key={pet.id}
                className={`snap-center shrink-0 w-[75vw] max-w-[280px] animate-fade-in-up stagger-${Math.min(index + 1, 6)}`}
              >
                <PetCardCompact pet={pet} score={petScores[pet.id]} onDelete={setDeleteId} />
              </div>
            ))}
            {/* Ghost card */}
            <div className="snap-center shrink-0 w-[75vw] max-w-[280px]">
              <AddPetGhostCard onClick={goToAddPet} />
            </div>
          </div>

          <CarouselDots count={totalCards} activeIndex={activeIndex} />

          {/* ── Desktop: compact grid ── */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {pets.map((pet, index) => (
              <div key={pet.id} className={`animate-fade-in-up stagger-${Math.min(index + 1, 6)}`}>
                <PetCardCompact pet={pet} score={petScores[pet.id]} onDelete={setDeleteId} />
              </div>
            ))}
            <AddPetGhostCard onClick={goToAddPet} />
          </div>
        </>
      )}

      {/* ── Memorial section ── */}
      {memorialPets.length > 0 && (
        <Collapsible open={memorialOpen} onOpenChange={setMemorialOpen} className="mt-8">
          <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full py-2">
            <Heart className="h-4 w-4" />
            <span>En memoria ({memorialPets.length})</span>
            <ChevronDown
              className={`h-4 w-4 ml-auto transition-transform ${memorialOpen ? 'rotate-180' : ''}`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {memorialPets.map((pet) => (
                <Card key={pet.id} className="opacity-75 hover:opacity-100 transition-opacity">
                  <CardContent className="p-4 flex items-center gap-3">
                    <Avatar className="h-12 w-12 ring-2 ring-purple-200">
                      <AvatarImage src={pet.photo_url || undefined} alt={pet.name} />
                      <AvatarFallback className="bg-purple-50 text-purple-400">
                        {pet.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{pet.name}</p>
                      <p className="text-xs text-muted-foreground">En nuestro corazón</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(LINKS.petClinical(pet.id))}
                      className="text-xs"
                    >
                      Ver ficha
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="mt-3 text-xs text-muted-foreground"
              onClick={() => navigate('/en-memoria')}
            >
              <MessageCircle className="h-3.5 w-3.5 mr-1" />
              Ir al espacio memorial completo
            </Button>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* ── Delete confirmation ── */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Eliminar a {pets.find((p) => p.id === deleteId)?.name ?? 'esta mascota'}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán todos los registros médicos,
              recordatorios y datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MyPets;
