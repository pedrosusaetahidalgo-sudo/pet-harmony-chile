import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Partner {
  id: string;
  brand_name: string;
  ad_text: string;
  ad_link: string;
  category: string;
  placement: string;
  is_active: boolean | null;
  priority: number | null;
  contact_phone: string | null;
  contact_email: string | null;
  website: string | null;
  address: string | null;
  commune: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  social_media: Record<string, string> | null;
  ad_image_url: string | null;
}

export const PARTNER_CATEGORY_LABELS: Record<string, string> = {
  store: 'Tienda',
  insurance: 'Seguro',
  clinic: 'Clinica',
  food: 'Alimento',
  general: 'Servicio',
  adoption: 'Adopcion',
};

export const PARTNER_CATEGORY_ICONS: Record<string, string> = {
  store: '🛒',
  insurance: '🛡️',
  clinic: '🏥',
  food: '🍖',
  general: '📍',
  adoption: '🐾',
};

export const usePartners = () => {
  const {
    data: partners,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['partners-directory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as Partner[];
    },
  });

  const getPartnersByCategory = (category: string) =>
    partners?.filter((p) => p.category === category) || [];

  const getPartnersWithGeodata = () =>
    partners?.filter((p) => p.latitude != null && p.longitude != null) || [];

  return { partners, isLoading, error, getPartnersByCategory, getPartnersWithGeodata };
};
