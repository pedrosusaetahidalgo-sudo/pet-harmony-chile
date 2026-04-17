import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { withTelemetry } from '../_shared/telemetry.ts';

const SITE = 'https://pawfriend.cl';

const COMUNAS = [
  'las-condes',
  'vitacura',
  'lo-barnechea',
  'providencia',
  'nunoa',
  'la-reina',
  'macul',
  'penalolen',
  'santiago',
  'independencia',
  'recoleta',
  'san-miguel',
  'la-florida',
  'maipu',
  'puente-alto',
  'quilicura',
  'huechuraba',
  'estacion-central',
];

const ESPECIALIDADES = [
  'medicina-general',
  'cirugia',
  'dermatologia',
  'oftalmologia',
  'cardiologia',
  'oncologia',
  'geriatria',
  'comportamiento-animal',
  'animales-exoticos',
  'reproduccion',
  'odontologia',
  'neurologia',
  'ortopedia',
  'vacunacion',
  'esterilizacion',
];

serve(
  withTelemetry('generate-sitemap', async () => {
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { auth: { persistSession: false } }
      );

      // Traer todos los slugs de vets visibles
      const { data: vets, error } = await supabase
        .from('service_providers')
        .select('slug, updated_at')
        .eq('is_directory_visible', true)
        .not('slug', 'is', null);

      if (error) throw error;

      const urls: string[] = [];

      // Páginas estáticas
      urls.push(url(SITE + '/', 'weekly', '1.0'));
      urls.push(url(SITE + '/veterinarios', 'daily', '0.9'));
      urls.push(url(SITE + '/para-veterinarios', 'weekly', '0.9'));
      urls.push(url(SITE + '/registro-veterinario', 'monthly', '0.7'));
      urls.push(url(SITE + '/precios-veterinarios', 'weekly', '0.9'));

      // Precios por comuna (top 5 por poblacion)
      const PRECIOS_TOP = ['santiago', 'las-condes', 'providencia', 'nunoa', 'maipu'];
      for (const c of PRECIOS_TOP) {
        urls.push(url(`${SITE}/precios-veterinarios/comuna/${c}`, 'weekly', '0.7'));
      }

      // Comunas
      for (const c of COMUNAS) {
        urls.push(url(`${SITE}/veterinarios/comuna/${c}`, 'weekly', '0.7'));
      }

      // Especialidades
      for (const e of ESPECIALIDADES) {
        urls.push(url(`${SITE}/veterinarios/especialidad/${e}`, 'weekly', '0.7'));
      }

      // Vets dinámicos
      for (const v of vets ?? []) {
        const lastmod = v.updated_at
          ? new Date(v.updated_at).toISOString().split('T')[0]
          : undefined;
        urls.push(url(`${SITE}/veterinarios/${v.slug}`, 'weekly', '0.8', lastmod));
      }

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

      return new Response(xml, {
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': 'https://pawfriend.cl',
        },
      });
    } catch (err) {
      console.error('generate-sitemap error:', err);
      return new Response('Error generating sitemap', { status: 500 });
    }
  })
);

function url(loc: string, changefreq: string, priority: string, lastmod?: string): string {
  return `  <url>
    <loc>${loc}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}
