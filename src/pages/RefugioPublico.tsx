/**
 * Perfil publico de un refugio / hogar de adopcion. Ruta: /refugios/:slug.
 *
 * Muestra:
 *   - Header con logo + banner + mision + stats
 *   - Mascotas disponibles del refugio (adoption_posts del user_id del refugio)
 *   - Info de contacto + redes
 *   - CTA donar a la causa (muestra disclaimer, UI gated por feature flag)
 *
 * Visible para anon y authenticated. Usa RLS public read sobre
 * adoption_centers.status='active'.
 */
import { useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Heart,
  MapPin,
  Globe,
  Instagram,
  Mail,
  Phone,
  CheckCircle2,
  Loader2,
  PawPrint,
  Home as HomeIcon,
  ArrowLeft,
  HandHeart,
} from 'lucide-react';
import { isShelterDonationsEnabled } from '@/lib/featureFlags';

interface PublicShelter {
  id: string;
  user_id: string;
  legal_name: string;
  type: 'ong' | 'fundacion' | 'refugio' | 'independiente' | 'municipal';
  mission: string | null;
  commune: string;
  region: string | null;
  address: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  social_media: Record<string, string> | null;
  logo_url: string | null;
  banner_url: string | null;
  slug: string | null;
  animal_types: string[] | null;
  capacity: number | null;
  verified: boolean;
  accepts_donations: boolean;
  total_pets_adopted: number;
  total_pets_in_care: number;
}

const TYPE_LABEL: Record<PublicShelter['type'], string> = {
  ong: 'ONG',
  fundacion: 'Fundacion',
  refugio: 'Refugio',
  independiente: 'Rescatista independiente',
  municipal: 'Programa municipal',
};

