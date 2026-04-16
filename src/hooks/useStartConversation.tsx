import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { track, EVENTS } from '@/lib/analytics';

export const useStartConversation = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const startConversation = async (otherUserId: string) => {
    if (!user || user.id === otherUserId) return;

    setLoading(true);
    try {
      // Check if user is blocked
      const { data: isBlocked, error: blockError } = await supabase.rpc('is_user_blocked', {
        blocker_id: user.id,
        blocked_id: otherUserId,
      });

      if (blockError) {
        logger.error('Error checking block status:', blockError);
      }

      if (isBlocked) {
        toast.error('No se puede enviar mensaje', {
          description: 'No puedes enviar mensajes a este usuario.',
        });
        setLoading(false);
        return;
      }

      // Order participant IDs to maintain constraint
      const [participant1, participant2] = [user.id, otherUserId].sort();

      // Atomic upsert: returns the existing row if the conversation already exists,
      // or inserts a new one — eliminating the TOCTOU window between check and insert.
      const { data: conv, error } = await supabase
        .from('conversations')
        .upsert(
          { participant1_id: participant1, participant2_id: participant2 },
          { onConflict: 'participant1_id,participant2_id' }
        )
        .select('id')
        .maybeSingle();

      if (error) throw error;
      if (!conv) throw new Error('No se pudo crear la conversación');

      track({ event: EVENTS.CONVERSATION_STARTED, properties: { other_user_id: otherUserId } });
      navigate(`/chat/${conv.id}`);
    } catch (error) {
      logger.error('Error starting conversation:', error);
      toast.error('Algo salió mal', { description: 'No se pudo iniciar la conversación' });
    } finally {
      setLoading(false);
    }
  };

  return { startConversation, loading };
};
