/**
 * QuickActionsHub — captura rápida desde Home (Refactor 2026-04-25 §FICHA_TABS_V2).
 *
 * Antes: grid 2x3 de 6 botones (Foto/Peso/Síntoma/Recordatorio/Compra/Vacuna)
 * con dialogs propios. El user veía 6 opciones y pensaba "uf, opciones".
 *
 * Después (insight Pedro "no pueden sentirse llenando formularios"):
 *   1. Botón principal grande "+ Registrar" → abre RegisterInterventionSheet
 *      (6 presets Vacuna/Antipara/Vet/Peso/Comida/Síntoma con form mínimo).
 *   2. Botón secundario "+ Recordatorio" → abre AddReminderDialog
 *      (también con 6 presets one-tap, refactorizado en la misma tanda).
 *
 * Reuso 100% de RegisterInterventionSheet y AddReminderDialog. Cero código
 * de form duplicado en este archivo.
 */
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { RegisterInterventionSheet } from '@/components/medical/RegisterInterventionSheet';
import { AddReminderDialog } from '@/components/reminders/AddReminderDialog';
import { trackRefactor, RefactorEvent } from '@/lib/refactorAnalytics';

interface QuickActionsHubProps {
  petId: string;
  petName: string;
}

export function QuickActionsHub({ petId, petName }: QuickActionsHubProps) {
  const queryClient = useQueryClient();
  const [registerOpen, setRegisterOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);

  const addReminder = useMutation({
    mutationFn: async (data: { pet_id: string; type: string; title: string; due_date: string }) => {
      const { error } = await supabase.from('pet_reminders').insert({
        pet_id: data.pet_id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        type: data.type as any,
        title: data.title,
        due_date: data.due_date,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Recordatorio creado');
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <>
      <Card>
        <CardContent className="p-4 space-y-3">
          <h3 className="text-sm font-semibold">Registrá algo de {petName}</h3>

          {/* Botón principal — abre sheet con 6 presets */}
          <Button
            onClick={() => {
              trackRefactor(RefactorEvent.quickActionTapped, { kind: 'register' });
              setRegisterOpen(true);
            }}
            size="lg"
            className="w-full h-14 text-base bg-purple-600 hover:bg-purple-700 gap-2"
          >
            <Plus className="h-5 w-5" />
            Registrar acción
          </Button>

          {/* Botón secundario — recordatorio (también con presets) */}
          <Button
            onClick={() => {
              trackRefactor(RefactorEvent.quickActionTapped, { kind: 'reminder' });
              setReminderOpen(true);
            }}
            variant="outline"
            className="w-full gap-2"
          >
            <Bell className="h-4 w-4" />
            Crear recordatorio
          </Button>

          <p className="text-[11px] text-muted-foreground text-center">
            Vacuna · antipara · peso · comida · vet · síntoma · recordatorio
          </p>
        </CardContent>
      </Card>

      <RegisterInterventionSheet
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        petId={petId}
        petName={petName}
      />

      <AddReminderDialog
        open={reminderOpen}
        onOpenChange={setReminderOpen}
        petId={petId}
        onSubmit={(data) => addReminder.mutate(data)}
      />
    </>
  );
}
