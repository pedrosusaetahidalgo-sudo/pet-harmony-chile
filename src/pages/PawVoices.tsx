import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Megaphone,
  Sparkles,
  Heart,
  Gift,
  Crown,
  Zap,
  Link2,
  Palette,
  MessageCircle,
} from '@/lib/icons';
import type { LucideIcon } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { CategoryIcon } from '@/components/CategoryIcon';
import { PawVoicesGrid } from '@/components/PawVoicesGrid';
import { PawVoiceApplyForm } from '@/components/PawVoiceApplyForm';

const BENEFITS = [
  {
    icon: Crown,
    title: 'Badge oficial Paw Voice',
    text: 'Visible en tu perfil y en cada mención. Reconocimiento público de la comunidad peluda.',
  },
  {
    icon: Sparkles,
    title: 'Perfil destacado',
    text: 'Aparecés en el directorio oficial de Paw Voices con tu link, historia y código promo.',
  },
  {
    icon: Gift,
    title: 'Código promo único',
    text: 'Tu audiencia recibe beneficios con tu código. Tú recibes reconocimiento y métricas.',
  },
  {
    icon: Zap,
    title: 'Beta access',
    text: 'Primera fila en features nuevas. Acceso directo al fundador para feedback.',
  },
];

const WE_NEED: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Link2,
    title: 'Exponer el link',
    text: 'pawfriend.cl en tu bio, historia o pie de reel.',
  },
  {
    icon: Palette,
    title: '1 gráfica o reel al mes',
    text: 'Nosotros te lo entregamos listo. Tú le pones tu voz.',
  },
  {
    icon: MessageCircle,
    title: 'Hablar desde tu experiencia',
    text: 'Sin guiones. Cuéntanos cómo Paw Friend te sirve a ti y a tus peludos.',
  },
];

export default function PawVoices() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Paw Voices — Red de creadores peludos | Paw Friend';
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Helmet>
        <title>Paw Voices — Red de creadores peludos | Paw Friend</title>
        <meta
          name="description"
          content="Creadores e influencers peludos que amplifican Paw Friend. Súmate, muestra el link, comparte un reel al mes. Badge oficial, perfil destacado y código promo."
        />
        <meta
          property="og:image"
          content="https://pawfriend.cl/paw-friend-assets-v2/paw_voices_og_card.svg"
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
      <PageHeader title="Paw Voices" onBack={() => navigate(-1)} />

      {/* Hero banner del brand kit v2 */}
      <div className="relative overflow-hidden">
        <img
          src="/paw-friend-assets-v2/paw_voices_hero_banner.svg"
          alt="Paw Voices · creadores peludos"
          className="w-full h-32 sm:h-48 object-cover"
          loading="eager"
        />
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% 0%, hsl(280 80% 92% / 0.6), transparent 60%), radial-gradient(ellipse 60% 40% at 50% 100%, hsl(320 90% 92% / 0.4), transparent 70%)',
        }}
      />

      <div className="container max-w-3xl mx-auto px-4 py-10 space-y-10 animate-fade-in">
        {/* Hero */}
        <section className="text-center space-y-3">
          <Badge
            variant="outline"
            className="bg-violet-50 border-violet-200 text-violet-700 text-[11px]"
          >
            <Megaphone className="h-3 w-3 mr-1" />
            Red de creadores peludos
          </Badge>
          <div className="flex justify-center pt-2">
            <CategoryIcon kind="voice" variant="full" className="h-28 w-28" />
          </div>
          <h1 className="font-display font-semibold text-4xl md:text-5xl leading-[1.08] tracking-tight">
            Sé una{' '}
            <span className="bg-audience-voices-gradient bg-clip-text text-transparent">
              voz peluda
            </span>{' '}
            de Paw Friend
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm md:text-base">
            Buscamos creadores que amen genuinamente a los animales y quieran amplificar la misión
            de Paw Friend. Chile y Latinoamérica bienvenidos.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
            <Button
              onClick={() =>
                document.getElementById('aplicar')?.scrollIntoView({ behavior: 'smooth' })
              }
              className="bg-audience-voices-gradient shadow-audience-voices"
            >
              Quiero aplicar →
            </Button>
            <Button variant="outline" onClick={() => navigate('/paw-core')}>
              Ver nuestra misión
            </Button>
          </div>
        </section>

        {/* Grid de voices activos */}
        <PawVoicesGrid />

        {/* Qué necesitamos */}
        <Card className="border-pink-200/60 bg-gradient-to-br from-pink-50/70 to-amber-50/40 dark:from-pink-950/30 dark:to-amber-950/20">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-500 fill-pink-500" />
              <h2 className="font-semibold text-lg">Qué te pedimos</h2>
            </div>
            <p className="text-sm text-foreground/85">
              En la etapa inicial es algo simple. Nada de contratos ni letra chica:
            </p>
            <ul className="space-y-2.5">
              {WE_NEED.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.title} className="flex gap-3 items-start">
                    <span
                      className="shrink-0 w-8 h-8 rounded-lg bg-pink-50 dark:bg-pink-950/30 flex items-center justify-center mt-0.5"
                      aria-hidden
                    >
                      <Icon className="h-4 w-4 text-pink-600 dark:text-pink-300" />
                    </span>
                    <div>
                      <div className="font-semibold text-sm">{item.title}</div>
                      <p className="text-xs text-muted-foreground leading-snug">{item.text}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>

        {/* Qué recibes */}
        <Card className="border-violet-200/70 bg-gradient-to-br from-violet-50/70 to-fuchsia-50/50 dark:from-violet-950/30 dark:to-fuchsia-950/20">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-500" />
              <h2 className="font-semibold text-lg">Qué recibes</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {BENEFITS.map((b) => {
                const Icon = b.icon;
                return (
                  <div
                    key={b.title}
                    className="rounded-lg border border-violet-100 dark:border-violet-900/40 bg-white/70 dark:bg-slate-900/60 p-3 space-y-1"
                  >
                    <div className="flex items-center gap-1.5">
                      <Icon className="h-4 w-4 text-violet-600" />
                      <h3 className="font-semibold text-sm leading-tight">{b.title}</h3>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug">{b.text}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Form de aplicación */}
        <PawVoiceApplyForm />

        {/* Link al brief */}
        <section className="text-center text-sm text-muted-foreground space-y-1 pt-2">
          <p>
            ¿Quieres más contexto? Pídenos el brief completo a{' '}
            <a
              href="mailto:pawfriendcl@gmail.com?subject=Brief%20Paw%20Voices"
              className="underline hover:text-foreground"
            >
              pawfriendcl@gmail.com
            </a>
            .
          </p>
          <p className="text-[11px] italic">Contacto directo: pawfriendcl@gmail.com</p>
        </section>
      </div>
    </div>
  );
}
