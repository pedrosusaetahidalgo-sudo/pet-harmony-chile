import { Fragment, useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Cpu,
  Zap,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Radio,
} from '@/lib/icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ─── Catalogo completo de edge functions (34) ──────────────────────────────
type Category =
  | 'ai'
  | 'payments'
  | 'google'
  | 'medical'
  | 'cron'
  | 'onboarding'
  | 'moderation'
  | 'notifications'
  | 'system';

interface EdgeFunctionMeta {
  name: string;
  category: Category;
  critical: boolean;
  logsHealth: boolean; // true si usa logEdgeFunctionCall
  description: string;
}

const EDGE_FUNCTIONS: EdgeFunctionMeta[] = [
  // Pagos (criticos: tocan dinero)
  {
    name: 'flow-create-subscription',
    category: 'payments',
    critical: true,
    logsHealth: false,
    description: 'Crea suscripcion Premium en Flow.cl',
  },
  {
    name: 'flow-webhook',
    category: 'payments',
    critical: true,
    logsHealth: false,
    description: 'Webhook Flow.cl (activa Premium)',
  },
  // IA (logsHealth: true, usan ai-base)
  {
    name: 'pet-assistant',
    category: 'ai',
    critical: false,
    logsHealth: true,
    description: 'Asistente IA basico de mascotas',
  },
  {
    name: 'symptom-triage',
    category: 'ai',
    critical: false,
    logsHealth: true,
    description: 'Triaje IA por sintomas',
  },
  {
    name: 'nutrition-coach',
    category: 'ai',
    critical: false,
    logsHealth: true,
    description: 'Coach nutricional IA',
  },
  {
    name: 'consultation-prep',
    category: 'ai',
    critical: false,
    logsHealth: true,
    description: 'Prep de consulta para vet',
  },
  {
    name: 'wound-vision',
    category: 'ai',
    critical: false,
    logsHealth: true,
    description: 'Analisis visual de heridas (IA)',
  },
  {
    name: 'breed-tips',
    category: 'ai',
    critical: false,
    logsHealth: false,
    description: 'Tips por raza (IA)',
  },
  {
    name: 'bereavement-assistant',
    category: 'ai',
    critical: false,
    logsHealth: false,
    description: 'Asistente empatico memorial',
  },
  {
    name: 'medical-suggestions',
    category: 'ai',
    critical: false,
    logsHealth: false,
    description: 'Sugerencias medicas IA',
  },
  {
    name: 'ocr-vaccination-card',
    category: 'ai',
    critical: false,
    logsHealth: false,
    description: 'OCR carnet vacunacion',
  },
  {
    name: 'process-consultation-transcript',
    category: 'ai',
    critical: false,
    logsHealth: false,
    description: 'Transcripcion audio consulta',
  },
  // Medical / PDF (criticos: joya de la corona)
  {
    name: 'generate-medical-summary',
    category: 'medical',
    critical: true,
    logsHealth: false,
    description: 'Ficha medica PDF descargable',
  },
  {
    name: 'generate-medical-zip',
    category: 'medical',
    critical: false,
    logsHealth: false,
    description: 'ZIP documentos medicos',
  },
  {
    name: 'generate-vet-patient-summary',
    category: 'medical',
    critical: false,
    logsHealth: false,
    description: 'Resumen consolidado pacientes vet',
  },
  // Google Calendar
  {
    name: 'google-calendar-oauth-init',
    category: 'google',
    critical: false,
    logsHealth: false,
    description: 'Inicia OAuth Google Calendar',
  },
  {
    name: 'google-calendar-callback',
    category: 'google',
    critical: false,
    logsHealth: false,
    description: 'Callback OAuth Google',
  },
  {
    name: 'google-calendar-sync',
    category: 'google',
    critical: false,
    logsHealth: false,
    description: 'Sync eventos Google Calendar',
  },
  {
    name: 'google-calendar-disconnect',
    category: 'google',
    critical: false,
    logsHealth: false,
    description: 'Desconectar Google Calendar',
  },
  // Cron jobs
  {
    name: 'reminder-cron',
    category: 'cron',
    critical: true,
    logsHealth: false,
    description: 'Cron recordatorios (1x/dia)',
  },
  {
    name: 'booking-reminders-cron',
    category: 'cron',
    critical: false,
    logsHealth: false,
    description: 'Cron reservas proximas',
  },
  {
    name: 'generate-weekly-owner-reports',
    category: 'cron',
    critical: false,
    logsHealth: false,
    description: 'Reporte semanal dueno',
  },
  {
    name: 'generate-weekly-vet-reports',
    category: 'cron',
    critical: false,
    logsHealth: false,
    description: 'Reporte semanal vet',
  },
  {
    name: 'generate-sitemap',
    category: 'cron',
    critical: false,
    logsHealth: false,
    description: 'Genera sitemap SEO',
  },
  {
    name: 'generate-shelters',
    category: 'cron',
    critical: false,
    logsHealth: false,
    description: 'Genera data refugios',
  },
  // Onboarding / provider
  {
    name: 'create-patient',
    category: 'onboarding',
    critical: false,
    logsHealth: false,
    description: 'Vet crea paciente + Paw Card',
  },
  {
    name: 'send-pet-invitation',
    category: 'onboarding',
    critical: false,
    logsHealth: false,
    description: 'Invitar dueno a gestionar mascota',
  },
  {
    name: 'send-lead-outreach',
    category: 'onboarding',
    critical: false,
    logsHealth: false,
    description: 'Outreach leads vets (email/WA)',
  },
  // Moderacion
  {
    name: 'verify-service-provider',
    category: 'moderation',
    critical: false,
    logsHealth: false,
    description: 'Verificacion IA proveedor',
  },
  {
    name: 'verify-vet-document',
    category: 'moderation',
    critical: false,
    logsHealth: false,
    description: 'Verificacion IA documento vet',
  },
  {
    name: 'moderate-service-promotion',
    category: 'moderation',
    critical: false,
    logsHealth: false,
    description: 'Modera promociones',
  },
  // Notificaciones
  {
    name: 'send-whatsapp-reminder',
    category: 'notifications',
    critical: false,
    logsHealth: false,
    description: 'WhatsApp (pend. verif. Meta)',
  },
  // Sistema
  {
    name: 'log-error',
    category: 'system',
    critical: false,
    logsHealth: false,
    description: 'Error logging centralizado',
  },
  {
    name: 'feedback-admin',
    category: 'system',
    critical: false,
    logsHealth: false,
    description: 'Admin feedback endpoint',
  },
];

