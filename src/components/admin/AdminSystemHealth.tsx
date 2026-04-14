import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, CheckCircle, XCircle, Clock, Cpu, Zap } from '@/lib/icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// All 21 edge functions deployed
const EDGE_FUNCTIONS = [
  'bereavement-assistant',
  'breed-tips',
  'flow-create-subscription',
  'flow-webhook',
  'generate-medical-summary',
  'generate-medical-zip',
  'generate-shelters',
  'generate-sitemap',
  'generate-weekly-owner-reports',
  'generate-weekly-vet-reports',
  'google-calendar-callback',
  'google-calendar-disconnect',
  'google-calendar-oauth-init',
  'google-calendar-sync',
  'medical-suggestions',
  'moderate-service-promotion',
  'ocr-vaccination-card',
  'pet-assistant',
  'reminder-cron',
  'send-pet-invitation',
  'send-whatsapp-reminder',
];

const CRITICAL_FUNCTIONS = [
  'flow-create-subscription',
  'flow-webhook',
  'generate-medical-summary',
  'reminder-cron',
];

interface HealthEntry {
  function_name: string;
  status: string;
  execution_time_ms: number | null;
  error_message: string | null;
  created_at: string;
}

interface FunctionStatus {
  name: string;
  lastStatus: 'success' | 'error' | 'timeout' | 'unknown';
  lastRun: string | null;
  avgLatencyMs: number | null;
  errorsLast24h: number;
  isCritical: boolean;
}

