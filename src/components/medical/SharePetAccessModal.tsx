import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { UserPlus, Users, Loader2, X, Mail } from '@/lib/icons';
import {
  useCoOwners,
  useInviteCoOwner,
  useRevokeCoOwner,
  ROLE_LABELS,
  type CoOwnerRole,
  type CoOwnerWithProfile,
} from '@/hooks/useCoOwners';

interface SharePetAccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  petId: string;
  petName: string;
}

const ROLE_DESCRIPTIONS: Record<CoOwnerRole, string> = {
  co_owner: 'Puede ver y agregar registros médicos, editar datos de la mascota',
  caretaker: 'Puede ver la ficha y agregar notas',
  family_member: 'Solo puede ver la ficha clínica',
  trainer: 'Puede ver la ficha y agregar rutinas de ejercicio',
};

const STATUS_BADGE: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  pending: { label: 'Pendiente', variant: 'secondary' },
  accepted: { label: 'Activo', variant: 'default' },
};

export function SharePetAccessModal({
  open,
  onOpenChange,
  petId,
  petName,
}: SharePetAccessModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<CoOwnerRole>('family_member');
  const [revokeTarget, setRevokeTarget] = useState<CoOwnerWithProfile | null>(null);

  const { data: coOwners = [], isLoading } = useCoOwners(open ? petId : null);
  const inviteMutation = useInviteCoOwner();
  const revokeMutation = useRevokeCoOwner();

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    await inviteMutation.mutateAsync({ petId, email: email.trim(), role });
    setEmail('');
    setRole('family_member');
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    await revokeMutation.mutateAsync({ coOwnerId: revokeTarget.id, petId });
    setRevokeTarget(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Compartir acceso a {petName}
            </DialogTitle>
            <DialogDescription>
              Invita a familiares, cuidadores o entrenadores para que vean la ficha de {petName}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 mt-2">
            {/* ── Invite form ── */}
            <form onSubmit={handleInvite} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="co-owner-email" className="text-sm font-medium">
                  Email de la persona
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="co-owner-email"
                      type="email"
                      placeholder="familiar@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Rol</Label>
                <Select value={role} onValueChange={(v) => setRole(v as CoOwnerRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(ROLE_LABELS) as CoOwnerRole[]).map((r) => (
                      <SelectItem key={r} value={r}>
                        <div>
                          <span className="font-medium">{ROLE_LABELS[r]}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            — {ROLE_DESCRIPTIONS[r]}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                disabled={!email.trim() || inviteMutation.isPending}
                className="w-full"
              >
                {inviteMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                Enviar invitación
              </Button>
            </form>

            {/* ── Current co-owners ── */}
            {(coOwners.length > 0 || isLoading) && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Personas con acceso ({coOwners.length})
                </Label>

                {isLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[250px] overflow-y-auto">
                    {coOwners.map((co) => (
                      <div
                        key={co.id}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20"
                      >
                        <Avatar className="h-9 w-9">
                          {co.profile?.avatar_url ? (
                            <AvatarImage
                              src={co.profile.avatar_url}
                              alt={co.profile.display_name || ''}
                            />
                          ) : null}
                          <AvatarFallback className="bg-purple-100 text-purple-700 text-xs">
                            {(co.profile?.display_name ||
                              co.invited_email ||
                              '?')[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {co.profile?.display_name || co.invited_email || 'Sin nombre'}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs text-muted-foreground">
                              {ROLE_LABELS[co.role as CoOwnerRole]}
                            </span>
                            <Badge
                              variant={STATUS_BADGE[co.status]?.variant || 'secondary'}
                              className="text-[10px] px-1.5 py-0"
                            >
                              {STATUS_BADGE[co.status]?.label || co.status}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setRevokeTarget(co)}
                          title="Revocar acceso"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Revoke confirmation ── */}
      <AlertDialog open={!!revokeTarget} onOpenChange={() => setRevokeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Revocar acceso?</AlertDialogTitle>
            <AlertDialogDescription>
              {revokeTarget?.profile?.display_name || revokeTarget?.invited_email} ya no podrá ver
              la ficha de {petName}. Puedes volver a invitarle después.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sí, revocar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
