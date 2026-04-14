import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
} from '@/lib/icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';

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
    'verification.approve': 'Verificación aprobada',
    'verification.reject': 'Verificación rechazada',
    'reward.create': 'Reward creado',
    'reward.update': 'Reward actualizado',
    'reward.delete': 'Reward eliminado',
    'mission.create': 'Misión creada',
    'mission.update': 'Misión actualizada',
    'ad.activate': 'Anuncio activado',
    'ad.deactivate': 'Anuncio desactivado',
    'ad.delete': 'Anuncio eliminado',
    'moderation.dismiss': 'Reporte descartado',
    'moderation.delete_content': 'Contenido eliminado',
    'settings.update': 'Configuración actualizada',
    'settings.update_commission': 'Comisión actualizada',
  };
  return labels[action] || action;
}

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
  const [filter, setFilter] = useState('');

  const { data: entries, isLoading } = useQuery({
    queryKey: ['admin-audit-log'],
    staleTime: 30_000,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('admin_audit_log') as any)
        .select('id, admin_user_id, action, target_type, target_id, details, created_at')
        .order('created_at', { ascending: false })
        .limit(100);

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

  const filtered = (entries ?? []).filter((e) => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return (
      e.action.toLowerCase().includes(q) ||
      getActionLabel(e.action).toLowerCase().includes(q) ||
      e.admin_name.toLowerCase().includes(q) ||
      (e.target_type || '').toLowerCase().includes(q)
    );
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          Registro de acciones
        </CardTitle>
        <CardDescription>Historial de todas las acciones administrativas</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Filtrar por acción, admin o tipo..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-sm"
        />

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>Sin acciones registradas</p>
            <p className="text-xs mt-1">
              Las acciones aparecerán aquí a medida que administres la plataforma
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {filtered.map((entry) => {
              const Icon = ACTION_ICONS[entry.action] || ClipboardList;
              const color = getActionColor(entry.action);
              return (
                <div key={entry.id} className="flex items-start gap-3 py-3">
                  <div className={`p-1.5 rounded-full ${color} mt-0.5`}>
                    <Icon className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{getActionLabel(entry.action)}</span>
                      {entry.target_type && (
                        <Badge variant="outline" className="text-xs">
                          {entry.target_type}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {entry.admin_name} &middot;{' '}
                      {format(new Date(entry.created_at), 'dd MMM yyyy HH:mm', { locale: es })}
                    </p>
                    {Object.keys(entry.details).length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1 truncate max-w-md">
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
