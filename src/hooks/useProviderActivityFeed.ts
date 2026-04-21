/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const sb = supabase as any;

export interface ActivityItem {
  id: string;
  type: 'shared_ficha' | 'link_request' | 'booking' | 'review';
  description: string;
  timestamp: string;
  relativeTime: string;
}

export function useProviderActivityFeed() {
  const { user } = useAuth();

  return useQuery<ActivityItem[]>({
    queryKey: ['provider-activity-feed', user?.id],
    queryFn: async (): Promise<ActivityItem[]> => {
      if (!user) return [];

      const { data: provider } = await supabase
        .from('service_providers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!provider) return [];

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const since = sevenDaysAgo.toISOString();

      const [fichasRes, linksRes, bookingsRes, reviewsRes] = await Promise.all([
        supabase
          .from('medical_share_tokens')
          .select('id, created_at, pets(name)')
          .eq('target_provider_id', provider.id)
          .gte('created_at', since)
          .order('created_at', { ascending: false })
          .limit(5),

        sb
          .from('pet_vet_links')
          .select('id, created_at, status, pets(name)')
          .eq('provider_id', provider.id)
          .gte('created_at', since)
          .order('created_at', { ascending: false })
          .limit(5),

        sb
          .from('vet_bookings')
          .select('id, created_at, status')
          .or(`service_provider_id.eq.${provider.id},vet_id.eq.${user.id}`)
          .gte('created_at', since)
          .order('created_at', { ascending: false })
          .limit(5),

        supabase
          .from('service_reviews')
          .select('id, created_at, rating')
          .eq('provider_id', provider.id)
          .gte('created_at', since)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      const items: ActivityItem[] = [];

      (fichasRes.data || []).forEach((f: any) => {
        items.push({
          id: `ficha-${f.id}`,
          type: 'shared_ficha',
          description: `Ficha de ${f.pets?.name || 'mascota'} compartida contigo`,
          timestamp: f.created_at,
          relativeTime: formatDistanceToNow(new Date(f.created_at), {
            addSuffix: true,
            locale: es,
          }),
        });
      });

      (linksRes.data || []).forEach((l: any) => {
        const action = l.status === 'pending' ? 'quiere vincularse' : 'se vinculo';
        items.push({
          id: `link-${l.id}`,
          type: 'link_request',
          description: `${l.pets?.name || 'Paciente'} ${action} contigo`,
          timestamp: l.created_at,
          relativeTime: formatDistanceToNow(new Date(l.created_at), {
            addSuffix: true,
            locale: es,
          }),
        });
      });

      (bookingsRes.data || []).forEach((b: any) => {
        items.push({
          id: `booking-${b.id}`,
          type: 'booking',
          description: `Nueva reserva ${b.status === 'completado' ? 'completada' : 'recibida'}`,
          timestamp: b.created_at,
          relativeTime: formatDistanceToNow(new Date(b.created_at), {
            addSuffix: true,
            locale: es,
          }),
        });
      });

      (reviewsRes.data || []).forEach((r: any) => {
        items.push({
          id: `review-${r.id}`,
          type: 'review',
          description: `Nueva resena ${'★'.repeat(r.rating || 0)}`,
          timestamp: r.created_at,
          relativeTime: formatDistanceToNow(new Date(r.created_at), {
            addSuffix: true,
            locale: es,
          }),
        });
      });

      return items
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });
}
