import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Share2, Link2, Copy, Trash2, MessageCircle, Download, ChevronDown } from '@/lib/icons';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useMedicalSharing } from '@/hooks/useMedicalSharing';
import { PremiumNudge } from '@/components/PremiumNudge';
import { openExternalUrl } from '@/lib/nativeNavigation';
import { formatShortDate } from '../helpers';
import { PetQRDisplay } from '@/components/medical/PetQRDisplay';
import { PetVetLinksSection } from '@/components/medical/PetVetLinksSection';

export function TabCompartir({ petId, petName }: { petId: string; petName: string }) {
  const {
    tokens,
    isLoading,
    createShareToken,
    isCreating,
    revokeToken,
    isRevoking,
    getShareUrl,
    shareLimitReached,
  } = useMedicalSharing(petId);
  const [legacyOpen, setLegacyOpen] = useState(false);

  const handleCopy = useCallback(
    async (token: string) => {
      const url = getShareUrl(token);
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Listo. Compártelo con tu veterinario');
      } catch {
        toast.error('No se pudo copiar el enlace');
      }
    },
    [getShareUrl]
  );

  const handleWhatsApp = useCallback(
    (token: string) => {
      const url = getShareUrl(token);
      const text = `Te comparto la ficha médica de mi mascota en Paw Friend: ${url}`;
      openExternalUrl(`https://wa.me/?text=${encodeURIComponent(text)}`);
    },
    [getShareUrl]
  );

  const handleCreate = useCallback(async () => {
    try {
      await createShareToken({ expiryDays: 30, targetProviderId: null });
    } catch {
      // Error handled by the hook
    }
  }, [createShareToken]);

  const handleRevoke = useCallback(
    async (tokenId: string) => {
      try {
        await revokeToken(tokenId);
      } catch {
        // Error handled by the hook
      }
    },
    [revokeToken]
  );

  const downloadQR = useCallback((tokenStr: string) => {
    const svg = document.querySelector(`#qr-${tokenStr}`) as SVGSVGElement;
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx?.drawImage(img, 0, 0, 300, 300);
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = 'paw-friend-ficha-qr.png';
      a.click();
    };
    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  }, []);

  const activeTokens = tokens?.filter((t) => new Date(t.expires_at) >= new Date()) || [];
  const hasActiveTokens = activeTokens.length > 0;

  return (
    <div className="space-y-4">
      {/* ═══ Sección principal: vincular con vet ═══ */}
      <PetVetLinksSection petId={petId} petName={petName} />

      {/* ═══ QR de la ficha clínica ═══ */}
      <PetQRDisplay petId={petId} petName={petName} />

      {/* ═══ Enlace público (legacy, colapsado) ═══ */}
      <Collapsible open={legacyOpen} onOpenChange={setLegacyOpen}>
        <Card>
          <CollapsibleTrigger className="w-full text-left">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-muted-foreground" />
                  Enlace público temporal
                  {hasActiveTokens && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-green-50 text-green-600 border-green-200"
                    >
                      {activeTokens.length} activo{activeTokens.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                </CardTitle>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform ${legacyOpen ? 'rotate-180' : ''}`}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Genera un enlace que cualquier persona puede abrir durante 30 días, sin necesidad de
                cuenta.
              </p>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              {shareLimitReached && (
                <PremiumNudge
                  feature="share_clinical"
                  title="Compartir con vets"
                  description="Puedes compartir la ficha con todos los vets que necesites, sin límite. Si te sirve, apóyanos."
                  variant="inline"
                />
              )}
              <Button
                onClick={handleCreate}
                disabled={isCreating || shareLimitReached}
                size="sm"
                variant="outline"
              >
                <Link2 className="h-4 w-4 mr-2" />
                {isCreating ? 'Generando...' : 'Generar enlace'}
              </Button>

              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-14 w-full" />
                </div>
              ) : activeTokens.length > 0 ? (
                <div className="space-y-3">
                  {activeTokens.map((token) => (
                    <div
                      key={token.id}
                      className="flex flex-wrap items-center justify-between gap-3 p-3 bg-muted/30 rounded-lg"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-mono text-muted-foreground truncate">
                          {getShareUrl(token.token)}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          Creado: {formatShortDate(token.created_at)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleWhatsApp(token.token)}
                          title="Enviar por WhatsApp"
                          className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 h-9 w-9"
                          aria-label="Enviar por WhatsApp"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(token.token)}
                          title="Copiar enlace"
                          className="h-9 w-9"
                          aria-label="Copiar enlace"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRevoke(token.id)}
                          disabled={isRevoking}
                          title="Revocar enlace"
                          className="text-destructive hover:text-destructive h-9 w-9"
                          aria-label="Revocar enlace"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="w-full mt-2 pt-2 border-t border-border/50 flex items-center gap-3">
                        <div className="p-1.5 bg-white rounded-lg border border-purple-100 flex-shrink-0">
                          <QRCodeSVG
                            id={`qr-${token.token}`}
                            value={getShareUrl(token.token)}
                            size={80}
                            level="M"
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadQR(token.token)}
                          className="h-8 text-xs gap-1.5"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Descargar QR
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}
