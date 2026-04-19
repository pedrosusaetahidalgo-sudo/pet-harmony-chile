import {
  BellRing,
  MessageCircle,
  Smartphone,
  Mail,
  Bell,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useNotificationDeliveryKpis,
  type DeliveryByChannel,
} from '@/hooks/useNotificationDeliveryKpis';
import { cn } from '@/lib/utils';

/**
 * Widget admin: estado de entrega de notificaciones ultimas 24h.
 * Consume notification_attempts (mig 20260612000001).
 * Criterio de alerta: tasa < 90% en cualquier canal o > 10 fallos.
 */
export function NotificationDeliveryWidget() {
  const { data, isLoading } = useNotificationDeliveryKpis();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BellRing className="h-4 w-4" aria-hidden="true" />
            Entrega de notificaciones (24h)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.totalLast24h === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BellRing className="h-4 w-4" aria-hidden="true" />
            Entrega de notificaciones (24h)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Sin actividad en las ultimas 24h (o la tabla notification_attempts aun no fue aplicada).
          </p>
        </CardContent>
      </Card>
    );
  }

  const hasAlerts =
    data.overallSuccessRate < 0.9 ||
    data.totalFailed24h > 10 ||
    data.byChannel.some((c) => c.total > 5 && c.successRate < 0.9);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BellRing className="h-4 w-4" aria-hidden="true" />
          Entrega de notificaciones (24h)
          <span className="ml-auto text-xs text-muted-foreground font-normal">
            {data.totalLast24h} intentos · {(data.overallSuccessRate * 100).toFixed(0)}% exito
          </span>
          {hasAlerts && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-[10px] font-semibold text-red-900">
              <AlertCircle className="h-3 w-3" aria-hidden="true" />
              Atencion
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {data.byChannel.map((ch) => (
            <ChannelRow key={ch.channel} channel={ch} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ChannelRow({ channel }: { channel: DeliveryByChannel }) {
  const Icon = iconForChannel(channel.channel);
  const label = labelForChannel(channel.channel);
  const successPct = Math.round(channel.successRate * 100);
  const effectiveTotal = channel.sent + channel.failed;
  const ok = channel.successRate >= 0.9 || effectiveTotal < 5;

  return (
    <div
      className={cn(
        'rounded-md border p-2.5 space-y-1.5',
        ok ? 'border-slate-200 bg-slate-50/40' : 'border-red-200 bg-red-50/40'
      )}
    >
      <div className="flex items-center gap-2">
        <Icon
          className={cn('h-4 w-4', ok ? 'text-slate-600' : 'text-red-700')}
          aria-hidden="true"
        />
        <span className="text-sm font-medium">{label}</span>
        <span
          className={cn(
            'ml-auto text-xs font-semibold',
            effectiveTotal === 0
              ? 'text-muted-foreground'
              : ok
                ? 'text-emerald-700'
                : 'text-red-700'
          )}
        >
          {effectiveTotal === 0 ? '—' : `${successPct}%`}
        </span>
      </div>
      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3 text-emerald-600" aria-hidden="true" />
          {channel.sent} ok
        </span>
        {channel.failed > 0 && (
          <span className="inline-flex items-center gap-1 text-red-700">
            <AlertCircle className="h-3 w-3" aria-hidden="true" />
            {channel.failed} fallos
          </span>
        )}
        {channel.skipped > 0 && (
          <span className="inline-flex items-center gap-1">· {channel.skipped} skip</span>
        )}
      </div>
    </div>
  );
}

function iconForChannel(ch: DeliveryByChannel['channel']) {
  switch (ch) {
    case 'whatsapp':
      return MessageCircle;
    case 'push':
      return Smartphone;
    case 'email':
      return Mail;
    case 'in_app':
      return Bell;
    case 'sms':
      return MessageCircle;
    default:
      return Bell;
  }
}

function labelForChannel(ch: DeliveryByChannel['channel']): string {
  switch (ch) {
    case 'whatsapp':
      return 'WhatsApp';
    case 'push':
      return 'Push';
    case 'email':
      return 'Email';
    case 'in_app':
      return 'In-app';
    case 'sms':
      return 'SMS';
    default:
      return ch;
  }
}
