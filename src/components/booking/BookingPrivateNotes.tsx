import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Lock, Save, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BookingPrivateNotesProps {
  bookingId: string;
  bookingType: 'vet';
  initialValue: string | null;
  /** Si es true, el campo es readonly (ej: owner viendo su propio booking). */
  readOnly?: boolean;
}

/**
 * Editor de notas privadas del vet. Solo visible para provider/admin.
 * Columna vet_bookings.private_notes (agregada en mig 20260612000000).
 *
 * NO visible al dueno de la cita por RLS + por decision de producto:
 * estas notas son observaciones rapidas del vet antes de crear la
 * nota clinica formal (que sí es visible al dueno).
 */
export function BookingPrivateNotes({
  bookingId,
  bookingType,
  initialValue,
  readOnly = false,
}: BookingPrivateNotesProps) {
  const [value, setValue] = useState(initialValue ?? '');
  const [dirty, setDirty] = useState(false);
  const queryClient = useQueryClient();

  // Sync si cambia el booking (cambio de drawer).
  useEffect(() => {
    setValue(initialValue ?? '');
    setDirty(false);
  }, [initialValue, bookingId]);

  const saveMutation = useMutation({
    mutationFn: async (next: string) => {
      if (bookingType !== 'vet') {
        throw new Error('private_notes solo disponible para vet bookings por ahora.');
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private_notes agregada en mig 20260612000000
      const { error } = await (supabase.from('vet_bookings') as any)
        .update({ private_notes: next.trim() ? next.trim() : null })
        .eq('id', bookingId);
      if (error) throw error;
    },
    onSuccess: () => {
      setDirty(false);
      toast.success('Nota privada guardada');
      queryClient.invalidateQueries({ queryKey: ['booking-detail', bookingType, bookingId] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'No se pudo guardar la nota');
    },
  });

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <Label
          htmlFor={`private-notes-${bookingId}`}
          className="text-xs font-semibold flex items-center gap-1.5 text-slate-700"
        >
          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
          Notas privadas del profesional
        </Label>
        <span className="text-[10px] text-slate-500">Solo visible para ti y tu equipo</span>
      </div>

      <Textarea
        id={`private-notes-${bookingId}`}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setDirty(true);
        }}
        placeholder={
          readOnly
            ? 'Sin notas privadas'
            : 'Ej: Dueno llego 10min tarde; revisar proxima vez conducta ansiosa al pesarlo...'
        }
        rows={3}
        disabled={readOnly}
        className="text-sm resize-none"
      />

      {!readOnly && dirty && (
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={() => saveMutation.mutate(value)}
            disabled={saveMutation.isPending}
            className="bg-slate-700 hover:bg-slate-800"
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
            )}
            Guardar nota
          </Button>
        </div>
      )}
    </div>
  );
}
