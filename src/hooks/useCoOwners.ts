import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

export type CoOwnerRole = 'co_owner' | 'caretaker' | 'trainer' | 'family_member';
export type CoOwnerStatus = 'pending' | 'accepted' | 'revoked';

export interface CoOwner {
  id: string;
  pet_id: string;
  user_id: string;
  role: CoOwnerRole;
  permissions: string[];
  invited_by: string | null;
  invited_email: string | null;
  invitation_token: string | null;
  invited_at: string;
  accepted_at: string | null;
  status: CoOwnerStatus;
}

export interface CoOwnerWithProfile extends CoOwner {
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
    email?: string | null;
  };
}

const ROLE_LABELS: Record<CoOwnerRole, string> = {
  co_owner: 'Co-dueño/a',
  caretaker: 'Cuidador/a',
  trainer: 'Entrenador/a',
  family_member: 'Familiar',
};

const ROLE_PERMISSIONS: Record<CoOwnerRole, string[]> = {
  co_owner: ['view_record', 'add_records', 'edit_pet'],
  caretaker: ['view_record', 'add_notes'],
  family_member: ['view_record'],
  trainer: ['view_record', 'add_routines'],
};

export { ROLE_LABELS, ROLE_PERMISSIONS };

/** Fetch co-owners for a specific pet */
export function useCoOwners(petId: string | null) {
  return useQuery({
    queryKey: ['co-owners', petId],
    enabled: !!petId,
    staleTime: 30_000,
    queryFn: async (): Promise<CoOwnerWithProfile[]> => {
      const { data, error } = await sb
        .from('pet_co_owners')
        .select('*')
        .eq('pet_id', petId)
        .neq('status', 'revoked')
        .order('invited_at', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) return [];

      // Fetch profiles for accepted co-owners
      const userIds = data.filter((c: CoOwner) => c.user_id).map((c: CoOwner) => c.user_id);

      let profiles: { id: string; display_name: string | null; avatar_url: string | null }[] = [];
      if (userIds.length > 0) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .in('id', userIds);
        profiles = profileData || [];
      }

      const profileMap = new Map(profiles.map((p) => [p.id, p]));

      return data.map((co: CoOwner) => ({
        ...co,
        profile: co.user_id
          ? profileMap.get(co.user_id) || { display_name: co.invited_email, avatar_url: null }
          : { display_name: co.invited_email, avatar_url: null },
      }));
    },
  });
}

/** Invite a co-owner by email */
export function useInviteCoOwner() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      petId,
      email,
      role,
    }: {
      petId: string;
      email: string;
      role: CoOwnerRole;
    }) => {
      const normalizedEmail = email.toLowerCase().trim();

      // Check if already invited
      const { data: existing } = await sb
        .from('pet_co_owners')
        .select('id, status')
        .eq('pet_id', petId)
        .eq('invited_email', normalizedEmail)
        .maybeSingle();

      if (existing && existing.status !== 'revoked') {
        throw new Error('already_invited');
      }

      // Check if the email belongs to a registered user
      const { data: targetProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', normalizedEmail)
        .maybeSingle();

      const permissions = ROLE_PERMISSIONS[role];

      if (existing && existing.status === 'revoked') {
        // Re-invite revoked co-owner
        const { error } = await sb
          .from('pet_co_owners')
          .update({
            role,
            permissions,
            status: 'pending',
            accepted_at: null,
            invited_by: user?.id,
            user_id: targetProfile?.id || existing.user_id,
          })
          .eq('id', existing.id);
        if (error) throw error;
        return { reinvited: true };
      }

      // Create new invitation
      const { error } = await sb.from('pet_co_owners').insert({
        pet_id: petId,
        user_id: targetProfile?.id || user?.id, // placeholder if no account yet
        role,
        permissions,
        invited_by: user?.id,
        invited_email: normalizedEmail,
        status: targetProfile ? 'pending' : 'pending',
      });

      if (error) throw error;
      return { created: true, hasAccount: !!targetProfile };
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['co-owners', variables.petId] });
      if (result.reinvited) {
        toast.success('Invitación reenviada');
      } else {
        toast.success('Invitación enviada', {
          description: `Se envió una invitación a ${variables.email}`,
        });
      }
    },
    onError: (error: Error) => {
      if (error.message === 'already_invited') {
        toast.error('Ya fue invitado', {
          description: 'Esta persona ya tiene acceso o una invitación pendiente.',
        });
      } else {
        toast.error('Error al invitar', { description: error.message });
      }
    },
  });
}

