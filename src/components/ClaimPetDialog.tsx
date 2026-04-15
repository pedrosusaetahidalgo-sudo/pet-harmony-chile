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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

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
      // 1. Find pet by invitation token
      const { data: pet, error: petErr } = await sb
        .from('pets')
        .select('id, name, owner_id, created_by_vet_id, owner_invitation_accepted_at')
        .eq('owner_invitation_token', token.trim())
        .maybeSingle();

      if (petErr || !pet) {
        toast.error('Codigo no valido. Verifica con tu veterinario.');
        return;
      }

      // 2. Already claimed?
      if (pet.owner_invitation_accepted_at) {
        if (pet.owner_id === user.id) {
          toast.info(`${pet.name} ya esta en tu lista de mascotas`);
        } else {
          toast.error('Esta mascota ya fue reclamada por otro usuario');
        }
        return;
      }

      // 3. Claim: set owner_id
      const { error: updateErr } = await sb
        .from('pets')
        .update({
          owner_id: user.id,
          owner_invitation_accepted_at: new Date().toISOString(),
        })
        .eq('id', pet.id);

      if (updateErr) {
        toast.error('Error al reclamar la mascota. Intenta de nuevo.');
        return;
      }

      // 4. Create pet_vet_link
      if (pet.created_by_vet_id) {
        try {
          const { data: vetProvider } = await supabase
            .from('service_providers')
            .select('id')
            .eq('user_id', pet.created_by_vet_id)
            .maybeSingle();

          if (vetProvider?.id) {
            await sb.from('pet_vet_links').upsert(
              {
                pet_id: pet.id,
                owner_id: user.id,
                provider_id: vetProvider.id,
                status: 'active',
                responded_at: new Date().toISOString(),
              },
              { onConflict: 'pet_id,provider_id' }
            );
          }
        } catch {
          // Non-blocking
        }
      }

      queryClient.invalidateQueries({ queryKey: ['pets'] });
      toast.success(`¡${pet.name} ahora es tuya! Tu veterinario ya tiene acceso a la ficha.`);
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
