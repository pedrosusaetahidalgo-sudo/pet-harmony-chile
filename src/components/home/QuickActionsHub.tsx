/**
 * QuickActionsHub — 6 acciones one-tap visibles en el Home (Refactor Maestro §2.7).
 *
 * Cuando el flag QUICK_ACTIONS_HUB esta activo, aparecen 6 botones grandes que
 * disparan flujos minimos de captura para acciones de cuidado real.
 *
 * 1. Foto       → redirige a /edit-pet/:id (subir foto)
 * 2. Peso       → dialog inline con input numerico
 * 3. Sintoma    → dialog inline con textarea + severidad
 * 4. Recordatorio → redirige a /reminders
 * 5. Compra     → "Proximamente" (Fase 2 - integracion partners retail)
 * 6. Vacuna     → redirige a /ficha/:id?tab=vacunas
 *
 * Diseño: grid 2x3 con iconos + labels cortos. Cada captura otorga Paw Points
 * cuando PAW_POINTS_CANONICAL esta activo.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Camera, Weight, Bell, ShoppingBag, Syringe, Activity, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { awardPoints } from '@/lib/points';
import { trackRefactor, RefactorEvent } from '@/lib/refactorAnalytics';

interface QuickActionsHubProps {
  petId: string;
  petName: string;
}

type ActionDialog = 'weight' | 'symptom' | null;

export function QuickActionsHub({ petId, petName }: QuickActionsHubProps) {
  const navigate = useNavigate();
  const [activeDialog, setActiveDialog] = useState<ActionDialog>(null);

  const trackTap = (kind: string) => trackRefactor(RefactorEvent.quickActionTapped, { kind });

  const actions = [
    {
      key: 'photo',
      icon: Camera,
      label: 'Foto',
      color: 'text-blue-600 bg-blue-50',
      onClick: () => {
        trackTap('photo');
        navigate(`/edit-pet/${petId}#photo`);
      },
    },
    {
      key: 'weight',
      icon: Weight,
      label: 'Peso',
      color: 'text-emerald-600 bg-emerald-50',
      onClick: () => {
        trackTap('weight');
        setActiveDialog('weight');
      },
    },
    {
      key: 'symptom',
      icon: Activity,
      label: 'Síntoma',
      color: 'text-amber-600 bg-amber-50',
      onClick: () => {
        trackTap('symptom');
        setActiveDialog('symptom');
      },
    },
    {
      key: 'reminder',
      icon: Bell,
      label: 'Recordatorio',
      color: 'text-purple-600 bg-purple-50',
      onClick: () => {
        trackTap('reminder');
        navigate('/reminders');
      },
    },
    {
      key: 'purchase',
      icon: ShoppingBag,
      label: 'Compra',
      color: 'text-pink-600 bg-pink-50',
      onClick: () => {
        trackTap('purchase');
        toast.info('Próximamente: registro de compras con partners');
      },
    },
    {
      key: 'vaccine',
      icon: Syringe,
      label: 'Vacuna',
      color: 'text-rose-600 bg-rose-50',
      onClick: () => {
        trackTap('vaccine');
        navigate(`/ficha/${petId}?tab=vacunas`);
      },
    },
  ] as const;

  return (
    <>
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Registrá algo de {petName}</h3>
            <Badge variant="outline" className="text-[10px]">
              1 tap
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {actions.map((a) => {
              const Icon = a.icon;
              return (
                <button
                  key={a.key}
                  type="button"
                  onClick={a.onClick}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-lg border bg-card hover:shadow-md hover:border-purple-300 transition-all active:scale-95"
                >
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center ${a.color}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium">{a.label}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {activeDialog === 'weight' && (
        <WeightDialog petId={petId} petName={petName} onClose={() => setActiveDialog(null)} />
      )}
      {activeDialog === 'symptom' && (
        <SymptomDialog petId={petId} petName={petName} onClose={() => setActiveDialog(null)} />
      )}
    </>
  );
}

// ── Weight Dialog ────────────────────────────────────────────────────────────
function WeightDialog({
  petId,
  petName,
  onClose,
}: {
  petId: string;
  petName: string;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('No autenticado');
      const numWeight = parseFloat(weight);
      if (isNaN(numWeight) || numWeight <= 0 || numWeight > 200) {
        throw new Error('Peso inválido (0-200 kg)');
      }

      // Insert en pet_timeline_events con categoría 'weight'
      const { error } = await supabase.from('pet_timeline_events').insert({
        pet_id: petId,
        category: 'weight',
        title: `Peso: ${numWeight} kg`,
        description: notes.trim() || null,
        event_at: new Date().toISOString(),
        is_user_reported: true,
        recorded_by: user.id,
        source: 'manual',
        data: { weight_kg: numWeight, notes: notes.trim() || null },
      });
      if (error) throw error;

      // Otorgar puntos canónicos (+30 si flag activo)
      await awardPoints(user.id, 'register_weight', { pet_id: petId, weight: numWeight });
    },
    onSuccess: () => {
      trackRefactor(RefactorEvent.quickActionWeightSaved);
      toast.success(`Peso de ${petName} registrado`);
      queryClient.invalidateQueries({ queryKey: ['pet-history-timeline', petId] });
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Peso de {petName}</DialogTitle>
          <DialogDescription>Anotá su peso de hoy.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Peso (kg) *</Label>
            <Input
              type="number"
              step="0.1"
              min="0"
              max="200"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="Ej: 25.5"
              autoFocus
            />
          </div>
          <div>
            <Label>Nota (opcional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Después del paseo, antes de comer, etc."
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button
            onClick={() => mutate()}
            disabled={isPending || !weight}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isPending ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Guardando
              </>
            ) : (
              'Guardar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Symptom Dialog ───────────────────────────────────────────────────────────
const SEVERITIES = [
  { value: 'mild', label: 'Leve' },
  { value: 'moderate', label: 'Moderado' },
  { value: 'severe', label: 'Importante (consultar vet pronto)' },
];

function SymptomDialog({
  petId,
  petName,
  onClose,
}: {
  petId: string;
  petName: string;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [symptom, setSymptom] = useState('');
  const [severity, setSeverity] = useState('mild');

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('No autenticado');
      if (!symptom.trim()) throw new Error('Describe brevemente el síntoma');

      const { error } = await supabase.from('pet_timeline_events').insert({
        pet_id: petId,
        category: 'health',
        title: `Síntoma observado: ${symptom.trim().slice(0, 60)}`,
        description: symptom.trim(),
        event_at: new Date().toISOString(),
        is_user_reported: true,
        recorded_by: user.id,
        source: 'manual',
        data: { severity, symptom: symptom.trim() },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      trackRefactor(RefactorEvent.quickActionSymptomSaved, { severity });
      toast.success(`Síntoma de ${petName} registrado`);
      queryClient.invalidateQueries({ queryKey: ['pet-history-timeline', petId] });
      if (severity === 'severe') {
        setTimeout(() => {
          toast.warning('Te recomendamos consultar al vet a la brevedad', { duration: 6000 });
        }, 500);
      }
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Síntoma de {petName}</DialogTitle>
          <DialogDescription>Anotá lo que observaste.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>¿Qué notaste? *</Label>
            <Textarea
              value={symptom}
              onChange={(e) => setSymptom(e.target.value)}
              placeholder="Vómito, diarrea, no come, cojea, ..."
              rows={3}
              autoFocus
              maxLength={500}
            />
          </div>
          <div>
            <Label>Severidad</Label>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SEVERITIES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button
            onClick={() => mutate()}
            disabled={isPending || !symptom.trim()}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {isPending ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Guardando
              </>
            ) : (
              'Registrar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
