/**
 * RetailRecommendationsCard — card en /home con productos sugeridos.
 *
 * Motor #3 RETAIL del REVENUE_MASTER_PLAN_2026.md (Refactor Maestro Fase 2 §7.4).
 *
 * Solo se muestra si flag RETAIL_FULFILLMENT=true y hay >=1 partner activo
 * para el cohort del pet (especie + comuna). Auto-esconde si no aplica.
 *
 * Click en partner → /tienda/:petId/:partnerSlug + track_retail_click RPC.
 */
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, ArrowRight } from '@/lib/icons';
import { supabase } from '@/integrations/supabase/client';
import { isFeatureEnabled } from '@/lib/featureFlags';

interface RetailPartner {
  id: string;
  slug: string;
  display_name: string;
  partner_logo_url: string | null;
  partner_url: string | null;
  tier: 'affiliate' | 'marketplace' | 'brand_partner';
  paw_member_discount_percent: number | null;
  categories: string[];
  display_order: number;
}

interface RetailRecommendationsCardProps {
  petId: string;
  petName: string;
}

export function RetailRecommendationsCard({ petId, petName }: RetailRecommendationsCardProps) {
  const navigate = useNavigate();

  const { data: partners } = useQuery({
    queryKey: ['retail-partners-home', petId],
    enabled: !!petId && isFeatureEnabled('RETAIL_FULFILLMENT'),
    staleTime: 30 * 60_000,
    queryFn: async (): Promise<RetailPartner[]> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).rpc('list_active_retail_partners', {
        p_pet_id: petId,
      });
      if (error) return [];
      return (data ?? []) as RetailPartner[];
    },
  });

  if (!isFeatureEnabled('RETAIL_FULFILLMENT')) return null;
  if (!partners || partners.length === 0) return null;

  const top = partners.slice(0, 3);

  return (
    <Card className="border-orange-200 bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50 overflow-hidden">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-orange-200 flex items-center justify-center shrink-0">
            <ShoppingBag className="h-5 w-5 text-orange-700" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-orange-900">
              Tiendas con descuento para {petName}
            </p>
            <p className="text-xs text-orange-700 mt-0.5">
              Alimento + accesorios con precios para Paw Members.
            </p>
          </div>
        </div>
        <div className="space-y-2">
          {top.map((p) => (
            <button
              key={p.id}
              onClick={() => navigate(`/tienda/${petId}/${p.slug}`)}
              className="w-full flex items-center justify-between gap-2 rounded-lg border border-orange-200 bg-white/70 hover:bg-white p-2 transition-colors text-left"
            >
              <div className="flex items-center gap-2 min-w-0">
                {p.partner_logo_url ? (
                  <img
                    src={p.partner_logo_url}
                    alt={p.display_name}
                    className="h-8 w-8 rounded object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="h-8 w-8 rounded bg-orange-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-orange-700">
                    {p.display_name[0]}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{p.display_name}</p>
                  <p className="text-xs text-orange-700">{p.categories.join(' · ')}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {p.paw_member_discount_percent && (
                  <Badge className="bg-orange-600 text-white text-[10px]">
                    -{Math.round(p.paw_member_discount_percent)}%
                  </Badge>
                )}
                <ArrowRight className="h-4 w-4 text-orange-700" />
              </div>
            </button>
          ))}
        </div>
        {partners.length > 3 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-orange-700 hover:bg-orange-100"
            onClick={() => navigate(`/tienda/${petId}`)}
          >
            Ver todos los partners ({partners.length})
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
