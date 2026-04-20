/**
 * /blog — Índice público de artículos SEO.
 *
 * Origen: INIT-13 Plan 90d. Canal orgánico barato via long-tail queries
 * chilenas donde QVET/Petsy/CuidaPet no hacen contenido.
 */

import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, ArrowRight } from '@/lib/icons';
import { PublicHeader, PublicFooter } from '@/components/layouts/PublicLayout';
import { listPublishedPosts } from '@/content/blog';

export default function BlogIndex() {
  const posts = listPublishedPosts();
  const canonical = 'https://pawfriend.cl/blog';

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50/40 to-white">
      <Helmet>
        <title>Blog · Paw Friend — Guías para dueños de mascotas en Chile</title>
        <meta
          name="description"
          content="Guías prácticas de veterinaria, salud y crianza para perros y gatos en Chile. Contenido útil por comuna, directorio de veterinarios y tips de emergencia."
        />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content="Blog · Paw Friend" />
        <meta
          property="og:description"
          content="Guías prácticas de veterinaria, salud y crianza para perros y gatos en Chile."
        />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="website" />
      </Helmet>

      <PublicHeader />

      <main className="container mx-auto px-4 py-10 max-w-4xl">
        <header className="text-center mb-10">
          <h1 className="font-display font-semibold text-4xl md:text-5xl text-purple-900 mb-3">
            Blog Paw Friend
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Guías prácticas de salud, crianza y emergencias para tu mascota. Escrito desde Chile,
            para dueños chilenos.
          </p>
        </header>

        {posts.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center text-muted-foreground">
              Pronto publicaremos los primeros artículos.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <Link
                key={post.slug}
                to={`/blog/${post.slug}`}
                className="block group focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-xl"
              >
                <Card className="border-purple-100 group-hover:border-purple-300 transition-colors">
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {post.comuna && (
                        <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                          {post.comuna}
                        </Badge>
                      )}
                      {post.tags.slice(0, 2).map((t) => (
                        <Badge key={t} variant="outline" className="text-xs">
                          {t}
                        </Badge>
                      ))}
                    </div>

                    <h2 className="text-xl sm:text-2xl font-display font-semibold text-purple-900 group-hover:text-purple-700 transition-colors mb-2">
                      {post.title}
                    </h2>

                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {post.excerpt}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(post.publishedAt).toLocaleDateString('es-CL', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {post.estimatedReadMinutes} min
                      </span>
                      <span className="ml-auto flex items-center gap-1 text-purple-600 font-medium group-hover:translate-x-1 transition-transform">
                        Leer <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
