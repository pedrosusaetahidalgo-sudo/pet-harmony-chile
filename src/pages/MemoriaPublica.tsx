/**
 * MemoriaPublica — página pública de memorial para una mascota fallecida.
 *
 * Ruta: `/memoria/:petId`
 *
 * Objetivo (refactor maestro §6.7 Memorial viral):
 *   - Compartible en redes (WhatsApp / Instagram / Twitter)
 *   - Meta tags OG con foto de la mascota para preview bonito
 *   - Accesible SIN login (tiene que poder abrirla cualquier persona)
 *   - Visible solo si:
 *       • passed_away_at IS NOT NULL (mascota marcada como fallecida)
 *       • memorial_visibility = 'public' OR memorial_remembrance_enabled = true
 *
 * Si la mascota no cumple los requisitos (vive, memorial privado, no existe),
 * muestra empty state elegante (no crash, no 404 feo).
 */
import { useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Heart, PawPrint, Share2, Home as HomeIcon } from 'lucide-react';
import { toast } from 'sonner';
import { trackRefactor, RefactorEvent } from '@/lib/refactorAnalytics';

interface PublicMemorial {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  photo_url: string | null;
  memorial_photo_url: string | null;
  memorial_message: string | null;
  memorial_visibility: string | null;
  memorial_remembrance_enabled: boolean | null;
  birth_date: string | null;
  passed_away_at: string | null;
  passed_away_cause: string | null;
}

function formatYear(date: string | null): string {
  if (!date) return '';
  try {
    return new Date(date).getFullYear().toString();
  } catch {
    return '';
  }
}

function fullYears(birth: string | null, death: string | null): string {
  if (!birth || !death) return '';
  try {
    const b = new Date(birth);
    const d = new Date(death);
    const years = Math.floor((d.getTime() - b.getTime()) / (365.25 * 24 * 3600 * 1000));
    if (years >= 1) return `${years} ${years === 1 ? 'año' : 'años'}`;
    const months = Math.floor((d.getTime() - b.getTime()) / (30.44 * 24 * 3600 * 1000));
    return `${months} ${months === 1 ? 'mes' : 'meses'}`;
  } catch {
    return '';
  }
}

const BASE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://pawfriend.cl';