const CATEGORY_LABELS: Record<Category | 'all', string> = {
  all: 'Todas',
  payments: 'Pagos',
  ai: 'IA',
  medical: 'Medical',
  google: 'Google',
  cron: 'Cron',
  onboarding: 'Onboarding',
  moderation: 'Moderacion',
  notifications: 'Notifs',
  system: 'Sistema',
};

// ─── Types ────────────────────────────────────────────────────────────────
type PingState = 'idle' | 'running' | 'ok' | 'fail';

interface PingResult {
  state: PingState;
  statusCode: number | null;
  latencyMs: number | null;
  ranAt: number | null;
}

interface ErrorEntry {
  id: string;
  message: string;
  created_at: string;
  context: Record<string, unknown>;
  severity: string;
  resolved: boolean;
}

interface FunctionRow extends EdgeFunctionMeta {
  lastStatus: 'success' | 'error' | 'timeout' | 'unknown';
  lastRun: string | null;
  avgLatencyMs: number | null;
  errorsLast24h: number;
  executionsLast24h: number;
  recentErrors: ErrorEntry[];
}

// ─── Live ping helper ─────────────────────────────────────────────────────
async function pingFunction(name: string): Promise<PingResult> {
  const base = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  if (!base) return { state: 'fail', statusCode: null, latencyMs: null, ranAt: Date.now() };

  const url = `${base}/functions/v1/${name}`;
  const t0 = performance.now();

  try {
    // CORS preflight: el gateway responde sin invocar la funcion (sin costo).
    // 404 => funcion no desplegada. 200/204 => desplegada.
    const res = await fetch(url, {
      method: 'OPTIONS',
      headers: {
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'authorization, content-type, x-client-info',
      },
    });
    const latency = Math.round(performance.now() - t0);
    return {
      state: res.status < 400 ? 'ok' : 'fail',
      statusCode: res.status,
      latencyMs: latency,
      ranAt: Date.now(),
    };
  } catch {
    return { state: 'fail', statusCode: null, latencyMs: null, ranAt: Date.now() };
  }
}

