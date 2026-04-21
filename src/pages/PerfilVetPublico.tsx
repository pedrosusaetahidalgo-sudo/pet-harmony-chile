import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  MapPin,
  Star,
  Stethoscope,
  Share2,
  MessageSquare,
  Calendar,
  Loader2,
  Clock,
  Phone,
  Award,
} from '@/lib/icons';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { LINKS } from '@/lib/links';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useDirectoryVetBySlug, useVetReviews, trackProviderView } from '@/hooks/useDirectoryVets';
import { setSeoTags, injectJsonLd, formatCLP } from '@/lib/vetDirectory';
import { PublicHeader, PublicFooter } from '@/components/layouts/PublicLayout';
import { BookingFlow } from '@/components/booking/BookingFlow';
import { UpgradePlanBanner } from '@/components/provider/dashboard/UpgradePlanBanner';

import { isOpenNow, getTodayHours } from '@/lib/openingHours';

function useIsOwnProviderSlug(slug: string | undefined, userId: string | undefined) {
  const { data, isLoading } = useQuery({
    queryKey: ['own-provider-slug', userId],
    enabled: !!userId && !!slug,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from('service_providers')
        .select('slug')
        .eq('user_id', userId!)
        .maybeSingle();
      return data?.slug ?? null;
    },
  });
  const isOwn = !!slug && !!data && data === slug;
  // While checking ownership, assume it might be own profile to avoid flash of "not found"
  const isPending = !!userId && !!slug && isLoading;
  return { isOwn, isPending };
}

