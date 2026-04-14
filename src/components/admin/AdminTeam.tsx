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
import { Shield, UserPlus, Trash2, Crown } from '@/lib/icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';
import { useIsAdmin } from '@/hooks/useIsAdmin';

const PERMISSION_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  providers: 'Proveedores',
  users: 'Usuarios',
  payments: 'Finanzas',
  content: 'Contenido',
  rewards: 'Gamificación',
  ads: 'Comercial',
  partners: 'Partners',
  settings: 'Configuración',
  safety: 'Seguridad',
  system: 'Sistema',
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

      return rows.map((r) => ({
        ...r,
        permissions: (r.permissions || {}) as Record<string, boolean>,
        display_name: nameMap.get(r.user_id) || r.email,
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
      // Find user by email
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (!profile) {
        throw new Error('Usuario no encontrado. Debe tener cuenta en Paw Friend primero.');
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('admin_access') as any).insert({
        user_id: profile.id,
        email,
        role: 'admin_operator',
        permissions,
        is_active: true,
      });

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
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <Shield className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p>Solo el Super Admin puede gestionar el equipo</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Equipo Admin
              </CardTitle>
              <CardDescription>
                Gestiona quién tiene acceso al panel de administración
              </CardDescription>
            </div>
            <Button onClick={() => setShowInvite(!showInvite)} size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Invitar operador
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Invite form */}
          {showInvite && (
            <Card className="border-dashed">
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label>Email del nuevo operador</Label>
                  <Input
                    type="email"
                    placeholder="operador@email.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    El usuario debe tener una cuenta en Paw Friend
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Permisos</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
                      <div key={key} className="flex items-center gap-2">
                        <Switch
                          checked={newPerms[key] || false}
                          onCheckedChange={(v) => setNewPerms((p) => ({ ...p, [key]: v }))}
                        />
                        <span className="text-sm">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      inviteOperator.mutate({ email: newEmail, permissions: newPerms })
                    }
                    disabled={!newEmail || inviteOperator.isPending}
                  >
                    Invitar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowInvite(false)}>
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
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="divide-y">
              {(members ?? []).map((member) => (
                <div key={member.id} className="flex items-center gap-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{member.display_name}</span>
                      {member.role === 'super_admin' ? (
                        <Badge className="bg-purple-100 text-purple-800 text-xs">
                          <Crown className="h-3 w-3 mr-1" />
                          Super Admin
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Operador
                        </Badge>
                      )}
                      {!member.is_active && (
                        <Badge variant="destructive" className="text-xs">
                          Inactivo
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                    {member.role === 'admin_operator' && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Object.entries(member.permissions)
                          .filter(([, v]) => v)
                          .map(([k]) => (
                            <Badge key={k} variant="secondary" className="text-[10px] px-1">
                              {PERMISSION_LABELS[k] || k}
                            </Badge>
                          ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">
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
                          className="h-8 w-8 text-red-500 hover:text-red-700"
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