// ─── Component ────────────────────────────────────────────────────────────
export default function AdminSystemHealth() {
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  const [expandedFn, setExpandedFn] = useState<string | null>(null);
  const [pingResults, setPingResults] = useState<Record<string, PingResult>>({});
  const [pingingAll, setPingingAll] = useState(false);

  // Health logs desde system_health_log + errors desde error_logs
  const {
    data: healthData,
    isLoading: loadingHealth,
    isFetching: fetchingHealth,
    refetch: refetchHealth,
  } = useQuery({
    queryKey: ['admin-system-health-v2'],
    staleTime: 60_000,
    queryFn: async () => {
      const [healthRes, errorsRes] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase.from('system_health_log') as any)
          .select('function_name, status, execution_time_ms, error_message, created_at')
          .order('created_at', { ascending: false })
          .limit(500),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase.from('error_logs') as any)
          .select('id, message, created_at, context, severity, resolved')
          .eq('source', 'edge_function')
          .order('created_at', { ascending: false })
          .limit(300),
      ]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const healthEntries = (healthRes.data as Array<Record<string, any>>) ?? [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errorEntries = (errorsRes.data as Array<Record<string, any>>) ?? [];

      const now = Date.now();
      const dayAgo = now - 24 * 60 * 60 * 1000;

      const rowMap = new Map<string, FunctionRow>();
      for (const fn of EDGE_FUNCTIONS) {
        rowMap.set(fn.name, {
          ...fn,
          lastStatus: 'unknown',
          lastRun: null,
          avgLatencyMs: null,
          errorsLast24h: 0,
          executionsLast24h: 0,
          recentErrors: [],
        });
      }

      // Procesa health logs
      const latencies = new Map<string, number[]>();
      for (const entry of healthEntries) {
        const fn = entry.function_name as string;
        let row = rowMap.get(fn);
        if (!row) {
          // Funcion no catalogada (reportando pero no en lista) — se agrega como "system"
          row = {
            name: fn,
            category: 'system',
            critical: false,
            logsHealth: true,
            description: '(no catalogada)',
            lastStatus: 'unknown',
            lastRun: null,
            avgLatencyMs: null,
            errorsLast24h: 0,
            executionsLast24h: 0,
            recentErrors: [],
          };
          rowMap.set(fn, row);
        }
        if (!row.lastRun) {
          row.lastStatus = entry.status as 'success' | 'error' | 'timeout';
          row.lastRun = entry.created_at;
        }
        const t = new Date(entry.created_at).getTime();
        if (t >= dayAgo) {
          row.executionsLast24h++;
          if (entry.status === 'error') row.errorsLast24h++;
        }
        if (entry.execution_time_ms != null) {
          const arr = latencies.get(fn) || [];
          arr.push(entry.execution_time_ms);
          latencies.set(fn, arr);
        }
      }
      for (const [fn, vals] of latencies) {
        const row = rowMap.get(fn);
        if (row && vals.length > 0) {
          row.avgLatencyMs = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
        }
      }

      // Asocia errores desde error_logs (match via context.function_name o message prefix)
      for (const err of errorEntries) {
        const ctxFn = (err.context as Record<string, unknown> | null)?.function_name as
          | string
          | undefined;
        let fnName = ctxFn;
        if (!fnName && typeof err.message === 'string') {
          const prefix = err.message.split(':')[0]?.trim();
          if (prefix && rowMap.has(prefix)) fnName = prefix;
        }
        if (!fnName) continue;
        const row = rowMap.get(fnName);
        if (!row) continue;
        if (row.recentErrors.length < 10) {
          row.recentErrors.push({
            id: err.id,
            message: err.message,
            created_at: err.created_at,
            context: (err.context as Record<string, unknown>) ?? {},
            severity: err.severity,
            resolved: err.resolved,
          });
        }
      }

      return Array.from(rowMap.values()).sort((a, b) => {
        if (a.critical !== b.critical) return a.critical ? -1 : 1;
        if (a.errorsLast24h !== b.errorsLast24h) return b.errorsLast24h - a.errorsLast24h;
        return a.name.localeCompare(b.name);
      });
    },
  });

  // AI usage (se mantiene)
  const { data: aiUsage, isLoading: loadingAi } = useQuery({
    queryKey: ['admin-ai-usage'],
    staleTime: 60_000,
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('ai_usage')
        .select('skill_name, calls_today, last_called_at')
        .eq('last_reset_date', today);
      if (error) return [];
      const bySkill = new Map<string, { used: number; lastUsed: string | null }>();
      for (const row of data ?? []) {
        const cur = bySkill.get(row.skill_name) ?? { used: 0, lastUsed: null };
        cur.used += row.calls_today ?? 0;
        if (row.last_called_at && (!cur.lastUsed || row.last_called_at > cur.lastUsed)) {
          cur.lastUsed = row.last_called_at;
        }
        bySkill.set(row.skill_name, cur);
      }
      return Array.from(bySkill.entries())
        .map(([skill, v]) => ({ skill, used: v.used, lastUsed: v.lastUsed }))
        .sort((a, b) => b.used - a.used);
    },
  });

  // Filtrado por categoria
  const filteredRows = useMemo(() => {
    const rows = healthData ?? [];
    if (categoryFilter === 'all') return rows;
    return rows.filter((r) => r.category === categoryFilter);
  }, [healthData, categoryFilter]);

  // Ping masivo (paralelizado en tandas de 6)
  const runPingAll = useCallback(async () => {
    if (pingingAll) return;
    setPingingAll(true);
    const targets = (healthData ?? []).map((r) => r.name);
    const results: Record<string, PingResult> = {};
    // Marca todas como running
    setPingResults((prev) => {
      const next = { ...prev };
      for (const n of targets) {
        next[n] = { state: 'running', statusCode: null, latencyMs: null, ranAt: null };
      }
      return next;
    });
    const CONCURRENCY = 6;
    for (let i = 0; i < targets.length; i += CONCURRENCY) {
      const batch = targets.slice(i, i + CONCURRENCY);
      const settled = await Promise.all(
        batch.map((n) => pingFunction(n).then((r) => [n, r] as const))
      );
      for (const [n, r] of settled) results[n] = r;
      setPingResults((prev) => ({ ...prev, ...Object.fromEntries(settled) }));
    }
    const okCount = Object.values(results).filter((r) => r.state === 'ok').length;
    const failCount = Object.values(results).filter((r) => r.state === 'fail').length;
    toast.success(`Ping completo: ${okCount} OK, ${failCount} fallos`);
    setPingingAll(false);
  }, [healthData, pingingAll]);

  const runPingOne = useCallback(async (name: string) => {
    setPingResults((prev) => ({
      ...prev,
      [name]: { state: 'running', statusCode: null, latencyMs: null, ranAt: null },
    }));
    const res = await pingFunction(name);
    setPingResults((prev) => ({ ...prev, [name]: res }));
    if (res.state === 'ok') toast.success(`${name} responde (${res.latencyMs}ms)`);
    else toast.error(`${name} no responde (${res.statusCode ?? 'network'})`);
  }, []);

  const totalErrors = (healthData ?? []).reduce((s, f) => s + f.errorsLast24h, 0);
  const criticalErrors = (healthData ?? []).filter((f) => f.critical && f.errorsLast24h > 0);
  const deployedOk = Object.values(pingResults).filter((r) => r.state === 'ok').length;
  const deployedFail = Object.values(pingResults).filter((r) => r.state === 'fail').length;
  const okCount = (healthData ?? []).filter((f) => f.lastStatus === 'success').length;

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-400" />;
      case 'timeout':
        return <Clock className="h-4 w-4 text-orange-400" />;
      default:
        return <Activity className="h-4 w-4 text-slate-500" />;
    }
  };

  const PingBadge = ({ name }: { name: string }) => {
    const r = pingResults[name];
    if (!r || r.state === 'idle') {
      return <span className="text-xs text-slate-600">—</span>;
    }
    if (r.state === 'running') {
      return <RefreshCw className="h-3 w-3 animate-spin text-slate-400" />;
    }
    if (r.state === 'ok') {
      return (
        <Badge
          variant="outline"
          className="text-[10px] px-1.5 py-0 bg-green-500/20 text-green-300 border-green-500/30"
        >
          {r.latencyMs}ms
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="text-[10px] px-1.5 py-0 bg-red-500/20 text-red-300 border-red-500/30"
      >
        {r.statusCode ?? 'off'}
      </Badge>
    );
  };

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: (healthData ?? []).length };
    for (const row of healthData ?? []) {
      counts[row.category] = (counts[row.category] ?? 0) + 1;
    }
    return counts;
  }, [healthData]);

  return (
    <div className="space-y-6">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-300">Edge Functions</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-white">{EDGE_FUNCTIONS.length}</p>
            <p className="text-xs text-slate-500">catalogadas</p>
          </CardContent>
        </Card>
        <Card
          className={cn('bg-slate-900 border-slate-800', totalErrors > 0 && 'border-red-500/40')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle
                className={cn('h-4 w-4', totalErrors > 0 ? 'text-red-400' : 'text-green-400')}
              />
              <span className="text-sm font-medium text-slate-300">Errores (24h)</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-white">{totalErrors}</p>
            <p className="text-xs text-slate-500">
              {criticalErrors.length > 0
                ? `${criticalErrors.length} en funciones criticas`
                : 'Sin errores criticos'}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-300">Ping en vivo</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-white">
              {deployedOk}
              <span className="text-sm text-slate-500 font-normal"> /{EDGE_FUNCTIONS.length}</span>
            </p>
            <p className="text-xs text-slate-500">
              {deployedFail > 0 ? `${deployedFail} sin respuesta` : 'sin fallos detectados'}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-300">IA Skills hoy</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-white">
              {(aiUsage ?? []).reduce((s, a) => s + a.used, 0)}
            </p>
            <p className="text-xs text-slate-500">{okCount} fns con ultima ejec. OK</p>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar + filtros */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-3">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base text-white">
                <Cpu className="h-4 w-4" />
                Validador Edge Functions
              </CardTitle>
              <CardDescription className="text-slate-400">
                Ping en vivo + historial + errores. {EDGE_FUNCTIONS.length} funciones catalogadas.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={() => refetchHealth()}
                disabled={fetchingHealth}
                className="border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
              >
                <RefreshCw className={cn('h-3 w-3 mr-1.5', fetchingHealth && 'animate-spin')} />
                Refrescar logs
              </Button>
              <Button
                size="sm"
                onClick={runPingAll}
                disabled={pingingAll || loadingHealth}
                className="bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                <Radio className={cn('h-3 w-3 mr-1.5', pingingAll && 'animate-pulse')} />
                {pingingAll ? 'Pinging...' : 'Ping a todas'}
              </Button>
            </div>
          </div>

          <Tabs
            value={categoryFilter}
            onValueChange={(v) => setCategoryFilter(v as Category | 'all')}
            className="mt-3"
          >
            <TabsList className="flex flex-wrap gap-1 h-auto bg-slate-800/50">
              {(Object.keys(CATEGORY_LABELS) as Array<Category | 'all'>).map((cat) => {
                const count = categoryCounts[cat] ?? 0;
                if (cat !== 'all' && count === 0) return null;
                return (
                  <TabsTrigger key={cat} value={cat} className="text-xs px-2.5 py-1">
                    {CATEGORY_LABELS[cat]}
                    <span className="ml-1.5 text-[10px] opacity-60">{count}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {loadingHealth ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-10 w-full bg-slate-800" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-left">
                    <th className="pb-2 pr-2 font-medium text-slate-400 uppercase text-xs w-6"></th>
                    <th className="pb-2 font-medium text-slate-400 uppercase text-xs">Funcion</th>
                    <th className="pb-2 font-medium text-slate-400 uppercase text-xs">Ping</th>
                    <th className="pb-2 font-medium text-slate-400 uppercase text-xs">Estado</th>
                    <th className="pb-2 font-medium text-slate-400 uppercase text-xs hidden md:table-cell">
                      Ultima ejec.
                    </th>
                    <th className="pb-2 font-medium text-slate-400 uppercase text-xs hidden lg:table-cell">
                      Latencia
                    </th>
                    <th className="pb-2 font-medium text-slate-400 uppercase text-xs">Err 24h</th>
                    <th className="pb-2 pl-2 font-medium text-slate-400 uppercase text-xs text-right"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((fn) => {
                    const isExpanded = expandedFn === fn.name;
                    const hasErrors = fn.recentErrors.length > 0;
                    return (
                      <Fragment key={fn.name}>
                        <tr
                          className={cn(
                            'border-b border-slate-800 last:border-0 hover:bg-slate-800/50 cursor-pointer',
                            isExpanded && 'bg-slate-800/70'
                          )}
                          onClick={() => setExpandedFn(isExpanded ? null : fn.name)}
                        >
                          <td className="py-2 pr-2">
                            {hasErrors ? (
                              isExpanded ? (
                                <ChevronDown className="h-3 w-3 text-slate-400" />
                              ) : (
                                <ChevronRight className="h-3 w-3 text-slate-500" />
                              )
                            ) : (
                              <span className="inline-block w-3" />
                            )}
                          </td>
                          <td className="py-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs text-slate-300">{fn.name}</span>
                              {fn.critical && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1 py-0 bg-red-500/20 text-red-300 border-red-500/30"
                                >
                                  CRITICO
                                </Badge>
                              )}
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1 py-0 bg-slate-800 text-slate-400 border-slate-700"
                              >
                                {CATEGORY_LABELS[fn.category]}
                              </Badge>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[320px]">
                              {fn.description}
                            </p>
                          </td>
                          <td className="py-2">
                            <PingBadge name={fn.name} />
                          </td>
                          <td className="py-2">
                            <StatusIcon status={fn.lastStatus} />
                          </td>
                          <td className="py-2 text-slate-500 text-xs hidden md:table-cell">
                            {fn.lastRun
                              ? format(new Date(fn.lastRun), 'dd MMM HH:mm', { locale: es })
                              : fn.logsHealth
                                ? 'Sin datos'
                                : 'N/A'}
                          </td>
                          <td className="py-2 text-xs text-slate-300 hidden lg:table-cell">
                            {fn.avgLatencyMs != null ? `${fn.avgLatencyMs}ms` : '\u2014'}
                          </td>
                          <td className="py-2">
                            {fn.errorsLast24h > 0 ? (
                              <Badge
                                variant="outline"
                                className="text-xs bg-red-500/20 text-red-300 border-red-500/30"
                              >
                                {fn.errorsLast24h}
                              </Badge>
                            ) : (
                              <span className="text-xs text-green-400">0</span>
                            )}
                          </td>
                          <td className="py-2 pl-2 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                runPingOne(fn.name);
                              }}
                              className="text-[10px] text-indigo-400 hover:text-indigo-300 px-2 py-0.5 rounded border border-slate-700 hover:border-indigo-500/50"
                            >
                              ping
                            </button>
                          </td>
                        </tr>
                        {isExpanded && hasErrors && (
                          <tr className="bg-slate-900/50">
                            <td colSpan={8} className="px-4 py-3">
                              <p className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-2">
                                <AlertTriangle className="h-3 w-3 text-amber-400" />
                                Ultimos {fn.recentErrors.length} errores (error_logs)
                              </p>
                              <div className="space-y-1.5">
                                {fn.recentErrors.map((err) => (
                                  <div
                                    key={err.id}
                                    className="flex items-start gap-3 text-xs bg-slate-900 border border-slate-800 rounded px-2 py-1.5"
                                  >
                                    <span className="text-slate-500 font-mono whitespace-nowrap">
                                      {format(new Date(err.created_at), 'dd MMM HH:mm', {
                                        locale: es,
                                      })}
                                    </span>
                                    <span
                                      className={cn(
                                        'font-mono text-[10px] px-1 rounded',
                                        err.severity === 'critical'
                                          ? 'bg-red-500/20 text-red-300'
                                          : err.severity === 'warning'
                                            ? 'bg-yellow-500/20 text-yellow-300'
                                            : 'bg-orange-500/20 text-orange-300'
                                      )}
                                    >
                                      {err.severity}
                                    </span>
                                    <p className="text-slate-300 break-all flex-1">{err.message}</p>
                                    {err.resolved && (
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] px-1 py-0 bg-green-500/10 text-green-400 border-green-500/30"
                                      >
                                        resuelto
                                      </Badge>
                                    )}
                                  </div>
                                ))}
                              </div>
                              <p className="text-[10px] text-slate-500 mt-2">
                                Para mas detalle ve a Sistema &rarr; Errores y filtra por{' '}
                                <span className="font-mono">{fn.name}</span>.
                              </p>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
              {filteredRows.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-8">
                  No hay funciones en esta categoria.
                </p>
              )}
            </div>
          )}
          <p className="text-[10px] text-slate-600 mt-3">
            Solo las 5 funciones IA registran historial (usan{' '}
            <span className="font-mono">logEdgeFunctionCall</span>). Para el resto, usa el ping en
            vivo o revisa errores en <span className="font-mono">error_logs</span>.
          </p>
        </CardContent>
      </Card>

      {/* AI Usage */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-white">
            <Zap className="h-4 w-4" />
            Uso de IA hoy
          </CardTitle>
          <CardDescription className="text-slate-400">Cuota consumida por skill</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingAi ? (
            <Skeleton className="h-20 w-full bg-slate-800" />
          ) : (aiUsage ?? []).length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">Sin uso de IA hoy</p>
          ) : (
            <div className="space-y-2">
              {(aiUsage ?? []).map((skill) => (
                <div
                  key={skill.skill}
                  className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0"
                >
                  <span className="font-mono text-xs text-slate-300">{skill.skill}</span>
                  <div className="flex items-center gap-3">
                    {skill.lastUsed && (
                      <span className="text-slate-500 text-xs">
                        {format(new Date(skill.lastUsed), 'HH:mm', { locale: es })}
                      </span>
                    )}
                    <Badge
                      variant="outline"
                      className="text-xs bg-slate-800 text-slate-200 border-slate-700"
                    >
                      {skill.used}
                    </Badge>
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