export default function RefugioPublico() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data: shelter, isLoading } = useQuery<PublicShelter | null>({
    queryKey: ['public-shelter', slug],
    queryFn: async () => {
      if (!slug) return null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('adoption_centers' as any) as any)
        .select('*')
        .eq('slug', slug)
        .eq('status', 'active')
        .maybeSingle();
      return (data as PublicShelter) || null;
    },
    enabled: !!slug,
  });

  const { data: posts } = useQuery({
    queryKey: ['public-shelter-posts', shelter?.user_id],
    queryFn: async () => {
      if (!shelter?.user_id) return [];
      const { data } = await supabase
        .from('adoption_posts')
        .select('id, pet_name, species, breed, age_years, size, photos, description')
        .eq('user_id', shelter.user_id)
        .eq('status', 'disponible')
        .order('created_at', { ascending: false })
        .limit(12);
      return data || [];
    },
    enabled: !!shelter?.user_id,
  });

  useEffect(() => {
    if (!isLoading && !shelter) {
      // No found — navegar a listado
      navigate('/refugios-hogares', { replace: true });
    }
  }, [isLoading, shelter, navigate]);

  if (isLoading || !shelter) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
      </div>
    );
  }

  const insta = shelter.social_media?.instagram;
  const donationsCtaEnabled = shelter.accepts_donations && isShelterDonationsEnabled();

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{shelter.legal_name} · Paw Friend</title>
        <meta
          name="description"
          content={
            shelter.mission ||
            `${shelter.legal_name} — hogar de adopcion en ${shelter.commune}, Chile. Dale una segunda oportunidad a una mascota.`
          }
        />
        <meta property="og:title" content={`${shelter.legal_name} · Paw Friend`} />
        <meta property="og:type" content="profile" />
        {shelter.banner_url && <meta property="og:image" content={shelter.banner_url} />}
      </Helmet>

      {/* Banner */}
      <div
        className="h-40 sm:h-56 bg-gradient-to-br from-purple-200 via-purple-100 to-pink-100 relative"
        style={
          shelter.banner_url
            ? {
                backgroundImage: `url(${shelter.banner_url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : undefined
        }
      >
        <div className="absolute top-3 left-3">
          <Button variant="secondary" size="sm" asChild>
            <Link to="/refugios-hogares">
              <ArrowLeft className="h-4 w-4 mr-1" /> Volver
            </Link>
          </Button>
        </div>
      </div>

      <div className="container max-w-5xl mx-auto px-4 pb-10">
        {/* Header card */}
        <Card className="-mt-14 relative z-10 shadow-lg">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="h-20 w-20 rounded-2xl bg-white border-4 border-white shadow-md overflow-hidden flex-shrink-0 -mt-12 sm:mt-0">
                {shelter.logo_url ? (
                  <img
                    src={shelter.logo_url}
                    alt={shelter.legal_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-purple-100 flex items-center justify-center text-purple-600">
                    <HomeIcon className="h-7 w-7" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold">{shelter.legal_name}</h1>
                  {shelter.verified && (
                    <Badge className="bg-green-100 text-green-700 border-green-300 hover:bg-green-100">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Verificado
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{shelter.commune}</span>
                  {shelter.region && shelter.region !== 'Metropolitana' && (
                    <span>· {shelter.region}</span>
                  )}
                  <span>·</span>
                  <span>{TYPE_LABEL[shelter.type]}</span>
                </div>
                {shelter.mission && (
                  <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                    {shelter.mission}
                  </p>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-slate-100">
              <StatSmall
                icon={<PawPrint className="h-4 w-4" />}
                label="En cuidado"
                value={shelter.total_pets_in_care}
                color="purple"
              />
              <StatSmall
                icon={<Heart className="h-4 w-4" />}
                label="Adoptadas"
                value={shelter.total_pets_adopted}
                color="pink"
              />
              <StatSmall
                icon={<HomeIcon className="h-4 w-4" />}
                label="Capacidad"
                value={shelter.capacity ?? '—'}
                color="teal"
              />
            </div>

            {/* CTA donacion (feature-flagged) */}
            {donationsCtaEnabled && (
              <div className="mt-5 p-4 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <HandHeart className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-purple-900">Apoya esta causa</p>
                    <p className="text-xs text-purple-700/80">
                      Puedes hacer una donacion dirigida a {shelter.legal_name}.
                    </p>
                  </div>
                </div>
                <Button asChild size="sm" className="bg-purple-600 hover:bg-purple-700">
                  <Link to={`/donaciones?refugio=${shelter.id}`}>Donar</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mascotas en adopcion */}
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Mascotas disponibles</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/adoption">Ver todas</Link>
            </Button>
          </div>
          {!posts || posts.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center space-y-2">
                <PawPrint className="h-8 w-8 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">
                  Este refugio aun no tiene mascotas publicadas.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {posts.map((p) => (
                <PostThumb key={p.id} post={p} />
              ))}
            </div>
          )}
        </div>

        {/* Contacto */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-3">Contacto</h2>
          <Card>
            <CardContent className="p-4 space-y-2 text-sm">
              {shelter.contact_email && (
                <a
                  href={`mailto:${shelter.contact_email}`}
                  className="flex items-center gap-2 text-muted-foreground hover:text-purple-700"
                >
                  <Mail className="h-4 w-4" /> {shelter.contact_email}
                </a>
              )}
              {shelter.contact_phone && (
                <a
                  href={`tel:${shelter.contact_phone}`}
                  className="flex items-center gap-2 text-muted-foreground hover:text-purple-700"
                >
                  <Phone className="h-4 w-4" /> {shelter.contact_phone}
                </a>
              )}
              {shelter.website && (
                <a
                  href={shelter.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-muted-foreground hover:text-purple-700"
                >
                  <Globe className="h-4 w-4" /> {shelter.website}
                </a>
              )}
              {insta && (
                <a
                  href={`https://instagram.com/${insta.replace(/^@/, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-muted-foreground hover:text-purple-700"
                >
                  <Instagram className="h-4 w-4" /> @{insta.replace(/^@/, '')}
                </a>
              )}
              {shelter.address && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" /> {shelter.address}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatSmall({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: 'purple' | 'pink' | 'teal';
}) {
  const colorMap = {
    purple: 'bg-purple-100 text-purple-700',
    pink: 'bg-pink-100 text-pink-700',
    teal: 'bg-teal-100 text-teal-700',
  };
  return (
    <div className="text-center">
      <div
        className={`h-8 w-8 mx-auto rounded-full flex items-center justify-center ${colorMap[color]} mb-1`}
      >
        {icon}
      </div>
      <div className="text-base font-bold">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

interface PublicPost {
  id: string;
  pet_name: string;
  species: string | null;
  breed: string | null;
  age_years: number | null;
  size: string | null;
  photos: string[] | null;
  description: string | null;
}

function PostThumb({ post }: { post: PublicPost }) {
  const cover = (post.photos || [])[0];
  return (
    <Link
      to="/adoption"
      className="block rounded-lg overflow-hidden border border-slate-200 hover:border-purple-300 transition group"
    >
      <div className="aspect-square bg-muted overflow-hidden">
        {cover ? (
          <img
            src={cover}
            alt={post.pet_name}
            loading="lazy"
            className="h-full w-full object-cover group-hover:scale-105 transition"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <PawPrint className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="p-2">
        <h3 className="font-semibold text-xs truncate">{post.pet_name}</h3>
        <p className="text-[10px] text-muted-foreground truncate">
          {post.species}
          {post.breed ? ` · ${post.breed}` : ''}
        </p>
      </div>
    </Link>
  );
}