/** Accept a co-owner invitation */
export function useAcceptCoOwnerInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ token, userId }: { token: string; userId: string }) => {
      const { data, error } = await sb.rpc('accept_co_owner_invitation', {
        p_token: token,
        p_user_id: userId,
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'unknown_error');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['co-owners'] });
      queryClient.invalidateQueries({ queryKey: ['pets'] });
      toast.success('Invitación aceptada', {
        description: 'Ahora puedes ver la ficha de esta mascota.',
      });
    },
    onError: (error: Error) => {
      const messages: Record<string, string> = {
        invalid_or_expired_token: 'El enlace de invitación no es válido o ya expiró.',
        invitation_for_another_user: 'Esta invitación es para otra persona.',
      };
      toast.error('No se pudo aceptar', {
        description: messages[error.message] || error.message,
      });
    },
  });
}

/** Revoke a co-owner (only owner can do this) */
export function useRevokeCoOwner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ coOwnerId, petId }: { coOwnerId: string; petId: string }) => {
      const { error } = await sb
        .from('pet_co_owners')
        .update({ status: 'revoked' })
        .eq('id', coOwnerId);

      if (error) throw error;
      return { petId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['co-owners', result.petId] });
      toast.success('Acceso revocado');
    },
    onError: () => {
      toast.error('Error al revocar acceso');
    },
  });
}

export interface SharedPet {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  birth_date: string | null;
  photo_url: string | null;
  size: string | null;
  color: string | null;
  personality: string[] | null;
  gender: string | null;
  weight: number | null;
  bio: string | null;
  holo_pattern: string | null;
  paw_card_id: string | null;
  _coOwnerRole: CoOwnerRole;
  _coOwnerPermissions: string[];
}

/** Fetch pets where current user is co-owner (for MyPets page) */
export function useSharedPets() {
  const { user } = useAuth();

  return useQuery<SharedPet[]>({
    queryKey: ['shared-pets', user?.id],
    enabled: !!user?.id,
    staleTime: 30_000,
    queryFn: async (): Promise<SharedPet[]> => {
      // Get co-owner records for this user
      const { data: coOwnerRecords, error: coError } = await sb
        .from('pet_co_owners')
        .select('pet_id, role, permissions')
        .eq('user_id', user?.id)
        .eq('status', 'accepted');

      if (coError) throw coError;
      if (!coOwnerRecords || coOwnerRecords.length === 0) return [];

      const petIds = coOwnerRecords.map((r: { pet_id: string }) => r.pet_id);

      // Fetch pet details
      const { data: pets, error: petError } = await supabase
        .from('pets')
        .select(
          'id, name, species, breed, birth_date, photo_url, size, color, personality, gender, weight, bio, holo_pattern, paw_card_id'
        )
        .in('id', petIds)
        .eq('lifecycle_status', 'active');

      if (petError) throw petError;

      // Merge role info
      const roleMap = new Map<string, { role: CoOwnerRole; permissions: string[] }>();
      for (const r of coOwnerRecords as {
        pet_id: string;
        role: CoOwnerRole;
        permissions: string[];
      }[]) {
        roleMap.set(r.pet_id, { role: r.role, permissions: r.permissions });
      }

      return (pets || []).map(
        (pet): SharedPet => ({
          ...(pet as Omit<SharedPet, '_coOwnerRole' | '_coOwnerPermissions'>),
          _coOwnerRole: roleMap.get(pet.id)?.role || 'family_member',
          _coOwnerPermissions: roleMap.get(pet.id)?.permissions || ['view_record'],
        })
      );
    },
  });
}
