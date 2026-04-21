/**
 * AdminSystemHealth — helpers puros.
 * Extraido de AdminSystemHealth.tsx (E.2 auditoria top-tier 2026-04-20).
 */
import {
  AI_EDGE_FUNCTIONS,
  type FunctionRow,
  type HealthLabel,
  type HealthLogEntry,
  type TrafficSignal,
} from './constants';

/**
 * Distingue fallas reales del servidor de errores de cliente (4xx).
 * - timeout / exception sin http_status → falla real
 * - http_status >= 500 → falla real
 * - http_status 4xx → error de cliente (rate limit, input invalido) — no es falla
 * - status !== 'error' → no es falla
 */
export function isRealFailure(entry: HealthLogEntry): boolean {
  if (entry.status === 'timeout') return true;
  if (entry.status !== 'error') return false;
  const metadata = entry.metadata as Record<string, unknown> | null | undefined;
  const httpStatus = metadata?.http_status;
  if (httpStatus == null) return true; // excepcion sin status → real
  if (typeof httpStatus === 'number' && httpStatus >= 500) return true;
  return false;
}

export function isClientError(entry: HealthLogEntry): boolean {
  if (entry.status !== 'error') return false;
  const metadata = entry.metadata as Record<string, unknown> | null | undefined;
  const httpStatus = metadata?.http_status;
  return typeof httpStatus === 'number' && httpStatus >= 400 && httpStatus < 500;
}

// ─── Supabase dashboard link (extrae project ref del URL) ─────────────────
export function getSupabaseLogsUrl(fnName: string): string | null {
  const base = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  if (!base) return null;
  const match = base.match(/https?:\/\/([^.]+)\.supabase\.co/);
  const ref = match?.[1];
  if (!ref) return null;
  return `https://supabase.com/dashboard/project/${ref}/functions/${fnName}/logs`;
}

// ─── Health score 0-100 (espejo de auditExport.ts) ────────────────────────
export function calculateRowScore(row: FunctionRow): { score: number; label: HealthLabel } {
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

// ─── Traffic semantics ────────────────────────────────────────────────────
export function getTrafficSignal(row: FunctionRow): TrafficSignal {
  if (row.errorsLast24h > 0) return 'failing';
  if (row.executionsLast24h > 0) return 'healthy';
  if (row.lastRun) return 'idle';
  return 'never';
}

// ─── Diagnostic text builder (pega en Claude) ─────────────────────────────
export function buildDiagnosticText(row: FunctionRow): string {
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

export function buildBulkDiagnostic(rows: FunctionRow[]): string {
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

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
