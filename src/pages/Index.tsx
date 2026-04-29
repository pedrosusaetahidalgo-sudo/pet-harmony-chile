import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/hooks/useAuth';
import { LINKS } from '@/lib/links';

import { LandingHeader } from '@/components/landing/LandingHeader';
import { Hero } from '@/components/landing/Hero';
import { SocialProofBand } from '@/components/landing/SocialProofBand';
import { ProblemSection } from '@/components/landing/ProblemSection';
import { EcosystemSection } from '@/components/landing/EcosystemSection';
import { MedicalRecordShowcase } from '@/components/landing/MedicalRecordShowcase';
import { VetDirectoryShowcase } from '@/components/landing/VetDirectoryShowcase';
import { AlmaSection } from '@/components/landing/AlmaSection';
import { ForVetsSection } from '@/components/landing/ForVetsSection';
import { CommunitySection } from '@/components/landing/CommunitySection';
import { AudiencesStrip } from '@/components/landing/AudiencesStrip';
import { FinalCTA } from '@/components/landing/FinalCTA';
import { RichFooter } from '@/components/landing/RichFooter';

/**
 * Landing v3 — Immersive masterplan ejecutado.
 *
 * Cambios estructurales vs v2 (2026-04-13):
 * - Componentes movidos a `src/components/landing/` (1 por sección).
 * - Copy alineado al modelo v2.1 (Plan v5 Opcion 3, 2026-04-29): freemium
 *   3 tiers (Free $0 / Paw Member $3.990 / Manada $9.990) + revenue B2B
 *   ancla (pharma + seguros + retail).
 * - Eliminados testimonios y logos ficticios (riesgo de credibilidad).
 * - Hero usa video real (`hero-pet.mp4`) en lugar de mockup CSS-only.
 * - Sección "Alma del proyecto" como pilar narrativo (no solo badge).
 * - Footer rico con 4 columnas y links a /paw-core, /donaciones, etc.
 * - FAQ movida a página dedicada `/faq`.
 *
 * Ref: docs-raiz/marketing/PAWFRIEND_LANDING_IMMERSIVE_MASTERPLAN.md
 */
const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  // Si el usuario ya está logueado, la landing pública no tiene sentido.
  useEffect(() => {
    if (!authLoading && user) {
      navigate(LINKS.home(), { replace: true });
    }
  }, [user, authLoading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Paw Friend — La salud de tu peludo, en un solo lugar. Empieza gratis.</title>
        <meta
          name="description"
          content="Ficha clínica digital, veterinarios verificados por comuna, recordatorios y comunidad pet lover. Hecho en Chile. Lo esencial gratis para siempre."
        />
        <link rel="canonical" href="https://pawfriend.cl/" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Paw Friend" />
        <meta property="og:url" content="https://pawfriend.cl/" />
        <meta property="og:title" content="Paw Friend — La salud de tu peludo, en un solo lugar" />
        <meta
          property="og:description"
          content="Ficha clínica digital, veterinarios verificados por comuna, recordatorios y comunidad pet lover. Lo esencial gratis para siempre. Hecho en Chile."
        />
        <meta
          property="og:image"
          content="https://pawfriend.cl/paw-friend-assets-v2/og/og-home.png"
        />
        <meta property="og:locale" content="es_CL" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Paw Friend — La salud de tu peludo, en un solo lugar" />
        <meta
          name="twitter:description"
          content="Ficha clínica, vets por comuna, recordatorios y comunidad. Lo esencial gratis."
        />
        <meta
          name="twitter:image"
          content="https://pawfriend.cl/paw-friend-assets-v2/og/og-home.png"
        />

        {/* JSON-LD: Organization */}
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Paw Friend',
            url: 'https://pawfriend.cl',
            logo: 'https://pawfriend.cl/paw-friend-assets-v2/logo/paw_friend_icon_principal.svg',
            description:
              'Plataforma chilena para la salud integral de mascotas. Ficha clínica, vets verificados y recordatorios. Lo esencial gratis para los dueños.',
            sameAs: [
              'https://www.instagram.com/pawfriend.cl',
              'https://www.tiktok.com/@pawfriend.cl',
            ],
            address: {
              '@type': 'PostalAddress',
              addressCountry: 'CL',
              addressRegion: 'Región Metropolitana',
            },
          })}
        </script>

        {/* JSON-LD: WebSite con SearchAction */}
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Paw Friend',
            url: 'https://pawfriend.cl',
            potentialAction: {
              '@type': 'SearchAction',
              target: 'https://pawfriend.cl/veterinarios/comuna/{search_term_string}',
              'query-input': 'required name=search_term_string',
            },
          })}
        </script>

        {/* JSON-LD: SoftwareApplication (para indicar que es una app gratis) */}
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'Paw Friend',
            operatingSystem: 'Web, Android, iOS',
            applicationCategory: 'HealthApplication',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CLP',
            },
            description:
              'App chilena para la salud de tu mascota: ficha clínica, recordatorios y vets verificados.',
          })}
        </script>
      </Helmet>

      <LandingHeader />

      <main>
        <Hero />
        <SocialProofBand />
        <ProblemSection />
        <EcosystemSection />
        <MedicalRecordShowcase />
        <VetDirectoryShowcase />
        <AlmaSection />
        <ForVetsSection />
        <CommunitySection />
        <AudiencesStrip />
        <FinalCTA />
      </main>

      <RichFooter />
    </div>
  );
};

export default Index;
