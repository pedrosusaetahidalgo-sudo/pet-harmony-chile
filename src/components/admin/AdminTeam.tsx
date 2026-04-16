import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Shield,
  UserPlus,
  Trash2,
  Crown,
  LayoutDashboard,
  Users,
  CreditCard,
  FileText,
  Gamepad2,
  Megaphone,
  Settings,
  ShieldCheck,
  Server,
  ClipboardList,
  Store,
} from '@/lib/icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { cn } from '@/lib/utils';

const PERMISSION_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> =
  {
    dashboard: {
      label: 'Dashboard',
      icon: LayoutDashboard,
      color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    },
    providers: {
      label: 'Proveedores',
      icon: Store,
      color: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    },
    users: {
      label: 'Usuarios',
      icon: Users,
      color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    },
    payments: {
      label: 'Finanzas',
      icon: CreditCard,
      color: 'bg-green-500/20 text-green-300 border-green-500/30',
    },
    content: {
      label: 'Contenido',
      icon: FileText,
      color: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    rewards: {
      label: 'Gamificacion',
      icon: Gamepad2,
      color: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    },
    ads: {
      label: 'Comercial',
      icon: Megaphone,
      color: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    },
    partners: {
      label: 'Partners',
      icon: Users,
      color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    },
    settings: {
      label: 'Configuracion',
      icon: Settings,
      color: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    },
    safety: {
      label: 'Seguridad',
      icon: ShieldCheck,
      color: 'bg-red-500/20 text-red-300 border-red-500/30',
    },
    system: {
      label: 'Sistema',
      icon: Server,
      color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
  };

interface AdminMember {
  id: string;
  user_id: string;
  email: string;
  role: string;
  permissions: Record<string, boolean>;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
  display_name: string;
  action_count: number;
}

export default function AdminTeam() {
  const { isSuperAdmin } = useIsAdmin();
  const queryClient = useQueryClient();
  const [newEmail, setNewEmail] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [newPerms, setNewPerms] = useState<Record<string, boolean>>({});

  const { data: members, isLoading } = useQuery({
    queryKey: ['admin-team'],
    staleTime: 60_000,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('admin_access') as any)
        .select('id, user_id, email, role, permissions, is_active, created_at, last_login')
        .order('created_at');

      if (error) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows = (data as Array<Record<string, any>>) ?? [];
      if (rows.length === 0) return [];

      const userIds = rows.map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', userIds);

      const nameMap = new Map((profiles ?? []).map((p) => [p.id, p.display_name || '']));

      // Get action counts per admin from audit log
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: auditCounts } = await (supabase.from('admin_audit_log') as any)
        .select('admin_user_id')
        .in('admin_user_id', userIds);

      const countMap = new Map<string, number>();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((auditCounts as Array<Record<string, any>>) ?? []).forEach((row) => {
        const uid = row.admin_user_id as string;
        countMap.set(uid, (countMap.get(uid) || 0) + 1);
      });

      return rows.map((r) => ({
        ...r,
        permissions: (r.permissions || {}) as Record<string, boolean>,
        display_name: nameMap.get(r.user_id) || r.email,
        action_count: countMap.get(r.user_id) || 0,
      })) as AdminMember[];
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('admin_access') as any)
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-team'] });
      toast.success('Estado actualizado');
    },
    onError: () => toast.error('Error al actualizar'),
  });

  const inviteOperator = useMutation({
    mutationFn: async ({
      email,
      permissions,
    }: {
      email: string;
      permissions: Record<string, boolean>;
    }) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (!profile) {
        throw new Error('Usuario no encontrado. Debe tener cuenta en Paw Friend primero.');
      }

      // Upsert on user_id (UNIQUE) to avoid TOCTOU race between checking existence
      // and inserting — a concurrent invite for the same user would otherwise cause
      // a unique-constraint error on the plain insert.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('admin_access') as any).upsert(
        {
          user_id: profile.id,
          email,
          role: 'admin_operator',
          permissions,
          is_active: true,
        },
        { onConflict: 'user_id' }
      );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-team'] });
      toast.success('Operador invitado');
      setNewEmail('');
      setNewPerms({});
      setShowInvite(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const removeAccess = useMutation({
    mutationFn: async (id: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('admin_access') as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-team'] });
      toast.success('Acceso removido');
    },
    onError: () => toast.error('Error al remover acceso'),
  });

  if (!isSuperAdmin) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-8 text-center text-slate-500">
          <Shield className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p>Solo el Super Admin puede gestionar el equipo</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-white">
                <Shield className="h-5 w-5 text-slate-400" />
                Equipo Admin
              </CardTitle>
              <CardDescription className="text-slate-400">
                Gestiona quien tiene acceso al panel de administracion
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowInvite(!showInvite)}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Invitar operador
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Invite form */}
          {showInvite && (
            <Card className="border-dashed border-slate-700 bg-slate-800/50">
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Email del nuevo operador</Label>
                  <Input
                    type="email"
                    placeholder="operador@email.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  />
                  <p className="text-xs text-slate-500">
                    El usuario debe tener una cuenta en Paw Friend
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Permisos</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {Object.entries(PERMISSION_CONFIG).map(([key, cfg]) => (
                      <div key={key} className="flex items-center gap-2">
                        <Switch
                          checked={newPerms[key] || false}
                          onCheckedChange={(v) => setNewPerms((p) => ({ ...p, [key]: v }))}
                        />
                        <span className="text-sm text-slate-300">{cfg.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() =>
                      inviteOperator.mutate({ email: newEmail, permissions: newPerms })
                    }
                    disabled={!newEmail || inviteOperator.isPending}
                  >
                    Invitar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-slate-700 text-slate-300 hover:bg-slate-800"
                    onClick={() => setShowInvite(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Members list */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-16 w-full bg-slate-800" />
              ))}
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {(members ?? []).map((member) => (
                <div key={member.id} className="flex items-center gap-4 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-white">{member.display_name}</span>
                      {member.role === 'super_admin' ? (
                        <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs">
                          <Crown className="h-3 w-3 mr-1" />
                          Super Admin
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-xs border-slate-600 text-slate-400"
                        >
                          Operador
                        </Badge>
                      )}
                      {!member.is_active && (
                        <Badge className="bg-red-500/20 text-red-300 border border-red-500/30 text-xs">
                          Inactivo
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{member.email}</p>

                    {/* Activity count */}
                    <div className="flex items-center gap-1 mt-1">
                      <ClipboardList className="h-3 w-3 text-slate-500" />
                      <span className="text-[11px] text-slate-500">
                        {member.action_count} {member.action_count === 1 ? 'accion' : 'acciones'}{' '}
                        registradas
                      </span>
                    </div>

                    {/* Permission chips */}
                    {member.role === 'admin_operator' && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {Object.entries(member.permissions)
                          .filter(([, v]) => v)
                          .map(([k]) => {
                            const cfg = PERMISSION_CONFIG[k];
                            if (!cfg) {
                              return (
                                <Badge
                                  key={k}
                                  variant="outline"
                                  className="text-[10px] px-1.5 border-slate-600 text-slate-400"
                                >
                                  {k}
                                </Badge>
                              );
                            }
                            const PermIcon = cfg.icon;
                            return (
                              <Badge
                                key={k}
                                variant="outline"
                                className={cn('text-[10px] px-1.5 border', cfg.color)}
                              >
                                <PermIcon className="h-2.5 w-2.5 mr-0.5" />
                                {cfg.label}
                              </Badge>
                            );
                          })}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-slate-500">
                      {member.last_login
                        ? format(new Date(member.last_login), 'dd MMM', { locale: es })
                        : 'Nunca'}
                    </span>

                    {member.role !== 'super_admin' && (
                      <>
                        <Switch
                          checked={member.is_active}
                          onCheckedChange={(v) =>
                            toggleActive.mutate({ id: member.id, is_active: v })
                          }
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          onClick={() => removeAccess.mutate(member.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
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