export default function MemoriaPublica() {
  const { petId } = useParams<{ petId: string }>();

  const { data: pet, isLoading } = useQuery<PublicMemorial | null>({
    queryKey: ['memoria-publica', petId],
    queryFn: async () => {
      if (!petId) return null;
      const { data } = await supabase
        .from('pets')
        .select(
          'id, name, species, breed, photo_url, memorial_photo_url, memorial_message, memorial_visibility, memorial_remembrance_enabled, birth_date, passed_away_at, passed_away_cause'
        )
        .eq('id', petId)
        .maybeSingle();
      return (data as PublicMemorial) || null;
    },
    enabled: !!petId,
    staleTime: 5 * 60_000,
  });

  const isPublic = useMemo(() => {
    if (!pet) return false;
    if (!pet.passed_away_at) return false;
    return pet.memorial_visibility === 'public' || pet.memorial_remembrance_enabled === true;
  }, [pet]);

  useEffect(() => {
    if (pet && isPublic) {
      trackRefactor(RefactorEvent.homePetFocusViewed, {
        memorial: true,
        pet_id: pet.id,
      });
    }
  }, [pet, isPublic]);

  const photo = pet?.memorial_photo_url || pet?.photo_url || '';
  const shareUrl = `${BASE_URL}/memoria/${petId}`;

  const handleShare = async () => {
    if (!pet) return;
    const shareTitle = `En memoria de ${pet.name}`;
    const shareText = `Recordando a ${pet.name}${
      pet.birth_date && pet.passed_away_at
        ? ` (${formatYear(pet.birth_date)}–${formatYear(pet.passed_away_at)})`
        : ''
    }`;
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
      } catch {
        // usuario canceló, sin error
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success('Link copiado al portapapeles');
    }
  };

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <PawPrint className="h-10 w-10 text-slate-400 animate-pulse" />
      </div>
    );
  }

  // Not found / privado
  if (!pet || !isPublic) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center px-4">
        <Helmet>
          <title>Memorial no disponible · Paw Friend</title>
        </Helmet>
        <div className="text-center max-w-md">
          <PawPrint className="h-12 w-12 mx-auto text-slate-400 mb-4" />
          <h1 className="text-xl font-semibold text-slate-700 mb-2">
            Este memorial no está disponible
          </h1>
          <p className="text-sm text-slate-500 mb-6">
            Puede ser que el tributo sea privado o que el link haya expirado.
          </p>
          <Button asChild variant="outline">
            <Link to="/">
              <HomeIcon className="h-4 w-4 mr-2" /> Ir a Paw Friend
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const years =
    pet.birth_date && pet.passed_away_at
      ? `${formatYear(pet.birth_date)} — ${formatYear(pet.passed_away_at)}`
      : '';
  const lifespanText = fullYears(pet.birth_date, pet.passed_away_at);
  const description = pet.memorial_message
    ? pet.memorial_message.slice(0, 160)
    : `En memoria de ${pet.name}${lifespanText ? `, nos acompañó ${lifespanText}` : ''}. Un tributo en Paw Friend.`;
  const ogTitle = `En memoria de ${pet.name}${years ? ` (${years})` : ''}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-amber-50 to-white">
      <Helmet>
        <title>{ogTitle} · Paw Friend</title>
        <meta name="description" content={description} />
        {/* Open Graph para preview en WhatsApp, Instagram, Twitter */}
        <meta property="og:type" content="profile" />
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={shareUrl} />
        {photo && <meta property="og:image" content={photo} />}
        {photo && <meta property="og:image:width" content="1200" />}
        {photo && <meta property="og:image:height" content="630" />}
        <meta property="og:site_name" content="Paw Friend" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={ogTitle} />
        <meta name="twitter:description" content={description} />
        {photo && <meta name="twitter:image" content={photo} />}
      </Helmet>

      <div className="container max-w-xl mx-auto px-4 pt-12 pb-16">
        {/* Header con link a Paw Friend */}
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/"
            className="text-xs text-rose-600 font-semibold tracking-wider flex items-center gap-1 hover:text-rose-700"
          >
            🐾 PAW FRIEND
          </Link>
          <Button
            onClick={handleShare}
            variant="outline"
            size="sm"
            className="gap-1 text-rose-600 border-rose-200 hover:bg-rose-50"
          >
            <Share2 className="h-3 w-3" /> Compartir
          </Button>
        </div>

        {/* Foto grande central con marco */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-56 h-56 sm:w-72 sm:h-72 rounded-full overflow-hidden border-[6px] border-white shadow-xl bg-slate-100">
              {photo ? (
                <img
                  src={photo}
                  alt={pet.name}
                  className="w-full h-full object-cover"
                  loading="eager"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <PawPrint className="h-20 w-20 text-rose-300" />
                </div>
              )}
            </div>
            {/* Marco decorativo */}
            <div className="absolute -top-1 -right-1 bg-white rounded-full p-2 shadow-md">
              <Heart className="h-5 w-5 text-rose-500 fill-rose-500" />
            </div>
          </div>
        </div>

        {/* Nombre y años */}
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-rose-500 font-semibold mb-2">
            En memoria de
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl text-slate-900 mb-3">{pet.name}</h1>
          {years && <p className="text-lg text-slate-500 font-serif italic mb-1">{years}</p>}
          {(pet.breed || pet.species) && (
            <p className="text-sm text-slate-400 capitalize">{pet.breed || pet.species}</p>
          )}
          {lifespanText && (
            <p className="text-sm text-rose-600 mt-3 font-medium">
              Nos acompañó durante {lifespanText}
            </p>
          )}
        </div>

        {/* Mensaje del dueño */}
        {pet.memorial_message && (
          <div className="bg-white/70 backdrop-blur rounded-2xl p-6 sm:p-8 border border-rose-100 shadow-sm mb-8">
            <p className="font-serif text-base sm:text-lg text-slate-700 leading-relaxed whitespace-pre-wrap italic">
              "{pet.memorial_message}"
            </p>
          </div>
        )}

        {/* Separador decorativo */}
        <div className="flex items-center justify-center gap-3 my-8 text-rose-300">
          <div className="h-px bg-rose-200 flex-1 max-w-[60px]"></div>
          <Heart className="h-4 w-4 fill-rose-300" />
          <div className="h-px bg-rose-200 flex-1 max-w-[60px]"></div>
        </div>

        {/* CTA secundario: crear mi propio Paw Friend */}
        <div className="text-center">
          <p className="text-sm text-slate-500 mb-4">
            Creado en Paw Friend · la app para recordar y cuidar a tu mascota
          </p>
          <Button
            asChild
            variant="outline"
            className="border-rose-200 text-rose-600 hover:bg-rose-50"
          >
            <Link to="/">Conocer Paw Friend</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