export default function AdminSystemHealth() {
  // Health logs from system_health_log
  const { data: healthData, isLoading: loadingHealth } = useQuery({
    queryKey: ['admin-system-health'],
    staleTime: 60_000,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('system_health_log') as any)
        .select('function_name, status, execution_time_ms, error_message, created_at')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const entries = (data as Array<Record<string, any>>) ?? [];

      const now = new Date();
      const day = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const statusMap = new Map<string, FunctionStatus>();

      // Initialize all known functions
      for (const fn of EDGE_FUNCTIONS) {
        statusMap.set(fn, {
          name: fn,
          lastStatus: 'unknown',
          lastRun: null,
          avgLatencyMs: null,
          errorsLast24h: 0,
          isCritical: CRITICAL_FUNCTIONS.includes(fn),
        });
      }

      // Process entries
      for (const entry of entries) {
        const fn = entry.function_name as string;
        let st = statusMap.get(fn);
        if (!st) {
          st = {
            name: fn,
            lastStatus: 'unknown',
            lastRun: null,
            avgLatencyMs: null,
            errorsLast24h: 0,
            isCritical: false,
          };
          statusMap.set(fn, st);
        }

        // First entry = most recent (ordered desc)
        if (!st.lastRun) {
          st.lastStatus = entry.status as 'success' | 'error' | 'timeout';
          st.lastRun = entry.created_at;
        }

        // Count errors in last 24h
        if (entry.status === 'error' && new Date(entry.created_at) >= day) {
          st.errorsLast24h++;
        }
      }

      // Calculate avg latency per function
      const latencies = new Map<string, number[]>();
      for (const entry of entries) {
        if (entry.execution_time_ms != null) {
          const arr = latencies.get(entry.function_name) || [];
          arr.push(entry.execution_time_ms);
          latencies.set(entry.function_name, arr);
        }
      }
      for (const [fn, vals] of latencies) {
        const st = statusMap.get(fn);
        if (st && vals.length > 0) {
          st.avgLatencyMs = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
        }
      }

      return Array.from(statusMap.values()).sort((a, b) => {
        // Critical first, then errors, then name
        if (a.isCritical !== b.isCritical) return a.isCritical ? -1 : 1;
        if (a.errorsLast24h !== b.errorsLast24h) return b.errorsLast24h - a.errorsLast24h;
        return a.name.localeCompare(b.name);
      });
    },
  });

  // AI usage from ai_usage table
  const { data: aiUsage, isLoading: loadingAi } = useQuery({
    queryKey: ['admin-ai-usage'],
    staleTime: 60_000,
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('ai_usage')
        .select('skill, daily_count, daily_limit, last_used_at')
        .eq('usage_date', today);

      if (error) return [];
      return (data ?? []).map((r) => ({
        skill: r.skill,
        used: r.daily_count,
        limit: r.daily_limit,
        lastUsed: r.last_used_at,
        percentage: r.daily_limit > 0 ? Math.round((r.daily_count / r.daily_limit) * 100) : 0,
      }));
    },
  });

  const totalErrors = (healthData ?? []).reduce((s, f) => s + f.errorsLast24h, 0);
  const criticalErrors = (healthData ?? []).filter((f) => f.isCritical && f.errorsLast24h > 0);

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'timeout':
        return <Clock className="h-4 w-4 text-orange-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Edge Functions</span>
            </div>
            <p className="text-2xl font-bold mt-1">{EDGE_FUNCTIONS.length}</p>
            <p className="text-xs text-muted-foreground">desplegadas</p>
          </CardContent>
        </Card>
        <Card className={totalErrors > 0 ? 'border-red-300' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle
                className={`h-4 w-4 ${totalErrors > 0 ? 'text-red-500' : 'text-green-500'}`}
              />
              <span className="text-sm font-medium">Errores (24h)</span>
            </div>
            <p className="text-2xl font-bold mt-1">{totalErrors}</p>
            <p className="text-xs text-muted-foreground">
              {criticalErrors.length > 0
                ? `${criticalErrors.length} en funciones críticas`
                : 'Sin errores críticos'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">IA Skills hoy</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {(aiUsage ?? []).reduce((s, a) => s + a.used, 0)}
            </p>
            <p className="text-xs text-muted-foreground">invocaciones totales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Funciones OK</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {
                (healthData ?? []).filter(
                  (f) => f.lastStatus === 'success' || f.lastStatus === 'unknown'
                ).length
              }
            </p>
            <p className="text-xs text-muted-foreground">de {EDGE_FUNCTIONS.length} totales</p>
          </CardContent>
        </Card>
      </div>

      {/* Edge Functions Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Cpu className="h-4 w-4" />
            Estado de Edge Functions
          </CardTitle>
          <CardDescription>Últimas ejecuciones y errores en 24h</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingHealth ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium">Función</th>
                    <th className="pb-2 font-medium">Estado</th>
                    <th className="pb-2 font-medium">Última ejecución</th>
                    <th className="pb-2 font-medium">Latencia prom.</th>
                    <th className="pb-2 font-medium">Errores 24h</th>
                  </tr>
                </thead>
                <tbody>
                  {(healthData ?? []).map((fn) => (
                    <tr key={fn.name} className="border-b last:border-0">
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs">{fn.name}</span>
                          {fn.isCritical && (
                            <Badge variant="destructive" className="text-[10px] px-1 py-0">
                              CRÍTICO
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-2">
                        <StatusIcon status={fn.lastStatus} />
                      </td>
                      <td className="py-2 text-muted-foreground text-xs">
                        {fn.lastRun
                          ? format(new Date(fn.lastRun), 'dd MMM HH:mm', { locale: es })
                          : 'Sin datos'}
                      </td>
                      <td className="py-2 text-xs">
                        {fn.avgLatencyMs != null ? `${fn.avgLatencyMs}ms` : '—'}
                      </td>
                      <td className="py-2">
                        {fn.errorsLast24h > 0 ? (
                          <Badge variant="destructive" className="text-xs">
                            {fn.errorsLast24h}
                          </Badge>
                        ) : (
                          <span className="text-xs text-green-600">0</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-4 w-4" />
            Uso de IA hoy
          </CardTitle>
          <CardDescription>Cuota consumida por skill</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingAi ? (
            <Skeleton className="h-20 w-full" />
          ) : (aiUsage ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Sin uso de IA hoy</p>
          ) : (
            <div className="space-y-3">
              {(aiUsage ?? []).map((skill) => (
                <div key={skill.skill} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-mono text-xs">{skill.skill}</span>
                    <span className="text-muted-foreground text-xs">
                      {skill.used}/{skill.limit} ({skill.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        skill.percentage >= 90
                          ? 'bg-red-500'
                          : skill.percentage >= 70
                            ? 'bg-orange-500'
                            : 'bg-primary'
                      }`}
                      style={{ width: `${Math.min(skill.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
