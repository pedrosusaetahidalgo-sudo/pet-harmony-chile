/**
 * /post-adoption/:id — el adoptante responde el check-in que le llego por
 * email del cron post-adoption-checkin-cron.
 *
 * Carga el check-in por id (RLS permite read si owner_id = auth.uid() o si
 * el check-in esta 'sent' y el user llego con email matching — confiamos
 * en la UUID como "firma" unica del link del email).
 *
 * Permite al adoptante:
 *   - Dar un score 1-5 (¿como le va a la mascota?)
 *   - Dejar notas opcionales
 *   - Se actualiza response_score + response_notes + responded_at + status='responded'
 *
 * Acceso publico (sin auth) porque el link viene por email. La RLS para
 * UPDATE requiere owner_id = auth.uid(), asi que si no hay sesion,
 * redirigimos al auth con returnTo. Si el user no es el owner, muestra
 * error amigable.
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, Loader2, ArrowRight, PawPrint, Star, Heart } from 'lucide-react';

interface CheckinRecord {
  id: string;
  pet_id: string;
  shelter_id: string | null;
  owner_id: string | null;
  owner_email: string;
  milestone_days: number;
  status: 'pending' | 'sent' | 'responded' | 'skipped' | 'failed';
  response_score: number | null;
  response_notes: string | null;
  responded_at: string | null;
  sent_at: string | null;
}

interface PetInfo {
  id: string;
  name: string;
  photo_url: string | null;
  species: string | null;
}

const MILESTONE_TITLE: Record<number, string> = {
  7: 'Primera semana',
  30: 'Un mes',
  90: '3 meses',
};

export default function PostAdoptionCheckin() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [score, setScore] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Redirect a auth si no hay sesion
  useEffect(() => {
    if (!authLoading && !user) {
      navigate(`/auth?returnTo=/post-adoption/${id}`, { replace: true });
    }
  }, [user, authLoading, id, navigate]);

  const {
    data: checkin,
    isLoading,
    error,
  } = useQuery<CheckinRecord | null>({
    queryKey: ['post-adoption-checkin', id, user?.id],
    queryFn: async () => {
      if (!id || !user) return null;
      const { data } = await supabase
        .from('post_adoption_checkins')
        .select(
          'id, pet_id, shelter_id, owner_id, owner_email, milestone_days, status, response_score, response_notes, responded_at, sent_at'
        )
        .eq('id', id)
        .maybeSingle();
      return (data as CheckinRecord) || null;
    },
    enabled: !!id && !!user,
  });

  const { data: pet } = useQuery<PetInfo | null>({
    queryKey: ['post-adoption-pet', checkin?.pet_id],
    queryFn: async () => {
      if (!checkin?.pet_id) return null;
      const { data } = await supabase
        .from('pets')
        .select('id, name, photo_url, species')
        .eq('id', checkin.pet_id)
        .maybeSingle();
      return (data as PetInfo) || null;
    },
    enabled: !!checkin?.pet_id,
  });

  // Pre-fill si ya respondio
  useEffect(() => {
    if (checkin?.response_score) setScore(checkin.response_score);
    if (checkin?.response_notes) setNotes(checkin.response_notes);
  }, [checkin?.response_score, checkin?.response_notes]);

  const handleSubmit = async () => {
    if (!id || !score) {
      toast.error('Elige un puntaje del 1 al 5');
      return;
    }
    setSubmitting(true);
    try {
      const { error: updateError } = await supabase
        .from('post_adoption_checkins')
        .update({
          response_score: score,
          response_notes: notes.trim() || null,
          responded_at: new Date().toISOString(),
          status: 'responded',
        })
        .eq('id', id);
      if (updateError) throw updateError;
      setSubmitted(true);
      toast.success('¡Gracias por tu respuesta!');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'No pudimos guardar tu respuesta');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error || !checkin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-50 to-pink-50">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <PawPrint className="h-10 w-10 text-muted-foreground mx-auto" />
            <h1 className="text-xl font-display font-semibold">Check-in no disponible</h1>
            <p className="text-sm text-muted-foreground">
              Este enlace no existe, ya caduco, o no tienes acceso. Si crees que es un error,
              escribenos a <strong>pedrosusaeta@pawfriend.cl</strong>.
            </p>
            <Button onClick={() => navigate('/home')}>Ir al inicio</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si el user autenticado no es el owner del check-in
  if (checkin.owner_id && user && checkin.owner_id !== user.id) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-50 to-pink-50">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Este check-in pertenece a otra cuenta. Inicia sesion con{' '}
              <strong>{checkin.owner_email}</strong> para responder.
            </p>
            <Button variant="outline" onClick={() => navigate('/auth')}>
              Cambiar de cuenta
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted || checkin.status === 'responded') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-50 to-purple-50">
        <Helmet>
          <title>Respuesta enviada · Paw Friend</title>
        </Helmet>
        <Card className="max-w-md w-full border-green-200">
          <CardContent className="p-8 text-center space-y-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-700" />
            </div>
            <h1 className="text-2xl font-display font-semibold">¡Gracias!</h1>
            <p className="text-sm text-muted-foreground">
              Tu respuesta nos ayuda a cerrar el ciclo de la adopcion y aporta data de calidad al
              refugio. Si hay algo en que podamos ayudarte, escríbenos a{' '}
              <strong>pedrosusaeta@pawfriend.cl</strong>.
            </p>
            {pet && (
              <div className="flex items-center justify-center gap-3 pt-2 text-sm text-muted-foreground">
                <Heart className="h-4 w-4 text-pink-500" />
                <span>Abrazos para {pet.name}</span>
              </div>
            )}
            <Button onClick={() => navigate('/home')}>Ir al inicio</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const milestoneTitle =
    MILESTONE_TITLE[checkin.milestone_days] || `${checkin.milestone_days} dias`;
  const petName = pet?.name || 'tu peludo';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-4 py-10">
      <Helmet>
        <title>Check-in {milestoneTitle} · Paw Friend</title>
      </Helmet>

      <div className="container max-w-lg mx-auto">
        <Card className="shadow-xl rounded-2xl overflow-hidden">
          {/* Header con gradient + mascota */}
          <div className="bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 p-6 text-white text-center">
            <div className="mx-auto h-20 w-20 rounded-full bg-white/20 backdrop-blur-sm border-4 border-white/30 flex items-center justify-center mb-3 overflow-hidden">
              {pet?.photo_url ? (
                <img src={pet.photo_url} alt={pet.name} className="h-full w-full object-cover" />
              ) : (
                <PawPrint className="h-10 w-10" />
              )}
            </div>
            <div className="text-xs uppercase tracking-wider text-purple-100/90">
              Check-in · {milestoneTitle}
            </div>
            <h1 className="text-2xl font-display font-semibold mt-1">¿Como esta {petName}?</h1>
          </div>

          <CardContent className="p-6 space-y-5">
            <p className="text-sm text-muted-foreground">
              Cuentanos como va la adaptacion. Tu respuesta le llega al refugio y nos ayuda a
              mejorar el proceso de adopciones futuras.
            </p>

            {/* Score 1-5 */}
            <div className="space-y-2" role="radiogroup" aria-label="¿Como esta todo?">
              <p className="text-sm font-semibold" id="score-legend">
                ¿Como esta todo? *
              </p>
              <div className="grid grid-cols-5 gap-2" aria-labelledby="score-legend">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setScore(n)}
                    className={`aspect-square rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 ${
                      score === n
                        ? 'border-purple-500 bg-purple-50 scale-105 shadow-md'
                        : 'border-slate-200 hover:border-purple-300 bg-white'
                    }`}
                    aria-label={`Puntaje ${n}`}
                  >
                    <span className="text-2xl">{['😞', '😐', '🙂', '😊', '🥰'][n - 1]}</span>
                    <span className="text-[10px] font-semibold text-muted-foreground">{n}</span>
                  </button>
                ))}
              </div>
              {score && (
                <p className="text-xs text-purple-700">
                  {score === 1 && 'Algo no va bien. Cuentanos mas abajo.'}
                  {score === 2 && 'Hay dificultades. Ayudanos a entender.'}
                  {score === 3 && 'Algo regular, progresando.'}
                  {score === 4 && '¡Que bueno! Buen progreso.'}
                  {score === 5 && '¡Genial! Toda una familia.'}
                </p>
              )}
            </div>

            {/* Notas */}
            <div className="space-y-1.5">
              <label htmlFor="notes" className="text-sm font-semibold">
                ¿Algo mas? (opcional)
              </label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Historia, anecdotas, preguntas, o cualquier cosa que quieras contarnos."
                rows={4}
                maxLength={1000}
              />
              <p className="text-[10px] text-muted-foreground text-right">{notes.length}/1000</p>
            </div>

            {/* Stars decorativos */}
            <div className="flex items-center justify-center gap-1 py-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    score && i <= score ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'
                  }`}
                />
              ))}
            </div>

            <Button
              onClick={handleSubmit}
              disabled={submitting || !score}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:opacity-90 h-12 font-bold"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando
                </>
              ) : (
                <>
                  Enviar respuesta <ArrowRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>

            <p className="text-[11px] text-center text-muted-foreground">
              Si quieres dejar de recibir check-ins, contestanos directo al email con la palabra
              "baja". Tu ficha medica sigue intacta.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
