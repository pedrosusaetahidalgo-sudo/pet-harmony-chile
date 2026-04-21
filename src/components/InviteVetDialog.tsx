/**
 * InviteVetDialog — invita a un vet NO registrado a sumarse a Paw Friend.
 *
 * Distinto de ShareWithVetModal (que comparte ficha con vet del directorio).
 * Este es el viral loop: el dueño refiere su vet de cabecera, quien aun no
 * esta en la plataforma. Genera link con ref_owner=<userId> + UTM y se
 * envia por WhatsApp (preferido) o se copia.
 *
 * Origen: Plan 90d Tanda 16 — viral loop.
 */

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Copy, Check, Stethoscope } from '@/lib/icons';
import { toast } from 'sonner';
import { track, EVENTS } from '@/lib/analytics';

interface InviteVetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Opcional: nombre del dueño para personalizar el mensaje. */
  ownerName?: string;
  /** Opcional: nombre de la mascota para personalizar el mensaje. */
  petName?: string;
}

function onlyDigits(s: string): string {
  return s.replace(/\D/g, '');
}

/** Convierte telefono ingresado a formato wa.me (+569...). */
function toWhatsAppNumber(phone: string): string {
  const digits = onlyDigits(phone);
  if (!digits) return '';
  if (digits.startsWith('569') && digits.length === 11) return digits;
  if (digits.startsWith('9') && digits.length === 9) return '56' + digits;
  if (digits.length === 8) return '569' + digits;
  return digits;
}

export function InviteVetDialog({ open, onOpenChange, ownerName, petName }: InviteVetDialogProps) {
  const { user } = useAuth();
  const [vetName, setVetName] = useState('');
  const [vetPhone, setVetPhone] = useState('');
  const [copied, setCopied] = useState(false);

  const refParam = user?.id
    ? `?ref_owner=${user.id}&utm_source=owner_invite`
    : '?utm_source=owner_invite';
  const inviteUrl = `https://pawfriend.cl/registro-veterinario${refParam}`;

  const baseMessage = `Hola${vetName ? ' ' + vetName : ''}, ${
    ownerName ? 'soy ' + ownerName + ' y ' : ''
  }te invito a Paw Friend, una plataforma chilena gratis para vets donde puedo compartir la ficha clinica de ${
    petName || 'mi mascota'
  } contigo en segundos (PDF, vacunas, fotos). Tu perfil publico queda en el directorio de vets de la comuna.\n\nMirala aca: ${inviteUrl}`;

  const [message, setMessage] = useState(baseMessage);

  const handleSendWhatsApp = () => {
    const waNumber = toWhatsAppNumber(vetPhone);
    const encodedMsg = encodeURIComponent(message);
    const url = waNumber
      ? `https://wa.me/${waNumber}?text=${encodedMsg}`
      : `https://wa.me/?text=${encodedMsg}`;
    track({ event: EVENTS.OWNER_INVITED_VET, properties: { via: 'whatsapp' } });
    window.open(url, '_blank', 'noopener,noreferrer');
    toast.success('Abrimos WhatsApp para que envies la invitacion');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      track({ event: EVENTS.OWNER_INVITED_VET, properties: { via: 'copy' } });
      toast.success('Mensaje copiado');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('No pudimos copiar el mensaje');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-purple-600" />
            Invita a tu veterinario
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Si tu vet aun no esta en Paw Friend, mandale una invitacion por WhatsApp. Cuando se
            registre podras compartirle la ficha clinica con un solo click.
          </p>

          <div className="space-y-2">
            <Label htmlFor="vet-name">Nombre del vet (opcional)</Label>
            <Input
              id="vet-name"
              value={vetName}
              onChange={(e) => {
                const v = e.target.value;
                setVetName(v);
                setMessage(baseMessage.replace(/Hola[^,]*/, v ? `Hola ${v}` : 'Hola'));
              }}
              placeholder="Dra. Paula / Dr. Nicolas"
              maxLength={60}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vet-phone">WhatsApp del vet (opcional)</Label>
            <Input
              id="vet-phone"
              type="tel"
              value={vetPhone}
              onChange={(e) => setVetPhone(e.target.value)}
              placeholder="+56 9 1234 5678"
              maxLength={20}
            />
            <p className="text-[11px] text-muted-foreground">
              Si lo dejas vacio, se abrira WhatsApp y podras elegir a quien enviar.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-message">Mensaje</Label>
            <Textarea
              id="invite-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="text-xs"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Button onClick={handleSendWhatsApp} className="w-full gap-2">
              <MessageCircle className="h-4 w-4" />
              Enviar por WhatsApp
            </Button>
            <Button variant="outline" onClick={handleCopy} className="w-full gap-2">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copiado' : 'Copiar mensaje y link'}
            </Button>
          </div>

          <p className="text-[10px] text-muted-foreground italic">
            El link incluye tu codigo de referido ({user?.id?.slice(0, 8) ?? '—'}...) para que tu
            vet sepa quien lo invito.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
