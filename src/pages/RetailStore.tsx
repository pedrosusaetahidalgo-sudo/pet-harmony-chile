/**
 * RetailStore — pagina /tienda/:petId/:partnerSlug?
 *
 * Motor #3 RETAIL del REVENUE_MASTER_PLAN_2026.md (Refactor Maestro Fase 2 §7.4).
 *
 * Si :partnerSlug viene → muestra catalogo del partner especifico filtrado
 *   por la mascota (especie + edad + peso si tiene).
 * Si no viene :partnerSlug → muestra grid de todos los partners activos
 *   para que el dueno elija.
 *
 * Cada click en producto/partner llama RPC track_retail_click + abre la URL
 * del partner en pestaña nueva con `?ref=pawfriend&pet=<id>`.
 *
 * Gate: si flag RETAIL_FULFILLMENT=false, placeholder "estamos firmando".
 */
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, ShoppingBag, ExternalLink, AlertCircle } from '@/lib/icons';
import { Tag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { logger } from '@/lib/logger';

interface RetailPartner {
  id: string;
  slug: string;
  display_name: string;
  partner_logo_url: string | null;
  partner_url: string | null;
  tier: string;
  commission_percent: number;
  paw_member_discount_percent: number | null;
  categories: string[];
  product_catalog: ProductSku[];
  display_order: number;
}

interface ProductSku {
  sku: string;
  name: string;
  category: string;
  price_clp: number;
  image_url?: string;
  target_breed?: string;
  target_weight_min?: number;
  target_weight_max?: number;
  target_age_min_months?: number;
  target_age_max_months?: number;
}

interface PetInfo {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  birth_date: string | null;
  weight_kg: number | null;
}

function ageMonths(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const now = new Date();
  return (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
}

function matchesPet(p: ProductSku, pet: PetInfo): boolean {
  if (
    p.target_breed &&
    pet.breed &&
    !pet.breed.toLowerCase().includes(p.target_breed.toLowerCase())
  ) {
    return false;
  }
  const am = ageMonths(pet.birth_date);
  if (p.target_age_min_months && am !== null && am < p.target_age_min_months) return false;
  if (p.target_age_max_months && am !== null && am > p.target_age_max_months) return false;
  if (p.target_weight_min && pet.weight_kg && pet.weight_kg < p.target_weight_min) return false;
  if (p.target_weight_max && pet.weight_kg && pet.weight_kg > p.target_weight_max) return false;
  return true;
}

function formatCLP(n: number): string {
  return n.toLocaleString('es-CL');
}

export default function RetailStore() {
  const { petId, partnerSlug } = useParams<{ petId: string; partnerSlug?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const flagOn = isFeatureEnabled('RETAIL_FULFILLMENT');

  const { data: pet } = useQuery({
    queryKey: ['retail-store-pet', petId],
    enabled: !!petId,
    queryFn: async (): Promise<PetInfo | null> => {
      if (!petId) return null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('pets')
        .select('id, name, species, breed, birth_date, weight_kg')
        .eq('id', petId)
        .maybeSingle();
      if (error) return null;
      return (data ?? null) as PetInfo | null;
    },
  });

  const { data: partners, isLoading } = useQuery({
    queryKey: ['retail-store-partners', petId],
    enabled: !!petId && flagOn,
    queryFn: async (): Promise<RetailPartner[]> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).rpc('list_active_retail_partners', {
        p_pet_id: petId,
      });
      if (error) return [];
      return (data ?? []) as RetailPartner[];
    },
  });

  const focusedPartner = partnerSlug ? partners?.find((p) => p.slug === partnerSlug) : null;

  const handlePartnerClick = async (partner: RetailPartner, sku?: ProductSku) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).rpc('track_retail_click', {
        p_partner_id: partner.id,
        p_pet_id: petId ?? null,
        p_sku: sku?.sku ?? null,
        p_category: sku?.category ?? null,
        p_recommendation_kind: sku ? 'food' : 'banner',
      });
    } catch (err) {
      logger.warn('[RetailStore] track click fallo', err);
    }
    if (partner.partner_url) {
      const url = new URL(partner.partner_url);
      url.searchParams.set('ref', 'pawfriend');
      if (petId) url.searchParams.set('pet', petId);
      window.open(url.toString(), '_blank', 'noopener,noreferrer');
    }
  };

  if (!flagOn) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-6 text-center space-y-3">
            <ShoppingBag className="h-12 w-12 mx-auto text-orange-600" />
            <h2 className="text-xl font-bold">Estamos firmando retailers</h2>
            <p className="text-sm text-orange-900 leading-relaxed">
              Pronto vas a poder comprar alimento + accesorios para tu mascota con descuento
              exclusivo para Paw Members.
            </p>
            <Button onClick={() => navigate(-1)} variant="outline">
              Volver
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8 text-center">
        <p>Inicia sesion para ver descuentos retail.</p>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl mx-auto px-4 py-6 space-y-4">
      <Helmet>
        <title>Tienda · {pet?.name ?? 'Paw Friend'}</title>
      </Helmet>

      <Button onClick={() => navigate(-1)} variant="ghost" size="sm">
        <ArrowLeft className="h-4 w-4 mr-1.5" /> Volver
      </Button>

      {/* UX-12: Disclaimer permanente al tope (no solo al final). El user
          debe saber DESDE EL INICIO que los catálogos son referenciales y
          se ajustan al firmar contrato comercial con cada retailer. */}
      <div
        role="status"
        className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-3 flex items-start gap-2.5"
      >
        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-300 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 dark:text-amber-100 leading-relaxed">
          <strong>Piloto en marcha · catálogos referenciales.</strong> Estamos integrando con
          retailers chilenos (Master Dog, Puppis, Pet Star). Los descuentos y precios se ajustan al
          firmar contrato comercial con cada partner. Hasta entonces, los links te llevan al sitio
          oficial del retailer.
        </div>
      </div>

      <div className="text-center space-y-1.5 py-3">
        <ShoppingBag className="h-10 w-10 mx-auto text-orange-600" />
        <h1 className="text-2xl font-bold">
          {focusedPartner
            ? `${focusedPartner.display_name} para ${pet?.name ?? 'tu mascota'}`
            : `Tienda${pet?.name ? ` para ${pet.name}` : ''}`}
        </h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Descuentos exclusivos para Paw Members. Comprando aqui, una parte vuelve a Paw Friend (sin
          costo extra para ti).
        </p>
      </div>

      {isLoading && <Skeleton className="h-32 w-full" />}

      {/* Partner focus mode: muestra catalogo */}
      {!isLoading && focusedPartner && pet && (
        <PartnerCatalog partner={focusedPartner} pet={pet} onProductClick={handlePartnerClick} />
      )}

      {/* Sin partner — grid de todos */}
      {!isLoading && !focusedPartner && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {partners?.map((p) => (
            <Card key={p.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  {p.partner_logo_url ? (
                    <img
                      src={p.partner_logo_url}
                      alt={p.display_name}
                      className="h-12 w-12 rounded-lg object-cover border"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center text-orange-700 font-bold">
                      {p.display_name[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{p.display_name}</p>
                    <p className="text-xs text-muted-foreground">{p.categories.join(' · ')}</p>
                  </div>
                  {p.paw_member_discount_percent && (
                    <Badge className="bg-orange-600 text-white">
                      -{Math.round(p.paw_member_discount_percent)}%
                    </Badge>
                  )}
                </div>
                <Button
                  onClick={() => navigate(`/tienda/${petId}/${p.slug}`)}
                  size="sm"
                  className="w-full bg-orange-600 hover:bg-orange-700"
                >
                  Ver catalogo
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && (!partners || partners.length === 0) && (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            No hay tiendas activas para tu region/especie todavia.
          </CardContent>
        </Card>
      )}

      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-4 text-xs leading-relaxed text-amber-900">
          <strong>Piloto en marcha · proximamente</strong> · Estamos integrando catalogos con
          tiendas chilenas. Los descuentos y links que ves son referenciales hasta firmar contrato
          definitivo con cada partner. Si tu tienda quiere sumarse:{' '}
          <a href="/aplicar?tipo=paw_partners" className="font-bold underline">
            postular como Paw Partner
          </a>
          .
        </CardContent>
      </Card>
    </div>
  );
}

function PartnerCatalog({
  partner,
  pet,
  onProductClick,
}: {
  partner: RetailPartner;
  pet: PetInfo;
  onProductClick: (partner: RetailPartner, sku?: ProductSku) => void;
}) {
  // Filter por pet (con fallback: si no hay catalog, mostramos solo el banner del partner).
  const matched = (partner.product_catalog ?? []).filter((p) => matchesPet(p, pet));
  const others = (partner.product_catalog ?? []).filter((p) => !matchesPet(p, pet));

  return (
    <div className="space-y-4">
      {partner.paw_member_discount_percent && (
        <Card className="border-orange-300 bg-gradient-to-r from-orange-50 to-amber-50">
          <CardContent className="p-4 flex items-center gap-3">
            <Tag className="h-6 w-6 text-orange-700" />
            <div>
              <p className="font-semibold text-sm">
                -{Math.round(partner.paw_member_discount_percent)}% para Paw Members
              </p>
              <p className="text-xs text-muted-foreground">
                Descuento exclusivo. Mostrar tu insignia en tienda o usar codigo en checkout.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {matched.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-orange-700 mb-2">
            Recomendados para {pet.name}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {matched.map((p) => (
              <ProductCard key={p.sku} sku={p} onClick={() => onProductClick(partner, p)} />
            ))}
          </div>
        </div>
      )}

      {others.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Mas productos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {others.slice(0, 6).map((p) => (
              <ProductCard key={p.sku} sku={p} onClick={() => onProductClick(partner, p)} />
            ))}
          </div>
        </div>
      )}

      {(!partner.product_catalog || partner.product_catalog.length === 0) && (
        <Card>
          <CardContent className="p-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Catalogo completo en la web del partner.
            </p>
            <Button
              onClick={() => onProductClick(partner)}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Ir a {partner.display_name}
              <ExternalLink className="h-4 w-4 ml-1.5" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ProductCard({ sku, onClick }: { sku: ProductSku; onClick: () => void }) {
  return (
    <Card
      className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-3 flex gap-3">
        {sku.image_url ? (
          <img
            src={sku.image_url}
            alt={sku.name}
            className="h-20 w-20 rounded object-cover flex-shrink-0"
          />
        ) : (
          <div className="h-20 w-20 rounded bg-muted flex items-center justify-center flex-shrink-0">
            <ShoppingBag className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium line-clamp-2">{sku.name}</p>
          <p className="text-xs text-muted-foreground capitalize mt-0.5">{sku.category}</p>
          <p className="text-base font-bold text-orange-700 mt-1">${formatCLP(sku.price_clp)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
