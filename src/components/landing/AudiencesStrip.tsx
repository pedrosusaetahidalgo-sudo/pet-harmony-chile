/**
 * AudiencesStrip — seccion del landing que muestra los 6 tipos de
 * audiencia con su wordmark oficial y link al flow correspondiente.
 *
 * Objetivo: que cualquier visitante entienda "Paw Friend es para mi"
 * (sea dueño, vet, refugio, creador, empresa, inversionista).
 */
import { Link } from 'react-router-dom';
import { ArrowRight } from '@/lib/icons';
import { CategoryIcon, type CategoryKind } from '@/components/CategoryIcon';
import { RevealSection } from './RevealSection';

interface Audience {
  kind: CategoryKind;
  title: string;
  desc: string;
  href: string;
  cta: string;
}

const AUDIENCES: Audience[] = [
  {
    kind: 'vet',
    title: 'Veterinarios',
    desc: 'Ficha clinica compartida, reservas online y perfil verificado.',
    href: '/para-veterinarios',
    cta: 'Postular',
  },
  {
    kind: 'shelter',
    title: 'Hogares de adopcion',
    desc: 'Gestion gratis de mascotas, carga masiva, transferencia al adoptante.',
    href: '/refugios-hogares',
    cta: 'Registrar refugio',
  },
  {
    kind: 'partner',
    title: 'Paw Partners',
    desc: 'Tiendas y servicios aliados que ofrecen descuentos a Paw Members.',
    href: '/paw-partners',
    cta: 'Sumar marca',
  },
  {
    kind: 'voice',
    title: 'Paw Voices',
    desc: 'Creadores peludos que amplifican adopciones y contenido util.',
    href: '/paw-voices',
    cta: 'Postular',
  },
  {
    kind: 'company',
    title: 'Paw Companys',
    desc: 'Empresas que patrocinan Paw Friend (Bronze · Silver · Gold).',
    href: '/aplicar?tipo=paw_companys',
    cta: 'Patrocinar',
  },
  {
    kind: 'investor',
    title: 'Inversionistas',
    desc: 'CORFO, Start-Up Chile, angels y VCs LATAM que invierten en pet-tech.',
    href: '/aplicar?tipo=angels_vc',
    cta: 'Conversar',
  },
];

export function AudiencesStrip() {
  return (
    <RevealSection
      as="section"
      id="audiencias"
      ariaLabelledby="audiencias-title"
      className="px-4 py-20 md:py-28 bg-gradient-to-b from-white via-purple-50/30 to-white"
    >
      <div className="container mx-auto max-w-6xl">
        <div className="mx-auto mb-12 max-w-2xl text-center md:mb-16">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            Paw Friend es para todos
          </span>
          <h2
            id="audiencias-title"
            className="mt-4 font-display font-semibold text-4xl leading-[1.05] tracking-tight md:text-5xl"
          >
            ¿En que lugar de la{' '}
            <span className="bg-gradient-to-r from-purple-600 via-fuchsia-500 to-amber-500 bg-clip-text text-transparent">
              comunidad
            </span>{' '}
            estas?
          </h2>
          <p className="mt-4 text-base text-muted-foreground md:text-lg">
            Desde dueños hasta veterinarios, refugios, empresas y creadores — hay un lugar para vos
            en la red.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AUDIENCES.map((a) => (
            <Link
              key={a.kind}
              to={a.href}
              className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-neutral-200/70 bg-white p-6 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elevated hover:border-primary/40"
            >
              {/* Wordmark full */}
              <CategoryIcon kind={a.kind} variant="full" className="h-16 w-auto self-start" />
              <div className="space-y-1">
                <h3 className="text-lg font-bold tracking-tight text-foreground">{a.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{a.desc}</p>
              </div>
              <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-primary">
                {a.cta}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </RevealSection>
  );
}
