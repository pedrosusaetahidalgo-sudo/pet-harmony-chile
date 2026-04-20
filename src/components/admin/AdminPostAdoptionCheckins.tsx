/**
 * Panel admin para ver el estado de los post-adoption check-ins. Muestra:
 *   - Stats (total programados, enviados, respondidos, tasa de respuesta)
 *   - Filtros por status y milestone (7/30/90)
 *   - Lista con respuestas + score promedio
 *   - Link al pet + al shelter
 */
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Star, Search, Clock, Heart } from 'lucide-react';

type Status = 'pending' | 'sent' | 'responded' | 'skipped' | 'failed';
type Milestone = 7 | 30 | 90;

interface CheckinRow {
  id: string;
  pet_id: string;
  shelter_id: string | null;
  owner_email: string;
  milestone_days: Milestone;
  status: Status;
  scheduled_at: string;
  sent_at: string | null;
  responded_at: string | null;
  response_score: number | null;
  response_notes: string | null;
  error_message: string | null;
  created_at: string;
}

interface PetRow {
  id: string;
  name: string;
}
interface ShelterRow {
  id: string;
  legal_name: string;
}

const STATUS_COLOR: Record<Status, string> = {
  pending: 'border-blue-300 text-blue-700 bg-blue-50',
  sent: 'border-amber-300 text-amber-700 bg-amber-50',
  responded: 'border-green-300 text-green-700 bg-green-50',
  skipped: 'border-slate-300 text-slate-700 bg-slate-50',
  failed: 'border-red-300 text-red-700 bg-red-50',
};

