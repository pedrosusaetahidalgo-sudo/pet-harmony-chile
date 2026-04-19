import { AlertTriangle, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useGoogleCalendarStatus } from '@/hooks/useGoogleCalendarStatus';

interface GoogleCalendarStatusBannerProps {
  /** Ruta a la pagina de settings/integraciones donde reconectar. Default `/profile` */
  settingsHref?: string;
  className?: string;
}

/**
 * Banner visible cuando el token de Google Calendar fue revocado
 * (el usuario desconecto la app desde su cuenta Google o el token expiro
 * mas alla del refresh). Invita a reconectar.
 *
 * Se oculta en estados `disconnected` y `connected` (solo aparece en `revoked`).
 * Colocarlo en Home, MyBookings o Calendario para que el user lo vea rapido.
 */
export function GoogleCalendarStatusBanner({
  settingsHref = '/profile',
  className,
}: GoogleCalendarStatusBannerProps) {
  const { data: status } = useGoogleCalendarStatus();

  if (!status || status.state !== 'revoked') {
    return null;
  }

  return (
    <div
      role="alert"
      className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-900 ${className ?? ''}`}
    >
      <div className="flex items-start gap-2 flex-1 min-w-0">
        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
        <div className="space-y-0.5">
          <p className="text-sm font-medium leading-tight">Tu Google Calendar esta desconectado</p>
          <p className="text-xs leading-relaxed">
            Tus recordatorios de Paw Friend no se estan sincronizando con Google Calendar
            {status.email ? ` (${status.email})` : ''}. Reconecta para volver a recibirlos.
          </p>
        </div>
      </div>
      <Button
        asChild
        size="sm"
        variant="outline"
        className="border-amber-400 text-amber-900 hover:bg-amber-100 shrink-0"
      >
        <Link to={settingsHref}>
          Reconectar
          <ExternalLink className="h-3 w-3 ml-1" aria-hidden="true" />
        </Link>
      </Button>
    </div>
  );
}
