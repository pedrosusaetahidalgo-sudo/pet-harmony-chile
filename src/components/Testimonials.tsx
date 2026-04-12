import { useState } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote } from '@/lib/icons';

/**
 * Sección de testimonios — sección 7 del blueprint.
 *
 * Carrusel horizontal en desktop (2 visibles), swipe en mobile (1 visible).
 * Testimonios con especificidad chilena (comuna, nombre mascota).
 */

const TESTIMONIALS = [
  {
    name: 'Catalina Muñoz',
    location: 'Providencia',
    pet: 'Luna, gata mestiza',
    quote:
      'Cambié de veterinario y le mandé la ficha PDF por WhatsApp. El doctor nuevo tenía todo el historial de Luna antes de que llegáramos.',
    avatar: 'from-amber-300 to-rose-400',
  },
  {
    name: 'Sebastián Rojas',
    location: 'Ñuñoa',
    pet: 'Toby, golden retriever',
    quote:
      'Los recordatorios de vacunas me salvaron. Siempre se me pasaba la fecha y terminaba pagando urgencia. Ahora me llega el aviso una semana antes.',
    avatar: 'from-sky-300 to-purple-400',
  },
  {
    name: 'Francisca López',
    location: 'Viña del Mar',
    pet: 'Milo, bulldog francés',
    quote:
      'Milo tiene alergias complicadas. Tener todo en la ficha clínica digital me da tranquilidad cuando viajamos y necesitamos un vet de urgencia.',
    avatar: 'from-emerald-300 to-teal-500',
  },
];

const Testimonials = () => {
  const [current, setCurrent] = useState(0);
  const total = TESTIMONIALS.length;

  const prev = () => setCurrent((c) => (c - 1 + total) % total);
  const next = () => setCurrent((c) => (c + 1) % total);

  return (
    <section aria-labelledby="testimonials-title" className="px-4 py-20 md:py-28">
      <div className="container mx-auto max-w-5xl">
        <div className="mb-10 text-center md:mb-14">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
            Lo que dicen nuestros usuarios
          </span>
          <h2
            id="testimonials-title"
            className="mt-4 text-3xl font-black tracking-tight md:text-5xl"
          >
            Dueños reales, historias reales.
          </h2>
        </div>

        {/* Desktop: grid 2 col visible */}
        <div className="hidden gap-6 md:grid md:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <TestimonialCard key={t.name} {...t} />
          ))}
        </div>

        {/* Mobile: carrusel 1 visible */}
        <div className="md:hidden">
          <TestimonialCard {...TESTIMONIALS[current]} />

          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              onClick={prev}
              aria-label="Testimonio anterior"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-foreground transition hover:bg-neutral-200 active:scale-95"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="flex gap-1.5">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  aria-label={`Ir al testimonio ${i + 1}`}
                  className={`h-2 rounded-full transition-all ${
                    i === current ? 'w-6 bg-primary' : 'w-2 bg-neutral-300'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={next}
              aria-label="Siguiente testimonio"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-foreground transition hover:bg-neutral-200 active:scale-95"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

const TestimonialCard = ({
  name,
  location,
  pet,
  quote,
  avatar,
}: {
  name: string;
  location: string;
  pet: string;
  quote: string;
  avatar: string;
}) => (
  <div className="rounded-2xl bg-white p-6 shadow-[0_8px_30px_-12px_rgba(251,146,60,0.15)] ring-1 ring-black/5 md:p-7">
    <Quote className="mb-3 h-6 w-6 text-amber-300" strokeWidth={1.75} />
    <p className="text-base leading-relaxed text-foreground">{quote}</p>
    <div className="mt-5 flex items-center gap-3 border-t border-neutral-100 pt-4">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatar} text-sm font-bold text-white shadow-sm`}
      >
        {name.charAt(0)}
      </div>
      <div>
        <p className="text-sm font-bold text-foreground">{name}</p>
        <p className="text-xs text-muted-foreground">
          {location} · {pet}
        </p>
      </div>
    </div>
  </div>
);

export default Testimonials;
