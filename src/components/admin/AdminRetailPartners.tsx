/**
 * AdminRetailPartners — gestion de retailers partners + KPIs.
 *
 * Spec: Refactor Maestro Fase 2 §7.4.
 *
 * 2 secciones:
 *   1. Partners — toggle is_active.
 *   2. KPIs ultimos 30d (clicks totales + unique owners) por partner.
 *
 * Pricing/catalogo se edita via SQL (es complejo).
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingBag, ExternalLink } from '@/lib/icons';
import { toast } from 'sonner';

interface RetailPartnerRow {
  id: string;
  slug: string;
  display_name: string;
  contact_email: string;
  partner_url: string | null;
  tier: 'affiliate' | 'marketplace' | 'brand_partner';
  commission_percent: number;
  paw_member_discount_percent: number | null;
  categories: string[];
  is_active: boolean;
  display_order: number;
  notes: string | null;
}

interface PartnerStats {
  total_clicks: number;
  unique_owners: number;
  conversions: number;
  total_conversion_clp: number;
}

const TIER_LABEL: Record<string, string> = {
  affiliate: 'Affiliate · 8-12% RS',
  marketplace: 'Marketplace · 15% + setup',
  brand_partner: 'Brand Partner · $3k+/mes',
};

export function AdminRetailPartners() {
  const qc = useQueryClient();

  const { data: partners, isLoading } = useQuery({
    queryKey: ['admin-retail-partners'],
    queryFn: async (): Promise<RetailPartnerRow[]> => {
      const { data, error } = await supabase
        .from('retail_partners')
        .select(
          'id, slug, display_name, contact_email, partner_url, tier, commission_percent, paw_member_discount_percent, categories, is_active, display_order, notes'
        )
        .order('display_order', { ascending: true });
      if (error) throw error;
      return (data ?? []) as RetailPartnerRow[];
    },
  });

  const toggleActive = useMutation({
    mutationFn: async (args: { id: string; next: boolean }) => {
      const { error } = await supabase
        .from('retail_partners')
        .update({ is_active: args.next, updated_at: new Date().toISOString() })
        .eq('id', args.id);
      if (error) throw error;
    },
    onSuccess: (_, args) => {
      toast.success(args.next ? 'Partner activado' : 'Partner desactivado');
      qc.invalidateQueries({ queryKey: ['admin-retail-partners'] });
    },
    onError: (err) =>
      toast.error('Error', {
        description: err instanceof Error ? err.message : 'unknown',
      }),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShoppingBag className="h-4 w-4 text-orange-600" />
          Retail partners
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading && <Skeleton className="h-24 w-full" />}
        {!isLoading && partners && partners.length === 0 && (
          <p className="text-sm text-muted-foreground">No hay retail partners cargados.</p>
        )}
        {!isLoading &&
          partners?.map((p) => (
            <PartnerRow
              key={p.id}
              partner={p}
              onToggle={(next) => toggleActive.mutate({ id: p.id, next })}
            />
          ))}
        <p className="text-[11px] text-muted-foreground pt-2 italic">
          Catalogo de productos se edita via SQL (product_catalog JSONB).
        </p>
      </CardContent>
    </Card>
  );
}

function PartnerRow({
  partner,
  onToggle,
}: {
  partner: RetailPartnerRow;
  onToggle: (next: boolean) => void;
}) {
  const { data: stats } = useQuery({
    queryKey: ['retail-partner-stats', partner.id],
    enabled: partner.is_active,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<PartnerStats | null> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).rpc('retail_partner_stats', {
        p_partner_id: partner.id,
        p_days: 30,
      });
      if (error) return null;
      const arr = (data as PartnerStats[] | null) ?? [];
      return arr[0] ?? null;
    },
  });

  return (
    <div className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors">
      <Switch checked={partner.is_active} onCheckedChange={onToggle} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-sm">{partner.display_name}</p>
          <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{partner.slug}</code>
          <Badge variant="outline" className="text-[10px]">
            {TIER_LABEL[partner.tier]}
          </Badge>
          {partner.is_active && (
            <Badge className="bg-green-100 text-green-800 text-[10px]">Activo</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {partner.contact_email}
          {partner.partner_url && (
            <>
              {' · '}
              <a
                href={partner.partner_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-600 hover:underline inline-flex items-center gap-0.5"
              >
                {partner.partner_url.replace(/^https?:\/\//, '')}
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </>
          )}
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">
          Categorias: {partner.categories.join(', ')} · RS {partner.commission_percent}%
          {partner.paw_member_discount_percent &&
            ` · Member -${Math.round(partner.paw_member_discount_percent)}%`}
        </p>
        {partner.is_active && stats && (
          <p className="text-[10px] text-orange-700 mt-1">
            <strong>30d:</strong> {stats.total_clicks} clicks · {stats.unique_owners} owners unicos
            {stats.conversions > 0 && ` · ${stats.conversions} conversiones`}
          </p>
        )}
        {partner.notes && <p className="text-[10px] text-amber-700 mt-1 italic">{partner.notes}</p>}
      </div>
    </div>
  );
}
