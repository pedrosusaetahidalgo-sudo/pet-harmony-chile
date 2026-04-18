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
  Copy,
  ExternalLink,
} from '@/lib/icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ─── Catalogo completo de edge functions (35) ──────────────────────────────
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
    logsHealth: true,
    description: 'Crea suscripcion Premium en Flow.cl',
  },
  {
    name: 'flow-webhook',
    category: 'payments',
    critical: true,
    logsHealth: true,
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
    logsHealth: true,
    description: 'Tips por raza (IA)',
  },
  {
    name: 'bereavement-assistant',
    category: 'ai',
    critical: false,
    logsHealth: true,
    description: 'Asistente empatico memorial',
  },
  {
    name: 'medical-suggestions',
    category: 'ai',
    critical: false,
    logsHealth: true,
    description: 'Sugerencias medicas IA',
  },
  {
    name: 'ocr-vaccination-card',
    category: 'ai',
    critical: false,
    logsHealth: true,
    description: 'OCR carnet vacunacion',
  },
  {
    name: 'process-consultation-transcript',
    category: 'ai',
    critical: false,
    logsHealth: true,
    description: 'Transcripcion audio consulta',
  },
  // Medical / PDF (criticos: joya de la corona)
  {
    name: 'generate-medical-summary',
    category: 'medical',
    critical: true,
    logsHealth: true,
    description: 'Ficha medica PDF descargable',
  },
  {
    name: 'generate-medical-zip',
    category: 'medical',
    critical: false,
    logsHealth: true,
    description: 'ZIP documentos medicos',
  },
  {
    name: 'generate-vet-patient-summary',
    category: 'medical',
    critical: false,
    logsHealth: true,
    description: 'Resumen consolidado pacientes vet',
  },
  // Google Calendar
  {
    name: 'google-calendar-oauth-init',
    category: 'google',
    critical: false,
    logsHealth: true,
    description: 'Inicia OAuth Google Calendar',
  },
  {
    name: 'google-calendar-callback',
    category: 'google',
    critical: false,
    logsHealth: true,
    description: 'Callback OAuth Google',
  },
  {
    name: 'google-calendar-sync',
    category: 'google',
    critical: false,
    logsHealth: true,
    description: 'Sync eventos Google Calendar',
  },
  {
    name: 'google-calendar-disconnect',
    category: 'google',
    critical: false,
    logsHealth: true,
    description: 'Desconectar Google Calendar',
  },
  // Cron jobs
  {
    name: 'reminder-cron',
    category: 'cron',
    critical: true,
    logsHealth: true,
    description: 'Cron recordatorios (1x/dia)',
  },
  {
    name: 'booking-reminders-cron',
    category: 'cron',
    critical: false,
    logsHealth: true,
    description: 'Cron reservas proximas',
  },
  {
    name: 'generate-weekly-owner-reports',
    category: 'cron',
    critical: false,
    logsHealth: true,
    description: 'Reporte semanal dueno',
  },
  {
    name: 'generate-weekly-vet-reports',
    category: 'cron',
    critical: false,
    logsHealth: true,
    description: 'Reporte semanal vet',
  },
  {
    name: 'generate-sitemap',
    category: 'cron',
    critical: false,
    logsHealth: true,
    description: 'Genera sitemap SEO',
  },
  {
    name: 'generate-shelters',
    category: 'cron',
    critical: false,
    logsHealth: true,
    description: 'Genera data refugios',
  },
  {
    name: 'audit-cron-daily',
    category: 'cron',
    critical: false,
    logsHealth: true,
    description: 'Snapshot diario salud + auto-fixers',
  },
  // Onboarding / provider
  {
    name: 'create-patient',
    category: 'onboarding',
    critical: false,
    logsHealth: true,
    description: 'Vet crea paciente + Paw Card',
  },
  {
    name: 'send-pet-invitation',
    category: 'onboarding',
    critical: false,
    logsHealth: true,
    description: 'Invitar dueno a gestionar mascota',
  },
  {
    name: 'send-lead-outreach',
    category: 'onboarding',
    critical: false,
    logsHealth: true,
    description: 'Outreach leads vets (email/WA)',
  },
  // Moderacion
  {
    name: 'verify-service-provider',
    category: 'moderation',
    critical: false,
    logsHealth: true,
    description: 'Verificacion IA proveedor',
  },
  {
    name: 'verify-vet-document',
    category: 'moderation',
    critical: false,
    logsHealth: true,
    description: 'Verificacion IA documento vet',
  },
  {
    name: 'moderate-service-promotion',
    category: 'moderation',
    critical: false,
    logsHealth: true,
    description: 'Modera promociones',
  },
  // Notificaciones
  {
    name: 'send-whatsapp-reminder',
    category: 'notifications',
    critical: false,
    logsHealth: true,
    description: 'WhatsApp (pend. verif. Meta)',
  },
  // Sistema
  {
    name: 'log-error',
    category: 'system',
    critical: false,
    logsHealth: true,
    description: 'Error logging centralizado',
  },
  {
    name: 'feedback-admin',
    category: 'system',
    critical: false,
    logsHealth: true,
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
  errorsLast24h: number; // fallas reales (5xx, timeouts, excepciones)
  clientErrorsLast24h: number; // 4xx (rate limit, input invalido) — NO son fallas
  executionsLast24h: number;
  recentErrors: ErrorEntry[];
}

