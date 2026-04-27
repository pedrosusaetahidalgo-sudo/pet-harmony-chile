/**
 * HomePetFocusV2 — nuevo Home "Mi mascota hoy" (Refactor Maestro §5.2.2)
 *
 * Activado con flag HOME_PET_FOCUS. Reemplaza el dashboard de widgets por
 * una pagina con UNA mascota en foco + UNA accion sugerida + timeline corto.
 *
 * Layout:
 * 1. Selector de mascota (solo si hay >1)
 * 2. PetHeroCard (foto grande + status)
 * 3. NextActionCard (1 sola accion sugerida)
 * 4. Mini timeline (ultimos 3 eventos + link a ficha completa)
 * 5. Quick actions secundarias (scroll)
 */
import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useReminders } from '@/hooks/useReminders';
import { LINKS } from '@/lib/links';
import { PetHeroCard } from '@/components/home/PetHeroCard';
import { BirthdayShareCard } from '@/components/birthday/BirthdayShareCard';
import { NextActionCard, type NextActionKind } from '@/components/home/NextActionCard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { PawPrint, Plus, Camera, Weight, Stethoscope, ChevronRight } from '@/lib/icons';
import { cn } from '@/lib/utils';
import { format, differenceInDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { usePetHistoryTimeline, TIMELINE_CATEGORY_META } from '@/hooks/usePetHistoryTimeline';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { QuickActionsHub } from '@/components/home/QuickActionsHub';
import { OwnerAudioNoteRecorder } from '@/components/medical/OwnerAudioNoteRecorder';
import { InsuranceBanner } from '@/components/insurance/InsuranceBanner';
import { PetHealthAlertsBanner } from '@/components/home/PetHealthAlertsBanner';
import { ResearchConsentNudge } from '@/components/home/ResearchConsentNudge';
import { trackRefactor, RefactorEvent } from '@/lib/refactorAnalytics';

interface PetBasic {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  birth_date: string | null;
  photo_url: string | null;
  holo_pattern: string | null;
}

/** Devuelve true si el cumple esta en ±14 dias respecto al dia de hoy. */
function isBirthdayWindow(birthDate: string | null): boolean {
  if (!birthDate) return false;
  try {
    const birth = parseISO(birthDate);
    const today = new Date();
    // Calcular el cumple de este año
    const birthThisYear = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
    const diffDays = Math.abs(differenceInDays(birthThisYear, today));
    return diffDays <= 14;
  } catch {
    return false;
  }
}

/** Devuelve "Cumple en X días" / "Cumplió hace X días" / "¡Hoy!" */
function birthdayLabel(birthDate: string | null): string {
  if (!birthDate) return '';
  try {
    const birth = parseISO(birthDate);
    const today = new Date();
    const birthThisYear = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
    const diffDays = differenceInDays(birthThisYear, today);
    if (diffDays === 0) return '¡Hoy! 🎉';
    if (diffDays > 0) return `En ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;
    return `Cumplió hace ${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'día' : 'días'}`;
  } catch {
    return '';
  }
}

export function HomePetFocusV2() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedPetIdx, setSelectedPetIdx] = useState(0);

  // Cargar mascotas del usuario
  const { data: pets = [], isLoading: loadingPets } = useQuery({
    queryKey: ['home-pets', user?.id],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<PetBasic[]> => {
      if (!user) return [];
      const { data } = await supabase
        .from('pets')
        .select('id, name, species, breed, birth_date, photo_url, holo_pattern')
        .eq('owner_id', user.id)
        .eq('lifecycle_status', 'active')
        .order('created_at', { ascending: true });
      return (data as PetBasic[]) ?? [];
    },
  });

  const selectedPet: PetBasic | undefined = pets[selectedPetIdx];

  // Tracking adopcion del flag HOME_PET_FOCUS (refactor maestro analytics)
  useEffect(() => {
    if (pets.length === 0) {
      trackRefactor(RefactorEvent.homePetFocusEmptyState);
    } else {
      trackRefactor(RefactorEvent.homePetFocusViewed, { pet_count: pets.length });
    }
  }, [pets.length]);

  // Recordatorios de la mascota seleccionada
  const { overdueReminders, upcomingReminders } = useReminders();
  const petReminders = useMemo(() => {
    if (!selectedPet) return { overdue: [], upcoming: [] };
    return {
      overdue: overdueReminders.filter((r) => r.pet_id === selectedPet.id),
      upcoming: upcomingReminders.filter((r) => r.pet_id === selectedPet.id),
    };
  }, [selectedPet, overdueReminders, upcomingReminders]);

  // Timeline corto (últimos 3 eventos)
  const { data: timelineEvents = [] } = usePetHistoryTimeline(selectedPet?.id, { limit: 3 });

  // Calcular status de salud + next action
  const { healthStatus, healthMessage, nextAction } = useMemo(() => {
    if (!selectedPet) {
      return {
        healthStatus: null,
        healthMessage: null,
        nextAction: null as {
          kind: NextActionKind;
          title: string;
          description?: string;
          ctaLabel: string;
          onAction: () => void;
        } | null,
      };
    }

    // Priority 1: recordatorio vencido
    if (petReminders.overdue.length > 0) {
      const r = petReminders.overdue[0];
      return {
        healthStatus: 'overdue' as const,
        healthMessage: `${petReminders.overdue.length} pendiente${petReminders.overdue.length !== 1 ? 's' : ''} vencido${petReminders.overdue.length !== 1 ? 's' : ''}`,
        nextAction: {
          kind: 'overdue_reminder' as NextActionKind,
          title: r.title,
          description: `Vencido hace ${Math.abs(differenceInDays(parseISO(r.due_date), new Date()))} días`,
          ctaLabel: 'Resolver',
          onAction: () => navigate(LINKS.petClinical(selectedPet.id)),
        },
      };
    }

    // Priority 2: recordatorio próximo en 7 días
    const soon = petReminders.upcoming.find((r) => {
      const days = differenceInDays(parseISO(r.due_date), new Date());
      return days >= 0 && days <= 7;
    });
    if (soon) {
      const days = differenceInDays(parseISO(soon.due_date), new Date());
      return {
        healthStatus: 'pending' as const,
        healthMessage: days === 0 ? 'Tiene algo hoy' : `Tiene algo en ${days}d`,
        nextAction: {
          kind: 'upcoming_reminder' as NextActionKind,
          title: soon.title,
          description:
            days === 0
              ? 'Hoy es el día'
              : `En ${days} día${days !== 1 ? 's' : ''} (${format(parseISO(soon.due_date), "d 'de' MMM", { locale: es })})`,
          ctaLabel: 'Marcar hecho',
          onAction: () => navigate(LINKS.petClinical(selectedPet.id)),
        },
      };
    }

    // Priority 3: sugerencia de foto mensual o peso
    const daysSinceBirth = selectedPet.birth_date
      ? differenceInDays(new Date(), parseISO(selectedPet.birth_date))
      : 0;
    if (timelineEvents.length === 0 && daysSinceBirth > 0) {
      return {
        healthStatus: 'up_to_date' as const,
        healthMessage: 'Empezando la historia',
        nextAction: {
          kind: 'suggestion' as NextActionKind,
          title: 'Agregá el primer evento a la historia',
          description: 'Una foto, un paseo, una consulta. Empezamos juntos.',
          ctaLabel: 'Agregar',
          onAction: () => navigate(LINKS.petClinical(selectedPet.id)),
        },
      };
    }

    // Default: all good
    return {
      healthStatus: 'up_to_date' as const,
      healthMessage: 'Al día con su cuidado',
      nextAction: {
        kind: 'all_good' as NextActionKind,
        title: `${selectedPet.name} está al día ✨`,
        description: 'Todo tranquilo por ahora. Seguimos atentos a lo que venga.',
        ctaLabel: 'Ver historia completa',
        onAction: () => navigate(LINKS.petClinical(selectedPet.id)),
      },
    };
  }, [selectedPet, petReminders, timelineEvents, navigate]);

  // Loading state
  if (loadingPets) {
    return (
      <div className="container max-w-2xl mx-auto p-4 space-y-4">
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    );
  }

  // Empty state (sin mascotas)
  if (pets.length === 0) {
    return (
      <div className="container max-w-md mx-auto p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mb-4">
          <PawPrint className="h-10 w-10 text-purple-600" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Bienvenido a Paw Friend</h1>
        <p className="text-muted-foreground mb-6">
          Agregá tu primera mascota para empezar a guardar su historia.
        </p>
        <Button size="lg" onClick={() => navigate(LINKS.addPet())} className="gap-2">
          <Plus className="h-5 w-5" />
          Agregar mi primera mascota
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto p-4 space-y-4">
      {/* Selector de mascota si hay más de una */}
      {pets.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
          {pets.map((pet, idx) => (
            <button
              key={pet.id}
              onClick={() => setSelectedPetIdx(idx)}
              className={cn(
                'shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all',
                idx === selectedPetIdx
                  ? 'bg-purple-100 border-purple-300 text-purple-700'
                  : 'bg-background border-border text-muted-foreground hover:bg-muted'
              )}
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src={pet.photo_url || undefined} alt={pet.name} />
                <AvatarFallback className="text-[10px]">{pet.name[0]}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{pet.name}</span>
            </button>
          ))}
          <button
            onClick={() => navigate(LINKS.addPet())}
            className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full border border-dashed border-border text-muted-foreground hover:bg-muted"
          >
            <Plus className="h-4 w-4" />
            <span className="text-sm">Otra</span>
          </button>
        </div>
      )}

      {/* Hero de la mascota */}
      {selectedPet && (
        <PetHeroCard
          petId={selectedPet.id}
          petName={selectedPet.name}
          species={selectedPet.species}
          breed={selectedPet.breed}
          birthDate={selectedPet.birth_date}
          photoUrl={selectedPet.photo_url}
          holoPattern={selectedPet.holo_pattern}
          healthStatus={healthStatus}
          healthStatusMessage={healthMessage}
          onClick={() => navigate(LINKS.petClinical(selectedPet.id))}
        />
      )}

      {/* Refactor Maestro §2.8.3 — Alertas automaticas (cascadas).
          Hoy: weight loss 10%+ en 30d + vaccine_overdue. El trigger/RPC DB
          las crea sola; el banner las muestra. Gateado por CASCADE_WEIGHT_ALERTS. */}
      {selectedPet && <PetHealthAlertsBanner petId={selectedPet.id} />}

      {/* Refactor Maestro Fase 2 §7.3 — Nudge sutil de research consent
          para usuarios que nunca decidieron. Auto-dismissable 14d. */}
      <ResearchConsentNudge />

      {/* Refactor Maestro Fase 2 §7.2 — Banner seguros embebidos. Oculto
          mientras EMBEDDED_INSURANCE = false; cuando un partner aseguradora
          firme, basta con flippear el flag a true para activarlo en prod. */}
      {selectedPet && (
        <InsuranceBanner
          petId={selectedPet.id}
          petName={selectedPet.name}
          hasMinimalProfile={Boolean(selectedPet.breed && selectedPet.birth_date)}
        />
      )}

      {/* Banner cumpleaños (CASCADE_BIRTHDAY_AUTO): aparece cuando faltan <=7 dias
          o paso <=14 dias del cumple. Reusa Canvas API en BirthdayShareCard. */}
      {selectedPet &&
        isFeatureEnabled('CASCADE_BIRTHDAY_AUTO') &&
        isBirthdayWindow(selectedPet.birth_date) && (
          <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-pink-50 p-3">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🎂</div>
              <div className="flex-1">
                <p className="text-sm font-semibold">¡Cumple de {selectedPet.name}!</p>
                <p className="text-xs text-muted-foreground">
                  {birthdayLabel(selectedPet.birth_date)}
                </p>
              </div>
              <BirthdayShareCard
                petName={selectedPet.name}
                photoUrl={selectedPet.photo_url}
                birthDate={selectedPet.birth_date}
              />
            </div>
          </Card>
        )}

      {/* Next action */}
      {nextAction && (
        <NextActionCard
          kind={nextAction.kind}
          title={nextAction.title}
          description={nextAction.description}
          ctaLabel={nextAction.ctaLabel}
          onAction={nextAction.onAction}
          secondaryLabel="Ver todo"
          onSecondary={() => selectedPet && navigate(LINKS.petClinical(selectedPet.id))}
        />
      )}

      {/* Mini timeline: ultimos eventos */}
      {selectedPet && timelineEvents.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Últimos eventos</h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => navigate(LINKS.petClinical(selectedPet.id))}
            >
              Ver historia completa
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
          <div className="space-y-2">
            {timelineEvents.slice(0, 3).map((event) => {
              const meta = TIMELINE_CATEGORY_META[event.category];
              return (
                <div
                  key={event.id}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
                >
                  <span className="text-xl shrink-0" aria-hidden>
                    {meta.emoji}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{event.title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {format(parseISO(event.event_at), "d 'de' MMM", { locale: es })} ·{' '}
                      {meta.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Audio note recorder (refactor maestro §2.6.2) */}
      {selectedPet && isFeatureEnabled('OWNER_AUDIO_NOTES') && (
        <OwnerAudioNoteRecorder petId={selectedPet.id} petName={selectedPet.name} />
      )}

      {/* Quick actions: Hub V2 (6 one-tap) cuando flag activo, legacy 4 botones cuando no */}
      {selectedPet &&
        (isFeatureEnabled('QUICK_ACTIONS_HUB') ? (
          <QuickActionsHub petId={selectedPet.id} petName={selectedPet.name} />
        ) : (
          <Card className="p-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
              Acciones rápidas
            </h3>
            <div className="grid grid-cols-4 gap-2">
              <QuickActionButton
                icon={<Camera className="h-5 w-5" />}
                label="Foto"
                onClick={() => navigate(LINKS.petClinical(selectedPet.id))}
              />
              <QuickActionButton
                icon={<Weight className="h-5 w-5" />}
                label="Peso"
                onClick={() => navigate(LINKS.petClinical(selectedPet.id))}
              />
              <QuickActionButton
                icon={<Stethoscope className="h-5 w-5" />}
                label="Vet"
                onClick={() => navigate(LINKS.vets())}
              />
              <QuickActionButton
                icon={<Plus className="h-5 w-5" />}
                label="Otro"
                onClick={() => navigate(LINKS.petClinical(selectedPet.id))}
              />
            </div>
          </Card>
        ))}
    </div>
  );
}

function QuickActionButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg border border-border hover:bg-muted transition-colors"
    >
      <div className="w-9 h-9 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
        {icon}
      </div>
      <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
    </button>
  );
}
