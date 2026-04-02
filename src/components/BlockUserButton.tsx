import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Ban, Loader2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface BlockUserButtonProps {
  targetUserId: string;
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
}

const BlockUserButton = ({ 
  targetUserId, 
  variant = "outline",
  size = "md"
}: BlockUserButtonProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isBlocking, setIsBlocking] = useState(false);

  if (!user || user.id === targetUserId) {
    return null;
  }

  const handleBlock = async () => {
    if (!user) return;

    setIsBlocking(true);
    try {
      const { error } = await supabase
        .from("user_blocks")
        .insert({
          blocker_id: user.id,
          blocked_id: targetUserId,
        });

      if (error) throw error;

      toast({
        title: "Usuario bloqueado",
        description: "Este usuario ha sido bloqueado y no podrá contactarte.",
      });

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["blocked", user.id, targetUserId] });
      queryClient.invalidateQueries({ queryKey: ["follows", user.id, targetUserId] });
    } catch (error: any) {
      console.error("Error blocking user:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo bloquear al usuario",
      });
    } finally {
      setIsBlocking(false);
    }
  };

  const sizeClasses = {
    sm: "h-8 text-xs px-3",
    md: "h-9 text-sm px-4",
    lg: "h-10 text-base px-6",
  };

  return (
    <Button
      variant={variant}
      className={sizeClasses[size]}
      disabled
      title="Próximamente"
    >
      <Ban className="h-4 w-4 mr-2" />
      Bloquear
    </Button>
  );
};

export default BlockUserButton;

