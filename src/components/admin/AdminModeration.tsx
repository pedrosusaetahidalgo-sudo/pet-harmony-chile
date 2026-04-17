import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Flag, Trash2, CheckCircle, Loader2, AlertTriangle } from '@/lib/icons';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ContentReport {
  id: string;
  post_id: string;
  reporter_id: string;
  reason: string;
  status: string;
  created_at: string;
}

interface PostPreview {
  id: string;
  content: string;
  user_id: string;
  profiles?: { display_name: string | null } | null;
}

export default function AdminModeration() {
  const queryClient = useQueryClient();
  const [confirmAction, setConfirmAction] = useState<{
    report: ContentReport;
    action: 'dismissed' | 'reviewed';
  } | null>(null);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['admin-content-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('content_reports' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as unknown as ContentReport[];
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  // Fetch post previews for reports that reference posts
  const postIds = [...new Set(reports.filter((r) => r.post_id).map((r) => r.post_id!))];
  const { data: postPreviews = [] } = useQuery({
    queryKey: ['admin-reported-posts', postIds],
    queryFn: async () => {
      if (postIds.length === 0) return [];
      const { data, error } = await supabase
        .from('posts')
        .select('id, content, user_id')
        .in('id', postIds);
      if (error) throw error;

      // Fetch author names
      const userIds = [...new Set((data || []).map((p) => p.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', userIds);
      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      return (data || []).map((p) => ({
        ...p,
        profiles: profileMap.get(p.user_id) || null,
      })) as PostPreview[];
    },
    enabled: postIds.length > 0,
  });

  const postMap = new Map(postPreviews.map((p) => [p.id, p]));

  const resolveReport = async (id: string, action: 'dismissed' | 'reviewed') => {
    // When taking action, delete the post first so the file is never lost
    // if the report-status update later fails
    if (action === 'reviewed') {
      const report = reports.find((r) => r.id === id);
      if (report?.post_id) {
        const { error: deleteError } = await supabase
          .from('posts')
          .delete()
          .eq('id', report.post_id);
        if (deleteError) {
          toast.error('Error al eliminar el contenido');
          setConfirmAction(null);
          return;
        }
      }
    }

    const { error } = await supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from('content_reports' as any)
      .update({ status: action, reviewed_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      toast(action === 'reviewed' ? 'Contenido eliminado' : 'Reporte descartado');
      queryClient.invalidateQueries({ queryKey: ['admin-content-reports'] });
    } else {
      toast.error('Error al actualizar el reporte');
    }
    setConfirmAction(null);
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-500/20 text-amber-300',
    reviewed: 'bg-red-500/20 text-red-300',
    dismissed: 'bg-slate-700/50 text-slate-400',
  };

  // Stats
  const totalReports = reports.length;
  const pendingCount = reports.filter((r) => r.status === 'pending').length;
  const actionCount = reports.filter((r) => r.status === 'reviewed').length;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-100">
        <Flag className="h-5 w-5" /> Moderacion de contenido
      </h2>

      {/* Stats row */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 rounded-lg bg-slate-900 border border-slate-800 px-3 py-2">
          <span className="text-xs text-slate-400">Total</span>
          <span className="text-sm font-bold text-slate-200">{totalReports}</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-slate-900 border border-slate-800 px-3 py-2">
          <span className="text-xs text-amber-400">Pendientes</span>
          <span className="text-sm font-bold text-amber-300">{pendingCount}</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-slate-900 border border-slate-800 px-3 py-2">
          <span className="text-xs text-red-400">Accion tomada</span>
          <span className="text-sm font-bold text-red-300">{actionCount}</span>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" />
        </div>
      ) : reports.length === 0 ? (
        <Card className="border-dashed bg-slate-900 border-slate-800">
          <CardContent className="py-8 text-center">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-400" />
            <p className="font-medium text-slate-300">Sin reportes pendientes</p>
            <p className="text-sm text-slate-500 mt-1">Todos los reportes han sido atendidos.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {reports.map((r) => {
            const post = r.post_id ? postMap.get(r.post_id) : null;
            return (
              <Card key={r.id} className="bg-slate-900 border-slate-800">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        <Badge
                          variant="outline"
                          className="text-xs capitalize border-slate-700 text-slate-300"
                        >
                          {r.post_id ? 'publicacion' : 'comentario'}
                        </Badge>
                        <Badge className={cn('text-xs', statusColors[r.status] || '')}>
                          {r.status}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          {format(new Date(r.created_at), 'd MMM yyyy HH:mm', { locale: es })}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400">Motivo: {r.reason}</p>
                      <p className="text-xs text-slate-500 font-mono">
                        ID: {r.post_id.slice(0, 8)}...
                      </p>

                      {/* Post content preview */}
                      {post && (
                        <div className="bg-slate-800/60 rounded-md p-2.5 border border-slate-700/50 mt-1">
                          <p className="text-xs text-slate-500 mb-1">
                            Publicacion de{' '}
                            <span className="text-slate-300">
                              {post.profiles?.display_name || 'Usuario'}
                            </span>
                          </p>
                          <p className="text-xs text-slate-400 line-clamp-3">
                            {post.content.length > 200
                              ? post.content.slice(0, 200) + '...'
                              : post.content}
                          </p>
                        </div>
                      )}
                    </div>
                    {r.status === 'pending' && (
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-slate-700 text-slate-300 hover:bg-slate-800"
                          onClick={() => setConfirmAction({ report: r, action: 'dismissed' })}
                        >
                          Descartar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setConfirmAction({ report: r, action: 'reviewed' })}
                        >
                          <Trash2 className="h-4 w-4 mr-1" /> Eliminar
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Confirmation dialog */}
      <Dialog open={!!confirmAction} onOpenChange={(v) => !v && setConfirmAction(null)}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-slate-100">
              {confirmAction?.action === 'reviewed'
                ? 'Confirmar eliminacion'
                : 'Confirmar descarte'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {confirmAction?.action === 'reviewed'
                ? 'El contenido reportado sera eliminado permanentemente. Esta accion no se puede deshacer.'
                : 'El reporte sera descartado y el contenido permanecera visible.'}
            </DialogDescription>
          </DialogHeader>
          {confirmAction && (
            <div className="bg-slate-800 rounded-md p-3 text-sm text-slate-300">
              <p className="text-xs text-slate-500 mb-1">Motivo del reporte:</p>
              <p>{confirmAction.report.reason}</p>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              className="border-slate-700 text-slate-300"
              onClick={() => setConfirmAction(null)}
            >
              Cancelar
            </Button>
            {confirmAction?.action === 'reviewed' ? (
              <Button
                variant="destructive"
                onClick={() => resolveReport(confirmAction.report.id, 'reviewed')}
              >
                <Trash2 className="h-4 w-4 mr-1" /> Eliminar contenido
              </Button>
            ) : confirmAction ? (
              <Button onClick={() => resolveReport(confirmAction.report.id, 'dismissed')}>
                Descartar reporte
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
