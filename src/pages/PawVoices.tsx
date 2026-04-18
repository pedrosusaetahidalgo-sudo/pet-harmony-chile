import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Megaphone, Sparkles, Heart, Gift, Crown, Zap } from '@/lib/icons';
import { PageHeader } from '@/components/PageHeader';
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

const WE_NEED = [
  {
    emoji: '🔗',
    title: 'Exponer el link',
    text: 'pawfriend.cl en tu bio, historia o pie de reel.',
  },
  {
    emoji: '🎨',
    title: '1 gráfica o reel al mes',
    text: 'Nosotros te lo entregamos listo. Vos le das tu voz.',
  },
  {
    emoji: '💬',
    title: 'Hablar desde tu experiencia',
    text: 'Sin guiones. Contá cómo Paw Friend te sirve a ti y a tus peludos.',
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
          content="Creadores e influencers peludos que amplifican Paw Friend. Sumate, exponé el link, compartí un reel al mes. Badge oficial, perfil destacado y código promo."
        />
      </Helmet>
      <PageHeader title="Paw Voices" onBack={() => navigate(-1)} />

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
          <h1 className="text-3xl md:text-4xl font-bold leading-tight">
            Sé una{' '}
            <span className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-rose-500 bg-clip-text text-transparent">
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
              className="bg-gradient-to-r from-violet-500 to-fuchsia-500"
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
              {WE_NEED.map((item) => (
                <li key={item.title} className="flex gap-3">
                  <span className="text-lg leading-none" aria-hidden>
                    {item.emoji}
                  </span>
                  <div>
                    <div className="font-semibold text-sm">{item.title}</div>
                    <p className="text-xs text-muted-foreground leading-snug">{item.text}</p>
                  </div>
                </li>
              ))}
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
            ¿Quieres más contexto? Descarga el brief completo desde{' '}
            <a
              href="https://github.com/pedrosusaetahidalgo-sudo/pet-harmony-chile/blob/main/docs/BRIEF_PAW_VOICES.md"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              aquí
            </a>
            .
          </p>
          <p className="text-[11px] italic">Contacto directo: pawfriendcl@gmail.com</p>
        </section>
      </div>
    </div>
  );
}
