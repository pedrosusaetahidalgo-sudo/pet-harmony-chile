import { Clock3, Info, ShieldCheck } from 'lucide-react';

/**
 * PolicyBanner — transparencia sobre la política de cancelación
 * antes de confirmar una reserva.
 *
 * Fuente de verdad (Booking Master Plan §17.3 y §30.5):
 *   - Grace window tutor: 2 horas antes → cancelación sin costo.
 *   - Grace window provider: 24 horas antes → cancelación sin penalización.
 *   - Sin cobros efectivos hoy (decision producto Y1). Solo se guarda
 *     motivo si se cancela fuera de grace.
 *
 * Props permiten customizar si en el futuro el provider define valores
 * distintos; por default se muestran los globales actuales.
 */
interface PolicyBannerProps {
  graceHoursOwner?: number;
  graceHoursProvider?: number;
  cancellationCost?: 'free' | 'charge';
  className?: string;
}

export function PolicyBanner({
  graceHoursOwner = 2,
  graceHoursProvider = 24,
  cancellationCost = 'free',
  className = '',
}: PolicyBannerProps) {
  const ownerHoursLabel = graceHoursOwner === 1 ? '1 hora' : `${graceHoursOwner} horas`;
  const providerHoursLabel = graceHoursProvider === 1 ? '1 hora' : `${graceHoursProvider} horas`;

  return (
    <div
      className={`rounded-lg border border-slate-200 bg-slate-50/70 p-3 space-y-2 text-xs ${className}`}
      role="note"
      aria-label="Política de cancelación"
    >
      <div className="flex items-start gap-2 text-slate-900">
        <ShieldCheck className="h-4 w-4 mt-0.5 text-emerald-700 flex-shrink-0" aria-hidden="true" />
        <div className="flex-1 space-y-1">
          <p className="font-medium leading-snug">
            Reserva flexible {cancellationCost === 'free' ? 'y sin costo' : ''}
          </p>
          <ul className="text-slate-600 space-y-0.5 leading-relaxed">
            <li className="flex items-start gap-1.5">
              <Clock3 className="h-3 w-3 mt-0.5 flex-shrink-0" aria-hidden="true" />
              <span>
                Puedes cancelar o reprogramar sin costo hasta{' '}
                <strong className="text-slate-800">{ownerHoursLabel}</strong> antes.
              </span>
            </li>
            <li className="flex items-start gap-1.5">
              <Info className="h-3 w-3 mt-0.5 flex-shrink-0" aria-hidden="true" />
              <span>
                Si cancelas después, te pediremos el motivo para mejorar nuestro servicio.
              </span>
            </li>
          </ul>
          <p className="text-slate-500 leading-snug pt-1">
            El veterinario puede reprogramar con hasta {providerHoursLabel} de aviso.
          </p>
        </div>
      </div>
    </div>
  );
}
