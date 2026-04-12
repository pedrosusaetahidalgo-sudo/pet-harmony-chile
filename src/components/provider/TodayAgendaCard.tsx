import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock } from '@/lib/icons';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

interface TodayBooking {
  id: string;
  scheduled_date: string;
  service_type: string | null;
  status: string;
  pet_name: string | null;
  owner_name: string | null;
}

export function TodayAgendaCard() {
  const { user } = useAuth();

  const { data: bookings = [] } = useQuery<TodayBooking[]>({
    queryKey: ['today-agenda', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await sb
        .from('vet_bookings')
        .select('id, scheduled_date, service_type, status, pet_id, owner_id')
        .eq('vet_id', user.id)
        .gte('scheduled_date', today)
        .lt('scheduled_date', today + 'T23:59:59')
        .neq('status', 'cancelled')
        .order('scheduled_date', { ascending: true });

      if (error || !data) return [];

      // Enriquecer con nombres
      const petIds = [
        ...new Set(data.map((b: Record<string, string | null>) => b.pet_id).filter(Boolean)),
      ];
      const ownerIds = [
        ...new Set(data.map((b: Record<string, string | null>) => b.owner_id).filter(Boolean)),
      ];

      const petMap = new Map<string, string>();
      const ownerMap = new Map<string, string>();

      if (petIds.length > 0) {
        const { data: pets } = await supabase
          .from('pets')
          .select('id, name')
          .in('id', petIds as string[]);
        pets?.forEach((p) => petMap.set(p.id, p.name));
      }

      if (ownerIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name')
          .in('id', ownerIds as string[]);
        profiles?.forEach((p) => ownerMap.set(p.id, p.display_name || ''));
      }

      return data.map((b: Record<string, string | null>) => ({
        id: b.id!,
        scheduled_date: b.scheduled_date!,
        service_type: b.service_type,
        status: b.status!,
        pet_name: b.pet_id ? petMap.get(b.pet_id) || null : null,
        owner_name: b.owner_id ? ownerMap.get(b.owner_id) || null : null,
      }));
    },
    enabled: !!user,
  });

  return (
    <Card className="border-purple-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="h-5 w-5 text-purple-600" />
          Agenda de hoy
          {bookings.length > 0 && (
            <Badge variant="secondary" className="ml-auto bg-purple-100 text-purple-700">
              {bookings.length} {bookings.length === 1 ? 'cita' : 'citas'}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Sin citas para hoy</p>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => {
              const time = b.scheduled_date
                ? new Date(b.scheduled_date).toLocaleTimeString('es-CL', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : null;
              return (
                <div
                  key={b.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {b.pet_name || 'Paciente'}
                      {b.owner_name ? ` · ${b.owner_name}` : ''}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      {time && (
                        <>
                          <Clock className="h-3 w-3" />
                          {time}
                          {b.service_type && ' · '}
                        </>
                      )}
                      {b.service_type}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] capitalize flex-shrink-0">
                    {b.status}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
