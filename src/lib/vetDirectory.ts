export const VET_SPECIALTIES = [
  // Generales
  'Medicina general',
  'Medicina interna',
  'Medicina felina',
  'Medicina de animales exóticos',

  // Quirúrgicas
  'Cirugía general',
  'Cirugía ortopédica',
  'Cirugía de tejidos blandos',

  // Especialidades clínicas
  'Dermatología',
  'Oftalmología',
  'Cardiología',
  'Oncología',
  'Neurología',
  'Endocrinología',
  'Odontología',
  'Gastroenterología',
  'Nefrología y urología',

  // Diagnóstico
  'Imagenología (ecografía/rayos X)',
  'Patología clínica (laboratorio)',

  // Etapas de vida
  'Geriatría',
  'Neonatología y pediatría',

  // Comportamiento y rehabilitación
  'Comportamiento animal (etología)',
  'Rehabilitación y fisioterapia',

  // Otras
  'Reproducción y obstetricia',
  'Nutrición animal',
  'Anestesiología',
  'Urgencias y cuidados críticos',
  'Medicina preventiva',
  'Animales silvestres',
  'Otra especialidad',
] as const;

export const SANTIAGO_COMUNAS = [
  'Las Condes',
  'Vitacura',
  'Lo Barnechea',
  'Providencia',
  'Ñuñoa',
  'La Reina',
  'Macul',
  'Peñalolén',
  'Santiago',
  'Independencia',
  'Recoleta',
  'San Miguel',
  'La Florida',
  'Maipú',
  'Puente Alto',
  'Quilicura',
  'Huechuraba',
  'Estación Central',
  'Otra comuna',
] as const;

// Comunas agrupadas por zona RM para selector UX-friendly
export const COMUNAS_POR_ZONA: Record<string, readonly string[]> = {
  Oriente: ['Las Condes', 'Vitacura', 'Lo Barnechea', 'La Reina', 'Peñalolén'],
  Centro: ['Santiago', 'Providencia', 'Ñuñoa', 'Independencia', 'Recoleta', 'Estación Central'],
  Sur: ['San Miguel', 'La Florida', 'Puente Alto', 'Macul'],
  'Poniente-Norte': ['Maipú', 'Quilicura', 'Huechuraba'],
  Otras: ['Otra comuna'],
} as const;

export function slugifyForUrl(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function unslugify(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function setSeoTags(opts: {
  title: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
}) {
  if (typeof document === 'undefined') return;
  document.title = opts.title;

  const upsert = (selector: string, attr: string, value: string) => {
    let el = document.head.querySelector<HTMLMetaElement | HTMLLinkElement>(selector);
    if (!el) {
      if (selector.startsWith('link')) {
        el = document.createElement('link');
        (el as HTMLLinkElement).rel = 'canonical';
      } else {
        el = document.createElement('meta');
        const m = selector.match(/\[(name|property)="([^"]+)"\]/);
        if (m) (el as HTMLMetaElement).setAttribute(m[1], m[2]);
      }
      document.head.appendChild(el);
    }
    el.setAttribute(attr, value);
  };

  if (opts.description) {
    upsert('meta[name="description"]', 'content', opts.description);
    upsert('meta[property="og:description"]', 'content', opts.description);
  }
  upsert('meta[property="og:title"]', 'content', opts.title);
  upsert('meta[property="og:type"]', 'content', 'website');
  if (opts.ogImage) upsert('meta[property="og:image"]', 'content', opts.ogImage);
  if (opts.canonical) upsert('link[rel="canonical"]', 'href', opts.canonical);
}

export function injectJsonLd(id: string, data: Record<string, unknown>) {
  if (typeof document === 'undefined') return;
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement('script');
    el.id = id;
    el.type = 'application/ld+json';
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

// Re-export from canonical location for backward compatibility
export { formatCLP } from '@/lib/format';
