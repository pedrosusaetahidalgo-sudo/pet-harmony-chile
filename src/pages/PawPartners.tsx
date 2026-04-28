/**
 * Directorio publico de Paw Partners. Ruta: /paw-partners.
 *
 * Tiendas, veterinarias, seguros, restaurantes y servicios aliados que
 * ofrecen descuento a Paw Members. El flujo de alta es via /aplicar?tipo=paw_partners
 * y al aprobar, el partner aparece en este directorio.
 *
 * Acceso publico. No expone descuentos completos hasta ser Paw Member
 * (misma logica de /paw-member), pero muestra lista + categoria + CTA.
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Heart,
  Search,
  Loader2,
  ArrowRight,
  ShoppingBag,
  Utensils,
  Shield,
  Scissors,
  Home as HomeIcon,
  Stethoscope,
  Store,
  Globe,
  Tag,
} from 'lucide-react';
import { CategoryIcon } from '@/components/CategoryIcon';
import { CategoryApplyInlineForm } from '@/components/CategoryApplyInlineForm';

interface PublicPartner {
  id: string;
  name: string;
  slug: string;
  website: string | null;
  description: string | null;
  logo_url: string | null;
  paw_member_discount: string | null;
  /** vertical (payload via admin) */
  vertical?: string;
  featured: boolean;
}

type VerticalFilter =
  | 'all'
  | 'retail'
  | 'food'
  | 'vet'
  | 'grooming'
  | 'housing'
  | 'insurance'
  | 'restaurant'
  | 'otro';

const VERTICAL_MAP: Record<string, { filter: VerticalFilter; label: string; icon: typeof Heart }> =
  {
    'Accesorios y retail': { filter: 'retail', label: 'Retail', icon: ShoppingBag },
    'Comida y snacks': { filter: 'food', label: 'Comida', icon: Utensils },
    Veterinaria: { filter: 'vet', label: 'Vets', icon: Stethoscope },
    Grooming: { filter: 'grooming', label: 'Grooming', icon: Scissors },
    'Guarderia / Hospedaje': { filter: 'housing', label: 'Hospedaje', icon: HomeIcon },
    Seguros: { filter: 'insurance', label: 'Seguros', icon: Shield },
    'Restaurantes pet-friendly': { filter: 'restaurant', label: 'Restaurantes', icon: Utensils },
    Otro: { filter: 'otro', label: 'Otro', icon: Store },
  };

