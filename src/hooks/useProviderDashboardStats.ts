import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

export interface ProviderDashboardStats {
  providerId: string | null;
  slug: string | null;
  isDirectoryVisible: boolean;
  // Engagement (from service_providers)
  profileViews: number;
  avgRating: number | null;
  totalReviews: number;
  // Clinical activity this month
  patientsThisMonth: number;
  notesThisMonth: number;
  followupsPending: number;
  sharedFichasThisWeek: number;
  // Bookings (from vet_bookings)
  bookingsThisMonth: number;
  estimatedRevenue: number;
  // Reviews this month
  reviewsThisMonth: number;
  // Review invitations
  invitationsSent: number;
  invitationsConverted: number;
}

const EMPTY_STATS: ProviderDashboardStats = {
  providerId: null,
  slug: null,
  isDirectoryVisible: false,
  profileViews: 0,
  avgRating: null,
  totalReviews: 0,
  patientsThisMonth: 0,
  notesThisMonth: 0,
  followupsPending: 0,
  sharedFichasThisWeek: 0,
  bookingsThisMonth: 0,
  estimatedRevenue: 0,
  reviewsThisMonth: 0,
  invitationsSent: 0,
  invitationsConverted: 0,
};

export function useProviderDashboardStats() {
  const { user } = useAuth();

  return useQuery<ProviderDashboardStats>({
    queryKey: ['provider-dashboard-stats', user?.id],
    queryFn: async (): Promise<ProviderDashboardStats> => {
      if (!user) return EMPTY_STATS;

      // 1. Get provider record
      const { data: provider } = await supabase
        .from('service_providers')
        .select('id, slug, is_directory_visible, directory_views, avg_rating, total_reviews')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!provider) return EMPTY_STATS;

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      // 2. Parallel queries for real data
      const [clinicalRes, sharedRes, bookingsRes, reviewsRes, invitationsRes, followupsRes] =
        await Promise.all([
          // Clinical notes this month (patients + note count)
          sb
            .from('vet_clinical_notes')
            .select('pet_id')
            .eq('provider_id', provider.id)
            .gte('created_at', startOfMonth),

          // Shared fichas this week
          supabase
            .from('medical_share_tokens')
            .select('id')
            .eq('target_provider_id', provider.id)
            .eq('is_revoked', false)
            .gte('created_at', sevenDaysAgo.toISOString()),

          // Bookings this month (vet_bookings uses vet_id = auth user id)
          sb
            .from('vet_bookings')
            .select('id, total_price, status')
            .eq('vet_id', user.id)
            .gte('scheduled_date', startOfMonth),

          // Reviews this month
          supabase
            .from('service_reviews')
            .select('id')
            .eq('provider_id', provider.id)
            .gte('created_at', startOfMonth),

          // Review invitations (all time for conversion rate)
          supabase.from('review_invitations').select('id, is_used').eq('provider_id', provider.id),

          // Followups pending (next 7 days)
          sb
            .from('vet_clinical_notes')
            .select('id')
            .eq('provider_id', provider.id)
            .eq('followup_required', true)
            .gte('followup_date', now.toISOString().split('T')[0])
            .lte('followup_date', sevenDaysFromNow.toISOString().split('T')[0]),
        ]);

      // Calculate patients (unique pet_ids)
      const clinicalNotes = clinicalRes.data || [];
      const uniquePets = new Set(clinicalNotes.map((n: { pet_id: string }) => n.pet_id));

      // Calculate bookings revenue (completed only)
      const bookings = bookingsRes.data || [];
      const completedBookings = bookings.filter(
        (b: { status: string }) => b.status === 'completado' || b.status === 'completed'
      );
      const estimatedRevenue = completedBookings.reduce(
        (sum: number, b: { total_price: number }) => sum + (b.total_price || 0),
        0
      );

      // Invitations
      const invitations = invitationsRes.data || [];
      const invitationsConverted = invitations.filter(
        (i: { is_used: boolean | null }) => i.is_used === true
      ).length;

      return {
        providerId: provider.id,
        slug: provider.slug,
        isDirectoryVisible: provider.is_directory_visible ?? false,
        profileViews: provider.directory_views ?? 0,
        avgRating: provider.avg_rating ? Number(provider.avg_rating) : null,
        totalReviews: provider.total_reviews ?? 0,
        patientsThisMonth: uniquePets.size,
        notesThisMonth: clinicalNotes.length,
        followupsPending: followupsRes.data?.length ?? 0,
        sharedFichasThisWeek: sharedRes.data?.length ?? 0,
        bookingsThisMonth: bookings.length,
        estimatedRevenue,
        reviewsThisMonth: reviewsRes.data?.length ?? 0,
        invitationsSent: invitations.length,
        invitationsConverted,
      };
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 min
  });
}