export default function AdminPostAdoptionCheckins() {
  const [statusFilter, setStatusFilter] = useState<'all' | Status>('all');
  const [milestoneFilter, setMilestoneFilter] = useState<'all' | Milestone>('all');
  const [search, setSearch] = useState('');

  const { data: checkins, isLoading } = useQuery<CheckinRow[]>({
    queryKey: ['admin-post-adoption-checkins', statusFilter, milestoneFilter],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let q: any = supabase
        .from('post_adoption_checkins')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      if (statusFilter !== 'all') q = q.eq('status', statusFilter);
      if (milestoneFilter !== 'all') q = q.eq('milestone_days', milestoneFilter);
      const { data } = await q;
      return (data as CheckinRow[]) || [];
    },
  });

  const petIds = useMemo(() => [...new Set((checkins || []).map((c) => c.pet_id))], [checkins]);
  const shelterIds = useMemo(
    () => [...new Set((checkins || []).map((c) => c.shelter_id).filter((x): x is string => !!x))],
    [checkins]
  );

  const { data: pets } = useQuery<PetRow[]>({
    queryKey: ['admin-checkin-pets', petIds],
    queryFn: async () => {
      if (petIds.length === 0) return [];
      const { data } = await supabase.from('pets').select('id, name').in('id', petIds);
      return (data as PetRow[]) || [];
    },
    enabled: petIds.length > 0,
  });

  const { data: shelters } = useQuery<ShelterRow[]>({
    queryKey: ['admin-checkin-shelters', shelterIds],
    queryFn: async () => {
      if (shelterIds.length === 0) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('adoption_centers') as any)
        .select('id, legal_name')
        .in('id', shelterIds);
      return (data as ShelterRow[]) || [];
    },
    enabled: shelterIds.length > 0,
  });

  const petMap = new Map((pets || []).map((p) => [p.id, p]));
  const shelterMap = new Map((shelters || []).map((s) => [s.id, s]));

  const filtered =
    checkins?.filter((c) => {
      if (!search) return true;
      const q = search.toLowerCase();
      const pet = petMap.get(c.pet_id);
      const shelter = c.shelter_id ? shelterMap.get(c.shelter_id) : null;
      return (
        c.owner_email.toLowerCase().includes(q) ||
        (pet?.name || '').toLowerCase().includes(q) ||
        (shelter?.legal_name || '').toLowerCase().includes(q) ||
        (c.response_notes || '').toLowerCase().includes(q)
      );
    }) || [];

  const stats = useMemo(() => {
    if (!checkins) return { total: 0, sent: 0, responded: 0, avgScore: 0, responseRate: 0 };
    const total = checkins.length;
    const sent = checkins.filter((c) => c.status === 'sent' || c.status === 'responded').length;
    const responded = checkins.filter((c) => c.status === 'responded');
    const scoreSum = responded.reduce((acc, c) => acc + (c.response_score || 0), 0);
    const avgScore = responded.length > 0 ? scoreSum / responded.length : 0;
    const responseRate = sent > 0 ? Math.round((responded.length / sent) * 100) : 0;
    return {
      total,
      sent,
      responded: responded.length,
      avgScore,
      responseRate,
    };
  }, [checkins]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatMini label="Programados" value={stats.total.toString()} />
        <StatMini label="Enviados" value={stats.sent.toString()} />
        <StatMini label="Respondidos" value={stats.responded.toString()} />
        <StatMini
          label="Tasa respuesta"
          value={`${stats.responseRate}%`}
          hint={stats.avgScore > 0 ? `Score avg ${stats.avgScore.toFixed(1)}/5` : undefined}
        />
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar email adoptante, mascota, refugio o nota"
            className="pl-9"
          />
        </div>
        <Select
          value={String(milestoneFilter)}
          onValueChange={(v) => setMilestoneFilter(v === 'all' ? 'all' : (Number(v) as Milestone))}
        >
          <SelectTrigger className="w-full md:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tiempos</SelectItem>
            <SelectItem value="7">7 dias</SelectItem>
            <SelectItem value="30">30 dias</SelectItem>
            <SelectItem value="90">90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | Status)}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="pending">Por enviar</TabsTrigger>
          <TabsTrigger value="sent">Enviados</TabsTrigger>
          <TabsTrigger value="responded">Respondidos</TabsTrigger>
          <TabsTrigger value="failed">Fallidos</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No hay check-ins con esos filtros. Se crean automaticamente cuando un refugio entrega
            una mascota.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => {
            const pet = petMap.get(c.pet_id);
            const shelter = c.shelter_id ? shelterMap.get(c.shelter_id) : null;
            return (
              <Card key={c.id}>
                <CardContent className="p-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-sm">
                          {pet?.name || `Pet #${c.pet_id.slice(0, 8)}`}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          <Clock className="h-2.5 w-2.5 mr-1" /> {c.milestone_days}d
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${STATUS_COLOR[c.status]}`}
                        >
                          {c.status}
                        </Badge>
                        {c.response_score && (
                          <Badge
                            variant="outline"
                            className="text-[10px] border-yellow-300 text-yellow-700 bg-yellow-50"
                          >
                            <Star className="h-2.5 w-2.5 mr-1 fill-yellow-400 text-yellow-400" />{' '}
                            {c.response_score}/5
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                        <span>{c.owner_email}</span>
                        {shelter && <span>· {shelter.legal_name}</span>}
                        <span>
                          · agendado {new Date(c.scheduled_at).toLocaleDateString('es-CL')}
                        </span>
                        {c.responded_at && (
                          <span>
                            · respondido {new Date(c.responded_at).toLocaleDateString('es-CL')}
                          </span>
                        )}
                      </div>
                      {c.response_notes && (
                        <div className="mt-2 p-2 rounded bg-purple-50 border-l-2 border-purple-400 text-xs whitespace-pre-wrap">
                          <span className="text-purple-700 font-semibold">Nota: </span>
                          {c.response_notes}
                        </div>
                      )}
                      {c.error_message && (
                        <div className="mt-2 p-2 rounded bg-red-50 border-l-2 border-red-400 text-xs text-red-700">
                          Error: {c.error_message}
                        </div>
                      )}
                    </div>
                    {c.response_score && c.response_score >= 4 && (
                      <Heart className="h-5 w-5 text-pink-500 flex-shrink-0" />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatMini({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-lg font-bold">{value}</div>
        {hint && <div className="text-[10px] text-muted-foreground mt-0.5">{hint}</div>}
      </CardContent>
    </Card>
  );
}
