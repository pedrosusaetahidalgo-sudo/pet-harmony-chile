import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Share2, Link2, Copy, Trash2, MessageCircle, Download } from "@/lib/icons";
import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMedicalSharing } from "@/hooks/useMedicalSharing";
import { supabase } from "@/integrations/supabase/client";
import { formatShortDate } from "../helpers";
import { EmptyState } from "../shared";
import { PetQRDisplay } from "@/components/medical/PetQRDisplay";

interface DirectoryVet {
  id: string;
  slug: string | null;
  display_name: string;
}

export function TabCompartir({ petId, petName }: { petId: string; petName: string }) {
  const { tokens, isLoading, createShareToken, isCreating, revokeToken, isRevoking, getShareUrl } = useMedicalSharing(petId);
  const [targetVetId, setTargetVetId] = useState<string>("none");
  const [vets, setVets] = useState<DirectoryVet[]>([]);

  // Carga de vets visibles en el directorio. Hacemos 2 fetches en vez del
  // join PostgREST profiles:user_id(...) porque ese path no esta auto
  // detectado y devuelve 400 (mismo patron que adoption_posts).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: providers } = await supabase
        .from("service_providers")
        .select("id, slug, user_id, is_directory_visible")
        .eq("is_directory_visible", true)
        .limit(50);
      if (!providers || providers.length === 0) {
        if (!cancelled) setVets([]);
        return;
      }
      const userIds = Array.from(
        new Set(providers.map((p: { user_id: string | null }) => p.user_id).filter(Boolean))
      );
      const { data: profiles } = userIds.length
        ? await supabase
            .from("profiles")
            .select("id, display_name")
            .in("id", userIds as string[])
        : { data: [] as { id: string; display_name: string | null }[] };
      const map = new Map(
        (profiles || []).map((p) => [p.id, p.display_name || "Veterinario/a"])
      );
      const merged: DirectoryVet[] = providers.map((p: { id: string; slug: string | null; user_id: string | null }) => ({
        id: p.id,
        slug: p.slug,
        display_name: (p.user_id && map.get(p.user_id)) || "Veterinario/a",
      }));
      if (!cancelled) setVets(merged);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCopy = useCallback(async (token: string) => {
    const url = getShareUrl(token);
    try {
      await navigator.clipboard.writeText(url);
      // El sistema (Android/iOS) muestra su propio toast de "copiado", así
      // que el nuestro aporta valor en lugar de duplicar el mensaje.
      toast.success("Listo. Compártelo con tu veterinario");
    } catch {
      toast.error("No se pudo copiar el enlace");
    }
  }, [getShareUrl]);

  const handleWhatsApp = useCallback((token: string) => {
    const url = getShareUrl(token);
    const text = `Te comparto la ficha médica de mi mascota en Paw Friend: ${url}`;
    // wa.me es link directo (no requiere API Meta), abre WhatsApp con el
    // mensaje pre-armado y deja que el usuario elija a quien enviarlo.
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  }, [getShareUrl]);

  const handleCreate = useCallback(async () => {
    try {
      await createShareToken({
        expiryDays: 30,
        targetProviderId: targetVetId === "none" ? null : targetVetId,
      });
    } catch {
      // Error handled by the hook
    }
  }, [createShareToken, targetVetId]);

  const vetNameById = useCallback(
    (id: string | null) => {
      if (!id) return null;
      return vets.find((v) => v.id === id)?.display_name || null;
    },
    [vets]
  );

  const handleRevoke = useCallback(async (tokenId: string) => {
    try {
      await revokeToken(tokenId);
    } catch {
      // Error handled by the hook
    }
  }, [revokeToken]);

  const downloadQR = useCallback((tokenStr: string) => {
    const svg = document.querySelector(`#qr-${tokenStr}`) as SVGSVGElement;
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      ctx?.drawImage(img, 0, 0, 300, 300);
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = "paw-friend-ficha-qr.png";
      a.click();
    };
    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  }, []);

  return (
    <div className="space-y-4">
      {/* QR de la ficha clinica */}
      <PetQRDisplay petId={petId} petName={petName} />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Share2 className="h-4 w-4 text-purple-600" />
            Compartir ficha clínica
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Genera un enlace seguro para compartir la ficha clínica de tu mascota con un veterinario.
            Los enlaces expiran automáticamente después de 30 días.
          </p>
          <div className="space-y-2">
            <Label className="text-xs">¿Para algún vet en particular? (opcional)</Label>
            <Select value={targetVetId} onValueChange={setTargetVetId}>
              <SelectTrigger className="w-full sm:w-[320px]">
                <SelectValue placeholder="Cualquier veterinario" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Cualquier veterinario</SelectItem>
                {vets.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Si eliges un vet, le llegará una notificación en su panel.
            </p>
          </div>
          <Button
            onClick={handleCreate}
            disabled={isCreating}
            className="w-full sm:w-auto"
          >
            <Link2 className="h-4 w-4 mr-2" />
            {isCreating ? "Generando..." : "Generar enlace"}
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : tokens && tokens.length > 0 ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Enlaces activos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tokens.map((token) => {
              const isExpired = new Date(token.expires_at) < new Date();
              return (
                <div key={token.id} className="flex items-center justify-between gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-mono text-muted-foreground truncate">
                      {getShareUrl(token.token)}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-muted-foreground">
                        Creado: {formatShortDate(token.created_at)}
                      </span>
                      {vetNameById(token.target_provider_id) && (
                        <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                          Para {vetNameById(token.target_provider_id)}
                        </Badge>
                      )}
                      {isExpired ? (
                        <Badge variant="outline" className="text-xs bg-red-50 text-red-600 border-red-200">
                          Expirado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-600 border-green-200">
                          Activo
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!isExpired && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleWhatsApp(token.token)}
                        title="Enviar por WhatsApp"
                        className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 h-11 w-11"
                        aria-label="Enviar por WhatsApp"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(token.token)}
                      title="Copiar enlace"
                      className="h-11 w-11"
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
                      className="text-destructive hover:text-destructive h-11 w-11"
                      aria-label="Revocar enlace"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {!isExpired && (
                    <div className="w-full mt-2 flex items-end gap-3">
                      <div className="p-2 bg-white rounded-lg inline-block">
                        <QRCodeSVG
                          id={`qr-${token.token}`}
                          value={getShareUrl(token.token)}
                          size={120}
                          level="M"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadQR(token.token)}
                        className="h-11 text-xs gap-1.5"
                      >
                        <Download className="h-4 w-4" />
                        Descargar QR
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={Link2}
          title="Sin enlaces activos"
          description="Genera un enlace para compartir la ficha clínica con tu veterinario."
        />
      )}
    </div>
  );
}
