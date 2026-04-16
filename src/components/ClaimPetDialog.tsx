import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Link2, Loader2, PawPrint } from '@/lib/icons';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Dialog that lets an owner manually claim a pet using
 * the invitation token. Useful when:
 * - The original invitation email was lost
 * - The vet gives the code verbally or via another channel
 */
export function ClaimPetDialog() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClaim = async () => {
    if (!token.trim() || !user) return;
    setLoading(true);

    try {
      // Single atomic RPC — all 5 steps (assign owner, pet_vet_link, reminders)
      // run inside one DB transaction, eliminating TOCTOU race conditions.
      const { data, error } = await supabase.rpc('claim_pet_by_invitation', {
        p_invitation_token: token.trim(),
        p_user_id: user.id,
      });

      if (error) {
        toast.error('Error al procesar el codigo');
        return;
      }

      const result = data as {
        success: boolean;
        error?: string;
        pet_name?: string;
        vet_linked?: boolean;
      };

      if (!result.success) {
        switch (result.error) {
          case 'invalid_token':
            toast.error('Codigo no valido. Verifica con tu veterinario.');
            break;
          case 'already_yours':
            toast.info(`${result.pet_name} ya esta en tu lista de mascotas`);
            break;
          case 'claimed_by_other':
            toast.error('Esta mascota ya fue reclamada por otro usuario');
            break;
          default:
            toast.error('Error al reclamar la mascota');
        }
        return;
      }

      const vetMsg = result.vet_linked ? ' Tu veterinario ya tiene acceso a la ficha.' : '';
      queryClient.invalidateQueries({ queryKey: ['pets'] });
      toast.success(`¡${result.pet_name} ahora es tuya!${vetMsg}`);
      setOpen(false);
      setToken('');
    } catch {
      toast.error('Error al procesar el codigo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Link2 className="h-4 w-4" />
          Tengo un codigo de mi vet
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PawPrint className="h-5 w-5 text-purple-600" />
            Enlazar mascota
          </DialogTitle>
          <DialogDescription>
            Si tu veterinario creo la ficha de tu mascota, pidele el codigo de enlace. Lo encuentras
            en el correo de invitacion o tu vet puede reenviarlo desde su panel.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <Input
            placeholder="Pega el codigo aqui..."
            value={token}
            onChange={(e) => setToken(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleClaim();
            }}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleClaim} disabled={!token.trim() || loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                'Enlazar mascota'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
