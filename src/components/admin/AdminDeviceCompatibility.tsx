import { useMemo, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Monitor, Smartphone, Tablet, Copy, RefreshCw } from '@/lib/icons';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/**
 * Panel de compatibilidad por dispositivo.
 *
 * Agrupa `analytics_events` de tipo session_start por platform_family +
 * os + browser_family + screen, y muestra cuántas sesiones únicas pasaron
 * por cada combinación en los últimos 30 días.
 *
 * Fuente: `useAnalyticsTracker` en el frontend escribe la metadata.
 * Datos de sesiones previas al 2026-04-17 no tienen platform_family y
 * caen en "legacy" (inferido por user agent).
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

interface SessionEvent {
  session_id: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

interface DeviceStats {
  platform_family: string;
  os: string;
  browser_family: string;
  screen: string;
  count: number;
}

const PLATFORM_LABELS: Record<string, { label: string; icon: typeof Monitor }> = {
  ios_app: { label: 'iOS (app)', icon: Smartphone },
  android_app: { label: 'Android (app)', icon: Smartphone },
  mobile_web: { label: 'Mobile web', icon: Smartphone },
  desktop_web: { label: 'Desktop web', icon: Monitor },
  tablet: { label: 'Tablet', icon: Tablet },
  legacy: { label: 'Legacy (sin platform)', icon: Monitor },
};

function inferPlatformFromUA(ua: string | undefined): string {
  if (!ua) return 'legacy';
  if (/iPhone|iPad|iPod/i.test(ua) && !/Safari/i.test(ua)) return 'ios_app';
  if (/Android/i.test(ua) && /wv\)/i.test(ua)) return 'android_app';
  if (/Mobile|Android|iPhone/i.test(ua)) return 'mobile_web';
  return 'desktop_web';
}

export default function AdminDeviceCompatibility() {
  const [windowDays, setWindowDays] = useState<7 | 30 | 90>(30);

  const {
    data: sessions,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['admin-device-compat', windowDays],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<SessionEvent[]> => {
      const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await sb
        .from('analytics_events')
        .select('session_id, created_at, metadata')
        .eq('event_type', 'session_start')
        .gte('created_at', since)
        .limit(5000);
      return (data as SessionEvent[] | null) ?? [];
    },
  });

  // Agrega stats por combinación
  const stats = useMemo(() => {
    const map = new Map<string, DeviceStats>();
    const byPlatform: Record<string, number> = {};
    const byOS: Record<string, number> = {};
    const byBrowser: Record<string, number> = {};
    const seenSessions = new Set<string>();

    for (const row of sessions ?? []) {
      // Evita contar doble si hay varios session_start de la misma sesión
      const sessionKey = row.session_id ?? `${row.created_at}`;
      if (seenSessions.has(sessionKey)) continue;
      seenSessions.add(sessionKey);

      const md = row.metadata ?? {};
      const platform =
        (md.platform_family as string | undefined) ?? inferPlatformFromUA(md.browser as string);
      const os = (md.os as string | undefined) ?? 'Unknown';
      const browser = (md.browser_family as string | undefined) ?? 'Unknown';
      const screen = (md.screen as string | undefined) ?? 'Unknown';

      const key = `${platform}|${os}|${browser}|${screen}`;
      const existing = map.get(key);
      if (existing) {
        existing.count++;
      } else {
        map.set(key, { platform_family: platform, os, browser_family: browser, screen, count: 1 });
      }

      byPlatform[platform] = (byPlatform[platform] ?? 0) + 1;
      byOS[os] = (byOS[os] ?? 0) + 1;
      byBrowser[browser] = (byBrowser[browser] ?? 0) + 1;
    }

    const combinations = Array.from(map.values()).sort((a, b) => b.count - a.count);
    return {
      totalSessions: seenSessions.size,
      byPlatform,
      byOS,
      byBrowser,
      combinations,
    };
  }, [sessions]);

  const copyReport = useCallback(async () => {
    const lines: string[] = [];
    lines.push(`DEVICE COMPATIBILITY — Paw Friend`);
    lines.push(`Ventana: ultimos ${windowDays} dias`);
    lines.push(`Sesiones totales: ${stats.totalSessions}`);
    lines.push('');
    lines.push('--- POR PLATAFORMA ---');
    for (const [p, n] of Object.entries(stats.byPlatform).sort((a, b) => b[1] - a[1])) {
      const pct = Math.round((n / stats.totalSessions) * 100);
      lines.push(`  ${PLATFORM_LABELS[p]?.label ?? p}: ${n} (${pct}%)`);
    }
    lines.push('');
    lines.push('--- POR OS ---');
    for (const [os, n] of Object.entries(stats.byOS).sort((a, b) => b[1] - a[1])) {
      lines.push(`  ${os}: ${n}`);
    }
    lines.push('');
    lines.push('--- POR BROWSER ---');
    for (const [b, n] of Object.entries(stats.byBrowser).sort((a, b) => b[1] - a[1])) {
      lines.push(`  ${b}: ${n}`);
    }
    lines.push('');
    lines.push('--- TOP 10 COMBINACIONES ---');
    for (const c of stats.combinations.slice(0, 10)) {
      lines.push(
        `  ${c.platform_family} | ${c.os} | ${c.browser_family} | ${c.screen} — ${c.count}`
      );
    }
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      toast.success('Reporte de compatibilidad copiado');
    } catch {
      toast.error('No se pudo copiar');
    }
  }, [stats, windowDays]);

  const platformCount = (key: string) => stats.byPlatform[key] ?? 0;
  const platformPct = (key: string) =>
    stats.totalSessions > 0 ? Math.round((platformCount(key) / stats.totalSessions) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* KPI cards — las 4 familias principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <PlatformCard
          icon={Monitor}
          label="Desktop web"
          count={platformCount('desktop_web')}
          pct={platformPct('desktop_web')}
        />
        <PlatformCard
          icon={Smartphone}
          label="Mobile web"
          count={platformCount('mobile_web')}
          pct={platformPct('mobile_web')}
        />
        <PlatformCard
          icon={Smartphone}
          label="Android (app)"
          count={platformCount('android_app')}
          pct={platformPct('android_app')}
          highlight={platformCount('android_app') > 0}
        />
        <PlatformCard
          icon={Smartphone}
          label="iOS (app)"
          count={platformCount('ios_app')}
          pct={platformPct('ios_app')}
          highlight={platformCount('ios_app') > 0}
        />
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-3">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base text-white">
                <Monitor className="h-4 w-4" />
                Compatibilidad por dispositivo
              </CardTitle>
              <CardDescription className="text-slate-400">
                {stats.totalSessions} sesiones en los ultimos {windowDays} dias
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex rounded border border-slate-700 overflow-hidden">
                {([7, 30, 90] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setWindowDays(d)}
                    className={cn(
                      'px-2.5 py-1 text-xs',
                      windowDays === d
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    )}
                  >
                    {d}d
                  </button>
                ))}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => refetch()}
                disabled={isFetching}
                className="border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
              >
                <RefreshCw className={cn('h-3 w-3 mr-1.5', isFetching && 'animate-spin')} />
                Refrescar
              </Button>
              <Button
                size="sm"
                onClick={copyReport}
                disabled={stats.totalSessions === 0}
                className="bg-indigo-600 hover:bg-indigo-500 text-white"
                title="Copia el reporte de compatibilidad para pegarlo en Claude"
              >
                <Copy className="h-3 w-3 mr-1.5" />
                Copiar reporte
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-40 w-full bg-slate-800" />
          ) : stats.totalSessions === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">
              Sin sesiones registradas en este periodo.
            </p>
          ) : (
            <div className="space-y-5">
              <BreakdownBar
                title="Por sistema operativo"
                map={stats.byOS}
                total={stats.totalSessions}
              />
              <BreakdownBar
                title="Por navegador"
                map={stats.byBrowser}
                total={stats.totalSessions}
              />

              <div>
                <h3 className="text-xs font-semibold text-slate-300 uppercase mb-2">
                  Top combinaciones (platform / OS / browser / screen)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 text-left">
                        <th className="pb-2 font-medium text-slate-400 uppercase text-xs">
                          Plataforma
                        </th>
                        <th className="pb-2 font-medium text-slate-400 uppercase text-xs">OS</th>
                        <th className="pb-2 font-medium text-slate-400 uppercase text-xs">
                          Browser
                        </th>
                        <th className="pb-2 font-medium text-slate-400 uppercase text-xs">
                          Pantalla
                        </th>
                        <th className="pb-2 font-medium text-slate-400 uppercase text-xs text-right">
                          Sesiones
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.combinations.slice(0, 20).map((c) => (
                        <tr
                          key={`${c.platform_family}|${c.os}|${c.browser_family}|${c.screen}`}
                          className="border-b border-slate-800 last:border-0 hover:bg-slate-800/50"
                        >
                          <td className="py-2">
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-slate-800 text-slate-300 border-slate-700"
                            >
                              {PLATFORM_LABELS[c.platform_family]?.label ?? c.platform_family}
                            </Badge>
                          </td>
                          <td className="py-2 text-xs text-slate-300">{c.os}</td>
                          <td className="py-2 text-xs text-slate-300">{c.browser_family}</td>
                          <td className="py-2 text-xs text-slate-500 font-mono">{c.screen}</td>
                          <td className="py-2 text-xs text-slate-200 text-right font-mono">
                            {c.count}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {stats.combinations.length > 20 && (
                  <p className="text-[10px] text-slate-500 mt-2">
                    +{stats.combinations.length - 20} combinaciones mas (copia el reporte para
                    verlas)
                  </p>
                )}
              </div>
            </div>
          )}
          <p className="text-[10px] text-slate-600 mt-3">
            Fuente: <span className="font-mono">analytics_events</span> (session_start). Requiere{' '}
            <span className="font-mono">useAnalyticsTracker</span> activo en el frontend.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function PlatformCard({
  icon: Icon,
  label,
  count,
  pct,
  highlight,
}: {
  icon: typeof Monitor;
  label: string;
  count: number;
  pct: number;
  highlight?: boolean;
}) {
  return (
    <Card className={cn('bg-slate-900 border-slate-800', highlight && 'border-indigo-500/40')}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-300">{label}</span>
        </div>
        <p className="text-2xl font-bold mt-1 text-white">{count}</p>
        <p className="text-xs text-slate-500">{pct}% sesiones</p>
      </CardContent>
    </Card>
  );
}

function BreakdownBar({
  title,
  map,
  total,
}: {
  title: string;
  map: Record<string, number>;
  total: number;
}) {
  const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
  return (
    <div>
      <h3 className="text-xs font-semibold text-slate-300 uppercase mb-2">{title}</h3>
      <div className="space-y-1.5">
        {entries.map(([key, count]) => {
          const pct = Math.round((count / total) * 100);
          return (
            <div key={key} className="flex items-center gap-3">
              <span className="text-xs text-slate-300 w-24 truncate">{key}</span>
              <div className="flex-1 h-2 bg-slate-800 rounded overflow-hidden">
                <div className="h-full bg-indigo-500/60" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-xs text-slate-400 w-16 text-right font-mono">
                {count} ({pct}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