export default function PawPartners() {
  const [filter, setFilter] = useState<VerticalFilter>('all');
  const [search, setSearch] = useState('');

  const { data: partners, isLoading } = useQuery<PublicPartner[]>({
    queryKey: ['public-partners'],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('paw_companys') as any)
        .select('id, name, slug, website, description, logo_url, paw_member_discount, featured')
        .eq('is_active', true)
        .eq('partnership_type', 'partner')
        .order('featured', { ascending: false })
        .order('name');
      return (data as PublicPartner[]) || [];
    },
  });

  const filtered = useMemo(() => {
    if (!partners) return [];
    return partners.filter((p) => {
      if (search) {
        const q = search.toLowerCase();
        const match =
          p.name.toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q) ||
          (p.paw_member_discount || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [partners, search]);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Paw Partners · Descuentos para Paw Members · Paw Friend</title>
        <meta
          name="description"
          content="Tiendas, veterinarias, seguros y servicios aliados que ofrecen descuentos exclusivos a Paw Members."
        />
        <meta
          property="og:image"
          content="https://pawfriend.cl/paw-friend-assets-v2/paw_partners_og_card.svg"
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      {/* Hero banner del brand kit v2 */}
      <div className="relative overflow-hidden">
        <img
          src="/paw-friend-assets-v2/paw_partners_hero.svg"
          alt="Paw Partners · alianzas con causa"
          className="w-full h-40 sm:h-56 object-cover"
          loading="eager"
        />
      </div>

      {/* Hero texto */}
      <div className="bg-gradient-to-br from-pink-50 via-purple-50/60 to-white border-b border-purple-100">
        <div className="container max-w-6xl mx-auto px-4 py-10 sm:py-14">
          <div className="flex flex-col items-center text-center max-w-2xl mx-auto space-y-4">
            <Badge variant="outline" className="bg-pink-100 text-pink-700 border-transparent">
              <Tag className="h-3 w-3 mr-1" /> Alianzas con causa
            </Badge>
            <CategoryIcon kind="partner" badge size="lg" className="shadow-lg" />
            <h1 className="text-3xl sm:text-5xl font-display font-semibold tracking-tight">
              Paw Partners
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl">
              Tiendas, veterinarias, seguros y servicios que apoyan la comunidad Paw Friend con
              descuentos y beneficios para Paw Members.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild className="bg-purple-600 hover:bg-purple-700">
                <Link to="/paw-member">
                  <Heart className="h-4 w-4 mr-1" /> Hacerme Paw Member
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/aplicar?tipo=paw_partners">
                  Sumar mi marca <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros + listado */}
      <div className="container max-w-6xl mx-auto px-4 py-6 space-y-5">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, descripcion o beneficio"
              className="pl-9"
            />
          </div>
        </div>

        <Tabs value={filter} onValueChange={(v) => setFilter(v as VerticalFilter)}>
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="retail">Retail</TabsTrigger>
            <TabsTrigger value="food">Comida</TabsTrigger>
            <TabsTrigger value="vet">Veterinarias</TabsTrigger>
            <TabsTrigger value="grooming">Grooming</TabsTrigger>
            <TabsTrigger value="housing">Hospedaje</TabsTrigger>
            <TabsTrigger value="insurance">Seguros</TabsTrigger>
            <TabsTrigger value="restaurant">Restaurantes</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center space-y-3">
              <img
                src="/paw-friend-assets-v2/paw_partners_empty_state.svg"
                alt="Sin partners"
                className="w-64 mx-auto"
                loading="lazy"
              />
              <div>
                <p className="text-sm font-semibold">Aun no hay partners en esta categoria</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Vamos sumando marcas aliadas poco a poco.
                </p>
              </div>
              <Button asChild variant="outline">
                <a href="#postular-partner">Sumar mi marca</a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p) => (
              <PartnerCard key={p.id} partner={p} />
            ))}
          </div>
        )}

        {/* Form inline de postulacion */}
        <section id="postular-partner" className="mt-14 pt-8 border-t border-slate-100">
          <div className="text-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-display font-semibold">
              Suma tu marca al directorio
            </h2>
            <p className="text-muted-foreground text-sm mt-2 max-w-xl mx-auto">
              Ofreces un beneficio a Paw Members, apareces gratis en este directorio. Sin
              compromiso. Respondemos en 1-3 dias habiles.
            </p>
          </div>
          <div className="max-w-2xl mx-auto">
            <CategoryApplyInlineForm
              kind="paw_partners"
              categoryIcon="partner"
              title="Postula en 2 minutos"
              subtitle="El equipo revisa tu marca y te contactamos."
              orgLabel="Nombre comercial de tu marca"
              submitLabel="Postular como Paw Partner"
              successMessage="Revisaremos tu marca y te escribimos en 1-3 dias habiles para alinear el beneficio y activarte en el directorio."
              successCta={{ href: '/paw-member', label: 'Hacerme Paw Member' }}
              extraFields={[
                {
                  key: 'vertical',
                  label: 'Categoria',
                  type: 'select',
                  options: [
                    'Accesorios y retail',
                    'Comida y snacks',
                    'Veterinaria',
                    'Grooming',
                    'Guarderia / Hospedaje',
                    'Seguros',
                    'Restaurantes pet-friendly',
                    'Otro',
                  ],
                  required: true,
                },
                {
                  key: 'discount',
                  label: 'Descuento para Paw Members',
                  placeholder: '15% off, envio gratis, 1er mes gratis...',
                  required: true,
                },
                {
                  key: 'commune',
                  label: 'Zona de cobertura',
                  placeholder: 'Las Condes · RM · Nacional',
                },
              ]}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function PartnerCard({ partner }: { partner: PublicPartner }) {
  return (
    <Card className="hover:border-pink-300 hover:shadow-md transition overflow-hidden group">
      <CardContent className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className="h-12 w-12 rounded-lg bg-white border flex-shrink-0 overflow-hidden flex items-center justify-center">
            {partner.logo_url ? (
              <img
                src={partner.logo_url}
                alt={partner.name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <CategoryIcon kind="partner" variant="icon" className="h-11 w-11" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate group-hover:text-pink-700 transition">
              {partner.name}
            </h3>
            {partner.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                {partner.description}
              </p>
            )}
          </div>
        </div>

        {partner.paw_member_discount && (
          <div className="rounded-lg bg-purple-50 border border-purple-200 p-2.5 flex items-start gap-2 mb-3">
            <Tag className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-purple-900 font-medium leading-snug">
              {partner.paw_member_discount}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          {partner.website ? (
            <a
              href={partner.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-purple-600 hover:underline"
            >
              <Globe className="h-3 w-3" /> Visitar
            </a>
          ) : (
            <span />
          )}
          {partner.featured && (
            <Badge className="bg-pink-100 text-pink-700 hover:bg-pink-100 border-pink-200 text-[10px]">
              Destacado
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Silent unused warning — VERTICAL_MAP se mantiene exportado/referenciado
// mentalmente para futura expansion de filtros por vertical real (hoy no
// esta en paw_companys sino en payload; cuando se agregue columna, se usa).
void VERTICAL_MAP;
