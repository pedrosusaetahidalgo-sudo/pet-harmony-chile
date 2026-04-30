/**
 * PawShieldPrivacyCard — Toggle de consent para archivado de imagenes
 * Paw Shield (entrenamiento modelo propio futuro).
 *
 * Spec: docs-raiz/PAW_SHIELD_DATA_ARCHIVE.md
 *
 * Aparece en /profile bajo "Privacidad". Permite al usuario:
 *   - Ver cuantas mascotas tiene con consent activo.
 *   - Revocar el consent (RPC revoke_paw_shield_archive_consent).
 *   - Ver cuantas imagenes tenemos guardadas suyas.
 *
 * Cumplimiento Ley 19.628 (ARCO) + 21.719: revocacion programa borrado en
 * 30 dias maximo via cron paw-shield-archive-cleanup.
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Shield, Trash2, Loader2 } from '@/lib/icons';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';
import { isFeatureEnabled } from '@/lib/featureFlags';

interface PetWithConsent {
  id: string;
  name: string;
  paw_shield_data_archive_consent: boolean;
}

interface ArchiveCountRow {
  id: string;
}

export function PawShieldPrivacyCard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Opción C 2026-04-30: Paw Shield fuera del modelo consumer. Si nunca se
  // activó la feature en el cohort de este user, no hay imágenes archivadas
  // y este card es ruido visual. Esconder si flag PAW_SHIELD_PETIFY=false.
  const pawShieldEnabled = isFeatureEnabled('PAW_SHIELD_PETIFY');

  // Mascotas del user con info de consent.
  const { data: pets, isLoading: petsLoading } = useQuery({
    queryKey: ['paw-shield-consent-pets', user?.id],
    enabled: pawShieldEnabled && !!user?.id,
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('pets')
        .select('id, name, paw_shield_data_archive_consent')
        .eq('owner_id', user.id);
      if (error) throw error;
      return (data ?? []) as PetWithConsent[];
    },
  });

  // Conteo de imagenes archivadas del user.
  const { data: imagesCount, isLoading: imagesLoading } = useQuery({
    queryKey: ['paw-shield-archive-count', user?.id],
    enabled: pawShieldEnabled && !!user?.id,
    queryFn: async () => {
      if (!user?.id) return 0;
      const { data, error } = await supabase
        .from('paw_shield_archive')
        .select('id')
        .eq('owner_id', user.id);
      if (error) {
        logger.warn('[PawShieldPrivacyCard] count fallo', error);
        return 0;
      }
      return (data as ArchiveCountRow[] | null)?.length ?? 0;
    },
  });

  const revoke = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('revoke_paw_shield_archive_consent');
      if (error) throw error;
      return data as number;
    },
    onSuccess: (count) => {
      toast.success('Consent revocado', {
        description: `${count} imagen(es) marcadas para borrado en 30 dias.`,
      });
      qc.invalidateQueries({ queryKey: ['paw-shield-consent-pets'] });
      qc.invalidateQueries({ queryKey: ['paw-shield-archive-count'] });
    },
    onError: (err) => {
      logger.error('[PawShieldPrivacyCard] revoke fallo', err);
      toast.error('No pudimos revocar', {
        description: err instanceof Error ? err.message : 'Intenta de nuevo.',
      });
    },
  });

  // Opción C 2026-04-30: si flag dormido, no renderizar este card.
  if (!pawShieldEnabled) return null;

  const consentingPets = pets?.filter((p) => p.paw_shield_data_archive_consent) ?? [];
  const hasAnyConsent = consentingPets.length > 0 || (imagesCount ?? 0) > 0;

  if (petsLoading || imagesLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4 text-purple-600" />
            Paw Shield · imagenes para mejora
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Cargando...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="h-4 w-4 text-purple-600" />
          Paw Shield · imagenes para mejora
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {!hasAnyConsent ? (
          <p className="text-muted-foreground">
            No conservamos imagenes biometricas tuyas para training. Si en el futuro activas Paw
            Shield para alguna mascota y autorizas el archivado, aparecera aca.
          </p>
        ) : (
          <>
            <p className="text-muted-foreground leading-relaxed">
              Tienes <strong>{consentingPets.length}</strong> mascota(s) con archivado activo.
              Conservamos <strong>{imagesCount ?? 0}</strong> imagen(es) anonimizadas para entrenar
              nuestro proximo modelo de identificacion.
            </p>
            {consentingPets.length > 0 && (
              <div className="text-xs text-muted-foreground">
                Mascotas: {consentingPets.map((p) => p.name).join(', ')}
              </div>
            )}
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <strong>Tu derecho ARCO (Ley 19.628):</strong> podes revocar este permiso en cualquier
              momento. Las imagenes se borran en maximo 30 dias.
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmOpen(true)}
              disabled={revoke.isPending}
              className="text-amber-900 border-amber-300 hover:bg-amber-100"
            >
              {revoke.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Revocar y borrar
            </Button>
          </>
        )}
      </CardContent>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revocar consent de archivado?</AlertDialogTitle>
            <AlertDialogDescription>
              Tus {imagesCount ?? 0} imagen(es) se marcaran para borrado y se eliminaran en maximo
              30 dias del sistema. Tu Paw Shield activo sigue funcionando (la mascota sigue
              protegida); solo desactivamos el archivado para training futuro.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmOpen(false);
                revoke.mutate();
              }}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Si, revocar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
