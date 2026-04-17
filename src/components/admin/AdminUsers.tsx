import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Eye,
  Search,
  Shield,
  ShieldOff,
  UserCog,
  ChevronLeft,
  ChevronRight,
  Filter,
  Clock,
  PawPrint,
  Crown,
  Users,
  AlertCircle,
} from '@/lib/icons';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { formatDistanceToNowStrict } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Tables } from '@/integrations/supabase/types';

const PAGE_SIZE = 20;
const INACTIVE_DAYS = 14;

const roleLabels: Record<string, string> = {
  user: 'Usuario',
  admin: 'Administrador',
  moderator: 'Moderador',
  dog_walker: 'Paseador',
  dog_sitter: 'Cuidador',
  vet: 'Veterinario',
  trainer: 'Entrenador',
};

type StatusFilter = 'all' | 'active' | 'inactive';
type SortOption = 'recent' | 'oldest' | 'name_asc';

const AdminUsers = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('recent');
  const [page, setPage] = useState(0);
  const [selectedUser, setSelectedUser] = useState<Tables<'profiles'> | null>(null);

  const inactiveCutoff = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - INACTIVE_DAYS);
    return d.toISOString();
  }, []);

  // ── Server-side paginated profiles ──
  const { data: profilesResult, isLoading } = useQuery({
    queryKey: ['admin-profiles', page, searchQuery, statusFilter, sortOption],
    queryFn: async () => {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase.from('profiles').select('*', { count: 'exact' });

      // Search filter
      if (searchQuery.trim()) {
        query = query.or(
          `display_name.ilike.%${searchQuery.trim()}%,id.ilike.%${searchQuery.trim()}%`
        );
      }

      // Status filter
      if (statusFilter === 'active') {
        query = query.gt('updated_at', inactiveCutoff);
      } else if (statusFilter === 'inactive') {
        query = query.lte('updated_at', inactiveCutoff);
      }

      // Sort
      if (sortOption === 'recent') {
        query = query.order('created_at', { ascending: false });
      } else if (sortOption === 'oldest') {
        query = query.order('created_at', { ascending: true });
      } else {
        query = query.order('display_name', { ascending: true });
      }

      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;
      return { data: data ?? [], count: count ?? 0 };
    },
    placeholderData: (prev) => prev,
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  const profiles = profilesResult?.data ?? [];
  const totalCount = profilesResult?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // ── User roles ──
  const { data: userRoles } = useQuery({
    queryKey: ['admin-user-roles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_roles').select('*');
      if (error) throw error;
      return data;
    },
  });

  // ── User stats ──
  const { data: userStats } = useQuery({
    queryKey: ['admin-user-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_stats').select('*');
      if (error) throw error;
      return data;
    },
  });

  // ── Active subscriptions (batch) ──
  const { data: activeSubUsers } = useQuery({
    queryKey: ['admin-active-sub-users'],
    staleTime: 60_000,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('subscriptions') as any)
        .select('user_id, plan_type')
        .eq('status', 'active');
      if (error) throw error;
      const map = new Map<string, string>();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((data as Array<Record<string, any>>) ?? []).forEach((s: any) => {
        map.set(s.user_id, s.plan_type);
      });
      return map;
    },
  });

  const addRoleMutation = useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: string;
      role: 'admin' | 'dog_walker' | 'dogsitter' | 'trainer' | 'user' | 'veterinarian';
    }) => {
      const { error } = await supabase.from('user_roles').insert({ user_id: userId, role });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-roles'] });
      toast.success('Rol agregado correctamente');
    },
    onError: (error: unknown) => {
      if (error instanceof Error && error.message?.includes('duplicate')) {
        toast.error('El usuario ya tiene este rol');
      } else {
        toast.error('Error al agregar rol');
      }
    },
  });

  const removeRoleMutation = useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: string;
      role: 'admin' | 'dog_walker' | 'dogsitter' | 'trainer' | 'user' | 'veterinarian';
    }) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-roles'] });
      toast.success('Rol eliminado correctamente');
    },
    onError: () => {
      toast.error('Error al eliminar rol');
    },
  });

  const getUserRoles = (userId: string) => {
    return userRoles?.filter((r) => r.user_id === userId).map((r) => r.role) || [];
  };

  const getUserStats = (userId: string) => {
    return userStats?.find((s) => s.user_id === userId);
  };

  const isUserInactive = (profile: Tables<'profiles'>) => {
    if (!profile.updated_at) return true;
    return new Date(profile.updated_at) <= new Date(inactiveCutoff);
  };

  const formatLastActivity = (updatedAt: string | null) => {
    if (!updatedAt) return '-';
    try {
      return 'Hace ' + formatDistanceToNowStrict(new Date(updatedAt), { locale: es });
    } catch {
      return '-';
    }
  };

  // Reset page when filters change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(0);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value as StatusFilter);
    setPage(0);
  };

  const handleSortChange = (value: string) => {
    setSortOption(value as SortOption);
    setPage(0);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCog className="h-5 w-5" />
          Gestion de Usuarios
          <Badge variant="secondary" className="ml-auto font-normal">
            {totalCount} usuarios
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filter row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o ID..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Activo</SelectItem>
              <SelectItem value="inactive">Inactivo</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortOption} onValueChange={handleSortChange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Mas recientes</SelectItem>
              <SelectItem value="oldest">Mas antiguos</SelectItem>
              <SelectItem value="name_asc">Nombre A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : profiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground font-medium">No se encontraron usuarios</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Intenta con otros filtros o terminos de busqueda
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead className="text-center">
                      <PawPrint className="h-3.5 w-3.5 inline-block mr-1" />
                      Mascotas
                    </TableHead>
                    <TableHead>Ultima actividad</TableHead>
                    <TableHead>Registro</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles.map((profile) => {
                    const roles = getUserRoles(profile.id);
                    const stats = getUserStats(profile.id);
                    const inactive = isUserInactive(profile);
                    const subPlan = activeSubUsers?.get(profile.id);
                    return (
                      <TableRow key={profile.id} className={cn(inactive && 'opacity-70')}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={profile.avatar_url || ''} />
                              <AvatarFallback>
                                {profile.display_name?.[0]?.toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">
                              {profile.display_name || 'Sin nombre'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          {(profile as any).email || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {roles.map((role) => (
                              <Badge
                                key={role}
                                variant={role === 'admin' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {roleLabels[role] || role}
                              </Badge>
                            ))}
                            {roles.length === 0 && (
                              <span className="text-muted-foreground text-xs">Sin roles</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {subPlan ? (
                            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 text-xs">
                              <Crown className="h-3 w-3 mr-1" />
                              {subPlan}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">Gratis</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">{stats?.pets_count ?? 0}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs">
                              {formatLastActivity(profile.updated_at)}
                            </span>
                            {inactive && (
                              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                Inactivo &gt;14d
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(profile.created_at).toLocaleDateString('es-CL')}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedUser(profile)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination controls */}
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                Pagina {page + 1} de {totalPages} ({totalCount} total)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Detail dialog */}
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Gestionar Usuario</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedUser.avatar_url || ''} />
                    <AvatarFallback className="text-xl">
                      {selectedUser.display_name?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-lg">
                      {selectedUser.display_name || 'Sin nombre'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedUser.location || 'Sin ubicacion'}
                    </p>
                    {activeSubUsers?.get(selectedUser.id) ? (
                      <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 text-xs mt-1">
                        <Crown className="h-3 w-3 mr-1" />
                        {activeSubUsers.get(selectedUser.id)} activo
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs mt-1">
                        Plan Gratis
                      </Badge>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Bio</p>
                  <p className="bg-muted p-2 rounded text-sm">
                    {selectedUser.bio || 'Sin descripcion'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Roles actuales</p>
                  <div className="flex flex-wrap gap-2">
                    {getUserRoles(selectedUser.id).map((role) => (
                      <Badge key={role} variant="secondary" className="flex items-center gap-1">
                        {roleLabels[role] || role}
                        <button
                          onClick={() =>
                            removeRoleMutation.mutate({ userId: selectedUser.id, role })
                          }
                          className="ml-1 hover:text-destructive"
                        >
                          <ShieldOff className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Agregar rol</p>
                  <Select
                    onValueChange={(role) =>
                      addRoleMutation.mutate({
                        userId: selectedUser.id,
                        role: role as
                          | 'admin'
                          | 'dog_walker'
                          | 'dogsitter'
                          | 'trainer'
                          | 'user'
                          | 'veterinarian',
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="moderator">Moderador</SelectItem>
                      <SelectItem value="dog_walker">Paseador</SelectItem>
                      <SelectItem value="dog_sitter">Cuidador</SelectItem>
                      <SelectItem value="vet">Veterinario</SelectItem>
                      <SelectItem value="trainer">Entrenador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">Nivel</p>
                    <p className="font-medium">{getUserStats(selectedUser.id)?.level || 1}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Puntos</p>
                    <p className="font-medium">
                      {getUserStats(selectedUser.id)?.total_points || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Mascotas</p>
                    <p className="font-medium">{getUserStats(selectedUser.id)?.pets_count || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Posts</p>
                    <p className="font-medium">{getUserStats(selectedUser.id)?.posts_count || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ultima actividad</p>
                    <p className="font-medium text-sm">
                      {formatLastActivity(selectedUser.updated_at)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default AdminUsers;
