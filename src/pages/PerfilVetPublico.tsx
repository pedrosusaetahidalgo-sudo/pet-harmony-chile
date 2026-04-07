import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MapPin, Star, Stethoscope, Share2, MessageSquare, Calendar, Loader2 } from '@/lib/icons';
import { useAuth } from '@/hooks/useAuth';
import { LINKS } from '@/lib/links';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  useDirectoryVetBySlug,
  useVetReviews,
  trackProviderView,
} from '@/hooks/useDirectoryVets';
import { setSeoTags, injectJsonLd, formatCLP } from '@/lib/vetDirectory';
import { PublicHeader, PublicFooter } from './DirectorioVets';

export default function PerfilVetPublico() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: vet, isLoading } = useDirectoryVetBySlug(slug);
  const v = vet;
  const { data: reviews } = useVetReviews(v?.id);

  const [reservaOpen, setReservaOpen] = useState(false);
  const [reservaMessage, setReservaMessage] = useState('');
  const [reservaDate, setReservaDate] = useState('');
  const [reservaLoading, setReservaLoading] = useState(false);

  const handleReservar = () => {
    if (!user) {
      navigate(LINKS.authReturn(`/veterinarios/${slug}`));
      return;
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
    setReservaLoading(true);
    try {
      // Buscar la primera mascota del usuario (vet_bookings requiere pet_id)
      const { data: pets } = await supabase
        .from('pets')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1);

      if (!pets || pets.length === 0) {
        toast.error('Debes registrar al menos una mascota antes de reservar');
        navigate('/add-pet');
        return;
      }

      // Crear booking real vinculado al directorio.
      // El trigger SQL notify_on_directory_booking notifica automáticamente al vet.
      const { error } = await supabase.from('vet_bookings').insert({
        owner_id: user.id,
        pet_id: pets[0].id,
        service_provider_id: v.id,
        scheduled_date: new Date(reservaDate).toISOString(),
        service_type: 'consultation',
        symptoms: reservaMessage.trim(),
        status: 'pending',
        payment_status: 'pending',
      });
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
    const rating = Number(v.avg_rating ?? 0).toFixed(1);
    const areas: string[] = v.service_areas ?? [];
    const description = `★ ${rating} (${v.total_reviews ?? 0} reseñas) · ${
      v.price_from ? `Consultas desde ${formatCLP(v.price_from)} · ` : ''
    }${areas.length > 0 ? `Atiende ${areas.slice(0, 3).join(', ')}` : ''}`;

    setSeoTags({
      title: `${v.display_name} | Veterinario en Paw Friend`,
      description,
      canonical: `https://pawfriend.cl/veterinarios/${v.slug}`,
      ogImage: v.avatar_url ?? undefined,
    });

    injectJsonLd('vet-jsonld', {
      '@context': 'https://schema.org',
      '@type': 'Veterinarian',
      name: v.display_name,
      image: v.avatar_url ?? undefined,
      description: v.bio ?? undefined,
      telephone: v.public_phone ?? undefined,
      email: v.public_email ?? undefined,
      address: v.commune
        ? { '@type': 'PostalAddress', addressLocality: v.commune, addressCountry: 'CL' }
        : undefined,
      aggregateRating:
        Number(v.total_reviews ?? 0) > 0
          ? {
              '@type': 'AggregateRating',
              ratingValue: rating,
              reviewCount: String(v.total_reviews ?? 0),
            }
          : undefined,
    });
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-amber-50">
        <PublicHeader />
        <main className="container mx-auto px-4 py-8 max-w-4xl space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </main>
      </div>
    );
  }

  if (!v) {
    return (
      <div className="min-h-screen bg-amber-50">
        <PublicHeader />
        <main className="container mx-auto px-4 py-16 max-w-md text-center">
          <h1 className="text-2xl font-bold mb-2">Veterinario no encontrado</h1>
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

  const rating = Number(v.avg_rating ?? 0);
  const reviewCount = Number(v.total_reviews ?? 0);
  const specialties: string[] = v.specialties ?? [];
  const areas: string[] = v.service_areas ?? [];
  const visibleReviews = reviews ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <PublicHeader />

      <main className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
        {/* Hero */}
        <Card className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-6">
            {v.avatar_url ? (
              <img
                src={v.avatar_url}
                alt={v.display_name}
                className="w-32 h-32 rounded-full object-cover border-4 border-amber-200 mx-auto md:mx-0"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-amber-100 flex items-center justify-center mx-auto md:mx-0">
                <Stethoscope className="h-12 w-12 text-amber-600" />
              </div>
            )}

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold text-amber-900">
                {v.display_name}
                {v.is_verified && (
                  <span className="ml-2 text-blue-500 text-base align-middle">
                    ✓ Verificado
                  </span>
                )}
              </h1>
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

              {areas.length > 0 && (
                <div className="flex items-start justify-center md:justify-start gap-1 text-sm mb-2">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-600" />
                  <span>
                    <strong>Atiende en:</strong> {areas.join(', ')}
                  </span>
                </div>
              )}

              {v.price_from && (
                <p className="text-sm mb-4">
                  💰 Consultas desde{' '}
                  <strong className="text-amber-700">{formatCLP(v.price_from)}</strong>
                </p>
              )}

              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                <Button onClick={handleReservar} className="bg-amber-600 hover:bg-amber-700">
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
              <p className="text-sm mt-3 text-amber-700">
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
                <span className="text-muted-foreground">
                  promedio · {reviewCount} reseñas
                </span>
              </div>

              <div className="space-y-4">
                {visibleReviews.map((r) => (
                  <div key={r.id} className="border-t pt-4 first:border-t-0 first:pt-0">
                    <div className="flex items-center gap-1 mb-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < r.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
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
                    {r.comment && (
                      <p className="text-sm text-muted-foreground">{r.comment}</p>
                    )}
                    {r.provider_response && (
                      <div className="mt-2 ml-4 pl-3 border-l-2 border-amber-300 text-sm">
                        <strong className="text-amber-700">Respuesta del vet:</strong>{' '}
                        {r.provider_response}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        {/* CTA registro */}
        <Card className="p-6 bg-amber-50 border-amber-300 text-center">
          <p className="text-sm mb-3">
            ¿Eres dueño de mascota? Crea tu cuenta gratis para reservar y dejar reseñas.
          </p>
          <Link to="/auth">
            <Button>Crear cuenta</Button>
          </Link>
        </Card>
      </main>

      <PublicFooter />

      {/* Modal responsive: bottom sheet en mobile, dialog en desktop */}
      <ResponsiveModal
        open={reservaOpen}
        onOpenChange={setReservaOpen}
        title={`Solicitar consulta a ${v.display_name}`}
        description="Cuéntale brevemente qué necesita tu mascota. Le enviaremos tu solicitud y te contactará para coordinar."
      >
        <div className="space-y-3">
            <div>
              <Label htmlFor="reserva-date">Fecha y hora tentativa</Label>
              <input
                id="reserva-date"
                type="datetime-local"
                value={reservaDate}
                onChange={(e) => setReservaDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full mt-1 px-3 py-2 border border-input rounded-md text-sm bg-background"
              />
              <p className="text-xs text-muted-foreground mt-1">
                El veterinario confirmará el horario por chat.
              </p>
            </div>

            <div>
              <Label htmlFor="reserva-msg">Mensaje</Label>
              <Textarea
                id="reserva-msg"
                value={reservaMessage}
                onChange={(e) => setReservaMessage(e.target.value)}
                placeholder="Ej: Mi perro Luna necesita su vacuna anual y un control general. Tiene 4 años, raza beagle."
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1">{reservaMessage.length}/500</p>
            </div>

            <Button
              onClick={handleSubmitReserva}
              disabled={reservaLoading}
              className="w-full bg-amber-600 hover:bg-amber-700"
            >
              {reservaLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Enviando…
                </>
              ) : (
                'Enviar solicitud'
              )}
            </Button>
          </div>
      </ResponsiveModal>
    </div>
  );
}
