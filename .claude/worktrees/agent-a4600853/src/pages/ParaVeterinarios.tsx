import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Stethoscope,
  Star,
  Globe,
  Calendar,
  TrendingUp,
  Shield,
  Check,
  X,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { setSeoTags } from '@/lib/vetDirectory';
import { PROVIDER_PLANS } from '@/lib/plans';
import { PublicHeader, PublicFooter } from './DirectorioVets';

const benefits = [
  {
    icon: Globe,
    title: 'Perfil público con tu propia URL',
    desc: 'pawfriend.cl/veterinarios/tu-nombre. Compártelo en Instagram, WhatsApp o tu tarjeta.',
  },
  {
    icon: Star,
    title: 'Reseñas verificadas',
    desc: 'Construye tu reputación con reseñas reales de pacientes que reservaron por la plataforma.',
  },
  {
    icon: Calendar,
    title: 'Reservas online integradas',
    desc: 'Tus pacientes reservan directo desde tu perfil. Tú gestionas todo desde un solo panel.',
  },
  {
    icon: TrendingUp,
    title: 'Sin costo de adquisición',
    desc: 'Aparece gratis en el directorio público de veterinarios de Chile. Posiciónate en Google.',
  },
  {
    icon: Shield,
    title: 'Verificación profesional',
    desc: 'Validamos tu N° Colmevet manualmente para que aparezcas con badge ✓ Verificado.',
  },
  {
    icon: Stethoscope,
    title: 'Hecho para veterinarios',
    desc: 'Especialidades, zonas de atención, precios y disponibilidad. Todo pensado para ti.',
  },
];

const faq = [
  {
    q: '¿Cuánto cuesta?',
    a: 'Tienes un Plan Gratis para empezar (limitado a 20 pacientes y 10 reservas/mes). El Plan Individual es de $9.900/mes y desbloquea hasta 100 pacientes y 50 reservas, además de invitaciones a reseñas. Las clínicas tienen sus propios planes desde $29.900.',
  },
  {
    q: '¿Cómo se verifican las reseñas?',
    a: 'Cada reseña proviene de una reserva real hecha por la plataforma. Esto significa que ningún paciente puede dejarte una reseña sin haberte contratado, y tampoco puedes dejarte reseñas a ti mismo.',
  },
  {
    q: '¿Qué pasa si ya tengo pacientes fuera de la plataforma?',
    a: 'Con el Plan Individual o superior puedes generar invitaciones a reseña: enlaces únicos que envías a tus pacientes actuales por WhatsApp para que dejen una reseña en tu perfil.',
  },
  {
    q: '¿Cómo funciona la comisión?',
    a: 'Solo cobramos comisión sobre las reservas que recibes a través de la plataforma. El Plan Gratis tiene 15% de comisión, el Individual 12%, las clínicas 10% u 8%. Si un paciente te paga directo (efectivo, transferencia), no hay comisión.',
  },
  {
    q: '¿Puedo aparecer si no estoy en Santiago?',
    a: 'Sí, el directorio acepta veterinarios de todo Chile. Por ahora la lista de comunas pre-cargada es de la Región Metropolitana, pero puedes editar tu zona base manualmente.',
  },
  {
    q: '¿Cuánto tarda en estar mi perfil online?',
    a: 'Apenas completas tu perfil al 80% (foto, bio, especialidades, zona, precio) puedes activar la visibilidad pública con un switch. La verificación del N° Colmevet la hacemos manualmente y demora 24-48 horas hábiles.',
  },
];

