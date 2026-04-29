import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ExternalLink,
  Eye,
  Share2,
  Stethoscope,
  Star,
  AlertCircle,
  Copy,
  Check,
  Mail,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateInvitation, useMonthInvitationCount } from '@/hooks/useReviewInvitations';
import { PROVIDER_PLANS, type ProviderPlanId } from '@/lib/plans';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { openExternalUrl } from '@/lib/nativeNavigation';
import {
  useMyProvider,
  calculateProfileCompleteness,
  REQUIRED_FOR_DIRECTORY_SCORE,
} from '@/hooks/useProviderProfile';

export function ProviderDirectoryCard() {
  const { data: provider, isLoading } = useMyProvider();
  const [shareOpen, setShareOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  const createInvitation = useCreateInvitation();
  const monthCount = useMonthInvitationCount();

  if (isLoading) {
    return <Skeleton className="h-40 w-full" />;
  }

  if (!provider) {
    return (
      <Card className="border-purple-200 bg-purple-50">
        <CardContent className="py-6 text-center">
          <Stethoscope className="h-10 w-10 mx-auto text-purple-400 mb-2" />
          <p className="font-medium mb-1">Aún no tienes un perfil profesional</p>
          <p className="text-sm text-muted-foreground mb-3">
            Crea tu perfil para aparecer en el directorio público de veterinarios.
          </p>
          <Link to="/provider/profile-edit">
            <Button>Crear mi perfil</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const p = provider;
  // Supabase devuelve `null` en columnas opcionales, pero
  // calculateProfileCompleteness espera `undefined`. Normalizamos con `??`.
  const completeness = calculateProfileCompleteness({
    display_name: p.display_name ?? undefined,
    bio: p.bio ?? undefined,
    specialties: p.specialties ?? undefined,
    service_areas: p.service_areas ?? undefined,
    commune: p.commune ?? undefined,
    license_number: p.license_number ?? undefined,
    experience_years: p.experience_years ?? undefined,
    price_from: p.price_from ?? undefined,
    avatar_url: p.avatar_url ?? undefined,
    public_email: p.public_email ?? undefined,
    public_phone: p.public_phone ?? undefined,
  });

  const isVisible = !!p.is_directory_visible;
  const slug: string | null = p.slug ?? null;
  const profileUrl = slug ? `https://pawfriend.cl/veterinarios/${slug}` : null;

  // Límite de invitaciones según el plan
  const planId: ProviderPlanId = (p.provider_plan as ProviderPlanId) ?? 'provider_free';
  const planConfig = PROVIDER_PLANS[planId] ?? PROVIDER_PLANS.provider_free;
  const inviteLimit = planConfig.features.max_review_invitations_per_month;
  const canInvite = inviteLimit === -1 || monthCount < inviteLimit;
  const inviteRemaining = inviteLimit === -1 ? '∞' : Math.max(0, inviteLimit - monthCount);
  const views = Number(p.directory_views ?? 0);
  const rating = Number(p.avg_rating ?? 0);
  const reviews = Number(p.total_reviews ?? 0);

  const shareMessage = `¡Hola! Ahora puedes reservar mis consultas y dejar reseñas en mi perfil de Paw Friend 🐾\n${profileUrl ?? ''}`;

  const copyLink = async () => {
    if (!profileUrl) return;
    await navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    toast.success('Link copiado');
    setTimeout(() => setCopied(false), 2000);
  };

  const copyMessage = async () => {
    await navigator.clipboard.writeText(shareMessage);
    toast.success('Mensaje copiado');
  };

  const shareWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
    openExternalUrl(url);
  };

  const handleCreateInvitation = async () => {
    if (!canInvite) {
      toast.error(`Llegaste al límite de ${inviteLimit} invitaciones este mes. Mejora tu plan.`);
      return;
    }
    try {
      const inv = await createInvitation.mutateAsync({
        client_name: clientName,
        client_email: clientEmail,
      });
      const link = `${window.location.origin}/resena/${inv.invitation_token}`;
      setGeneratedLink(link);
      toast.success('Invitación creada');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al crear la invitación');
    }
  };

  const resetInviteForm = () => {
    setClientName('');
    setClientEmail('');
    setGeneratedLink(null);
  };

  const copyInviteLink = async () => {
    if (!generatedLink) return;
    await navigator.clipboard.writeText(generatedLink);
    toast.success('Link copiado');
  };

  const shareInviteWhatsApp = () => {
    if (!generatedLink) return;
    const msg = `Hola${clientName ? ' ' + clientName : ''}, te invito a dejar tu reseña sobre mi atención en Paw Friend 🐾\n${generatedLink}`;
    openExternalUrl(`https://wa.me/?text=${encodeURIComponent(msg)}`);
  };

  const shareNative = async () => {
    if (!profileUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: p.display_name ?? undefined,
          text: shareMessage,
          url: profileUrl,
        });
      } catch {
        /* cancelado */
      }
    } else {
      await copyLink();
    }
  };

  return (
    <>
      <Card className="border-purple-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base">Tu perfil público</CardTitle>
            {isVisible ? (
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Visible</Badge>
            ) : (
              <Badge variant="secondary">Oculto</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Header con avatar + URL */}
          <div className="flex items-center gap-3">
            {p.avatar_url ? (
              <img
                src={p.avatar_url}
                alt={p.display_name ?? undefined}
                loading="lazy"
                className="w-14 h-14 rounded-full object-cover border-2 border-purple-100"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center">
                <Stethoscope className="h-6 w-6 text-purple-500" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{p.display_name}</p>
              {profileUrl && (
                <p className="text-xs text-muted-foreground font-mono truncate">{profileUrl}</p>
              )}
            </div>
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-purple-50 rounded-lg p-3">
              <div className="flex items-center justify-center gap-1 text-purple-700">
                <Eye className="h-4 w-4" />
                <span className="font-bold text-lg">{views}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">Vistas</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3">
              <div className="flex items-center justify-center gap-1 text-yellow-700">
                <Star className="h-4 w-4 fill-yellow-500" />
                <span className="font-bold text-lg">{rating.toFixed(1)}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">Rating</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-blue-700 font-bold text-lg">{reviews}</div>
              <p className="text-[11px] text-muted-foreground">Reseñas</p>
            </div>
          </div>

          {/* Completitud */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Completitud del perfil</span>
              <span className="font-semibold text-purple-700">{completeness.score}%</span>
            </div>
            <Progress value={completeness.score} className="h-2" />
            {completeness.score < REQUIRED_FOR_DIRECTORY_SCORE && (
              <div className="mt-2 flex items-start gap-2 text-xs text-amber-700 bg-amber-50 p-2 rounded">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>
                  Necesitas {REQUIRED_FOR_DIRECTORY_SCORE}% para aparecer en el directorio. Te
                  faltan: {completeness.missing.slice(0, 3).join(', ')}
                  {completeness.missing.length > 3 && '…'}
                </span>
              </div>
            )}
          </div>

          {/* Acciones */}
          <div className="flex flex-wrap gap-2">
            <Link to="/provider/profile-edit" className="flex-1">
              <Button variant="outline" className="w-full" size="sm">
                Editar perfil
              </Button>
            </Link>
            {profileUrl && (
              <a href={profileUrl} target="_blank" rel="noreferrer" className="flex-1">
                <Button variant="outline" className="w-full" size="sm">
                  <ExternalLink className="h-4 w-4 mr-1" /> Ver público
                </Button>
              </a>
            )}
            <Button
              size="sm"
              onClick={() => setShareOpen(true)}
              disabled={!profileUrl || !isVisible}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white"
            >
              <Share2 className="h-4 w-4 mr-1" /> Compartir
            </Button>
          </div>

          {/* Invitar a reseña */}
          <div className="border-t pt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                resetInviteForm();
                setInviteOpen(true);
              }}
              className="w-full text-purple-700 hover:bg-purple-50"
              disabled={!isVisible}
            >
              <Mail className="h-4 w-4 mr-1" /> Invitar paciente a dejar reseña
              <span className="ml-auto text-xs text-muted-foreground">
                {inviteRemaining} restantes
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal invitar a reseña */}
      <ResponsiveModal
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        title="Invitar paciente a dejar reseña"
        description='Genera un link único para enviarle a un paciente que ya atendiste fuera de la plataforma. La reseña aparecerá marcada como "no verificada por reserva".'
      >
        {!generatedLink ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="cname">Nombre del paciente (opcional)</Label>
              <Input
                id="cname"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="María Pérez"
              />
            </div>
            <div>
              <Label htmlFor="cemail">Email del paciente (opcional)</Label>
              <Input
                id="cemail"
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="maria@email.cl"
              />
            </div>
            <div className="text-xs text-muted-foreground bg-purple-50 p-3 rounded">
              Plan {planConfig.name}: {inviteRemaining} invitaciones restantes este mes.
            </div>
            <Button
              onClick={handleCreateInvitation}
              disabled={createInvitation.isPending || !canInvite}
              className="w-full"
            >
              {createInvitation.isPending ? 'Generando…' : 'Generar link de invitación'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Link de invitación:</p>
              <div className="flex items-center gap-2">
                <p className="text-xs font-mono text-green-700 flex-1 truncate">{generatedLink}</p>
                <Button size="sm" variant="ghost" onClick={copyInviteLink}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">
                Válido por 30 días. Solo puede usarse una vez.
              </p>
            </div>
            <Button
              onClick={shareInviteWhatsApp}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Enviar por WhatsApp
            </Button>
            <Button variant="outline" onClick={resetInviteForm} className="w-full">
              Crear otra invitación
            </Button>
          </div>
        )}
      </ResponsiveModal>

      {/* Modal compartir */}
      <ResponsiveModal
        open={shareOpen}
        onOpenChange={setShareOpen}
        title="Comparte tu perfil"
        description="Envía tu link a tus pacientes para que reserven y dejen reseñas."
      >
        <div className="space-y-4">
          <div className="bg-purple-50 p-3 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Tu link público:</p>
            <div className="flex items-center gap-2">
              <p className="text-sm font-mono text-purple-700 flex-1 truncate">{profileUrl}</p>
              <Button size="sm" variant="ghost" onClick={copyLink}>
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button onClick={shareWhatsApp} className="bg-green-600 hover:bg-green-700 text-white">
              WhatsApp
            </Button>
            <Button onClick={shareNative} variant="outline">
              <Share2 className="h-4 w-4 mr-1" /> Más opciones
            </Button>
          </div>

          <div>
            <p className="text-xs font-medium mb-1">Mensaje sugerido:</p>
            <div className="bg-slate-50 p-3 rounded text-sm whitespace-pre-line">
              {shareMessage}
            </div>
            <Button variant="ghost" size="sm" onClick={copyMessage} className="mt-2 w-full">
              <Copy className="h-3 w-3 mr-1" /> Copiar mensaje
            </Button>
          </div>
        </div>
      </ResponsiveModal>
    </>
  );
}
