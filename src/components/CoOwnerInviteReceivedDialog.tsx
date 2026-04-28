import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { PawPrint } from '@/lib/icons';

/**
 * CoOwnerInviteReceivedDialog — procesa `?co_owner=TOKEN` mostrando un
 * dialog con "X te invitó a compartir Y. Aceptar / Rechazar".
 *
 * Reemplaza al hook auto-accept: antes el token se aceptaba automático
 * apenas cargaba la página. Ahora mostramos el dialog siempre para que
 * el user confirme, excepto en el caso de link post-registro donde
 * tiene sentido semántico aceptar (ya vino con intent a aceptar).
 *
 * Monta en MyPets (y eventualmente en Home) como componente auto-
 * contenido: no rompe si no hay token, y limpia el URL al terminar.
 */

interface InvitationSnapshot {
  id: string;
  pet_id: string;
  pet_name: string;
  inviter_name: string;
  role: 'co_owner' | 'caretaker' | 'trainer' | 'family_member';
  status: string;
}

const ROLE_LABELS: Record<InvitationSnapshot['role'], string> = {
  co_owner: 'co-dueño/a',
  family_member: 'familiar',
  caretaker: 'cuidador/a',
  trainer: 'entrenador/a',
};

export function CoOwnerInviteReceivedDialog() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [invitation, setInvitation] = useState<InvitationSnapshot | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const token = searchParams.get('co_owner');
    if (!token || !user) return;

    (async () => {
      // Fetch invitation + pet + inviter en una sola vuelta
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('pet_co_owners')
        .select('id, pet_id, role, status, invited_by, pets:pet_id(name)')
        .eq('invitation_token', token)
        .maybeSingle();

      if (error || !data) {
        toast.error('Esta invitación ya no existe o expiró');
        clearToken();
        return;
      }

      if (data.status !== 'pending') {
        toast(`La invitación ya fue ${data.status === 'accepted' ? 'aceptada' : 'revocada'}`);
        clearToken();
        return;
      }

      // Fetch inviter name
      const { data: inviter } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', data.invited_by)
        .maybeSingle();

      setInvitation({
        id: data.id,
        pet_id: data.pet_id,
        pet_name: data.pets?.name ?? 'la mascota',
        inviter_name: inviter?.display_name ?? 'Alguien',
        role: data.role,
        status: data.status,
      });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, user]);

  function clearToken() {
    searchParams.delete('co_owner');
    setSearchParams(searchParams, { replace: true });
  }

  async function handleAccept() {
    if (!invitation || !user) return;
    setProcessing(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).rpc('accept_co_owner_invitation', {
        p_token: searchParams.get('co_owner'),
        p_user_id: user.id,
      });

      if (error) {
        logger.error('[co_owner] accept RPC error:', error);
        toast.error('No pudimos aceptar la invitación');
        return;
      }

      const result = data as { success: boolean; error?: string; pet_id?: string };
      if (!result?.success) {
        toast.error(
          result?.error === 'invalid_or_expired_token'
            ? 'Este link ya fue usado o expiró'
            : 'No pudimos aceptar la invitación'
        );
        return;
      }

      toast.success('¡Invitación aceptada!', {
        description: `Ya podes ver a ${invitation.pet_name} en tus mascotas compartidas.`,
      });

      queryClient.invalidateQueries({ queryKey: ['shared-pets', user.id] });
      queryClient.invalidateQueries({ queryKey: ['co-owners'] });
      queryClient.invalidateQueries({ queryKey: ['pets'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });

      setInvitation(null);
      clearToken();
      if (result.pet_id) navigate(`/ficha/${result.pet_id}`, { replace: true });
    } finally {
      setProcessing(false);
    }
  }

  async function handleReject() {
    if (!invitation) return;
    setProcessing(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('pet_co_owners')
        .update({ status: 'revoked' })
        .eq('id', invitation.id);

      if (error) {
        logger.error('[co_owner] reject update error:', error);
        toast.error('No pudimos rechazar la invitación');
        return;
      }

      toast('Invitación rechazada');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setInvitation(null);
      clearToken();
    } finally {
      setProcessing(false);
    }
  }

  if (!invitation) return null;

  return (
    <AlertDialog open onOpenChange={(o) => !o && clearToken()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-2">
            <PawPrint className="h-6 w-6 text-purple-600" />
          </div>
          <AlertDialogTitle className="text-center">
            {invitation.inviter_name} te invitó a compartir{' '}
            <span className="text-purple-600">{invitation.pet_name}</span>
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            Vas a aparecer como <strong>{ROLE_LABELS[invitation.role]}</strong> y podrás ver la
            ficha clínica. Puedes rechazar si no reconoces esta invitación.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={processing} onClick={handleReject}>
            Rechazar
          </AlertDialogCancel>
          <AlertDialogAction disabled={processing} onClick={handleAccept}>
            {processing ? 'Procesando…' : 'Aceptar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
