import { Badge } from '@/components/ui/badge';
import { getStatusColor, getStatusLabel, type BookingStatus } from '@/lib/bookingStateMachine';

interface BookingStatusBadgeProps {
  status: BookingStatus;
  className?: string;
}

export function BookingStatusBadge({ status, className }: BookingStatusBadgeProps) {
  return (
    <Badge variant="secondary" className={`${getStatusColor(status)} ${className ?? ''}`}>
      {getStatusLabel(status)}
    </Badge>
  );
}
