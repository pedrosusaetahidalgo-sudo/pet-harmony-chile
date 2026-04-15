import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, CheckCircle2, Loader2 } from '@/lib/icons';
import { formatDistanceToNowStrict, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { LINKS } from '@/lib/links';
import { toast } from 'sonner';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

interface FollowupNote {
  id: string;
  pet_id: string;
  title: string;
  followup_date: string;
  followup_reason: string | null;
  pet_name?: string;
}

export function VetFollowupsCard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: followups = [] } = useQuery<FollowupNote[]>({
    queryKey: ['vet-followups', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: provider } = await supabase
        .from('service_providers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!provider) return [];

      const now = new Date();
      const weekLater = new Date();
      weekLater.setDate(weekLater.getDate() + 7);

      const { data, error } = await sb
        .from('vet_clinical_notes')
        .select('id, pet_id, title, followup_date, followup_reason')
        .eq('provider_id', provider.id)
        .eq('followup_required', true)
        .gte('followup_date', now.toISOString().split('T')[0])
        .lte('followup_date', weekLater.toISOString().split('T')[0])
        .order('followup_date', { ascending: true })
        .limit(5);

      if (error) return [];

      const petIds = [...new Set((data as FollowupNote[]).map((d) => d.pet_id))];
      if (petIds.length === 0) return [];

      const { data: pets } = await supabase.from('pets').select('id, name').in('id', petIds);
      const petMap = new Map((pets ?? []).map((p) => [p.id, p.name]));

      return (data as FollowupNote[]).map((note) => ({
        ...note,
        pet_name: petMap.get(note.pet_id) ?? 'Mascota',
      }));
    },
    enabled: !!user,
  });

  const markDone = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await sb
        .from('vet_clinical_notes')
        .update({ followup_required: false })
        .eq('id', noteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vet-followups'] });
      toast.success('Seguimiento marcado como completado');
    },
    onError: () => {
      toast.error('Error al actualizar el seguimiento');
    },
  });

  if (followups.length === 0) return null;

  return (
    <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="h-5 w-5 text-amber-600" />
          Seguimientos esta semana ({followups.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {followups.map((f) => (
          <div
            key={f.id}
            className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-200"
          >
            <Link
              to={`${LINKS.petClinical(f.pet_id)}?grabar=0`}
              className="min-w-0 flex-1 hover:opacity-80 transition-opacity"
            >
              <p className="text-sm font-semibold truncate">
                {f.pet_name} — {f.followup_reason ?? f.title}
              </p>
              <p className="text-xs text-amber-700">
                {formatDistanceToNowStrict(parseISO(f.followup_date), {
                  addSuffix: true,
                  locale: es,
                })}
              </p>
            </Link>
            <Button
              size="sm"
              variant="ghost"
              className="text-green-700 hover:text-green-800 hover:bg-green-100 flex-shrink-0"
              title="Marcar como completado"
              disabled={markDone.isPending}
              onClick={() => markDone.mutate(f.id)}
            >
              {markDone.isPending && markDone.variables === f.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
