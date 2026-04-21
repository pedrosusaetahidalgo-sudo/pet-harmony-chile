import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNowStrict } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, CheckCircle, ExternalLink } from '@/lib/icons';
import { cn } from '@/lib/utils';

/**
 * ConstraintViolationsWidget — Prevención #3 (auditoría top-tier
 * 2026-04-21). Detecta en tiempo real violaciones de CHECK / FK / UNIQUE
 * en la DB para que Pedro sepa si un deploy rompió algo.
 *
 * Lee de `error_logs` los últimos 7 días buscando patrones Postgres:
 *   - "violates check constraint"  (CHECK falla, código 23514)
 *   - "violates foreign key"       (FK falla, 23503)
 *   - "violates not-null"          (NOT NULL viola, 23502)
 *   - "duplicate key value"        (unique viola, 23505)
 *
 * Agrupa por mensaje normalizado y muestra count por 24h / 7d.
 * Si la última 24h tiene >0, alerta roja.
 */

interface ErrorRow {
  id: string;
  message: string;
  created_at: string;
  source: string;
  resolved: boolean;
  context: Record<string, unknown> | null;
}

const VIOLATION_PATTERNS = [
  { pattern: /violates check constraint "(\w+)"/i, type: 'CHECK', code: '23514' },
  { pattern: /violates foreign key constraint "(\w+)"/i, type: 'FK', code: '23503' },
  { pattern: /violates not-null constraint/i, type: 'NOT NULL', code: '23502' },
  {
    pattern: /duplicate key value violates unique constraint "(\w+)"/i,
    type: 'UNIQUE',
    code: '23505',
  },
  { pattern: /column "(\w+)".*does not exist/i, type: 'MISSING COL', code: '42703' },
  { pattern: /relation "(\w+)".*does not exist/i, type: 'MISSING TABLE', code: '42P01' },
];

function classifyError(message: string): { type: string; constraint: string | null } | null {
  for (const p of VIOLATION_PATTERNS) {
    const m = message.match(p.pattern);
    if (m) {
      return { type: p.type, constraint: m[1] ?? null };
    }
  }
  return null;
}

function shortMessage(msg: string): string {
  // Truncar messages largos para UI; dejar el inicio identificable.
  return msg.length > 140 ? msg.slice(0, 140) + '…' : msg;
}

export function ConstraintViolationsWidget() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-constraint-violations'],
    staleTime: 60_000,
    queryFn: async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('error_logs')
        .select('id, message, created_at, source, resolved, context')
        .gte('created_at', sevenDaysAgo)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      return (data ?? []) as ErrorRow[];
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-56" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="p-4 flex items-center gap-2 text-amber-600 text-sm">
          <AlertTriangle className="h-4 w-4" />
          No pude leer error_logs. Revisá permisos admin_access.
        </CardContent>
      </Card>
    );
  }

  const allRows = data ?? [];

  // Clasificar y agrupar por (type, constraint)
  const groups = new Map<
    string,
    { type: string; constraint: string | null; count24h: number; count7d: number; sample: ErrorRow }
  >();
  const day24h = Date.now() - 24 * 60 * 60 * 1000;

  for (const r of allRows) {
    const cls = classifyError(r.message);
    if (!cls) continue;
    const key = `${cls.type}::${cls.constraint ?? '?'}`;
    const existing = groups.get(key);
    const is24h = new Date(r.created_at).getTime() >= day24h;
    if (existing) {
      existing.count7d += 1;
      if (is24h) existing.count24h += 1;
    } else {
      groups.set(key, {
        type: cls.type,
        constraint: cls.constraint,
        count24h: is24h ? 1 : 0,
        count7d: 1,
        sample: r,
      });
    }
  }

  const ordered = Array.from(groups.values()).sort(
    (a, b) => b.count24h - a.count24h || b.count7d - a.count7d
  );
  const total24h = ordered.reduce((sum, g) => sum + g.count24h, 0);
  const total7d = ordered.reduce((sum, g) => sum + g.count7d, 0);

  // Estado sano: sin violaciones en 7 días
  if (ordered.length === 0) {
    return (
      <Card className="border-emerald-500/30 bg-emerald-500/5">
        <CardContent className="p-4 flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-sm">
          <CheckCircle className="h-4 w-4" />
          Sin violaciones de CHECK / FK / UNIQUE / NOT NULL en los últimos 7 días.
        </CardContent>
      </Card>
    );
  }

  const severity = total24h > 0 ? 'critical' : 'warning';

  return (
    <Card
      className={cn(
        severity === 'critical'
          ? 'border-red-500/40 bg-red-500/5'
          : 'border-amber-500/40 bg-amber-500/5'
      )}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle
            className={cn('h-4 w-4', severity === 'critical' ? 'text-red-600' : 'text-amber-600')}
          />
          Violaciones de schema (últimos 7 días)
        </CardTitle>
        <CardDescription className="flex items-center gap-3 flex-wrap">
          <span>
            <strong>{total7d}</strong> totales · <strong>{total24h}</strong> en últimas 24h
          </span>
          <span className="text-xs">{ordered.length} patrones distintos</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {ordered.slice(0, 10).map((g) => (
          <div
            key={`${g.type}-${g.constraint}`}
            className="flex items-start gap-3 p-2 rounded-md bg-background/60 border border-border/40 text-xs"
          >
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-[10px] font-mono">
                  {g.type}
                </Badge>
                {g.constraint && (
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {g.constraint}
                  </Badge>
                )}
                <span className="font-semibold">
                  {g.count24h > 0 && <span className="text-red-600">{g.count24h} en 24h</span>}
                  {g.count24h > 0 && g.count7d > g.count24h && (
                    <span className="text-muted-foreground"> · </span>
                  )}
                  {g.count7d > g.count24h && (
                    <span className="text-muted-foreground">{g.count7d - g.count24h} previos</span>
                  )}
                </span>
                <span className="text-muted-foreground">
                  última {formatDistanceToNowStrict(new Date(g.sample.created_at), { locale: es })}
                </span>
              </div>
              <p className="text-muted-foreground break-words">{shortMessage(g.sample.message)}</p>
            </div>
          </div>
        ))}
        {ordered.length > 10 && (
          <p className="text-xs text-muted-foreground pt-1">
            +{ordered.length - 10} patrón{ordered.length - 10 === 1 ? '' : 'es'} más.
          </p>
        )}
        <div className="pt-2">
          <Button size="sm" variant="outline" asChild>
            <a href="/admin?section=system&sub=errors" className="gap-1">
              Ver todos <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
