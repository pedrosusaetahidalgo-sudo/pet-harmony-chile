import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Plus, CalendarDays } from '@/lib/icons';
import { useRoutines, Routine, RoutineInput } from '@/hooks/useRoutines';
import { RoutineCard } from '@/components/routines/RoutineCard';
import { RoutineWeekView } from '@/components/routines/RoutineWeekView';
import { RoutineForm } from '@/components/routines/RoutineForm';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export default function PetRoutines() {
  const { petId } = useParams<{ petId: string }>();
  const { user } = useAuth();
  const [selectedPetId, setSelectedPetId] = useState<string>(petId || 'all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);

  const filterPetId = selectedPetId === 'all' ? undefined : selectedPetId;
  const {
    routines,
    activeRoutines,
    isLoading,
    completions,
    addRoutine,
    updateRoutine,
    deleteRoutine,
    toggleActive,
    completeToday,
    skipToday,
    getCompletionForDate,
    completionRate,
  } = useRoutines(filterPetId);

  const { data: pets = [] } = useQuery({
    queryKey: ['my-pets-tabs', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('pets')
        .select('id, name, species, photo_url')
        .eq('owner_id', user.id)
        .eq('lifecycle_status', 'active')
        .order('name');
      return data || [];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const handleSubmit = (data: RoutineInput) => {
    if (editingRoutine) {
      updateRoutine.mutate(
        { id: editingRoutine.id, ...data },
        {
          onSuccess: () => {
            setFormOpen(false);
            setEditingRoutine(null);
          },
        }
      );
    } else {
      addRoutine.mutate(data, {
        onSuccess: () => setFormOpen(false),
      });
    }
  };

  const handleEdit = (routine: Routine) => {
    setEditingRoutine(routine);
    setFormOpen(true);
  };

  const displayRoutines = useMemo(() => {
    return activeRoutines.sort((a, b) => a.time_of_day.localeCompare(b.time_of_day));
  }, [activeRoutines]);

  const inactiveRoutines = routines.filter((r) => !r.is_active);

  return (
    <>
      <PageHeader
        title="Rutinas de tus mascotas"
        actions={
          <Button
            size="sm"
            onClick={() => {
              setEditingRoutine(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1" /> Nueva
          </Button>
        }
      >
        {/* Pet tabs */}
        {!petId && pets.length > 1 && (
          <Tabs value={selectedPetId} onValueChange={setSelectedPetId}>
            <TabsList className="h-8">
              <TabsTrigger value="all" className="text-xs h-7">
                Todas
              </TabsTrigger>
              {pets.map((pet) => (
                <TabsTrigger key={pet.id} value={pet.id} className="text-xs h-7">
                  {pet.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}
      </PageHeader>

      <main className="container max-w-2xl mx-auto px-3 py-4 space-y-6 pb-24">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : displayRoutines.length === 0 ? (
          <EmptyState
            variant="compact"
            icon={CalendarDays}
            title="Sin rutinas activas"
            description="Crea rutinas semanales para organizar paseos, comidas, medicacion y mas."
            actionLabel="Crear primera rutina"
            onAction={() => {
              setEditingRoutine(null);
              setFormOpen(true);
            }}
          />
        ) : (
          <>
            {/* Week view */}
            <RoutineWeekView routines={displayRoutines} completions={completions} />

            {/* Routine cards */}
            <div className="space-y-2">
              {displayRoutines.map((routine) => (
                <RoutineCard
                  key={routine.id}
                  routine={routine}
                  todayCompletion={getCompletionForDate(routine.id, todayStr)}
                  weeklyRate={completionRate(routine.id, 7)}
                  showPetName={selectedPetId === 'all'}
                  onComplete={() => completeToday.mutate({ routineId: routine.id })}
                  onSkip={() => skipToday.mutate({ routineId: routine.id })}
                  onEdit={() => handleEdit(routine)}
                  onToggleActive={() => toggleActive.mutate({ id: routine.id, is_active: false })}
                  onDelete={() => deleteRoutine.mutate(routine.id)}
                />
              ))}
            </div>

            {/* Inactive routines */}
            {inactiveRoutines.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Pausadas ({inactiveRoutines.length})
                </p>
                {inactiveRoutines.map((routine) => (
                  <RoutineCard
                    key={routine.id}
                    routine={routine}
                    showPetName={selectedPetId === 'all'}
                    onComplete={() => {}}
                    onSkip={() => {}}
                    onEdit={() => handleEdit(routine)}
                    onToggleActive={() => toggleActive.mutate({ id: routine.id, is_active: true })}
                    onDelete={() => deleteRoutine.mutate(routine.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <RoutineForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingRoutine(null);
        }}
        onSubmit={handleSubmit}
        defaultPetId={filterPetId}
        editRoutine={editingRoutine}
        isLoading={addRoutine.isPending || updateRoutine.isPending}
      />
    </>
  );
}
