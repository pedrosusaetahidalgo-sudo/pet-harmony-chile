import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  AlertTriangle,
  Bug,
  CheckCircle,
  XCircle,
  Monitor,
  Server,
  Database,
  Globe,
  Filter,
} from '@/lib/icons';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

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
  created_at: string;
}

export default function AdminErrorLog() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [sourceFilter, setSourceFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const now = new Date();
  const weekAgo = subDays(now, 7);

  // KPIs
  const { data: kpis } = useQuery({
    queryKey: ['admin-errors-kpis'],
    staleTime: 30_000,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('error_logs') as any)
        .select('id, severity, resolved, created_at')
        .order('created_at', { ascending: false })
        .limit(1000);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errors = (data as Array<Record<string, any>>) ?? [];
      const today = format(now, 'yyyy-MM-dd');

      return {
        today: errors.filter((e) => e.created_at?.startsWith(today)).length,
        week: errors.filter((e) => new Date(e.created_at) >= weekAgo).length,
        unresolved: errors.filter((e) => !e.resolved).length,
        critical: errors.filter((e) => e.severity === 'critical' && !e.resolved).length,
      };
    },
  });

  // Error list
  const { data: errors, isLoading } = useQuery({
    queryKey: ['admin-errors-list', sourceFilter, severityFilter],
    staleTime: 30_000,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase.from('error_logs') as any)
        .select(
          'id, source, severity, message, stack_trace, context, user_id, resolved, created_at'
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

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={kpis?.critical ? 'border-red-500/50' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle
                className={`h-4 w-4 ${kpis?.critical ? 'text-red-400' : 'text-slate-400'}`}
              />
              <span className="text-sm font-medium">Criticos</span>
            </div>
            <p className="text-2xl font-bold font-mono mt-1">{kpis?.critical ?? 0}</p>
            <p className="text-xs text-muted-foreground">sin resolver</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-400" />
              <span className="text-sm font-medium">Sin resolver</span>
            </div>
            <p className="text-2xl font-bold font-mono mt-1">{kpis?.unresolved ?? 0}</p>
            <p className="text-xs text-muted-foreground">total pendiente</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Bug className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-medium">Hoy</span>
            </div>
            <p className="text-2xl font-bold font-mono mt-1">{kpis?.today ?? 0}</p>
            <p className="text-xs text-muted-foreground">errores nuevos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Bug className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-medium">Semana</span>
            </div>
            <p className="text-2xl font-bold font-mono mt-1">{kpis?.week ?? 0}</p>
            <p className="text-xs text-muted-foreground">ultimos 7 dias</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Errores por dia (7 dias)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData ?? []}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="errores" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Buscar en mensajes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Fuente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las fuentes</SelectItem>
            <SelectItem value="frontend">Frontend</SelectItem>
            <SelectItem value="edge_function">Edge Function</SelectItem>
            <SelectItem value="database">Database</SelectItem>
            <SelectItem value="external">Externo</SelectItem>
          </SelectContent>
        </Select>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Severidad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="critical">Critico</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bug className="h-4 w-4" />
            Errores ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-10 w-10 mx-auto mb-2 text-green-500 opacity-50" />
              <p>Sin errores</p>
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((err) => {
                const SourceIcon = SOURCE_ICONS[err.source] || Bug;
                const isExpanded = expandedId === err.id;

                return (
                  <div key={err.id} className="py-3">
                    <div
                      className="flex items-start gap-3 cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : err.id)}
                    >
                      <SourceIcon className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${SEVERITY_STYLES[err.severity] || ''}`}
                          >
                            {err.severity}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
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
                        <p className="text-sm mt-1 truncate">{err.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(err.created_at), 'dd MMM HH:mm:ss', { locale: es })}
                        </p>
                      </div>
                      {!err.resolved && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="shrink-0 text-xs"
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
                      <div className="mt-2 ml-7 p-3 bg-muted/30 rounded-md text-xs space-y-2">
                        {err.stack_trace && (
                          <div>
                            <p className="font-medium mb-1">Stack trace:</p>
                            <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-[10px] max-h-40 overflow-y-auto bg-muted/50 p-2 rounded">
                              {err.stack_trace}
                            </pre>
                          </div>
                        )}
                        {Object.keys(err.context).length > 0 && (
                          <div>
                            <p className="font-medium mb-1">Context:</p>
                            <pre className="font-mono text-[10px] bg-muted/50 p-2 rounded">
                              {JSON.stringify(err.context, null, 2)}
                            </pre>
                          </div>
                        )}
                        {err.user_id && (
                          <p>
                            <span className="font-medium">User:</span>{' '}
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
