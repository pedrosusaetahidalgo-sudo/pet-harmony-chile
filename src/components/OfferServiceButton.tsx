import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RequestRoleVerification } from "./RequestRoleVerification";
import { UserPlus, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database['public']['Enums']['app_role'];

interface OfferServiceButtonProps {
  serviceType: 'dog_walker' | 'dogsitter' | 'veterinarian' | 'trainer';
  serviceName: string;
  className?: string;
}

export const OfferServiceButton = ({ serviceType, serviceName, className = "" }: OfferServiceButtonProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const { data: hasRole } = useQuery({
    queryKey: ['user-has-role', user?.id, serviceType],
    queryFn: async () => {
      if (!user) return false;
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', serviceType as AppRole)
        .maybeSingle();
      
      if (error) return false;
      return !!data;
    },
    enabled: !!user
  });

  if (!user) return null;

  if (hasRole) {
    return (
      <Button 
        variant="outline" 
        className={`gap-2 border-green-500 text-green-600 hover:bg-green-50 ${className}`}
        disabled
      >
        <CheckCircle className="h-4 w-4" />
        Ya ofreces este servicio
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className={`gap-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground ${className}`}
        >
          <UserPlus className="h-4 w-4" />
          Quiero ofrecer {serviceName}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ofrecer Servicios como {serviceName}</DialogTitle>
        </DialogHeader>
        <RequestRoleVerification />
      </DialogContent>
    </Dialog>
  );
};
