import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Mail, Clock, User, Trash2, Ghost, AlertTriangle } from '@/lib/icons';
import { formatDistanceToNowStrict } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { track, EVENTS } from '@/lib/analytics';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

interface GhostUser {
  id: string;
  email: string;
  created_at: string;
  invited_at: string;
  pets_count: number;
  display_name: string | null;
}

/**
 * Admin: monitorea y limpia ghost users (cuentas creadas por invitacion
 * que el dueno nunca acepto). Antes el flujo create-patient las creaba
 * automaticamente; ahora el flujo correcto es solo enviar el email con
 * un link y que el dueno se registre.
 */
export default function AdminGhostUsers() {
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);

  const {
    data: ghosts,
    isLoading,
    refetch,
  } = useQuery<GhostUser[]>({
    queryKey: ['admin-ghost-users'],
    queryFn: async () => {
      const { data, error } = await sb.rpc('admin_list_ghost_users');
      if (error) throw error;
      return (data || []) as GhostUser[];
    },
    staleTime: 30_000,
  });

  const handleDeleteOne = async (userId: string, email: string) => {
    setDeletingId(userId);
    try {
      const { data, error } = await sb.rpc('admin_delete_ghost_user', {
        p_user_id: userId,
      });
      if (error) throw error;
      if (data?.success) {
        toast.success(`${email} eliminado`);
        track({
          event: EVENTS.ADMIN_ACTION,
          properties: { action: 'delete_ghost_user', target_email: email },
        });
        refetch();
      } else {
        toast.error(data?.error || 'No se pudo eliminar');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al eliminar';
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteAll = async () => {
    setDeletingAll(true);
    setConfirmDeleteAll(false);
    try {
      const { data, error } = await sb.rpc('admin_delete_all_ghost_users');
      if (error) throw error;
      if (data?.success) {
        toast.success(`${data.deleted_count} cuentas fantasma eliminadas`);
        track({
          event: EVENTS.ADMIN_BULK_ACTION,
          properties: { action: 'delete_all_ghost_users', count: data.deleted_count },
        });
        refetch();
      } else {
        toast.error('Error en limpieza masiva');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al eliminar';
      toast.error(msg);
    } finally {
      setDeletingAll(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl bg-slate-800" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Ghost className="h-5 w-5 text-purple-400" />
            Cuentas fantasma
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Cuentas creadas por invitacion (invited_at) que el duenio nunca acepto. Si esta lista
            crece, algo esta creando users automaticamente.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={
              ghosts && ghosts.length > 0
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
            }
          >
            {ghosts?.length ?? 0} fantasma{(ghosts?.length ?? 0) !== 1 ? 's' : ''}
          </Badge>
          {ghosts && ghosts.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="border-red-500/40 text-red-300 hover:bg-red-500/10"
              onClick={() => setConfirmDeleteAll(true)}
              disabled={deletingAll}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Borrar todos
            </Button>
          )}
        </div>
      </div>

      {/* Empty state */}
      {!ghosts || ghosts.length === 0 ? (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Ghost className="h-12 w-12 text-emerald-500 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Sin cuentas fantasma</h3>
            <p className="text-slate-400 text-sm max-w-md">
              No hay cuentas creadas automaticamente por invitacion. El flujo esta funcionando
              correctamente.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {/* Warning banner si hay muchas */}
          {ghosts.length >= 5 && (
            <Card className="bg-amber-500/10 border-amber-500/30">
              <CardContent className="py-3 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-200">
                  <strong>Hay {ghosts.length} cuentas fantasma.</strong> Esto puede indicar que el
                  flujo de invitacion esta creando cuentas automaticamente. Verifica que el edge
                  function create-patient este desplegado con el codigo mas reciente (sin llamadas a
                  auth.admin.generateLink ni inviteUserByEmail).
                </div>
              </CardContent>
            </Card>
          )}

          {ghosts.map((g) => (
            <Card key={g.id} className="bg-slate-900 border-slate-800">
              <CardContent className="py-3 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                  <Ghost className="h-5 w-5 text-purple-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{g.email}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400 mt-0.5">
                    {g.display_name && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {g.display_name}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      Invitado{' '}
                      {formatDistanceToNowStrict(new Date(g.invited_at), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNowStrict(new Date(g.created_at), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </span>
                    {g.pets_count > 0 && (
                      <Badge
                        variant="outline"
                        className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px]"
                      >
                        {g.pets_count} mascota{g.pets_count !== 1 ? 's' : ''} asociada
                        {g.pets_count !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-500/40 text-red-300 hover:bg-red-500/10"
                  onClick={() => handleDeleteOne(g.id, g.email)}
                  disabled={deletingId === g.id}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Confirm delete all dialog */}
      <AlertDialog open={confirmDeleteAll} onOpenChange={setConfirmDeleteAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Borrar todas las cuentas fantasma?</AlertDialogTitle>
            <AlertDialogDescription>
              Esto eliminara {ghosts?.length ?? 0} cuentas en cascada (incluyendo mascotas
              asociadas, profiles, notifications, etc.). Solo se borran cuentas con invited_at y sin
              login. Esta accion no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAll} className="bg-red-600 hover:bg-red-700">
              Borrar {ghosts?.length ?? 0} cuentas
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