/**
 * Distingue fallas reales del servidor de errores de cliente (4xx).
 * - timeout / exception sin http_status → falla real
 * - http_status >= 500 → falla real
 * - http_status 4xx → error de cliente (rate limit, input invalido) — no es falla
 * - status !== 'error' → no es falla
 */
type HealthLogEntry = Record<string, unknown>;

function isRealFailure(entry: HealthLogEntry): boolean {
  if (entry.status === 'timeout') return true;
  if (entry.status !== 'error') return false;
  const metadata = entry.metadata as Record<string, unknown> | null | undefined;
  const httpStatus = metadata?.http_status;
  if (httpStatus == null) return true; // excepcion sin status → real
  if (typeof httpStatus === 'number' && httpStatus >= 500) return true;
  return false;
}

function isClientError(entry: HealthLogEntry): boolean {
  if (entry.status !== 'error') return false;
  const metadata = entry.metadata as Record<string, unknown> | null | undefined;
  const httpStatus = metadata?.http_status;
  return typeof httpStatus === 'number' && httpStatus >= 400 && httpStatus < 500;
}

// ─── Supabase dashboard link (extrae project ref del URL) ─────────────────
function getSupabaseLogsUrl(fnName: string): string | null {
  const base = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  if (!base) return null;
  const match = base.match(/https?:\/\/([^.]+)\.supabase\.co/);
  const ref = match?.[1];
  if (!ref) return null;
  return `https://supabase.com/dashboard/project/${ref}/functions/${fnName}/logs`;
}

// ─── Health score por fn (espejo de auditExport.ts) ─────────────────────
// Calcula 0-100 que responde "esta fn esta cumpliendo su funcion?".
const AI_EDGE_FUNCTIONS = new Set([
  'consultation-prep',
  'symptom-triage',
  'generate-vet-patient-summary',
  'generate-medical-summary',
  'bereavement-assistant',
  'pet-assistant',
  'medical-suggestions',
  'breed-tips',
  'moderate-service-promotion',
  'ocr-vaccination-card',
  'verify-service-provider',
  'verify-vet-document',
  'process-consultation-transcript',
]);

type HealthLabel = 'healthy' | 'ok' | 'degraded' | 'failing' | 'unused';

