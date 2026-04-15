import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Users, Star } from '@/lib/icons';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';

/**
 * Compact "Próximas 24h" summary card for ProviderDashboard.
 * Shows: upcoming appointments, new patients today, recent reviews.
 */
export function Next24hCard() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['next-24h-summary', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data: provider } = await supabase
        .from('service_providers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!provider) return null;

      const now = new Date();
      const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const todayStr = now.toISOString().split('T')[0];

      const [bookingsRes, reviewsRes] = await Promise.all([
        // Bookings in next 24h
        supabase
          .from('vet_bookings')
          .select('id, pet_id', { count: 'exact', head: false })
          .or(`vet_id.eq.${user.id},service_provider_id.eq.${provider.id}`)
          .gte('scheduled_date', now.toISOString())
          .lt('scheduled_date', in24h.toISOString())
          .neq('status', 'cancelado'),
        // Reviews in last 24h
        supabase
          .from('service_reviews')
          .select('id, rating', { count: 'exact', head: false })
          .eq('provider_id', provider.id)
          .gte('created_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()),
      ]);

      const bookings = bookingsRes.data || [];
      const uniquePets = new Set(bookings.map((b) => b.pet_id).filter(Boolean));

      return {
        appointmentCount: bookingsRes.count || 0,
        patientCount: uniquePets.size,
        reviewCount: reviewsRes.count || 0,
        avgRating:
          reviewsRes.data && reviewsRes.data.length > 0
            ? (
                reviewsRes.data.reduce((sum, r) => sum + r.rating, 0) / reviewsRes.data.length
              ).toFixed(1)
            : null,
      };
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 min
  });

  if (isLoading) {
    return <Skeleton className="h-20 w-full rounded-xl" />;
  }

  if (!data) return null;

  const items = [
    {
      icon: Calendar,
      value: data.appointmentCount,
      label: 'Citas',
      color: 'text-teal-600',
      bg: 'bg-teal-50',
      href: '/mis-reservas',
    },
    {
      icon: Users,
      value: data.patientCount,
      label: 'Pacientes',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      href: '/provider/pacientes',
    },
    {
      icon: Star,
      value: data.reviewCount,
      label: data.avgRating ? `Reseñas (${data.avgRating}★)` : 'Reseñas',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      href: '/provider/profile-edit',
    },
  ];

  return (
    <Card className="border-teal-200/60 bg-gradient-to-r from-teal-50/50 to-cyan-50/30">
      <CardContent className="p-3">
        <p className="text-xs font-semibold text-teal-800 mb-2">Próximas 24 horas</p>
        <div className="grid grid-cols-3 gap-2">
          {items.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white/60 transition-colors"
            >
              <div className={`rounded-full p-1.5 ${item.bg}`}>
                <item.icon className={`h-4 w-4 ${item.color}`} />
              </div>
              <span className="text-lg font-bold text-foreground">{item.value}</span>
              <span className="text-[10px] text-muted-foreground text-center leading-tight">
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
