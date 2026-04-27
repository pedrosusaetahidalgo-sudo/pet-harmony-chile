/**
 * AdminRiskMonitor — banner que destaca señales de riesgo del plan §11.
 *
 * Lee de la RPC compute_risk_signals que devuelve 0+ filas. Si severity
 * 'critical', banner rojo con ALERT prominente. Si solo 'warn', banner
 * amarillo plegable.
 *
 * Solo se renderiza si hay signals activos. Si todo OK, no contamina UI.
 * Refresca cada 5 min — los signals se mueven en escala de horas.
 *
 * El componente se monta en AdminDashboard al tope para visibilidad.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

interface RiskSignal {
  signal_id: string;
  name: string;
  severity: 'warn' | 'critical';
  value: number;
  threshold: number;
  message: string;
  linked_risk: string;
  computed_at: string;
}

export function AdminRiskMonitor() {
  const { data: signals = [] } = useQuery<RiskSignal[]>({
    queryKey: ['admin-risk-signals'],
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await sb.rpc('compute_risk_signals');
      if (error) {
        console.warn('[AdminRiskMonitor] rpc error', error);
        return [];
      }
      return (data ?? []) as RiskSignal[];
    },
  });

  if (signals.length === 0) return null;

  const critical = signals.filter((s) => s.severity === 'critical');
  const warn = signals.filter((s) => s.severity === 'warn');

  return (
    <div className="space-y-2">
      {critical.length > 0 && (
        <Card className="border-red-500/40 bg-red-500/10">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="h-4 w-4 text-red-400" />
              <p className="font-semibold text-red-300 text-sm">
                {critical.length} señal{critical.length > 1 ? 'es' : ''} crítica
                {critical.length > 1 ? 's' : ''} detectada{critical.length > 1 ? 's' : ''}
              </p>
              <Badge variant="outline" className="ml-auto border-red-500 text-red-300 text-[10px]">
                Acción requerida
              </Badge>
            </div>
            <div className="space-y-2">
              {critical.map((s) => (
                <SignalRow key={s.signal_id} signal={s} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {warn.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <p className="font-medium text-amber-300 text-sm">
                {warn.length} señal{warn.length > 1 ? 'es' : ''} de atención
              </p>
            </div>
            <div className="space-y-2">
              {warn.map((s) => (
                <SignalRow key={s.signal_id} signal={s} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SignalRow({ signal }: { signal: RiskSignal }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-900/40 p-2.5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p
          className={cn(
            'text-xs font-medium',
            signal.severity === 'critical' ? 'text-red-300' : 'text-amber-300'
          )}
        >
          {signal.name}
        </p>
        <Badge
          variant="outline"
          className={cn(
            'text-[10px] font-mono',
            signal.severity === 'critical'
              ? 'border-red-500 text-red-400'
              : 'border-amber-500 text-amber-400'
          )}
        >
          {signal.value} / {signal.threshold}
        </Badge>
      </div>
      <p className="text-[11px] text-slate-400 mt-1">{signal.message}</p>
      <p className="text-[10px] text-slate-500 italic mt-0.5">→ {signal.linked_risk}</p>
    </div>
  );
}