function calculateRowScore(row: FunctionRow): { score: number; label: HealthLabel } {
  const isAI = AI_EDGE_FUNCTIONS.has(row.name);
  const latencyThreshold = isAI ? 8000 : 3000;
  const hasAnySignal = row.executionsLast24h > 0 || row.lastRun !== null;

  if (!hasAnySignal) return { score: 0, label: 'unused' };

  // 50 pts confiabilidad
  let reliability = 50;
  if (row.executionsLast24h > 0) {
    const successRate = 1 - row.errorsLast24h / row.executionsLast24h;
    reliability = Math.round(50 * Math.max(0, successRate));
  } else if (row.lastStatus === 'error') {
    reliability = 25;
  }

  // 30 pts latencia (solo si hay trafico)
  let latency = 30;
  if (row.avgLatencyMs != null && row.executionsLast24h > 0) {
    const ratio = row.avgLatencyMs / latencyThreshold;
    if (ratio <= 1) latency = 30;
    else if (ratio <= 2) latency = Math.round(30 * (2 - ratio));
    else latency = 0;
  }

  // 20 pts actividad / viveza
  let activity = 20;
  if (row.executionsLast24h === 0 && row.lastRun) {
    const hoursSinceLastRun = (Date.now() - new Date(row.lastRun).getTime()) / 3600_000;
    if (hoursSinceLastRun > 168) activity = 5;
    else if (hoursSinceLastRun > 48) activity = 10;
    else activity = 15;
  }

  const score = Math.max(0, Math.min(100, reliability + latency + activity));
  const label: HealthLabel =
    score >= 90 ? 'healthy' : score >= 70 ? 'ok' : score >= 40 ? 'degraded' : 'failing';
  return { score, label };
}

// ─── Traffic semantics (reemplaza ping OPTIONS) ───────────────────────────
type TrafficSignal = 'healthy' | 'failing' | 'idle' | 'never';

function getTrafficSignal(row: FunctionRow): TrafficSignal {
  if (row.errorsLast24h > 0) return 'failing';
  if (row.executionsLast24h > 0) return 'healthy';
  if (row.lastRun) return 'idle';
  return 'never';
}

// ─── Diagnostic text builder (pega en Claude) ─────────────────────────────
function buildDiagnosticText(row: FunctionRow): string {
  const { score, label } = calculateRowScore(row);
  const lines: string[] = [];
  lines.push(`EDGE FUNCTION: ${row.name}`);
  lines.push(`Categoria: ${row.category}${row.critical ? ' (CRITICO)' : ''}`);
  lines.push(`Descripcion: ${row.description}`);
  lines.push(`Health score: ${score}/100 (${label})`);
  lines.push('');
  lines.push('--- TELEMETRIA ULTIMAS 24h ---');
  lines.push(`Invocaciones: ${row.executionsLast24h}`);
  lines.push(`Fallas reales (5xx/timeout/excepcion): ${row.errorsLast24h}`);
  lines.push(`Client errors (4xx rate-limit/input invalido): ${row.clientErrorsLast24h}`);
  lines.push(`Latencia promedio: ${row.avgLatencyMs != null ? `${row.avgLatencyMs}ms` : 'N/D'}`);
  lines.push(`Ultimo estado: ${row.lastStatus}`);
  lines.push(`Ultima ejecucion: ${row.lastRun ? new Date(row.lastRun).toISOString() : 'nunca'}`);

  if (row.recentErrors.length > 0) {
    lines.push('');
    lines.push(`--- ULTIMOS ${row.recentErrors.length} ERRORES ---`);
    for (const err of row.recentErrors) {
      lines.push('');
      lines.push(`[${err.created_at}] ${err.severity}${err.resolved ? ' (resuelto)' : ''}`);
      lines.push(err.message);
      if (err.context && Object.keys(err.context).length > 0) {
        lines.push(`context: ${JSON.stringify(err.context)}`);
      }
    }
  }
  return lines.join('\n');
}