export default function PerfilVetPublico() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  // First try with visibility filter off (for own profile preview)
  // Then fall back to public-only
  const { isOwn: isOwnProfile, isPending: ownerCheckPending } = useIsOwnProviderSlug(
    slug,
    user?.id
  );
  const { data: vet, isLoading } = useDirectoryVetBySlug(slug, {
    skipVisibilityFilter: isOwnProfile || ownerCheckPending,
  });
  const v = vet;
  const { data: reviews } = useVetReviews(v?.id);

  const [reservaOpen, setReservaOpen] = useState(false);
  const [reservaMessage, setReservaMessage] = useState('');
  const [reservaDate, setReservaDate] = useState('');
  const [reservaLoading, setReservaLoading] = useState(false);
  const [selectedPetId, setSelectedPetId] = useState<string>('');
  const [userPets, setUserPets] = useState<{ id: string; name: string }[]>([]);

  const handleReservar = async () => {
    if (!user) {
      navigate(LINKS.authReturn(`/veterinarios/${slug}`));
      return;
    }
    // Load user's pets for the selector
    const { data: pets } = await supabase
      .from('pets')
      .select('id, name')
      .eq('owner_id', user.id)
      .order('name');
    const petsList = (pets || []) as { id: string; name: string }[];
    setUserPets(petsList);
    if (petsList.length === 1) {
      setSelectedPetId(petsList[0].id);
    }
    setReservaOpen(true);
  };

  const handleSubmitReserva = async () => {
    if (!user || !v?.id) return;
    if (reservaMessage.trim().length < 10) {
      toast.error('Cuéntale al veterinario brevemente qué necesitas');
      return;
    }
    if (!reservaDate) {
      toast.error('Selecciona una fecha tentativa');
      return;
    }
    if (!selectedPetId) {
      toast.error('Selecciona la mascota para esta consulta');
      return;
    }
    setReservaLoading(true);
    try {
      if (userPets.length === 0) {
        toast.error('Debes registrar al menos una mascota antes de reservar');
        navigate('/add-pet');
        return;
      }

      // Crear booking real vinculado al directorio.
      // El trigger SQL notify_on_directory_booking notifica automáticamente al vet.
      // Nota: la migración 20260408100000 hizo `vet_id`, `visit_address` y
      // `total_price` nullable y agregó `service_provider_id`, pero types.ts
      // todavía no fue regenerado (regla del proyecto). Usamos un tipo
      // intermedio explícito para reflejar el shape real de la tabla.
      type DirectoryBookingInsert = {
        owner_id: string;
        pet_id: string;
        service_provider_id: string;
        scheduled_date: string;
        service_type: string;
        symptoms: string;
        status: string;
        payment_status: string;
        visit_address: string | null;
        total_price: number | null;
      };
      const payload: DirectoryBookingInsert = {
        owner_id: user.id,
        pet_id: selectedPetId,
        service_provider_id: v.id,
        scheduled_date: new Date(reservaDate).toISOString(),
        service_type: 'consultation',
        symptoms: reservaMessage.trim(),
        status: 'pendiente',
        payment_status: 'pendiente',
        visit_address: null,
        total_price: null,
      };
      // Cast a través de unknown porque types.ts aún no refleja
      // service_provider_id ni los nullables introducidos por la migración
      // 20260408100000. La regla del proyecto prohíbe regenerar types.ts.
      const tbl = supabase.from('vet_bookings') as unknown as {
        insert: (values: DirectoryBookingInsert) => Promise<{ error: { message: string } | null }>;
      };
      const { error } = await tbl.insert(payload);
      if (error) throw error;

      toast.success('Reserva enviada. El veterinario te contactará para confirmar.');
      setReservaOpen(false);
      setReservaMessage('');
      setReservaDate('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo enviar la reserva');
    } finally {
      setReservaLoading(false);
    }
  };

  const handleMensaje = () => {
    if (!user) {
      navigate(LINKS.authReturn(`/veterinarios/${slug}`));
      return;
    }
    if (v?.user_id) {
      navigate(`/chat?user=${v.user_id}`);
    } else {
      navigate(LINKS.chat());
    }
  };

  useEffect(() => {
    if (slug) trackProviderView(slug);
  }, [slug]);

  useEffect(() => {
    if (!v) return;
    const ratingNum = Number(v.avg_rating ?? 0);
    const ratingStr = ratingNum.toFixed(1);
    const reviewNum = Number(v.total_reviews ?? 0);
    const areas: string[] = v.service_areas ?? [];
    const mainComuna = v.commune || (areas.length > 0 ? areas[0] : null);

    const titleParts = [v.display_name ?? 'Veterinario'];
    if (mainComuna) titleParts.push(`Veterinario en ${mainComuna}`);
    titleParts.push('Paw Friend');
    const seoTitle = titleParts.join(' - ');

    const descParts: string[] = [];
    if (reviewNum > 0) descParts.push(`★ ${ratingStr} (${reviewNum} resenas)`);
    if (v.price_from) descParts.push(`Consultas desde ${formatCLP(v.price_from)}`);
    if (areas.length > 0) descParts.push(`Atiende en ${areas.slice(0, 3).join(', ')}`);
    if (v.bio) descParts.push(v.bio.slice(0, 120));
    const seoDesc =
      descParts.join(' · ') || `Perfil profesional de ${v.display_name} en Paw Friend`;
    const canonical = `https://pawfriend.cl/veterinarios/${v.slug}`;

    setSeoTags({
      title: seoTitle,
      description: seoDesc,
      canonical,
      ogImage: v.avatar_url ?? undefined,
    });

    // Build JSON-LD structured data (Schema.org VeterinaryCare)
    const jsonLd: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'VeterinaryCare',
      name: v.display_name,
      url: canonical,
    };
    if (v.avatar_url) jsonLd.image = v.avatar_url;
    if (v.bio) jsonLd.description = v.bio;
    if (v.public_phone) jsonLd.telephone = v.public_phone;
    if (v.public_email) jsonLd.email = v.public_email;
    if (v.price_from) {
      jsonLd.priceRange = `Desde ${formatCLP(v.price_from)}`;
    }

    // Address
    if (mainComuna) {
      jsonLd.address = {
        '@type': 'PostalAddress',
        addressLocality: mainComuna,
        addressRegion: 'Metropolitana',
        addressCountry: 'CL',
      };
    }

    // AggregateRating — only when real reviews exist
    if (reviewNum > 0) {
      jsonLd.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: ratingStr,
        reviewCount: String(reviewNum),
        bestRating: '5',
        worstRating: '1',
      };
    }

    // OpeningHours — parse the opening_hours JSON if available
    if (v.opening_hours && typeof v.opening_hours === 'object') {
      const dayMap: Record<string, string> = {
        lunes: 'Mo',
        martes: 'Tu',
        miercoles: 'We',
        miércoles: 'We',
        jueves: 'Th',
        viernes: 'Fr',
        sabado: 'Sa',
        sábado: 'Sa',
        domingo: 'Su',
      };
      const specs: string[] = [];
      for (const [day, hours] of Object.entries(v.opening_hours)) {
        const abbr = dayMap[day.toLowerCase()];
        if (!abbr) continue;
        const h = hours as { open?: string; close?: string; closed?: boolean } | null;
        if (!h || h.closed) continue;
        if (h.open && h.close) {
          specs.push(`${abbr} ${h.open}-${h.close}`);
        }
      }
      if (specs.length > 0) jsonLd.openingHours = specs;
    }

    injectJsonLd('vet-jsonld', jsonLd);
  }, [v]);

  const handleShare = async () => {
    const url = `https://pawfriend.cl/veterinarios/${v?.slug}`;
    const text = `Mira el perfil de ${v?.display_name} en Paw Friend 🐾`;
    if (navigator.share) {
      try {
        await navigator.share({ title: v?.display_name, text, url });
        return;
      } catch {
        /* user cancelled */
      }
    }
    await navigator.clipboard.writeText(url);
    toast.success('Link copiado al portapapeles');
  };

  const rating = Number(v?.avg_rating ?? 0);
  const reviewCount = Number(v?.total_reviews ?? 0);
  const specialties: string[] = v?.specialties ?? [];
  const serviceAreas: string[] = useMemo(() => v?.service_areas ?? [], [v?.service_areas]);
  const visibleReviews = reviews ?? [];
  const mainComuna = v?.commune || (serviceAreas.length > 0 ? serviceAreas[0] : null);

  const helmetTitle = useMemo(() => {
    const parts = [v?.display_name ?? 'Veterinario'];
    if (mainComuna) parts.push(`Veterinario en ${mainComuna}`);
    parts.push('Paw Friend');
    return parts.join(' - ');
  }, [v?.display_name, mainComuna]);

  const helmetDesc = useMemo(() => {
    const parts: string[] = [];
    if (reviewCount > 0) parts.push(`${rating.toFixed(1)} estrellas (${reviewCount} resenas)`);
    if (v?.price_from) parts.push(`Consultas desde ${formatCLP(v.price_from)}`);
    if (serviceAreas.length > 0) parts.push(`Atiende en ${serviceAreas.slice(0, 3).join(', ')}`);
    return parts.join(' · ') || `Perfil profesional de ${v?.display_name} en Paw Friend`;
  }, [v?.display_name, v?.price_from, serviceAreas, reviewCount, rating]);

  const helmetCanonical = `https://pawfriend.cl/veterinarios/${v?.slug}`;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-purple-50">
        {!user && <PublicHeader />}
        <main className="container mx-auto px-4 py-8 max-w-4xl space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </main>
      </div>
    );
  }

  if (!v) {
    return (
      <div className="min-h-screen bg-purple-50">
        {!user && <PublicHeader />}
        <main className="container mx-auto px-4 py-16 max-w-md text-center">
          <h1 className="font-display font-semibold text-2xl md:text-3xl mb-2 tracking-tight">
            Veterinario no encontrado
          </h1>
          <p className="text-muted-foreground mb-4">
            Este perfil no existe o no está disponible públicamente.
          </p>
          <Link to="/veterinarios">
            <Button>Ver directorio</Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50/40 to-white">
      <Helmet>
        <title>{helmetTitle}</title>
        <meta name="description" content={helmetDesc} />
        <link rel="canonical" href={helmetCanonical} />
        <meta property="og:title" content={helmetTitle} />
        <meta property="og:description" content={helmetDesc} />
        <meta property="og:url" content={helmetCanonical} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Paw Friend" />
        {v.avatar_url && <meta property="og:image" content={v.avatar_url} />}
      </Helmet>
      {!user && <PublicHeader />}

      <main className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Veterinarios', to: LINKS.vets() },
            ...(serviceAreas[0]
              ? [{ label: serviceAreas[0], to: LINKS.vetsByComuna(serviceAreas[0]) }]
              : []),
            { label: v.display_name || 'Perfil' },
          ]}
        />

        {/* Upsell banner solo cuando el vet dueño mira su propio perfil público
            (QW-11 auditoría top-tier 2026-04-20). No afecta a visitantes, y
            UpgradePlanBanner ya oculta solo si ya está en plan pagado. */}
        {isOwnProfile && <UpgradePlanBanner />}

        {/* Hero */}
        <Card className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-6">
            {v.avatar_url ? (
              <img
                src={v.avatar_url}
                alt={v.display_name}
                className="w-32 h-32 rounded-full object-cover border-4 border-purple-200 mx-auto md:mx-0"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-purple-100 flex items-center justify-center mx-auto md:mx-0">
                <Stethoscope className="h-12 w-12 text-purple-600" />
              </div>
            )}

            <div className="flex-1 text-center md:text-left">
              <h1 className="font-display font-semibold text-3xl md:text-4xl text-purple-900 tracking-tight">
                {v.display_name}
                {v.is_verified && (
                  <span className="ml-2 text-blue-500 text-base align-middle">✓ Verificado</span>
                )}
              </h1>
              {(v as { excellence_badge_at?: string | null }).excellence_badge_at && (
                <div className="flex items-center justify-center md:justify-start gap-1.5 mt-1 mb-1">
                  <Badge
                    variant="outline"
                    className="bg-amber-50 border-amber-300 text-amber-800 gap-1"
                  >
                    <Award className="h-3.5 w-3.5" />
                    Vet Verificado Excelente
                  </Badge>
                  <span className="text-[10px] text-muted-foreground italic">3+ reseñas 5★</span>
                </div>
              )}
              <p className="text-muted-foreground mb-2">
                {v.provider_type === 'home_visit'
                  ? 'Veterinario a domicilio'
                  : v.provider_type === 'clinic'
                    ? 'Clínica veterinaria'
                    : 'Médico Veterinario'}
                {v.license_number && ` · Reg. Colmevet ${v.license_number}`}
              </p>

              {reviewCount > 0 && (
                <div className="flex items-center justify-center md:justify-start gap-1 mb-3">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <strong className="text-lg">{rating.toFixed(1)}</strong>
                  <span className="text-muted-foreground">({reviewCount} reseñas)</span>
                </div>
              )}

              {serviceAreas.length > 0 && (
                <div className="flex items-start justify-center md:justify-start gap-1 text-sm mb-2">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-purple-600" />
                  <span>
                    <strong>Atiende en:</strong> {serviceAreas.join(', ')}
                  </span>
                </div>
              )}

              {v.price_from && (
                <p className="text-sm mb-2">
                  💰 Consultas desde{' '}
                  <strong className="text-purple-700">{formatCLP(v.price_from)}</strong>
                </p>
              )}

              {/* Horario de hoy */}
              {v.opening_hours && (
                <div className="flex items-center justify-center md:justify-start gap-1 text-sm mb-1">
                  <Clock className="h-4 w-4 text-purple-600 flex-shrink-0" />
                  <span>
                    Hoy: <strong>{getTodayHours(v.opening_hours)}</strong>
                  </span>
                  {isOpenNow(v.opening_hours) ? (
                    <Badge
                      className="ml-1 bg-green-100 text-green-700 border-green-200"
                      variant="outline"
                    >
                      Abierto ahora
                    </Badge>
                  ) : (
                    <Badge
                      className="ml-1 bg-slate-100 text-slate-600 border-slate-200"
                      variant="outline"
                    >
                      Cerrado
                    </Badge>
                  )}
                </div>
              )}

              {/* Emergencia */}
              {v.emergency_available && (
                <div className="flex items-center justify-center md:justify-start gap-2 text-sm mb-4">
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    <Phone className="h-3 w-3 mr-1" />
                    Atiende urgencias
                  </Badge>
                  {v.emergency_phone && (
                    <a
                      href={`tel:${v.emergency_phone}`}
                      className="text-red-600 font-semibold hover:underline"
                    >
                      {v.emergency_phone}
                    </a>
                  )}
                  {v.emergency_surcharge_pct != null && v.emergency_surcharge_pct > 0 && (
                    <span className="text-xs text-muted-foreground">
                      (+{v.emergency_surcharge_pct}% recargo)
                    </span>
                  )}
                </div>
              )}

              {!v.opening_hours && !v.emergency_available && <div className="mb-4" />}

              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                <Button onClick={handleReservar} className="bg-purple-600 hover:bg-purple-700">
                  <Calendar className="h-4 w-4 mr-1" /> Reservar consulta
                </Button>
                <Button variant="outline" onClick={handleMensaje}>
                  <MessageSquare className="h-4 w-4 mr-1" /> Mensaje
                </Button>
                <Button variant="outline" onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-1" /> Compartir
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Bio */}
        {v.bio && (
          <Card className="p-6">
            <h2 className="font-semibold text-lg mb-2">Sobre mí</h2>
            <p className="text-muted-foreground whitespace-pre-line">{v.bio}</p>
            {v.experience_years && (
              <p className="text-sm mt-3 text-purple-700">
                <strong>{v.experience_years}</strong> años de experiencia
              </p>
            )}
          </Card>
        )}

        {/* Specialties */}
        {specialties.length > 0 && (
          <Card className="p-6">
            <h2 className="font-semibold text-lg mb-3">Especialidades</h2>
            <div className="flex flex-wrap gap-2">
              {specialties.map((s) => (
                <Badge key={s} variant="secondary" className="text-sm">
                  {s}
                </Badge>
              ))}
            </div>
          </Card>
        )}

        {/* Reviews */}
        <Card className="p-6">
          <h2 className="font-semibold text-lg mb-3">Reseñas de clientes</h2>

          {reviewCount === 0 ? (
            <p className="text-muted-foreground text-sm">
              Este veterinario aún no tiene reseñas. ¡Sé el primero en dejar una!
            </p>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-4">
                <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                <strong className="text-2xl">{rating.toFixed(1)}</strong>
                <span className="text-muted-foreground">promedio · {reviewCount} reseñas</span>
              </div>

              <div className="space-y-4">
                {visibleReviews.map((r) => (
                  <div key={r.id} className="border-t pt-4 first:border-t-0 first:pt-0">
                    <div className="flex items-center gap-1 mb-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'
                          }`}
                        />
                      ))}
                      {r.verification_type === 'invitation' && (
                        <Badge variant="outline" className="ml-2 text-[10px]">
                          No verificada por reserva
                        </Badge>
                      )}
                    </div>
                    {r.title && <p className="font-medium">{r.title}</p>}
                    {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
                    {r.provider_response && (
                      <div className="mt-2 ml-4 pl-3 border-l-2 border-purple-300 text-sm">
                        <strong className="text-purple-700">Respuesta del vet:</strong>{' '}
                        {r.provider_response}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        {/* CTA registro — solo para visitantes no logueados */}
        {!user && (
          <Card className="p-6 bg-purple-50 border-purple-300 text-center">
            <p className="text-sm mb-3">
              ¿Eres dueño de mascota? Crea tu cuenta gratis para reservar y dejar reseñas.
            </p>
            <Link to="/auth">
              <Button>Crear cuenta</Button>
            </Link>
          </Card>
        )}
      </main>

      <PublicFooter />

      {/* Modal responsive: bottom sheet en mobile, dialog en desktop */}
      <ResponsiveModal
        open={reservaOpen}
        onOpenChange={setReservaOpen}
        title={`Reservar con ${v.display_name}`}
        description="Elige tu mascota, fecha y hora para reservar."
      >
        <BookingFlow
          providerId={v.id}
          providerName={v.display_name ?? 'Profesional'}
          serviceType="consulta_general"
          bookingType="vet"
          onSuccess={() => setReservaOpen(false)}
          onClose={() => setReservaOpen(false)}
        />
      </ResponsiveModal>
    </div>
  );
}
