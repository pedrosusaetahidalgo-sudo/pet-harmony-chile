import { useCallback } from "react";
import { toast } from "sonner";
import { Share2, Link2, Copy, Trash2 } from "@/lib/icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMedicalSharing } from "@/hooks/useMedicalSharing";
import { formatShortDate } from "../helpers";
import { EmptyState } from "../shared";

export function TabCompartir({ petId }: { petId: string }) {
  const { tokens, isLoading, createShareToken, isCreating, revokeToken, isRevoking, getShareUrl } = useMedicalSharing(petId);

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

  const handleCreate = useCallback(async () => {
    try {
      await createShareToken(30);
    } catch {
      // Error handled by the hook
    }
  }, [createShareToken]);

  const handleRevoke = useCallback(async (tokenId: string) => {
    try {
      await revokeToken(tokenId);
    } catch {
      // Error handled by the hook
    }
  }, [revokeToken]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Share2 className="h-4 w-4 text-emerald-600" />
            Compartir ficha clínica
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Genera un enlace seguro para compartir la ficha clínica de tu mascota con un veterinario.
            Los enlaces expiran automáticamente después de 30 días.
          </p>
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
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        Creado: {formatShortDate(token.created_at)}
                      </span>
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(token.token)}
                      title="Copiar enlace"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevoke(token.id)}
                      disabled={isRevoking}
                      title="Revocar enlace"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
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