function buildBulkDiagnostic(rows: FunctionRow[]): string {
  const failing = rows.filter((r) => r.errorsLast24h > 0 || r.lastStatus === 'error');
  const idle = rows.filter((r) => r.executionsLast24h === 0 && r.lastStatus !== 'error');
  const healthy = rows.filter((r) => r.executionsLast24h > 0 && r.errorsLast24h === 0);
  // Score promedio solo de fns con telemetria (excluye 'unused').
  const scored = rows.map((r) => calculateRowScore(r)).filter((s) => s.label !== 'unused');
  const avgScore =
    scored.length > 0 ? Math.round(scored.reduce((sum, s) => sum + s.score, 0) / scored.length) : 0;
  const header = [
    `DIAGNOSTICO EDGE FUNCTIONS — ${new Date().toISOString()}`,
    `Total: ${rows.length} | Con errores: ${failing.length} | Healthy: ${healthy.length} | Sin trafico 24h: ${idle.length}`,
    `Health score promedio (fns con telemetria): ${avgScore}/100`,
    '',
  ].join('\n');
  // Todas las fns en orden: fallando primero, luego por score ascendente.
  const ordered = [...rows].sort((a, b) => {
    const scoreA = calculateRowScore(a).score;
    const scoreB = calculateRowScore(b).score;
    return scoreA - scoreB;
  });
  return header + ordered.map(buildDiagnosticText).join('\n\n========================\n\n');
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// ─── Component ────────────────────────────────────────────────────────────
export default function AdminSystemHealth() {
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  const [expandedFn, setExpandedFn] = useState<string | null>(null);
  const [copiedFn, setCopiedFn] = useState<string | null>(null);
  // Ping manual: estado por nombre de edge fn. Usa CORS preflight OPTIONS
  // para validar que la fn este deployada sin invocarla ni gastar tokens IA.
  const [pingState, setPingState] = useState<
    Record<string, { status: 'pinging' | 'ok' | 'error'; ms?: number; detail?: string }>
  >({});
  const [pingingAll, setPingingAll] = useState(false);

  const SUPABASE_URL =
    import.meta.env.VITE_SUPABASE_URL || 'https://gwailbjlvevkhwcrovfd.supabase.co';
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  // Timeout por categoria: las fns IA tienen cold starts de 5-10s,
  // las de sistema/cron responden <2s. Asi cada fn se evalua segun
  // su perfil natural, no un timeout uniforme injusto.
  const pingTimeoutByCategory = (cat: Category): number => {
    switch (cat) {
      case 'ai':
        return 15000;
      case 'medical':
      case 'google':
      case 'notifications':
        return 10000;
      default:
        return 6000;
    }
  };

  const pingFunction = useCallback(
    async (name: string): Promise<{ status: 'ok' | 'error'; ms: number; detail?: string }> => {
      const meta = EDGE_FUNCTIONS.find((f) => f.name === name);
      const timeoutMs = meta ? pingTimeoutByCategory(meta.category) : 8000;

      const attemptOnce = async (): Promise<Response> => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        try {
          return await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
            method: 'OPTIONS',
            headers: {
              'Access-Control-Request-Method': 'POST',
              'Access-Control-Request-Headers': 'content-type,authorization,apikey',
              ...(SUPABASE_ANON_KEY ? { apikey: SUPABASE_ANON_KEY } : {}),
            },
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeoutId);
        }
      };

      const t0 = Date.now();
      // 1 retry ante network flaky / cold start. Total max ~2x timeoutMs.
      let lastErr: unknown = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const res = await attemptOnce();
          const ms = Date.now() - t0;

          // Interpretacion de status (health check, no auth check):
          //   2xx/204 → fn responde OPTIONS (deployada).
          //   401/403 → fn existe pero exige JWT (verify_jwt: true). OK.
          //   404 → fn NO deployada (error real).
          //   5xx en 1er intento → retry. Si persiste, error.
          if (res.ok || res.status === 401 || res.status === 403) {
            return { status: 'ok', ms };
          }
          if (res.status === 404) {
            return { status: 'error', ms, detail: 'Not deployed (404)' };
          }
          // 5xx: reintentar una vez
          if (res.status >= 500 && attempt === 0) {
            lastErr = new Error(`HTTP ${res.status}`);
            continue;
          }
          return { status: 'error', ms, detail: `HTTP ${res.status}` };
        } catch (err) {
          lastErr = err;
          // Network/timeout → reintentar una vez
          if (attempt === 0) continue;
          break;
        }
      }
      return {
        status: 'error',
        ms: Date.now() - t0,
        detail: lastErr instanceof Error ? lastErr.message : 'Network error',
      };
    },
    [SUPABASE_URL, SUPABASE_ANON_KEY]
  );

  const handlePingOne = useCallback(
    async (name: string) => {
      setPingState((prev) => ({ ...prev, [name]: { status: 'pinging' } }));
      const result = await pingFunction(name);
      setPingState((prev) => ({ ...prev, [name]: result }));
    },
    [pingFunction]
  );

  const handlePingAll = useCallback(async () => {
    setPingingAll(true);
    // Inicializa todas como "pinging"
    const names = EDGE_FUNCTIONS.map((f) => f.name);
    setPingState(Object.fromEntries(names.map((n) => [n, { status: 'pinging' as const }])));
    // Corre en paralelo con limite de concurrencia 5 para no saturar
    const concurrency = 5;
    let idx = 0;
    const workers = Array.from({ length: concurrency }).map(async () => {
      while (idx < names.length) {
        const i = idx++;
        const n = names[i];
        const result = await pingFunction(n);
        setPingState((prev) => ({ ...prev, [n]: result }));
      }
    });
    await Promise.all(workers);
    setPingingAll(false);
    const results = Object.values(pingState);
    const ok = results.filter((r) => r?.status === 'ok').length;
    toast.success(`Ping completado: ${ok}/${names.length} respondieron OK`);
  }, [pingFunction, pingState]);

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
          .select('function_name, status, execution_time_ms, error_message, metadata, created_at')
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
          clientErrorsLast24h: 0,
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
            clientErrorsLast24h: 0,
            executionsLast24h: 0,
            recentErrors: [],
          };
          rowMap.set(fn, row);
        }
        if (!row.lastRun) {
          // lastStatus refleja fallas reales (4xx no es falla)
          row.lastStatus = isRealFailure(entry)
            ? 'error'
            : entry.status === 'timeout'
              ? 'timeout'
              : 'success';
          row.lastRun = entry.created_at;
        }
        const t = new Date(entry.created_at).getTime();
        if (t >= dayAgo) {
          row.executionsLast24h++;
          if (isRealFailure(entry)) row.errorsLast24h++;
          else if (isClientError(entry)) row.clientErrorsLast24h++;
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
      // Filtra 4xx (rate limits, input invalido del cliente) — no son fallas reales
      for (const err of errorEntries) {
        const ctx = (err.context as Record<string, unknown> | null) ?? null;
        const ctxFn = ctx?.function_name as string | undefined;
        let fnName = ctxFn;
        if (!fnName && typeof err.message === 'string') {
          const prefix = err.message.split(':')[0]?.trim();
          if (prefix && rowMap.has(prefix)) fnName = prefix;
        }
        if (!fnName) continue;
        const row = rowMap.get(fnName);
        if (!row) continue;

        // Filtrar 4xx: viene del context.http_status o se detecta por message "HTTP 4xx"
        const httpStatus = ctx?.http_status;
        const is4xxByStatus =
          typeof httpStatus === 'number' && httpStatus >= 400 && httpStatus < 500;
        const is4xxByMessage =
          typeof err.message === 'string' && /\bHTTP 4\d\d\b/.test(err.message);
        if (is4xxByStatus || is4xxByMessage) continue;

        if (row.recentErrors.length < 10) {
          row.recentErrors.push({
            id: err.id,
            message: err.message,
            created_at: err.created_at,
            context: ctx ?? {},
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

  // Copiar diagnostico individual
  const copyOne = useCallback(async (row: FunctionRow) => {
    const text = buildDiagnosticText(row);
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedFn(row.name);
      toast.success(`Diagnostico de ${row.name} copiado`);
      setTimeout(() => setCopiedFn((c) => (c === row.name ? null : c)), 2000);
    } else {
      toast.error('No se pudo copiar al clipboard');
    }
  }, []);

  // Copia TODAS las edge fns al clipboard en markdown (fallando primero,
  // luego healthy, luego idle). Listo para pegar en Claude para auditoria.
  const copyAllFailing = useCallback(async () => {
    const rows = healthData ?? [];
    const text = buildBulkDiagnostic(rows);
    const ok = await copyToClipboard(text);
    if (ok) {
      const failing = rows.filter((r) => r.errorsLast24h > 0 || r.lastStatus === 'error').length;
      toast.success(
        failing > 0
          ? `${rows.length} fns copiadas (${failing} con errores al inicio)`
          : `${rows.length} fns copiadas — todas healthy o idle`
      );
    } else {
      toast.error('No se pudo copiar al clipboard');
    }
  }, [healthData]);

  const totalErrors = (healthData ?? []).reduce((s, f) => s + f.errorsLast24h, 0);
  const criticalErrors = (healthData ?? []).filter((f) => f.critical && f.errorsLast24h > 0);
  const healthyCount = (healthData ?? []).filter(
    (f) => f.executionsLast24h > 0 && f.errorsLast24h === 0
  ).length;
  const idleCount = (healthData ?? []).filter((f) => f.executionsLast24h === 0).length;
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

  // Badge de health score 0-100: la UI principal que dice si la fn
  // esta cumpliendo o no. Usa la misma formula que el audit export.
  const ScoreBadge = ({ row }: { row: FunctionRow }) => {
    const { score, label } = calculateRowScore(row);
    if (label === 'unused') {
      return (
        <span className="text-[10px] text-slate-600" title="Sin trafico ni telemetria historica">
          unused
        </span>
      );
    }
    const className =
      label === 'healthy'
        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
        : label === 'ok'
          ? 'bg-green-500/20 text-green-300 border-green-500/30'
          : label === 'degraded'
            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
            : 'bg-red-500/20 text-red-300 border-red-500/30';
    return (
      <Badge
        variant="outline"
        className={cn('text-[10px] px-1.5 py-0 font-mono', className)}
        title={`Score ${score}/100 — ${label}. Confiabilidad + latencia + actividad.`}
      >
        {score}/100 {label}
      </Badge>
    );
  };

  const TrafficBadge = ({ row }: { row: FunctionRow }) => {
    const signal = getTrafficSignal(row);
    if (signal === 'failing') {
      return (
        <Badge
          variant="outline"
          className="text-[10px] px-1.5 py-0 bg-red-500/20 text-red-300 border-red-500/30"
          title={`${row.executionsLast24h} invocaciones, ${row.errorsLast24h} errores`}
        >
          {row.executionsLast24h} calls · {row.errorsLast24h} err
        </Badge>
      );
    }
    if (signal === 'healthy') {
      const clientErrSuffix =
        row.clientErrorsLast24h > 0 ? ` (${row.clientErrorsLast24h} · 4xx)` : '';
      return (
        <Badge
          variant="outline"
          className="text-[10px] px-1.5 py-0 bg-green-500/20 text-green-300 border-green-500/30"
          title={`${row.executionsLast24h} invocaciones, ${row.clientErrorsLast24h} client errors (4xx — no son fallas)`}
        >
          {row.executionsLast24h} calls{clientErrSuffix}
        </Badge>
      );
    }
    if (signal === 'idle') {
      return (
        <span className="text-[10px] text-slate-500" title="Sin trafico en las ultimas 24h">
          sin trafico 24h
        </span>
      );
    }
    return (
      <span className="text-[10px] text-slate-600" title="Nunca se ha invocado post-deploy">
        nunca invocada
      </span>
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
              <span className="text-sm font-medium text-slate-300">Con trafico 24h</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-white">
              {healthyCount}
              <span className="text-sm text-slate-500 font-normal"> /{EDGE_FUNCTIONS.length}</span>
            </p>
            <p className="text-xs text-slate-500">
              {idleCount > 0 ? `${idleCount} sin invocar en 24h` : 'todas con actividad'}
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
                Telemetria real (system_health_log). {EDGE_FUNCTIONS.length} funciones catalogadas.
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
                variant="outline"
                onClick={handlePingAll}
                disabled={pingingAll}
                className="border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                title="Valida via CORS preflight que cada fn este deployada. No invoca ni gasta tokens."
              >
                <Radio className={cn('h-3 w-3 mr-1.5', pingingAll && 'animate-pulse')} />
                {pingingAll ? 'Pingeando...' : 'Ping todas'}
              </Button>
              <Button
                size="sm"
                onClick={copyAllFailing}
                disabled={loadingHealth}
                className="bg-indigo-600 hover:bg-indigo-500 text-white"
                title="Copia TODAS las edge fns al clipboard en markdown — listo para pegar en Claude"
              >
                <Copy className="h-3 w-3 mr-1.5" />
                Copiar fallas
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
                    <th
                      scope="col"
                      className="pb-2 pr-2 font-medium text-slate-400 uppercase text-xs w-6"
                    >
                      <span className="sr-only">Expandir</span>
                    </th>
                    <th scope="col" className="pb-2 font-medium text-slate-400 uppercase text-xs">
                      Funcion
                    </th>
                    <th scope="col" className="pb-2 font-medium text-slate-400 uppercase text-xs">
                      Trafico 24h
                    </th>
                    <th scope="col" className="pb-2 font-medium text-slate-400 uppercase text-xs">
                      Estado
                    </th>
                    <th
                      scope="col"
                      className="pb-2 font-medium text-slate-400 uppercase text-xs hidden md:table-cell"
                    >
                      Ultima ejec.
                    </th>
                    <th
                      scope="col"
                      className="pb-2 font-medium text-slate-400 uppercase text-xs hidden lg:table-cell"
                    >
                      Latencia
                    </th>
                    <th scope="col" className="pb-2 font-medium text-slate-400 uppercase text-xs">
                      Err 24h
                    </th>
                    <th
                      scope="col"
                      className="pb-2 pl-2 font-medium text-slate-400 uppercase text-xs text-right"
                    >
                      <span className="sr-only">Acciones</span>
                    </th>
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
                            <div className="flex flex-col gap-1">
                              <TrafficBadge row={fn} />
                              <ScoreBadge row={fn} />
                            </div>
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
                            <div className="flex items-center gap-1 justify-end">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePingOne(fn.name);
                                }}
                                disabled={pingState[fn.name]?.status === 'pinging'}
                                className={cn(
                                  'text-[10px] px-2 py-0.5 rounded border flex items-center gap-1',
                                  pingState[fn.name]?.status === 'ok'
                                    ? 'text-green-400 border-green-500/40 hover:border-green-500/60'
                                    : pingState[fn.name]?.status === 'error'
                                      ? 'text-red-400 border-red-500/40 hover:border-red-500/60'
                                      : 'text-slate-400 border-slate-700 hover:border-slate-500 hover:text-slate-200'
                                )}
                                title={
                                  pingState[fn.name]?.status === 'ok'
                                    ? `OK ${pingState[fn.name]?.ms}ms`
                                    : pingState[fn.name]?.status === 'error'
                                      ? `Error: ${pingState[fn.name]?.detail}`
                                      : 'Verificar que la fn este deployada (CORS preflight)'
                                }
                              >
                                <Radio
                                  className={cn(
                                    'h-3 w-3',
                                    pingState[fn.name]?.status === 'pinging' && 'animate-pulse'
                                  )}
                                />
                                {pingState[fn.name]?.status === 'pinging'
                                  ? '...'
                                  : pingState[fn.name]?.status === 'ok'
                                    ? `${pingState[fn.name]?.ms}ms`
                                    : pingState[fn.name]?.status === 'error'
                                      ? 'error'
                                      : 'ping'}
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyOne(fn);
                                }}
                                className="text-[10px] text-indigo-400 hover:text-indigo-300 px-2 py-0.5 rounded border border-slate-700 hover:border-indigo-500/50 flex items-center gap-1"
                                title="Copiar diagnostico al clipboard"
                              >
                                {copiedFn === fn.name ? (
                                  <>
                                    <CheckCircle className="h-3 w-3 text-green-400" />
                                    copiado
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3 w-3" />
                                    copiar
                                  </>
                                )}
                              </button>
                              {getSupabaseLogsUrl(fn.name) && (
                                <a
                                  href={getSupabaseLogsUrl(fn.name) ?? '#'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-[10px] text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded border border-slate-700 hover:border-slate-500 flex items-center gap-1"
                                  title="Abrir logs en Supabase Dashboard"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  logs
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                        {isExpanded && hasErrors && (
                          // eslint-disable-next-line jsx-a11y/control-has-associated-label -- <tr> no es control; falso positivo
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
            Las {EDGE_FUNCTIONS.length} funciones registran telemetria al invocarse (wrapper{' '}
            <span className="font-mono">withTelemetry</span> en{' '}
            <span className="font-mono">_shared/telemetry.ts</span>). "Sin trafico 24h" significa
            que nadie la uso — no implica que este rota. Usa "copiar" para pegar el diagnostico en
            Claude y "logs" para el dashboard de Supabase.
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
