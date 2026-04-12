import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface PetStory {
  id: string;
  pet_id: string;
  user_id: string;
  media_url: string;
  media_type: string;
  caption: string | null;
  expires_at: string;
  created_at: string;
  pet_name: string;
  pet_photo: string | null;
  owner_name: string | null;
  owner_avatar: string | null;
}

export interface StoryGroup {
  petId: string;
  petName: string;
  petPhoto: string | null;
  userId: string;
  ownerName: string | null;
  ownerAvatar: string | null;
  stories: PetStory[];
  hasUnseen: boolean;
}

interface StoryRow {
  id: string;
  pet_id: string;
  user_id: string;
  media_url: string;
  media_type: string | null;
  caption: string | null;
  expires_at: string;
  created_at: string;
  pets: { name: string; photo_url: string | null; owner_id: string } | null;
  profiles: { display_name: string | null; avatar_url: string | null } | null;
}

export function useActiveStories() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['pet-stories-active'],
    queryFn: async (): Promise<StoryGroup[]> => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const storiesTable = (supabase as any).from('pet_stories');
        const { data, error } = await storiesTable
          .select(
            `
            id,
            pet_id,
            user_id,
            media_url,
            media_type,
            caption,
            expires_at,
            created_at,
            pets!pet_stories_pet_id_fkey (
              name,
              photo_url,
              owner_id
            ),
            profiles!pet_stories_user_id_fkey (
              display_name,
              avatar_url
            )
          `
          )
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false });

        if (error) {
          if (error.code === '42P01') return [];
          throw error;
        }

        // Group by pet
        const groups = new Map<string, StoryGroup>();
        const rows = (data || []) as unknown as StoryRow[];
        for (const s of rows) {
          const petId = s.pet_id;
          if (!groups.has(petId)) {
            groups.set(petId, {
              petId,
              petName: s.pets?.name || 'Mascota',
              petPhoto: s.pets?.photo_url || null,
              userId: s.user_id,
              ownerName: s.profiles?.display_name || null,
              ownerAvatar: s.profiles?.avatar_url || null,
              stories: [],
              hasUnseen: true,
            });
          }
          groups.get(petId)!.stories.push({
            id: s.id,
            pet_id: s.pet_id,
            user_id: s.user_id,
            media_url: s.media_url,
            media_type: s.media_type || 'image',
            caption: s.caption,
            expires_at: s.expires_at,
            created_at: s.created_at,
            pet_name: s.pets?.name || 'Mascota',
            pet_photo: s.pets?.photo_url || null,
            owner_name: s.profiles?.display_name || null,
            owner_avatar: s.profiles?.avatar_url || null,
          });
        }

        // Put own stories first
        const result = Array.from(groups.values());
        if (user) {
          result.sort((a, b) => {
            if (a.userId === user.id) return -1;
            if (b.userId === user.id) return 1;
            return 0;
          });
        }

        return result;
      } catch {
        // Table doesn't exist yet
        return [];
      }
    },
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });
}

export function useCreateStory() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      petId,
      file,
      caption,
    }: {
      petId: string;
      file: File;
      caption?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      // Upload to storage
      const ext = file.name.split('.').pop();
      const path = `stories/${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('pet-photos').upload(path, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('pet-photos').getPublicUrl(path);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const storiesInsert = (supabase as any).from('pet_stories');
      const { error } = await storiesInsert.insert({
        pet_id: petId,
        user_id: user.id,
        media_url: urlData.publicUrl,
        media_type: file.type.startsWith('video/') ? 'video' : 'image',
        caption: caption || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pet-stories-active'] });
    },
  });
}
