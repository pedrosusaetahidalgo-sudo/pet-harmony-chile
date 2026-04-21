/**
 * Blog posts registry — Paw Friend.
 *
 * Cada post es un archivo .tsx con:
 *   - export const meta (título, slug, fecha, tags, excerpt, ogImage)
 *   - export default componente JSX con el cuerpo
 *
 * Regla de SEO: slug kebab-case, excerpt 140-160 chars, title 50-60 chars.
 * Meta tags aplicados automáticamente en `BlogPost.tsx` via react-helmet-async.
 *
 * Para agregar un post:
 * 1. Crear src/content/blog/<slug>.tsx con meta + default export.
 * 2. Agregar entry al array `POSTS` abajo.
 * 3. Build y sitemap se actualizan automáticamente.
 */

import type { LazyExoticComponent, ComponentType } from 'react';
import { lazy } from 'react';

export interface BlogPostMeta {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string; // YYYY-MM-DD
  updatedAt?: string;
  author: string;
  tags: string[];
  comuna?: string; // Para SEO local
  estimatedReadMinutes: number;
  ogImage?: string;
}

export interface BlogPostEntry {
  meta: BlogPostMeta;
  Component: LazyExoticComponent<ComponentType>;
}

// ─────────────────────────────────────────────────────────────
// Registro de posts (orden: más reciente arriba)
// ─────────────────────────────────────────────────────────────

