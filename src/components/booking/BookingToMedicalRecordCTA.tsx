import { Link } from 'react-router-dom';
import { FileText, ExternalLink, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BookingToMedicalRecordCTAProps {
  bookingId: string;
  petId: string;
  /**
   * Si la cita ya tiene una nota clinica linkeada via medical_records.booking_id,
   * el CTA muestra "Ver nota creada" en vez de "Crear nota".
   */
  existingMedicalRecordId?: string | null;
}

/**
 * CTA que se muestra cuando una cita esta completada:
 * navega a la ficha clinica del paciente con query params para
 * auto-abrir el dialog AddMedicalRecord con pre-fill del booking.
 *
 * Se embebe en BookingDetailDrawer cuando status='completado'.
 */
export function BookingToMedicalRecordCTA({
  bookingId,
  petId,
  existingMedicalRecordId,
}: BookingToMedicalRecordCTAProps) {
  if (existingMedicalRecordId) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle2 className="h-4 w-4 text-emerald-700" aria-hidden="true" />
          <span className="text-emerald-900 font-medium">Nota clinica ya creada</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          asChild
          className="h-7 text-xs border-emerald-300 text-emerald-900 hover:bg-emerald-100"
        >
          <Link to={`/ficha/${petId}#record-${existingMedicalRecordId}`}>Ver en ficha</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3 flex items-center justify-between gap-3">
      <div className="flex items-start gap-2 flex-1 min-w-0">
        <FileText className="h-4 w-4 text-indigo-700 mt-0.5 shrink-0" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold text-indigo-900 leading-tight">
            Crea la nota clinica
          </p>
          <p className="text-xs text-indigo-800 mt-0.5">
            Queda linkeada a esta cita y aparece en la ficha del paciente.
          </p>
        </div>
      </div>
      <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0">
        <Link to={`/ficha/${petId}?booking=${bookingId}`}>
          Crear ahora
          <ExternalLink className="h-3 w-3 ml-1" aria-hidden="true" />
        </Link>
      </Button>
    </div>
  );
}
