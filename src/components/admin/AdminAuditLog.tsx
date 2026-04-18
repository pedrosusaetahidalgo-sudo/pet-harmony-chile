import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  ClipboardList,
  UserCheck,
  UserX,
  ShieldCheck,
  Trash2,
  Settings,
  Gift,
  Target,
  Megaphone,
  Flag,
  Eye,
  Download,
} from '@/lib/icons';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { track, EVENTS } from '@/lib/analytics';

const ACTION_ICONS: Record<string, React.ElementType> = {
  'provider.approve': UserCheck,
  'provider.reject': UserX,
  'provider.suspend': Flag,
  'provider.verify': ShieldCheck,
  'user.add_role': UserCheck,
  'user.remove_role': UserX,
  'verification.approve': ShieldCheck,
  'verification.reject': UserX,
  'reward.create': Gift,
  'reward.update': Gift,
  'reward.delete': Trash2,
  'mission.create': Target,
  'mission.update': Target,
  'ad.activate': Megaphone,
  'ad.deactivate': Megaphone,
  'ad.delete': Trash2,
  'moderation.dismiss': Eye,
  'moderation.delete_content': Trash2,
  'settings.update': Settings,
};

const ACTION_COLORS: Record<string, string> = {
  approve: 'bg-green-500',
  verify: 'bg-blue-500',
  create: 'bg-purple-500',
  activate: 'bg-green-500',
  reject: 'bg-red-500',
  suspend: 'bg-orange-500',
  delete: 'bg-red-500',
  deactivate: 'bg-gray-500',
  dismiss: 'bg-gray-500',
  remove: 'bg-red-500',
  update: 'bg-blue-500',
  add: 'bg-green-500',
};

function getActionColor(action: string): string {
  const verb = action.split('.')[1] || '';
  for (const [key, color] of Object.entries(ACTION_COLORS)) {
    if (verb.includes(key)) return color;
  }
  return 'bg-gray-500';
}

function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    'provider.approve': 'Proveedor aprobado',
    'provider.reject': 'Proveedor rechazado',
    'provider.suspend': 'Proveedor suspendido',
    'provider.verify': 'Proveedor verificado',
    'user.add_role': 'Rol asignado',
    'user.remove_role': 'Rol removido',
    'user.suspend': 'Usuario suspendido',
    'verification.approve': 'Verificacion aprobada',
    'verification.reject': 'Verificacion rechazada',
    'reward.create': 'Reward creado',
    'reward.update': 'Reward actualizado',
    'reward.delete': 'Reward eliminado',
    'mission.create': 'Mision creada',
    'mission.update': 'Mision actualizada',
    'ad.activate': 'Anuncio activado',
    'ad.deactivate': 'Anuncio desactivado',
    'ad.delete': 'Anuncio eliminado',
    'moderation.dismiss': 'Reporte descartado',
    'moderation.delete_content': 'Contenido eliminado',
    'settings.update': 'Configuracion actualizada',
    'settings.update_commission': 'Comision actualizada',
  };
  return labels[action] || action;
}

type DateRange = '7d' | '30d' | 'all';

interface AuditEntry {
  id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
  admin_name: string;
}

