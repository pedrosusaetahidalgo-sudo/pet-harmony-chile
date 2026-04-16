import { useState } from 'react';
import { formatDistanceToNowStrict } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { UserPlus, Check, X, Loader2 } from '@/lib/icons';
import {
  usePendingVetLinks,
  useAcceptPetVetLink,
  useRejectPetVetLink,
} from '@/hooks/usePetVetLinks';
import { calculateAge } from '@/lib/format';

export function PendingVetLinksCard() {
  const { data: pending, isLoading } = usePendingVetLinks();
  const acceptMut = useAcceptPetVetLink();
  const rejectMut = useRejectPetVetLink();
  const [rejectId, setRejectId] = useState<string | null>(null);

  if (isLoading || !pending || pending.length === 0) return null;

  return (
    <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-amber-600" />
            Solicitudes de vinculacion
          </CardTitle>
          <Badge variant="outline" className="bg-white border-amber-200 text-amber-700">
            {pending.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {pending.map((link) => {
          const pet = link.pets;
          const owner = link.profiles;
          const when = formatDistanceToNowStrict(new Date(link.created_at), {
            locale: es,
            addSuffix: true,
          });
          const busy = acceptMut.isPending || rejectMut.isPending;

          return (
            <div
              key={link.id}
              className="p-4 bg-white rounded-lg border border-amber-100 space-y-3"
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12">
                  {pet?.photo_url ? (
                    <AvatarImage src={pet.photo_url} alt={pet?.name || 'Mascota'} />
                  ) : null}
                  <AvatarFallback className="bg-amber-100 text-amber-700">
                    {(pet?.name || 'M')[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">
                    {pet?.name || 'Mascota'}
                    {pet?.species && (
                      <span className="text-muted-foreground font-normal capitalize">
                        {' '}
                        · {pet.species}
                      </span>
                    )}
                  </p>
                  {pet?.breed && <p className="text-xs text-muted-foreground">{pet.breed}</p>}
                  <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground mt-0.5">
                    {pet?.birth_date && <span>{calculateAge(pet.birth_date)}</span>}
                    {pet?.weight && <span>· {pet.weight} kg</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Dueño: {owner?.display_name || 'Usuario'} · {when}
                  </p>
                  {link.message && (
                    <p className="text-xs italic text-muted-foreground mt-1">"{link.message}"</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={busy}
                  onClick={() => acceptMut.mutate(link.id)}
                >
                  {acceptMut.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Aceptar
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/5"
                  disabled={busy}
                  onClick={() => setRejectId(link.id)}
                >
                  <X className="h-4 w-4 mr-1" />
                  Rechazar
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>

      <AlertDialog open={!!rejectId} onOpenChange={() => setRejectId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Rechazar esta solicitud?</AlertDialogTitle>
            <AlertDialogDescription>
              El dueño será notificado de que no aceptaste la vinculación. Podrá enviarte una nueva
              solicitud más adelante si lo desea.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (rejectId) rejectMut.mutate(rejectId);
                setRejectId(null);
              }}
            >
              Sí, rechazar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
