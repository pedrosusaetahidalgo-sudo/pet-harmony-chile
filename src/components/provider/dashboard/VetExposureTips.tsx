import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  Eye,
  Star,
  Share2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  MessageCircle,
} from '@/lib/icons';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface VetExposureTipsProps {
  slug: string | null;
  isDirectoryVisible: boolean;
  profileViews: number;
  avgRating: number | null;
  totalReviews: number;
  bookingsThisMonth: number;
}

interface Tip {
  id: string;
  done: boolean;
  priority: 'high' | 'medium' | 'low';
  title: string;
  hint: string;
  action?: {
    label: string;
    onClick?: () => void;
    to?: string;
    external?: boolean;
  };
}

export function VetExposureTips({
  slug,
  isDirectoryVisible,
  profileViews,
  avgRating,
  totalReviews,
  bookingsThisMonth,
}: VetExposureTipsProps) {
  const publicUrl = slug ? `${window.location.origin}/veterinarios/${slug}` : null;

  const copyUrl = () => {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl).then(
      () => toast.success('Link copiado al portapapeles'),
      () => toast.error('No se pudo copiar')
    );
  };

  const shareWhatsApp = () => {
    if (!publicUrl) return;
    const text = encodeURIComponent(
      `Hola! Ahora puedes agendar conmigo online en Paw Friend: ${publicUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  // Calculo de tips segun estado
  const tips: Tip[] = [
    {
      id: 'visibility',
      done: isDirectoryVisible,
      priority: 'high',
      title: isDirectoryVisible ? 'Perfil publico visible' : 'Activa tu perfil en el directorio',
      hint: isDirectoryVisible
        ? 'Los dueños pueden encontrarte en /veterinarios.'
        : 'Sin esto nadie nuevo puede descubrirte. Actívalo en tu perfil.',
      action: isDirectoryVisible
        ? undefined
        : { label: 'Ir al perfil', to: '/provider/profile-edit' },
    },
    {
      id: 'reviews',
      done: totalReviews >= 5,
      priority: totalReviews === 0 ? 'high' : 'medium',
      title:
        totalReviews === 0
          ? 'Consigue tu primera reseña'
          : totalReviews < 5
            ? `Llega a 5 reseñas (vas ${totalReviews})`
            : `${totalReviews} reseñas · promedio ${avgRating?.toFixed(1) ?? '—'}`,
      hint:
        totalReviews < 5
          ? 'Perfiles con ≥5 reseñas convierten 3x más. Invita a tus pacientes después de cada consulta.'
          : 'Sigue pidiendo reseñas a clientes recurrentes para mantener el ranking alto.',
      action:
        totalReviews < 5
          ? { label: 'Invitar a dejar reseña', to: '/provider/dashboard?tab=reservas' }
          : undefined,
    },
    {
      id: 'share-link',
      done: false,
      priority: 'high',
      title: 'Comparte tu link de reservas',
      hint: 'Pégalo en tu bio de Instagram, Google Business, WhatsApp y firma de email.',
      action: publicUrl ? { label: 'Copiar link', onClick: copyUrl } : undefined,
    },
    {
      id: 'views',
      done: profileViews >= 50,
      priority: 'medium',
      title: `${profileViews} visitas al perfil`,
      hint:
        profileViews < 50
          ? 'Pocas visitas = poco alcance. Completa bio, fotos y especialidades para aparecer mejor en busquedas.'
          : 'Buen flujo. Revisa tu tasa de conversion (visitas → reservas) en Analytics.',
      action:
        profileViews < 50 ? { label: 'Completar perfil', to: '/provider/profile-edit' } : undefined,
    },
    {
      id: 'availability',
      done: bookingsThisMonth > 0,
      priority: 'medium',
      title: 'Mantén tu agenda abierta',
      hint: 'Bloques de disponibilidad actualizados = reservas reales. Revisa huecos esta semana.',
      action: { label: 'Editar disponibilidad', to: '/provider/profile-edit' },
    },
  ];

  const pending = tips.filter((t) => !t.done);
  const completedCount = tips.length - pending.length;
  const progress = Math.round((completedCount / tips.length) * 100);

  return (
    <Card className="border-purple-200/60 bg-gradient-to-br from-purple-50/40 to-indigo-50/30 dark:from-purple-950/20 dark:to-indigo-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              Consigue más reservas
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              {pending.length === 0
                ? '¡Todo en orden! Mantén el ritmo.'
                : `${pending.length} ${pending.length === 1 ? 'acción pendiente' : 'acciones pendientes'} para aumentar tu flujo`}
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className="bg-white/60 dark:bg-slate-900/60 text-xs whitespace-nowrap"
          >
            {completedCount}/{tips.length} ({progress}%)
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {tips.map((tip) => {
          const Icon = tip.done ? CheckCircle2 : AlertCircle;
          return (
            <div
              key={tip.id}
              className={cn(
                'flex items-start gap-2.5 rounded-md border p-2.5 text-sm',
                tip.done
                  ? 'border-green-200/60 bg-white/40 dark:bg-slate-900/30 opacity-80'
                  : 'border-purple-200/70 bg-white/80 dark:bg-slate-900/50'
              )}
            >
              <Icon
                className={cn(
                  'h-4 w-4 shrink-0 mt-0.5',
                  tip.done ? 'text-green-500' : 'text-purple-500'
                )}
              />
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    'font-medium text-xs leading-tight',
                    tip.done && 'line-through text-muted-foreground'
                  )}
                >
                  {tip.title}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{tip.hint}</p>
                {tip.action && !tip.done && (
                  <div className="mt-1.5">
                    {tip.action.to ? (
                      <Button
                        asChild
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-100/50"
                      >
                        <Link to={tip.action.to}>{tip.action.label}</Link>
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={tip.action.onClick}
                        className="h-7 px-2 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-100/50"
                      >
                        {tip.action.label}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Share row */}
        {publicUrl && (
          <div className="rounded-md border border-purple-200/70 bg-white/80 dark:bg-slate-900/50 p-2.5 mt-3">
            <p className="text-xs font-medium mb-1.5 flex items-center gap-1.5">
              <Share2 className="h-3.5 w-3.5 text-purple-500" />
              Tu link público
            </p>
            <p className="font-mono text-[11px] text-muted-foreground break-all mb-2">
              {publicUrl}
            </p>
            <div className="flex gap-1.5 flex-wrap">
              <Button size="sm" variant="outline" onClick={copyUrl} className="h-7 px-2 text-xs">
                <Copy className="h-3 w-3 mr-1" /> Copiar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={shareWhatsApp}
                className="h-7 px-2 text-xs"
              >
                <MessageCircle className="h-3 w-3 mr-1" /> WhatsApp
              </Button>
              <Button asChild size="sm" variant="outline" className="h-7 px-2 text-xs">
                <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3 w-3 mr-1" /> Ver perfil
                </a>
              </Button>
            </div>
          </div>
        )}

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="rounded-md bg-white/60 dark:bg-slate-900/40 border border-slate-200/60 p-2 text-center">
            <Eye className="h-3.5 w-3.5 mx-auto text-slate-500 mb-0.5" />
            <p className="text-sm font-bold">{profileViews}</p>
            <p className="text-[10px] text-muted-foreground">visitas</p>
          </div>
          <div className="rounded-md bg-white/60 dark:bg-slate-900/40 border border-slate-200/60 p-2 text-center">
            <Star className="h-3.5 w-3.5 mx-auto text-amber-500 mb-0.5" />
            <p className="text-sm font-bold">{avgRating ? avgRating.toFixed(1) : '—'}</p>
            <p className="text-[10px] text-muted-foreground">{totalReviews} reseñas</p>
          </div>
          <div className="rounded-md bg-white/60 dark:bg-slate-900/40 border border-slate-200/60 p-2 text-center">
            <TrendingUp className="h-3.5 w-3.5 mx-auto text-green-500 mb-0.5" />
            <p className="text-sm font-bold">{bookingsThisMonth}</p>
            <p className="text-[10px] text-muted-foreground">reservas/mes</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
