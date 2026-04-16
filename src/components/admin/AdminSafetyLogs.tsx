import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, CheckCircle, Loader2 } from '@/lib/icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface SafetyLog {
  id: string;
  user_id: string;
  flag_type: string;
  detected_phrase: string | null;
  resources_provided: string[] | null;
  reviewed: boolean | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string | null;
}

export default function AdminSafetyLogs() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['admin-safety-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bereavement_safety_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as SafetyLog[];
    },
  });

  const markReviewedMutation = useMutation({
    mutationFn: async (logId: string) => {
      const { error } = await supabase
        .from('bereavement_safety_logs' as string)
        .update({
          reviewed: true,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq('id', logId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-safety-logs'] });
      toast.success('Marcado como revisado');
    },
    onError: () => {
      toast.error('Error al marcar como revisado');
    },
  });

  const flagColors: Record<string, string> = {
    crisis: 'bg-red-500/20 text-red-300 border-red-500/30',
    warning: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    info: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
        <Shield className="h-5 w-5" /> Logs de seguridad (Bereavement)
      </h2>
      <p className="text-sm text-slate-400">
        Registros de frases detectadas por el modulo memorial que activaron protocolos de seguridad.
      </p>

      {isLoading ? (
        <div className="text-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" />
        </div>
      ) : logs.length === 0 ? (
        <Card className="border-dashed bg-slate-900 border-slate-800">
          <CardContent className="py-8 text-center">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-400" />
            <p className="font-medium text-white">Sin alertas de seguridad</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {logs.map((log) => (
            <Card
              key={log.id}
              className={`bg-slate-900 border-slate-800 ${log.flag_type === 'crisis' ? 'border-red-500/40' : ''}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    {log.flag_type === 'crisis' ? (
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                    ) : (
                      <Shield className="h-4 w-4 text-amber-400" />
                    )}
                    <Badge
                      variant="outline"
                      className={`text-xs ${flagColors[log.flag_type] || 'bg-slate-500/20 text-slate-300'}`}
                    >
                      {log.flag_type}
                    </Badge>
                    {log.reviewed && (
                      <Badge
                        variant="outline"
                        className="text-xs bg-green-500/20 text-green-300 border-green-500/30"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" /> Revisado
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {log.created_at && (
                      <span className="text-xs text-slate-500">
                        {format(new Date(log.created_at), 'd MMM yyyy HH:mm', { locale: es })}
                      </span>
                    )}
                    {!log.reviewed && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white text-xs"
                        onClick={() => markReviewedMutation.mutate(log.id)}
                        disabled={markReviewedMutation.isPending}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Marcar como revisado
                      </Button>
                    )}
                  </div>
                </div>
                {log.detected_phrase && (
                  <p className="text-sm bg-slate-800 p-2 rounded text-slate-400 italic">
                    &ldquo;{log.detected_phrase}&rdquo;
                  </p>
                )}
                <p className="text-xs text-slate-500 mt-2 font-mono">
                  User: {log.user_id.slice(0, 8)}...
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
