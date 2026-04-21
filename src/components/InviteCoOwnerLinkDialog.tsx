import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Copy, Mail, MessageCircle, PawPrint } from '@/lib/icons';
import { toast } from 'sonner';

/**
 * Dialog post-AddPet cuando el email invitado NO tiene cuenta aun.
 *
 * El row en pet_co_owners ya se creo con invitation_token + invited_email.
 * Esta UI le da al user un link copiable + botones de share para que lo
 * mande a la persona. Al abrir el link, el hook
 * useAutoAcceptCoOwnerInvitation (en MyPets/Home) procesa el token tras
 * el registro.
 *
 * Si el email SI tiene cuenta, la notificacion in-app la dispara el
 * trigger notify_co_owner_on_invite (mig 20260721000000) y este dialog
 * NO se muestra.
 */

const ORIGIN =
  typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : 'https://pawfriend.cl';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Token de la invitacion (pet_co_owners.invitation_token). */
  invitationToken: string;
  /** Email al que se invito (para mostrarlo de vuelta al user). */
  invitedEmail: string;
  /** Nombre de la mascota, para personalizar mensajes. */
  petName: string;
  /** Se llama al cerrar el dialog (ej. para navegar a /my-pets). */
  onDone?: () => void;
}

export function InviteCoOwnerLinkDialog({
  open,
  onOpenChange,
  invitationToken,
  invitedEmail,
  petName,
  onDone,
}: Props) {
  const [copied, setCopied] = useState(false);

  // Link apunta a /my-pets porque ese es el lugar que monta
  // useAutoAcceptCoOwnerInvitation y procesa el token. La ruta es
  // protegida; si el user no tiene cuenta, ProtectedRoute lo manda a
  // /auth con returnTo y al volver procesa el token automaticamente.
  const link = `${ORIGIN}/my-pets?co_owner=${invitationToken}`;
  const inviteMessage = `Te invito a compartir la ficha de ${petName} en Paw Friend. Abri este link para unirte: ${link}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success('Link copiado');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('No se pudo copiar. Selecciona y copia manualmente.');
    }
  };

  const handleWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(inviteMessage)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`Invitacion Paw Friend: ${petName}`);
    const body = encodeURIComponent(inviteMessage);
    window.location.href = `mailto:${invitedEmail}?subject=${subject}&body=${body}`;
  };

  const handleClose = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) onDone?.();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-2">
            <PawPrint className="h-6 w-6 text-purple-600" />
          </div>
          <DialogTitle className="text-center">Falta un paso para invitar</DialogTitle>
          <DialogDescription className="text-center">
            <strong>{invitedEmail}</strong> no tiene cuenta en Paw Friend todavia. Mandale este link
            y cuando se registre, {petName} va a quedar enlazada a su cuenta.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={link}
              className="text-xs font-mono bg-muted"
              onFocus={(e) => e.target.select()}
            />
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={handleCopy}
              title="Copiar link"
              aria-label="Copiar link"
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" onClick={handleWhatsApp} className="gap-2">
              <MessageCircle className="h-4 w-4 text-green-600" />
              WhatsApp
            </Button>
            <Button type="button" variant="outline" onClick={handleEmail} className="gap-2">
              <Mail className="h-4 w-4 text-blue-600" />
              Email
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center pt-1">
            El link funciona una sola vez y vence cuando la invitacion se acepta o revoca.
          </p>
        </div>

        <DialogFooter>
          <Button onClick={() => handleClose(false)} className="w-full">
            Listo, seguir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
