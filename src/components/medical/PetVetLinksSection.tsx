import { useState } from 'react';
import { formatDistanceToNowStrict } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Stethoscope, Plus, X, Check, Loader2 } from '@/lib/icons';
import {
  usePetVetLinksByPet,
  useRevokePetVetLink,
  useAcceptPetVetLink,
} from '@/hooks/usePetVetLinks';
import { ShareWithVetModal } from './ShareWithVetModal';

interface PetVetLinksSectionProps {
  petId: string;
  petName: string;
}

export function PetVetLinksSection({ petId, petName }: PetVetLinksSectionProps) {
  const { data: links, isLoading } = usePetVetLinksByPet(petId);
  const revokeMut = useRevokePetVetLink();
  const acceptMut = useAcceptPetVetLink();
  const [modalOpen, setModalOpen] = useState(false);

  if (isLoading) return null;

  const activeLinks = links?.filter((l) => l.status === 'active') || [];
  const pendingLinks = links?.filter((l) => l.status === 'pending') || [];

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-purple-600" />
              Veterinarios de {petName}
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => setModalOpen(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Agregar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {activeLinks.length === 0 && pendingLinks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aun no has vinculado veterinarios. Agrega uno para que pueda acceder a la ficha
              clinica.
            </p>
          ) : (
            <>
              {activeLinks.map((link) => {
                const provider = link.service_providers;
                const since = link.responded_at
                  ? formatDistanceToNowStrict(new Date(link.responded_at), {
                      locale: es,
                      addSuffix: false,
                    })
                  : null;
                return (
                  <div
                    key={link.id}
                    className="flex items-center gap-3 p-3 bg-green-50/50 rounded-lg border border-green-100"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-green-100 text-green-700 text-sm">
                        {(provider?.business_name || 'V')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {provider?.business_name || 'Veterinario/a'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {since ? `Vinculado hace ${since}` : 'Vinculado'}
                        {provider?.comuna && ` · ${provider.comuna}`}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive h-8"
                      disabled={revokeMut.isPending}
                      onClick={() => revokeMut.mutate(link.id)}
                    >
                      {revokeMut.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <X className="h-3.5 w-3.5" />
                      )}
                      <span className="ml-1 text-xs">Revocar</span>
                    </Button>
                  </div>
                );
              })}

              {pendingLinks.map((link) => {
                const provider = link.service_providers;
                const when = formatDistanceToNowStrict(new Date(link.created_at), {
                  locale: es,
                  addSuffix: true,
                });
                const isVetInitiated = link.message === 'Solicitud de acceso via QR';
                const busy = revokeMut.isPending || acceptMut.isPending;
                return (
                  <div
                    key={link.id}
                    className="p-3 bg-amber-50/50 rounded-lg border border-amber-100 space-y-2"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-amber-100 text-amber-700 text-sm">
                          {(provider?.business_name || 'V')[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {provider?.business_name || 'Veterinario/a'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isVetInitiated ? 'Quiere acceder a la ficha' : 'Pendiente'} ({when})
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-xs bg-amber-50 text-amber-600 border-amber-200"
                      >
                        Pendiente
                      </Badge>
                    </div>
                    {isVetInitiated ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1 bg-green-600 hover:bg-green-700 h-8"
                          disabled={busy}
                          onClick={() => acceptMut.mutate(link.id)}
                        >
                          <Check className="h-3.5 w-3.5 mr-1" />
                          Aceptar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-destructive border-destructive/30 h-8"
                          disabled={busy}
                          onClick={() => revokeMut.mutate(link.id)}
                        >
                          <X className="h-3.5 w-3.5 mr-1" />
                          Rechazar
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive h-8"
                          disabled={busy}
                          onClick={() => revokeMut.mutate(link.id)}
                        >
                          <X className="h-3.5 w-3.5" />
                          <span className="ml-1 text-xs">Cancelar</span>
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </CardContent>
      </Card>

      <ShareWithVetModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        petId={petId}
        petName={petName}
      />
    </>
  );
}
