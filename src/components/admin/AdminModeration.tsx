import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Flag, Trash2, CheckCircle, Loader2, AlertTriangle } from '@/lib/icons';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ContentReport {
  id: string;
  post_id: string | null;
  comment_id: string | null;
  reporter_id: string;
  reason: string;
  status: string;
  created_at: string;
}

export default function AdminModeration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
  });

  const resolveReport = async (id: string, action: 'dismissed' | 'action_taken') => {
    const { error } = await supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from('content_reports' as any)
      .update({ status: action, reviewed_at: new Date().toISOString() })
      .eq('id', id);

    if (action === 'action_taken') {
      const report = reports.find((r) => r.id === id);
      if (report?.post_id) {
        await supabase.from('posts').delete().eq('id', report.post_id);
      }
    }

    if (!error) {
      toast({ title: action === 'action_taken' ? 'Contenido eliminado' : 'Reporte descartado' });
      queryClient.invalidateQueries({ queryKey: ['admin-content-reports'] });
    }
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    reviewed: 'bg-blue-100 text-blue-600',
    dismissed: 'bg-slate-100 text-slate-600',
    action_taken: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Flag className="h-5 w-5" /> Moderación de contenido
      </h2>

      {isLoading ? (
        <div className="text-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
        </div>
      ) : reports.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-400" />
            <p className="font-medium">Sin reportes pendientes</p>
            <p className="text-sm text-muted-foreground mt-1">
              Todos los reportes han sido atendidos.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {reports.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <Badge variant="outline" className="text-xs capitalize">
                      {r.post_id ? 'publicación' : 'comentario'}
                    </Badge>
                    <Badge className={`text-xs ${statusColors[r.status] || ''}`}>{r.status}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(r.created_at), 'd MMM yyyy HH:mm', { locale: es })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Motivo: {r.reason}</p>
                  <p className="text-xs text-muted-foreground mt-1 font-mono">
                    ID: {(r.post_id || r.comment_id || '').slice(0, 8)}...
                  </p>
                </div>
                {r.status === 'pending' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => resolveReport(r.id, 'dismissed')}
                    >
                      Descartar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => resolveReport(r.id, 'action_taken')}
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Eliminar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