export default function ParaVeterinarios() {
  const navigate = useNavigate();

  useEffect(() => {
    setSeoTags({
      title: 'Para veterinarios | Construye tu reputación online · Paw Friend',
      description:
        'Únete al directorio de veterinarios de Chile. Recibe reservas, construye tu reputación con reseñas verificadas y haz crecer tu consulta. Desde $9.900/mes.',
      canonical: 'https://pawfriend.cl/para-veterinarios',
    });
  }, []);

  const planFree = PROVIDER_PLANS.provider_free;
  const planIndividual = PROVIDER_PLANS.provider_individual;
  const planClinic = PROVIDER_PLANS.provider_clinic_basic;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <PublicHeader />

      {/* HERO */}
      <section className="container mx-auto px-4 py-8 md:py-12 max-w-5xl">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-5">
            <Badge className="bg-amber-100 text-amber-800 border-amber-300">
              🩺 Para profesionales
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold text-amber-900 leading-tight">
              ¿Cansado de depender solo del boca a boca?
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Construye tu reputación online, recibe reservas y haz crecer tu consulta veterinaria
              con Paw Friend. Tu perfil profesional, tu URL, tus pacientes.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                size="lg"
                className="bg-gradient-to-r from-amber-400 to-pink-500 text-white hover:opacity-90 h-14 text-base font-bold shadow-xl"
                onClick={() => navigate('/registro-veterinario')}
              >
                <Stethoscope className="h-5 w-5 mr-2" />
                Crear mi perfil gratis
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-14 text-base"
                onClick={() => navigate('/veterinarios')}
              >
                Ver directorio
              </Button>
            </div>
            <p className="text-xs text-muted-foreground pt-2">
              ✓ Sin tarjeta de crédito · ✓ Plan gratis para empezar · ✓ Cancela cuando quieras
            </p>
          </div>

          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1612531386530-97286d97c2d2?w=600&h=600&fit=crop"
              alt="Veterinario con mascota"
              className="rounded-2xl shadow-2xl w-full object-cover aspect-square"
            />
            <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-4 max-w-[200px]">
              <div className="flex items-center gap-1 mb-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-xs font-medium">"Atención excelente, súper recomendado."</p>
              <p className="text-[10px] text-muted-foreground mt-1">— Camila S., paciente real</p>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFICIOS */}
      <section className="container mx-auto px-4 py-8 md:py-12 max-w-5xl">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-amber-900 mb-3">
            Todo lo que necesitas para crecer
          </h2>
          <p className="text-muted-foreground">
            Una sola plataforma para tu reputación, tus reservas y tus pacientes.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {benefits.map((b) => {
            const Icon = b.icon;
            return (
              <Card key={b.title} className="border-amber-200 hover:shadow-lg transition">
                <CardContent className="pt-6 space-y-3">
                  <div className="rounded-full bg-amber-100 w-12 h-12 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-amber-600" />
                  </div>
                  <h3 className="font-semibold text-lg">{b.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* COMPARACIÓN PLANES */}
      <section className="container mx-auto px-4 py-8 md:py-12 max-w-5xl">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-amber-900 mb-3">
            Planes pensados para ti
          </h2>
          <p className="text-muted-foreground">
            Empieza gratis y mejora cuando tu consulta crezca.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          <PlanCard
            plan={planFree}
            highlight={false}
            ctaLabel="Empezar gratis"
            onCta={() => navigate('/registro-veterinario')}
            features={[
              'Perfil público en el directorio',
              'Hasta 20 pacientes',
              'Hasta 10 reservas/mes',
              'Reseñas verificadas',
            ]}
            missing={['Invitaciones a reseña', 'Estadísticas', 'Foto destacada']}
          />
          <PlanCard
            plan={planIndividual}
            highlight={true}
            ctaLabel="Empezar con Individual"
            onCta={() => navigate('/registro-veterinario')}
            features={[
              'Todo lo del Plan Gratis',
              'Hasta 100 pacientes',
              'Hasta 50 reservas/mes',
              '5 invitaciones a reseña/mes',
              'Estadísticas básicas',
              'Comisión 12% (vs 15%)',
            ]}
            missing={['Multi-vet', 'Multi-sucursal']}
          />
          <PlanCard
            plan={planClinic}
            highlight={false}
            ctaLabel="Para clínicas"
            onCta={() => navigate('/registro-veterinario')}
            features={[
              'Hasta 500 pacientes',
              'Reservas ilimitadas',
              '20 invitaciones/mes',
              'Posición destacada',
              'Multi-veterinario',
              'Branding completo',
              'Comisión 10%',
            ]}
            missing={[]}
          />
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          ¿Tienes una clínica grande? También ofrecemos Plan Pro con multi-sucursal y soporte
          prioritario.
        </p>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-4 py-8 md:py-12 max-w-3xl">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-amber-900 mb-3">
            Preguntas frecuentes
          </h2>
        </div>

        <div className="space-y-4">
          {faq.map((item) => (
            <Card key={item.q}>
              <CardContent className="pt-5">
                <h3 className="font-semibold mb-2 flex items-start gap-2">
                  <ChevronRight className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>{item.q}</span>
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed pl-7">{item.a}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="rounded-3xl bg-gradient-to-br from-amber-400 via-orange-400 to-pink-500 p-10 md:p-16 text-center text-white shadow-2xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Crea tu perfil profesional hoy
          </h2>
          <p className="text-lg text-white/95 mb-6 max-w-xl mx-auto">
            Toma 5 minutos. Sin compromiso, sin tarjeta de crédito. Empieza con el Plan Gratis y
            mejora cuando estés listo.
          </p>
          <Button
            size="lg"
            className="bg-white text-orange-600 hover:bg-white/90 h-14 text-lg font-bold shadow-xl"
            onClick={() => navigate('/registro-veterinario')}
          >
            <Stethoscope className="h-5 w-5 mr-2" />
            Crear mi perfil ahora
          </Button>
          <p className="text-xs text-white/80 mt-4">
            ¿Ya tienes cuenta?{' '}
            <Link to="/auth" className="underline">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

function PlanCard({
  plan,
  highlight,
  ctaLabel,
  onCta,
  features,
  missing,
}: {
  plan: { id: string; name: string; monthlyPrice: number; commissionRate: number; segment: string };
  highlight: boolean;
  ctaLabel: string;
  onCta: () => void;
  features: string[];
  missing: string[];
}) {
  return (
    <Card
      className={`relative ${
        highlight ? 'border-amber-500 border-2 shadow-xl scale-105' : 'border-amber-200'
      }`}
    >
      {highlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-amber-500 text-white">Más popular</Badge>
        </div>
      )}
      <CardContent className="pt-6 space-y-4">
        <div>
          <h3 className="font-bold text-xl">{plan.name}</h3>
          <p className="text-xs text-muted-foreground capitalize">
            {plan.segment === 'clinic' ? 'Para clínicas' : 'Para profesionales independientes'}
          </p>
        </div>
        <div>
          <span className="text-3xl font-bold text-amber-700">
            ${plan.monthlyPrice.toLocaleString('es-CL')}
          </span>
          <span className="text-sm text-muted-foreground">/mes</span>
          <p className="text-xs text-muted-foreground mt-1">
            Comisión {plan.commissionRate}% sobre reservas
          </p>
        </div>
        <ul className="space-y-2 text-sm">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>{f}</span>
            </li>
          ))}
          {missing.map((m) => (
            <li key={m} className="flex items-start gap-2 text-muted-foreground">
              <X className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{m}</span>
            </li>
          ))}
        </ul>
        <Button
          className={`w-full ${highlight ? '' : 'variant-outline'}`}
          variant={highlight ? 'default' : 'outline'}
          onClick={onCta}
        >
          {ctaLabel}
        </Button>
      </CardContent>
    </Card>
  );
}
