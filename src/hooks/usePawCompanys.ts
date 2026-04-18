import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type PawCompanyTier = 'bronze' | 'silver' | 'gold';
export type PawCompanyStatus = 'pending' | 'active' | 'inactive' | 'rejected';
/**
 * Tipo de alianza (2026-04-19):
 * - 'sponsor' = empresa que aporta dinero mensual (Paw Companys clasico).
 * - 'partner' = tienda/accesorios/restaurante que aporta descuentos/flujo
 *   a cambio de exposicion (Paw Partners).
 */
export type PartnershipType = 'sponsor' | 'partner';

export interface PawMemberDiscount {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  website: string | null;
  description: string | null;
  paw_member_discount: string;
  partnership_type: PartnershipType;
}

export interface PawCompany {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  website: string | null;
  description: string | null;
  tier: PawCompanyTier;
  monthly_clp: number | null;
  featured: boolean;
  is_active: boolean;
  status: PawCompanyStatus;
  contact_email: string | null;
  started_at: string | null;
  notes: string | null;
  partnership_type: PartnershipType;
  paw_member_discount: string | null;
  created_at: string;
  updated_at: string;
}

export interface PawCompanyInput {
  name: string;
  slug: string;
  logo_url?: string | null;
  website?: string | null;
  description?: string | null;
  tier: PawCompanyTier;
  monthly_clp?: number | null;
  featured?: boolean;
  is_active?: boolean;
  status?: PawCompanyStatus;
  contact_email?: string | null;
  started_at?: string | null;
  notes?: string | null;
}

const PUBLIC_COLUMNS = 'id,name,slug,logo_url,website,description,tier,featured,started_at';

export function usePublicPawCompanys() {
  return useQuery({
    queryKey: ['paw-companys', 'public'],
    queryFn: async () => {
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('paw_companys' as any)
        .select(PUBLIC_COLUMNS)
        .eq('is_active', true)
        .order('featured', { ascending: false })
        .order('tier', { ascending: true })
        .order('name', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Array<
        Pick<
          PawCompany,
          | 'id'
          | 'name'
          | 'slug'
          | 'logo_url'
          | 'website'
          | 'description'
          | 'tier'
          | 'featured'
          | 'started_at'
        >
      >;
    },
    staleTime: 10 * 60_000,
    gcTime: 30 * 60_000,
  });
}

export function useAdminPawCompanys() {
  return useQuery({
    queryKey: ['paw-companys', 'admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('paw_companys' as any)
        .select('*')
        .order('is_active', { ascending: false })
        .order('featured', { ascending: false })
        .order('name', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as PawCompany[];
    },
    staleTime: 60_000,
  });
}

export function useUpsertPawCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: PawCompanyInput }) => {
      if (id) {
        const { error } = await supabase
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .from('paw_companys' as any)
          .update(input)
          .eq('id', id);
        if (error) throw error;
        return id;
      }
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('paw_companys' as any)
        .insert(input)
        .select('id')
        .single();
      if (error) throw error;
      return (data as { id: string }).id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['paw-companys'] });
    },
  });
}

/**
 * Lista publica de partners con descuentos activos para Paw Members.
 * Usa el RPC get_paw_member_discounts (SECURITY DEFINER).
 */
export function usePawMemberDiscounts() {
  return useQuery({
    queryKey: ['paw-member-discounts'],
    queryFn: async (): Promise<PawMemberDiscount[]> => {
      const { data, error } = await supabase.rpc('get_paw_member_discounts');
      if (error) throw error;
      return (data ?? []) as PawMemberDiscount[];
    },
    staleTime: 10 * 60_000,
    gcTime: 30 * 60_000,
  });
}

export function useDeletePawCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('paw_companys' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['paw-companys'] });
    },
  });
}

/**
 * Aplicacion publica de una empresa para ser Paw Company.
 * Envia con status='pending' + is_active=false (no visible hasta aprobacion admin).
 */
export function useApplyAsPawCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Omit<PawCompanyInput, 'status' | 'is_active' | 'featured' | 'notes'>
    ) => {
      const payload = {
        ...input,
        status: 'pending' as const,
        is_active: false,
        featured: false,
        notes: null,
      };
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('paw_companys' as any)
        .insert(payload)
        .select('id')
        .single();
      if (error) throw error;
      return (data as { id: string }).id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['paw-companys'] });
    },
  });
}
