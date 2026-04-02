import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export const useStartConversation = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const startConversation = async (otherUserId: string) => {
    if (!user || user.id === otherUserId) return;

    setLoading(true);
    try {
      // Check for mutual follow requirement
      const { data: mutualFollow, error: followError } = await supabase
        .rpc("is_mutual_follow", {
          user1_id: user.id,
          user2_id: otherUserId,
        });

      if (followError) {
        console.error("Error checking mutual follow:", followError);
      }

      if (!mutualFollow) {
        toast({
          variant: "destructive",
          title: "Seguimiento mutuo requerido",
          description: "Debes seguir a este usuario y que él te siga para poder enviar mensajes. Sigue al usuario primero.",
        });
        setLoading(false);
        return;
      }

      // Check if user is blocked
      const { data: isBlocked, error: blockError } = await supabase
        .rpc("is_user_blocked", {
          blocker_id: user.id,
          blocked_id: otherUserId,
        });

      if (blockError) {
        console.error("Error checking block status:", blockError);
      }

      if (isBlocked) {
        toast({
          variant: "destructive",
          title: "No se puede enviar mensaje",
          description: "No puedes enviar mensajes a este usuario.",
        });
        setLoading(false);
        return;
      }

      // Order participant IDs to maintain constraint
      const [participant1, participant2] = [user.id, otherUserId].sort();

      // Check if conversation already exists
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('participant1_id', participant1)
        .eq('participant2_id', participant2)
        .maybeSingle();

      if (existingConv) {
        navigate(`/chat/${existingConv.id}`);
        return;
      }

      // Create new conversation
      const { data: newConv, error } = await supabase
        .from('conversations')
        .insert({
          participant1_id: participant1,
          participant2_id: participant2
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!newConv) throw new Error("No se pudo crear la conversación");

      navigate(`/chat/${newConv.id}`);
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo iniciar la conversación"
      });
    } finally {
      setLoading(false);
    }
  };

  return { startConversation, loading };
};