export default function AdminAuditLog() {
  const [textFilter, setTextFilter] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [adminFilter, setAdminFilter] = useState('all');

  const { data: entries, isLoading } = useQuery({
    queryKey: ['admin-audit-log'],
    staleTime: 30_000,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('admin_audit_log') as any)
        .select('id, admin_user_id, action, target_type, target_id, details, created_at')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows = (data as Array<Record<string, any>>) ?? [];
      if (rows.length === 0) return [];

      // Enrich with admin names
      const adminIds = [...new Set(rows.map((r) => r.admin_user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', adminIds);

      const nameMap = new Map((profiles ?? []).map((p) => [p.id, p.display_name || 'Admin']));

      return rows.map((r) => ({
        id: r.id,
        action: r.action,
        target_type: r.target_type,
        target_id: r.target_id,
        details: (r.details || {}) as Record<string, unknown>,
        created_at: r.created_at,
        admin_name: nameMap.get(r.admin_user_id) || 'Admin',
      }));
    },
  });

  // Unique admin names for the filter dropdown
  const adminNames = useMemo(() => {
    if (!entries) return [];
    return [...new Set(entries.map((e) => e.admin_name))].sort();
  }, [entries]);

  const filtered = useMemo(() => {
    const now = new Date();
    return (entries ?? []).filter((e) => {
      // Date filter
      if (dateRange === '7d' && new Date(e.created_at) < subDays(now, 7)) return false;
      if (dateRange === '30d' && new Date(e.created_at) < subDays(now, 30)) return false;

      // Admin filter
      if (adminFilter !== 'all' && e.admin_name !== adminFilter) return false;

      // Text filter
      if (textFilter) {
        const q = textFilter.toLowerCase();
        return (
          e.action.toLowerCase().includes(q) ||
          getActionLabel(e.action).toLowerCase().includes(q) ||
          e.admin_name.toLowerCase().includes(q) ||
          (e.target_type || '').toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [entries, textFilter, dateRange, adminFilter]);

  const handleExportCSV = () => {
    if (!filtered.length) return;
    track({
      event: EVENTS.ADMIN_ACTION,
      properties: {
        action: 'export_csv',
        section: 'audit_log',
        rows: filtered.length,
        has_text_filter: Boolean(textFilter),
        has_date_range: Boolean(dateRange),
      },
    });
    const header = 'Accion,Admin,Tipo objetivo,ID objetivo,Fecha,Detalles';
    const rows = filtered.map((e) => {
      const details = Object.entries(e.details)
        .map(([k, v]) => `${k}: ${v}`)
        .join('; ');
      return [
        `"${getActionLabel(e.action)}"`,
        `"${e.admin_name}"`,
        `"${e.target_type || ''}"`,
        `"${e.target_id || ''}"`,
        `"${format(new Date(e.created_at), 'yyyy-MM-dd HH:mm:ss')}"`,
        `"${details.replace(/"/g, '""')}"`,
      ].join(',');
    });
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-log-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-white">
              <ClipboardList className="h-5 w-5 text-slate-400" />
              Registro de acciones
            </CardTitle>
            <CardDescription className="text-slate-400">
              Historial de todas las acciones administrativas
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
            onClick={handleExportCSV}
            disabled={!filtered.length}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters row */}
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Filtrar por accion, admin o tipo..."
            value={textFilter}
            onChange={(e) => setTextFilter(e.target.value)}
            className="max-w-xs bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
          />

          {/* Date range buttons */}
          <div className="flex border border-slate-700 rounded-md overflow-hidden">
            {(['7d', '30d', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium transition-colors',
                  dateRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                )}
              >
                {range === '7d' ? 'Ultimos 7d' : range === '30d' ? 'Ultimos 30d' : 'Todos'}
              </button>
            ))}
          </div>

          {/* Admin filter */}
          {adminNames.length > 1 && (
            <Select value={adminFilter} onValueChange={setAdminFilter}>
              <SelectTrigger className="w-44 bg-slate-800 border-slate-700 text-slate-200">
                <SelectValue placeholder="Admin" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">Todos los admins</SelectItem>
                {adminNames.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full bg-slate-800" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>Sin acciones registradas</p>
            <p className="text-xs mt-1">
              Las acciones apareceran aqui a medida que administres la plataforma
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filtered.map((entry) => {
              const Icon = ACTION_ICONS[entry.action] || ClipboardList;
              const color = getActionColor(entry.action);
              return (
                <div key={entry.id} className="flex items-start gap-3 py-3">
                  <div className={cn('p-1.5 rounded-full mt-0.5', color)}>
                    <Icon className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-slate-200">
                        {getActionLabel(entry.action)}
                      </span>
                      {entry.target_type && (
                        <Badge
                          variant="outline"
                          className="text-xs border-slate-600 text-slate-400"
                        >
                          {entry.target_type}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {entry.admin_name} &middot;{' '}
                      {format(new Date(entry.created_at), 'dd MMM yyyy HH:mm', { locale: es })}
                    </p>
                    {Object.keys(entry.details).length > 0 && (
                      <p className="text-xs text-slate-500 mt-1 truncate max-w-md">
                        {Object.entries(entry.details)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(' · ')}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
