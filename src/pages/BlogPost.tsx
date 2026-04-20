/**
 * /blog/:slug — Post individual con SEO completo.
 *
 * Origen: INIT-13 Plan 90d.
 */

import { Suspense } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, ArrowLeft } from '@/lib/icons';
import { PublicHeader, PublicFooter } from '@/components/layouts/PublicLayout';
import { EmptyState } from '@/components/ui/EmptyState';
import { FileText } from '@/lib/icons';
import { getPostMeta, getPostComponent } from '@/content/blog';

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();

  if (!slug) {
    return <NotFoundView />;
  }

  const meta = getPostMeta(slug);
  const Component = getPostComponent(slug);

  if (!meta || !Component) {
    return <NotFoundView />;
  }

  const canonical = `https://pawfriend.cl/blog/${meta.slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: meta.title,
    description: meta.excerpt,
    datePublished: meta.publishedAt,
    dateModified: meta.updatedAt || meta.publishedAt,
    author: { '@type': 'Organization', name: meta.author, url: 'https://pawfriend.cl' },
    publisher: {
      '@type': 'Organization',
      name: 'Paw Friend',
      logo: { '@type': 'ImageObject', url: 'https://pawfriend.cl/pwa-icon-512.png' },
    },
    mainEntityOfPage: canonical,
    keywords: meta.tags.join(', '),
  };

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>{meta.title} · Paw Friend</title>
        <meta name="description" content={meta.excerpt} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={meta.title} />
        <meta property="og:description" content={meta.excerpt} />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="article" />
        <meta property="article:published_time" content={meta.publishedAt} />
        {meta.updatedAt && <meta property="article:modified_time" content={meta.updatedAt} />}
        <meta property="article:author" content={meta.author} />
        {meta.tags.map((t) => (
          <meta property="article:tag" content={t} key={t} />
        ))}
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <PublicHeader />

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Link
          to="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-800 mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver al blog
        </Link>

        <header className="mb-6">
          <div className="flex flex-wrap gap-2 mb-3">
            {meta.comuna && (
              <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                {meta.comuna}
              </Badge>
            )}
            {meta.tags.map((t) => (
              <Badge key={t} variant="outline" className="text-xs">
                {t}
              </Badge>
            ))}
          </div>
          <h1 className="font-display font-semibold text-3xl md:text-4xl text-purple-900 mb-3 leading-tight">
            {meta.title}
          </h1>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(meta.publishedAt).toLocaleDateString('es-CL', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {meta.estimatedReadMinutes} min lectura
            </span>
            <span>· {meta.author}</span>
          </div>
        </header>

        <Suspense fallback={<ArticleSkeleton />}>
          <Component />
        </Suspense>
      </main>

      <PublicFooter />
    </div>
  );
}

function ArticleSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-6 w-5/6" />
      <Skeleton className="h-6 w-4/6" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-6 w-5/6" />
    </div>
  );
}

function NotFoundView() {
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
      <main className="container mx-auto px-4 py-16 max-w-md text-center">
        <EmptyState
          variant="card"
          icon={FileText}
          title="Artículo no encontrado"
          description="El artículo que buscas no existe o fue movido."
          action={
            <Link to="/blog" className="text-sm text-purple-600 underline">
              Ver todos los artículos
            </Link>
          }
        />
      </main>
      <PublicFooter />
    </div>
  );
}
