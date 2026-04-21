import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, Syringe, PawPrint, Scale, FileText, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { formatBookingDate } from '@/lib/format';
import { LINKS } from '@/lib/links';

/**
 * CC-29 (Booking V3 Master Plan §19.2) — briefing rápido del paciente
 * para que el vet vea lo esencial antes de la consulta sin abrir la ficha.
 *
 * Muestra:
 *   - Alergias + condiciones crónicas (alerta ámbar si hay)
 *   - Vacunas pendientes próximas (recordatorios tipo 'vaccine' / 'deworming')
 *   - Última consulta (nota clínica más reciente)
 *   - Peso/edad si están disponibles
 *
 * Se monta en el drawer de detalle cuando viewerRole='provider'.
 */
interface PatientBriefingProps {
  petId: string;
}

interface PetBrief {
  id: string;
  name: string;
  species: string | null;
  breed: string | null;
  birth_date: string | null;
  weight_kg: number | null;
  allergies: string | null;
  chronic_conditions: string | null;
}

interface ReminderBrief {
  id: string;
  title: string;
  type: string;
  due_date: string;
  is_completed: boolean;
}

interface LastNote {
  id: string;
  note_type: string | null;
  title: string | null;
  created_at: string;
}

export function PatientBriefing({ petId }: PatientBriefingProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['patient-briefing', petId],
    queryFn: async () => {
      const [petRes, remindersRes, lastNoteRes] = await Promise.all([
        supabase
          .from('pets')
          .select('id, name, species, breed, birth_date, weight_kg, allergies, chronic_conditions')
          .eq('id', petId)
          .maybeSingle(),

        supabase
          .from('pet_reminders')
          .select('id, title, type, due_date, is_completed')
          .eq('pet_id', petId)
          .eq('is_completed', false)
          .gte('due_date', new Date().toISOString().split('T')[0])
          .order('due_date', { ascending: true })
          .limit(3),

        supabase
          .from('vet_clinical_notes')
          .select('id, note_type, title, created_at')
          .eq('pet_id', petId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      return {
        pet: (petRes.data ?? null) as PetBrief | null,
        reminders: ((remindersRes.data ?? []) as ReminderBrief[]).filter(Boolean),
        lastNote: (lastNoteRes.data ?? null) as LastNote | null,
      };
    },
    staleTime: 2 * 60_000,
    enabled: !!petId,
  });

  if (isLoading) {
    return (
      <div className="rounded-lg border border-indigo-200 bg-indigo-50/40 p-3 space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    );
  }

  if (!data?.pet) return null;

  const { pet, reminders, lastNote } = data;

  const hasAlerts = !!(pet.allergies || pet.chronic_conditions);
  const upcomingVaccines = reminders.filter((r) =>
    ['vaccine', 'deworming', 'flea'].includes(r.type)
  );

  const ageYears = pet.birth_date
    ? Math.floor((Date.now() - new Date(pet.birth_date).getTime()) / (1000 * 60 * 60 * 24 * 365))
    : null;

  return (
    <div className="rounded-lg border border-indigo-200 bg-indigo-50/40 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-indigo-900 flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5" aria-hidden="true" />
          Resumen del paciente
        </p>
        <Link
          to={LINKS.petClinicalVet(petId)}
          className="text-[11px] font-medium text-indigo-700 hover:text-indigo-900 flex items-center gap-0.5"
        >
          Ver ficha completa
          <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </Link>
      </div>

      {/* Bio breve */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-700">
        <span className="inline-flex items-center gap-1">
          <PawPrint className="h-3 w-3 text-indigo-600" aria-hidden="true" />
          <span className="font-medium">{pet.name}</span>
          {pet.breed && <span className="text-slate-500">· {pet.breed}</span>}
        </span>
        {ageYears !== null && (
          <span className="text-slate-500">
            {ageYears} año{ageYears !== 1 ? 's' : ''}
          </span>
        )}
        {pet.weight_kg && (
          <span className="inline-flex items-center gap-1 text-slate-500">
            <Scale className="h-3 w-3" aria-hidden="true" />
            {pet.weight_kg} kg
          </span>
        )}
      </div>

      {/* Alertas médicas */}
      {hasAlerts && (
        <div className="rounded border border-amber-200 bg-amber-50 p-2 space-y-0.5">
          <p className="text-[11px] font-semibold text-amber-900 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" aria-hidden="true" />
            Alertas médicas
          </p>
          {pet.allergies && (
            <p className="text-[11px] text-amber-800">
              <span className="font-medium">Alergias:</span> {pet.allergies}
            </p>
          )}
          {pet.chronic_conditions && (
            <p className="text-[11px] text-amber-800">
              <span className="font-medium">Condiciones:</span> {pet.chronic_conditions}
            </p>
          )}
        </div>
      )}

      {/* Vacunas próximas */}
      {upcomingVaccines.length > 0 && (
        <div className="space-y-0.5">
          <p className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
            <Syringe className="h-3 w-3" aria-hidden="true" />
            Próximos controles
          </p>
          <ul className="space-y-0.5">
            {upcomingVaccines.slice(0, 3).map((r) => (
              <li key={r.id} className="text-[11px] text-slate-600 flex justify-between">
                <span>{r.title}</span>
                <span className="text-slate-500">{formatBookingDate(r.due_date)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Última consulta */}
      {lastNote && (
        <div className="border-t border-indigo-100 pt-1.5">
          <p className="text-[11px] text-slate-600">
            <span className="font-medium">Última consulta:</span>{' '}
            {lastNote.title || lastNote.note_type || 'Registro clínico'}{' '}
            <span className="text-slate-400">
              · {formatBookingDate(lastNote.created_at.split('T')[0])}
            </span>
          </p>
        </div>
      )}

      {!hasAlerts && upcomingVaccines.length === 0 && !lastNote && (
        <p className="text-[11px] text-slate-500 italic">
          Sin alertas ni historial previo en Paw Friend. Primera atención.
        </p>
      )}
    </div>
  );
}
