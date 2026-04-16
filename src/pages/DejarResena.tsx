import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Star, Loader2, CheckCircle2, AlertCircle, Stethoscope } from '@/lib/icons';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { track, EVENTS } from '@/lib/analytics';
import { useInvitationByToken, useSubmitInvitedReview } from '@/hooks/useReviewInvitations';
import { LINKS } from '@/lib/links';
import { useAuth } from '@/hooks/useAuth';
import { PublicHeader, PublicFooter } from '@/components/layouts/PublicLayout';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { reviewSchema, type ReviewFormData } from '@/lib/schemas';

export default function DejarResena() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: invitation, isLoading, error } = useInvitationByToken(token);
  const submit = useSubmitInvitedReview();

  const {
    register,
    handleSubmit: rhfHandleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { title: '', comment: '', rating: 0 },
  });

  const rating = watch('rating');
  const comment = watch('comment');
  const [hover, setHover] = useState(0);
  const [done, setDone] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-purple-50">
        <PublicHeader />
        <main className="container mx-auto px-4 py-8 max-w-xl">
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <ErrorState
        title="Invitación no válida"
        message="Este enlace no existe o ya expiró. Pídele al veterinario que te genere uno nuevo."
      />
    );
  }

  if (invitation.is_used) {
    return (
      <ErrorState
        title="Invitación ya utilizada"
        message="Esta invitación ya fue usada para dejar una reseña. Si quieres dejar otra, pídele a tu veterinario un nuevo enlace."
      />
    );
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return (
      <ErrorState
        title="Invitación expirada"
        message="Este enlace expiró. Pídele a tu veterinario que te genere uno nuevo."
      />
    );
  }

  const provider = invitation.service_providers;

  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
        <PublicHeader />
        <main className="container mx-auto px-4 py-8 md:py-12 max-w-md text-center">
          <div className="inline-flex p-4 rounded-full bg-green-100 mb-4">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">¡Gracias por tu reseña!</h1>
          <p className="text-muted-foreground mb-6">
            Tu opinión ya está publicada en el perfil de {provider?.display_name}.
          </p>
          {provider?.slug && (
            <Link to={`/veterinarios/${provider.slug}`}>
              <Button>Ver el perfil</Button>
            </Link>
          )}
        </main>
        <PublicFooter />
      </div>
    );
  }

  // Si no está logueado, pedir login antes
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
        <PublicHeader />
        <main className="container mx-auto px-4 py-8 max-w-md">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-3">
                {provider?.avatar_url ? (
                  <img
                    src={provider.avatar_url}
                    alt={provider.display_name}
                    loading="lazy"
                    className="w-20 h-20 rounded-full object-cover border-2 border-purple-100"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center mx-auto">
                    <Stethoscope className="h-8 w-8 text-purple-500" />
                  </div>
                )}
              </div>
              <CardTitle>{provider?.display_name} te invita a dejar una reseña</CardTitle>
              <CardDescription>
                Para dejar tu reseña necesitas iniciar sesión o crear una cuenta. Es rápido y
                gratuito.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full"
                onClick={() => navigate(LINKS.authReturn(`/resena/${token}`))}
              >
                Iniciar sesión / Registrarme
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Después de iniciar sesión volverás aquí automáticamente.
              </p>
            </CardContent>
          </Card>
        </main>
        <PublicFooter />
      </div>
    );
  }

  const onSubmit = async (data: ReviewFormData) => {
    try {
      await submit.mutateAsync({
        invitation_id: invitation.id,
        provider_id: provider.id,
        rating: data.rating,
        title: data.title || '',
        comment: data.comment,
      });
      track({
        event: EVENTS.REVIEW_CREATED,
        properties: { provider_id: provider.id, rating: data.rating },
      });
      setDone(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al enviar la reseña');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <PublicHeader />
      <main className="container mx-auto px-4 py-8 max-w-xl">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-3">
              {provider?.avatar_url ? (
                <img
                  src={provider.avatar_url}
                  alt={provider.display_name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-purple-100"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center mx-auto">
                  <Stethoscope className="h-8 w-8 text-purple-500" />
                </div>
              )}
            </div>
            <CardTitle>Dejar reseña a {provider?.display_name}</CardTitle>
            <CardDescription>Tu opinión ayuda a otros dueños de mascotas a elegir.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <form onSubmit={rhfHandleSubmit(onSubmit)} className="space-y-5">
              {/* Estrellas */}
              <div>
                <Label className="block mb-2 text-center">Tu calificacion *</Label>
                <div className="flex justify-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onMouseEnter={() => setHover(n)}
                      onMouseLeave={() => setHover(0)}
                      onClick={() => setValue('rating', n, { shouldValidate: true })}
                      className="p-1"
                    >
                      <Star
                        className={`h-9 w-9 transition ${
                          n <= (hover || rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {errors.rating && (
                  <p className="text-xs text-destructive text-center mt-1">
                    {errors.rating.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="title">Titulo (opcional)</Label>
                <Input
                  id="title"
                  {...register('title')}
                  placeholder="Excelente atencion"
                  maxLength={100}
                />
                {errors.title && (
                  <p className="text-xs text-destructive mt-1">{errors.title.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="comment">Tu resena *</Label>
                <Textarea
                  id="comment"
                  {...register('comment')}
                  placeholder="Cuenta tu experiencia con este veterinario..."
                  rows={5}
                  maxLength={500}
                />
                <div className="flex justify-between mt-1">
                  {errors.comment ? (
                    <p className="text-xs text-destructive">{errors.comment.message}</p>
                  ) : (
                    <span />
                  )}
                  <p className="text-xs text-muted-foreground">{comment?.length ?? 0}/500</p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">
                  Esta resena aparecera marcada como "no verificada por reserva" porque viene de una
                  invitacion directa del veterinario, no de una reserva hecha en Paw Friend.
                </p>
              </div>

              <Button type="submit" disabled={submit.isPending} className="w-full" size="lg">
                {submit.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Enviando...
                  </>
                ) : (
                  'Publicar resena'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
      <PublicFooter />
    </div>
  );
}

function ErrorState({ title, message }: { title: string; message: string }) {
  return (
    <div className="min-h-screen bg-purple-50">
      <PublicHeader />
      <main className="container mx-auto px-4 py-10 md:py-16 max-w-md text-center">
        <AlertCircle className="h-12 w-12 mx-auto text-amber-500 mb-3" />
        <h1 className="text-2xl font-bold mb-2">{title}</h1>
        <p className="text-muted-foreground mb-6">{message}</p>
        <Link to="/veterinarios">
          <Button>Ver directorio de veterinarios</Button>
        </Link>
      </main>
      <PublicFooter />
    </div>
  );
}