export const POSTS: BlogPostEntry[] = [
  {
    meta: {
      slug: 'como-saber-si-mi-perro-tiene-dolor',
      title: 'Cómo saber si tu perro o gato tiene dolor (señales y cuándo correr al vet)',
      excerpt:
        'Señales sutiles de dolor en perros y gatos que suelen pasarse por alto. 12 signos conductuales + físicos, escala de urgencia, qué no hacer (automedicar) y cómo triage te ayuda a decidir.',
      publishedAt: '2026-04-21',
      author: 'Paw Friend',
      tags: ['dolor', 'salud', 'perro', 'gato', 'emergencia'],
      estimatedReadMinutes: 10,
    },
    Component: lazy(() => import('./como-saber-si-mi-perro-tiene-dolor')),
  },
  {
    meta: {
      slug: 'barf-vs-pellet-que-conviene-perros',
      title: 'BARF vs pellet: qué conviene darle a tu perro (guía sin ideología)',
      excerpt:
        'Comparativa honesta de BARF (dieta cruda) vs pellet (balanceado comercial) para perros en Chile. Costos reales, riesgos sanitarios, qué dicen los veterinarios y caso por caso según edad y raza.',
      publishedAt: '2026-04-21',
      author: 'Paw Friend',
      tags: ['alimento', 'barf', 'pellet', 'nutricion', 'perro'],
      estimatedReadMinutes: 9,
    },
    Component: lazy(() => import('./barf-vs-pellet-que-conviene-perros')),
  },
  {
    meta: {
      slug: 'desparasitacion-perro-gato-cada-cuanto-chile',
      title: 'Cada cuánto desparasitar a tu perro o gato: guía completa Chile',
      excerpt:
        'Desparasitación interna cada 3 meses, externa cada 1 mes (Bravecto = 3m). Cronograma cachorros, señales de parásitos, errores comunes y cuánto cuesta al año. Zoonosis también te afecta a ti.',
      publishedAt: '2026-04-21',
      author: 'Paw Friend',
      tags: ['antiparasitario', 'desparasitacion', 'bravecto', 'perro', 'gato'],
      estimatedReadMinutes: 7,
    },
    Component: lazy(() => import('./desparasitacion-perro-gato-cada-cuanto-chile')),
  },
  {
    meta: {
      slug: 'donde-pasear-perro-santiago-parques',
      title: 'Dónde pasear a tu perro en Santiago: parques por comuna (2026)',
      excerpt:
        'Guía completa de parques pet-friendly en Santiago por comuna. Reglas, horarios recomendados, frecuencia según raza, emergencias comunes y qué llevar en cada paseo.',
      publishedAt: '2026-04-21',
      author: 'Paw Friend',
      tags: ['paseo', 'parques', 'santiago', 'perro', 'ejercicio'],
      estimatedReadMinutes: 9,
    },
    Component: lazy(() => import('./donde-pasear-perro-santiago-parques')),
  },
  {
    meta: {
      slug: 'cuanto-cuesta-tener-perro-primer-ano-chile',
      title: 'Cuánto cuesta tener un perro el primer año en Chile (con calculadora)',
      excerpt:
        'Presupuesto real primer año: setup, alimento, veterinario, esterilización y ocasionales. Calculadora interactiva según tamaño y lifestyle. Perro vs gato, dónde ahorrar y dónde no.',
      publishedAt: '2026-04-21',
      author: 'Paw Friend',
      tags: ['presupuesto', 'perro', 'gato', 'primer año', 'chile'],
      estimatedReadMinutes: 10,
    },
    Component: lazy(() => import('./cuanto-cuesta-tener-perro-primer-ano-chile')),
  },
  {
    meta: {
      slug: 'protocolo-mascota-perdida-maipu',
      title: 'Mi mascota se perdió en Maipú: protocolo de 8 pasos (primeras 12h)',
      excerpt:
        'Protocolo de emergencia cuando tu perro o gato se pierde en Maipú: qué hacer en las primeras 2h, grupos Facebook, veterinarios cercanos, carteles físicos y prevención futura.',
      publishedAt: '2026-04-21',
      author: 'Paw Friend',
      tags: ['mascota perdida', 'maipu', 'emergencia', 'protocolo', 'santiago'],
      comuna: 'Maipú',
      estimatedReadMinutes: 8,
    },
    Component: lazy(() => import('./protocolo-mascota-perdida-maipu')),
  },
  {
    meta: {
      slug: 'seguro-mascotas-chile-vale-la-pena',
      title: 'Seguro para mascotas en Chile: ¿vale la pena? (2026)',
      excerpt:
        'Guía honesta de seguros pet en Chile: precios, coberturas, aseguradoras, cuándo conviene vs fondo propio. Checklist antes de firmar y cálculo real de ROI.',
      publishedAt: '2026-04-21',
      author: 'Paw Friend',
      tags: ['seguro', 'pet insurance', 'chile', 'presupuesto', 'salud'],
      estimatedReadMinutes: 10,
    },
    Component: lazy(() => import('./seguro-mascotas-chile-vale-la-pena')),
  },
  {
    meta: {
      slug: 'peluquero-perros-vitacura-como-elegir',
      title: 'Peluquero canino en Vitacura: precios, señales de calidad y qué evitar (2026)',
      excerpt:
        'Guía práctica para elegir peluquero de perros en Vitacura. Precios por tamaño, 7 señales de buena peluquería, red flags, frecuencia recomendada por raza y cómo preparar a tu perro.',
      publishedAt: '2026-04-21',
      author: 'Paw Friend',
      tags: ['peluquero', 'groomer', 'vitacura', 'perro', 'precios'],
      comuna: 'Vitacura',
      estimatedReadMinutes: 7,
    },
    Component: lazy(() => import('./peluquero-perros-vitacura-como-elegir')),
  },
  {
    meta: {
      slug: 'adoptar-perro-nunoa-refugios-responsables',
      title: 'Cómo adoptar un perro en Ñuñoa: refugios, costos y primeros pasos',
      excerpt:
        'Guía completa para adoptar perro en Ñuñoa: dónde ir, qué preguntar, gastos reales primeros 30 días y cómo Paw Friend te entrega la ficha médica completa desde el día 1.',
      publishedAt: '2026-04-21',
      author: 'Paw Friend',
      tags: ['adopcion', 'nunoa', 'perro', 'refugio', 'chile'],
      comuna: 'Ñuñoa',
      estimatedReadMinutes: 9,
    },
    Component: lazy(() => import('./adoptar-perro-nunoa-refugios-responsables')),
  },
  {
    meta: {
      slug: 'cuanto-cuesta-veterinario-las-condes',
      title: 'Cuánto cuesta el veterinario en Las Condes (2026)',
      excerpt:
        'Rangos reales de consultas, vacunas, exámenes y cirugías veterinarias en Las Condes, Santiago. Cómo no pagar de más y presupuesto mensual realista de tu mascota.',
      publishedAt: '2026-04-21',
      author: 'Paw Friend',
      tags: ['precios', 'las-condes', 'veterinario', 'presupuesto', 'chile'],
      comuna: 'Las Condes',
      estimatedReadMinutes: 8,
    },
    Component: lazy(() => import('./cuanto-cuesta-veterinario-las-condes')),
  },
  {
    meta: {
      slug: 'cronograma-vacunas-cachorro-chile',
      title: 'Cronograma de vacunas para cachorro en Chile: guía 2026',
      excerpt:
        'Calendario completo de vacunas para cachorros y gatitos según protocolo Colmevet. Qué vacuna toca a qué edad, errores comunes y cómo Paw Friend lo agenda automáticamente.',
      publishedAt: '2026-04-21',
      author: 'Paw Friend',
      tags: ['vacunas', 'cachorro', 'perro', 'gato', 'cronograma', 'chile'],
      estimatedReadMinutes: 7,
    },
    Component: lazy(() => import('./cronograma-vacunas-cachorro-chile')),
  },
  {
    meta: {
      slug: 'veterinario-urgencia-providencia-3am',
      title: 'Dónde llevar a tu perro enfermo en Providencia a las 3 AM',
      excerpt:
        'Guía práctica de clínicas veterinarias 24 horas cerca de Providencia, Santiago. Qué hacer antes de salir y cómo elegir la opción correcta en emergencia.',
      publishedAt: '2026-04-21',
      author: 'Paw Friend',
      tags: ['urgencia', 'providencia', 'veterinario', 'santiago'],
      comuna: 'Providencia',
      estimatedReadMinutes: 5,
    },
    Component: lazy(() => import('./veterinario-urgencia-providencia-3am')),
  },
];

/**
 * Obtiene el meta por slug. Retorna null si no existe.
 */
export function getPostMeta(slug: string): BlogPostMeta | null {
  const entry = POSTS.find((p) => p.meta.slug === slug);
  return entry?.meta ?? null;
}

/**
 * Obtiene el componente por slug.
 */
export function getPostComponent(slug: string): LazyExoticComponent<ComponentType> | null {
  const entry = POSTS.find((p) => p.meta.slug === slug);
  return entry?.Component ?? null;
}

/**
 * Lista metas ordenadas por fecha desc.
 */
export function listPublishedPosts(): BlogPostMeta[] {
  return POSTS.map((p) => p.meta).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}
