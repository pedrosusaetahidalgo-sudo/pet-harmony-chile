import { Clock, CheckCircle2, Truck, Play, CheckCheck, X, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getStatusColor, getStatusLabel, type BookingStatus } from '@/lib/bookingStateMachine';

interface BookingStatusBadgeProps {
  status: BookingStatus;
  className?: string;
  /** Si true, oculta el icono (útil en espacios muy angostos) */
  hideIcon?: boolean;
  /** Si true, usa tamaño compacto */
  size?: 'sm' | 'md';
}

function getStatusIcon(status: BookingStatus) {
  switch (status) {
    case 'pendiente':
      return Clock;
    case 'confirmado':
      return CheckCircle2;
    case 'en_camino':
      return Truck;
    case 'en_curso':
      return Play;
    case 'completado':
      return CheckCheck;
    case 'cancelado':
      return X;
    case 'no_show':
      return AlertTriangle;
    default:
      return Clock;
  }
}

export function BookingStatusBadge({
  status,
  className,
  hideIcon = false,
  size = 'sm',
}: BookingStatusBadgeProps) {
  const Icon = getStatusIcon(status);
  return (
    <Badge
      variant="secondary"
      role="status"
      aria-label={`Estado: ${getStatusLabel(status)}`}
      className={cn(
        'inline-flex items-center gap-1 font-medium',
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1',
        getStatusColor(status),
        className
      )}
    >
      {!hideIcon && (
        <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} aria-hidden="true" />
      )}
      {getStatusLabel(status)}
    </Badge>
  );
}
