import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  AlertTriangle,
  Bug,
  CheckCircle,
  XCircle,
  Monitor,
  Server,
  Database,
  Globe,
  Clock,
  Layers,
  ChevronDown,
  ChevronRight,
} from '@/lib/icons';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, differenceInHours } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const SOURCE_ICONS: Record<string, React.ElementType> = {
  frontend: Monitor,
  edge_function: Server,
  database: Database,
  external: Globe,
};

const SEVERITY_STYLES: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-300 border-red-500/30',
  error: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  warning: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
};

interface ErrorEntry {
  id: string;
  source: string;
  severity: string;
  message: string;
  stack_trace: string | null;
  context: Record<string, unknown>;
  user_id: string | null;
  resolved: boolean;
  resolved_at: string | null;
  created_at: string;
}

interface ErrorGroup {
  key: string;
  message: string;
  count: number;
  lastOccurrence: string;
  entries: ErrorEntry[];
  severity: string;
  source: string;
  hasUnresolved: boolean;
}

export default function AdminErrorLog() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [sourceFilter, setSourceFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [groupSimilar, setGroupSimilar] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const now = new Date();
  const weekAgo = subDays(now, 7);

  // KPIs
  const { data: kpis } = useQuery({
    queryKey: ['admin-errors-kpis'],
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('error_logs') as any)
        .select('id, severity, resolved, created_at, resolved_at')
        .order('created_at', { ascending: false })
        .limit(1000);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errors = (data as Array<Record<string, any>>) ?? [];
      const today = format(now, 'yyyy-MM-dd');
      const thirtyDaysAgo = subDays(now, 30);

      // MTTR: average hours between created_at and resolved_at for resolved errors in last 30 days
      const resolvedRecent = errors.filter(
        (e) => e.resolved && e.resolved_at && new Date(e.created_at) >= thirtyDaysAgo
      );
      let mttrHours = 0;
      if (resolvedRecent.length > 0) {
        const totalHours = resolvedRecent.reduce((sum: number, e: Record<string, unknown>) => {
          return (
            sum +
            differenceInHours(new Date(e.resolved_at as string), new Date(e.created_at as string))
          );
        }, 0);
        mttrHours = Math.round(totalHours / resolvedRecent.length);
      }

      return {
        today: errors.filter((e) => e.created_at?.startsWith(today)).length,
        week: errors.filter((e) => new Date(e.created_at) >= weekAgo).length,
        unresolved: errors.filter((e) => !e.resolved).length,
        critical: errors.filter((e) => e.severity === 'critical' && !e.resolved).length,
        mttrHours,
        mttrSample: resolvedRecent.length,
      };
    },
  });

  // Error list
  const { data: errors, isLoading } = useQuery({
    queryKey: ['admin-errors-list', sourceFilter, severityFilter],
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase.from('error_logs') as any)
        .select(
          'id, source, severity, message, stack_trace, context, user_id, resolved, resolved_at, created_at'
        )
        .order('created_at', { ascending: false })
        .limit(100);

      if (sourceFilter !== 'all') query = query.eq('source', sourceFilter);
      if (severityFilter !== 'all') query = query.eq('severity', severityFilter);

      const { data } = await query;
      return (data ?? []) as ErrorEntry[];
    },
  });

  // Chart data
  const { data: chartData } = useQuery({
    queryKey: ['admin-errors-chart'],
    staleTime: 120_000,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('error_logs') as any)
        .select('created_at')
        .gte('created_at', weekAgo.toISOString())
        .order('created_at');

      const byDay: Record<string, number> = {};
      for (let i = 0; i < 7; i++) {
        byDay[format(subDays(now, 6 - i), 'yyyy-MM-dd')] = 0;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((data as Array<Record<string, any>>) ?? []).forEach((e) => {
        const d = format(new Date(e.created_at), 'yyyy-MM-dd');
        if (byDay[d] !== undefined) byDay[d]++;
      });

      return Object.entries(byDay).map(([date, count]) => ({
        date: format(new Date(date), 'EEE', { locale: es }),
        errores: count,
      }));
    },
  });

  // Resolve mutation
  const resolve = useMutation({
    mutationFn: async (errorId: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('error_logs') as any)
        .update({ resolved: true, resolved_at: new Date().toISOString(), resolved_by: user?.id })
        .eq('id', errorId);
    },
    onSuccess: () => {
      toast.success('Error marcado como resuelto');
      qc.invalidateQueries({ queryKey: ['admin-errors-list'] });
      qc.invalidateQueries({ queryKey: ['admin-errors-kpis'] });
    },
  });

  const filtered = (errors ?? []).filter((e) => {
    if (!searchTerm) return true;
    return e.message.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Group similar errors by first 80 chars of message
  const grouped = useMemo<ErrorGroup[]>(() => {
    if (!groupSimilar) return [];
    const map = new Map<string, ErrorGroup>();
    for (const err of filtered) {
      const key = err.message.slice(0, 80);
      const existing = map.get(key);
      if (existing) {
        existing.count++;
        existing.entries.push(err);
        if (err.created_at > existing.lastOccurrence) {
          existing.lastOccurrence = err.created_at;
        }
        if (!err.resolved) existing.hasUnresolved = true;
      } else {
        map.set(key, {
          key,
          message: err.message,
          count: 1,
          lastOccurrence: err.created_at,
          entries: [err],
          severity: err.severity,
          source: err.source,
          hasUnresolved: !err.resolved,
        });
      }
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.lastOccurrence).getTime() - new Date(a.lastOccurrence).getTime()
    );
  }, [filtered, groupSimilar]);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card
          className={cn('bg-slate-900 border-slate-800', kpis?.critical ? 'border-red-500/50' : '')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle
                className={cn('h-4 w-4', kpis?.critical ? 'text-red-400' : 'text-slate-500')}
              />
              <span className="text-sm font-medium text-slate-300">Criticos</span>
            </div>
            <p className="text-2xl font-bold font-mono mt-1 text-white">{kpis?.critical ?? 0}</p>
            <p className="text-xs text-slate-500">sin resolver</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-400" />
              <span className="text-sm font-medium text-slate-300">Sin resolver</span>
            </div>
            <p className="text-2xl font-bold font-mono mt-1 text-white">{kpis?.unresolved ?? 0}</p>
            <p className="text-xs text-slate-500">total pendiente</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Bug className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-300">Hoy</span>
            </div>
            <p className="text-2xl font-bold font-mono mt-1 text-white">{kpis?.today ?? 0}</p>
            <p className="text-xs text-slate-500">errores nuevos</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Bug className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-300">Semana</span>
            </div>
            <p className="text-2xl font-bold font-mono mt-1 text-white">{kpis?.week ?? 0}</p>
            <p className="text-xs text-slate-500">ultimos 7 dias</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium text-slate-300">MTTR</span>
            </div>
            <p className="text-2xl font-bold font-mono mt-1 text-white">
              {kpis?.mttrHours ?? '-'}
              <span className="text-sm font-normal text-slate-400">h</span>
            </p>
            <p className="text-xs text-slate-500">
              prom. resolucion ({kpis?.mttrSample ?? 0} errores, 30d)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-base text-slate-200">Errores por dia (7 dias)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: 8,
                  color: '#e2e8f0',
                }}
              />
              <Bar dataKey="errores" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Buscar en mensajes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
        />
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-40 bg-slate-800 border-slate-700 text-slate-200">
            <SelectValue placeholder="Fuente" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all">Todas las fuentes</SelectItem>
            <SelectItem value="frontend">Frontend</SelectItem>
            <SelectItem value="edge_function">Edge Function</SelectItem>
            <SelectItem value="database">Database</SelectItem>
            <SelectItem value="external">Externo</SelectItem>
          </SelectContent>
        </Select>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-36 bg-slate-800 border-slate-700 text-slate-200">
            <SelectValue placeholder="Severidad" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="critical">Critico</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2 ml-auto">
          <Layers className="h-4 w-4 text-slate-400" />
          <span className="text-xs text-slate-400">Agrupar similares</span>
          <Switch checked={groupSimilar} onCheckedChange={setGroupSimilar} />
        </div>
      </div>

      {/* Error list */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-slate-200">
            <Bug className="h-4 w-4" />
            {groupSimilar ? `Grupos (${grouped.length})` : `Errores (${filtered.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full bg-slate-800" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <CheckCircle className="h-10 w-10 mx-auto mb-2 text-green-500 opacity-50" />
              <p>Sin errores</p>
            </div>
          ) : groupSimilar ? (
            /* Grouped view */
            <div className="divide-y divide-slate-800">
              {grouped.map((group) => {
                const SourceIcon = SOURCE_ICONS[group.source] || Bug;
                const isOpen = expandedGroup === group.key;

                return (
                  <div key={group.key} className="py-3">
                    <div
                      className="flex items-start gap-3 cursor-pointer"
                      onClick={() => setExpandedGroup(isOpen ? null : group.key)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setExpandedGroup(isOpen ? null : group.key);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
                      )}
                      <SourceIcon className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant="outline"
                            className={cn('text-[10px]', SEVERITY_STYLES[group.severity] || '')}
                          >
                            {group.severity}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="text-[10px] border-slate-600 text-slate-400"
                          >
                            x{group.count}
                          </Badge>
                          {group.hasUnresolved && (
                            <Badge
                              variant="outline"
                              className="text-[10px] border-orange-500/30 text-orange-300"
                            >
                              pendiente
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm mt-1 truncate text-slate-200">{group.message}</p>
                        <p className="text-xs text-slate-500">
                          Ultima:{' '}
                          {format(new Date(group.lastOccurrence), 'dd MMM HH:mm:ss', {
                            locale: es,
                          })}
                        </p>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="mt-2 ml-10 space-y-2">
                        {group.entries.map((err) => (
                          <div
                            key={err.id}
                            className="flex items-center justify-between p-2 bg-slate-800/50 rounded-md text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  'w-2 h-2 rounded-full',
                                  err.resolved ? 'bg-green-500' : 'bg-orange-500'
                                )}
                              />
                              <span className="text-slate-300 font-mono">
                                {format(new Date(err.created_at), 'dd MMM HH:mm:ss', {
                                  locale: es,
                                })}
                              </span>
                              {err.user_id && (
                                <span className="text-slate-500 font-mono truncate max-w-[120px]">
                                  {err.user_id.slice(0, 8)}...
                                </span>
                              )}
                            </div>
                            {!err.resolved && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 text-xs text-slate-400 hover:text-green-400"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  resolve.mutate(err.id);
                                }}
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Resolver
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Flat view */
            <div className="divide-y divide-slate-800">
              {filtered.map((err) => {
                const SourceIcon = SOURCE_ICONS[err.source] || Bug;
                const isExpanded = expandedId === err.id;

                return (
                  <div key={err.id} className="py-3">
                    <div
                      className="flex items-start gap-3 cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : err.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setExpandedId(isExpanded ? null : err.id);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <SourceIcon className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant="outline"
                            className={cn('text-[10px]', SEVERITY_STYLES[err.severity] || '')}
                          >
                            {err.severity}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="text-[10px] border-slate-600 text-slate-400"
                          >
                            {err.source}
                          </Badge>
                          {err.resolved && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] bg-green-500/20 text-green-300"
                            >
                              resuelto
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm mt-1 truncate text-slate-200">{err.message}</p>
                        <p className="text-xs text-slate-500">
                          {format(new Date(err.created_at), 'dd MMM HH:mm:ss', { locale: es })}
                        </p>
                      </div>
                      {!err.resolved && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="shrink-0 text-xs text-slate-400 hover:text-green-400"
                          onClick={(e) => {
                            e.stopPropagation();
                            resolve.mutate(err.id);
                          }}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Resolver
                        </Button>
                      )}
                    </div>

                    {isExpanded && (
                      <div className="mt-2 ml-7 p-3 bg-slate-800/50 rounded-md text-xs space-y-2">
                        {err.stack_trace && (
                          <div>
                            <p className="font-medium mb-1 text-slate-300">Stack trace:</p>
                            <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-[10px] max-h-40 overflow-y-auto bg-slate-800 p-2 rounded text-slate-400">
                              {err.stack_trace}
                            </pre>
                          </div>
                        )}
                        {Object.keys(err.context).length > 0 && (
                          <div>
                            <p className="font-medium mb-1 text-slate-300">Context:</p>
                            <pre className="font-mono text-[10px] bg-slate-800 p-2 rounded text-slate-400">
                              {JSON.stringify(err.context, null, 2)}
                            </pre>
                          </div>
                        )}
                        {err.user_id && (
                          <p className="text-slate-400">
                            <span className="font-medium text-slate-300">User:</span>{' '}
                            <span className="font-mono">{err.user_id}</span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
