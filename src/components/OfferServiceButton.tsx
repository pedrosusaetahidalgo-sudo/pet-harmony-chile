import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { RequestRoleVerification } from './RequestRoleVerification';
import { UserPlus, CheckCircle } from '@/lib/icons';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
interface OfferServiceButtonProps {
  serviceType: 'dog_walker' | 'dogsitter' | 'veterinarian' | 'trainer' | 'grooming';
  serviceName: string;
  className?: string;
}

export const OfferServiceButton = ({
  serviceType,
  serviceName,
  className = '',
}: OfferServiceButtonProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const { data: hasRole } = useQuery({
    queryKey: ['user-has-service', user?.id, serviceType],
    queryFn: async () => {
      if (!user) return false;

      // Check if user already has a service_providers record for this service type
      const { data, error } = await supabase
        .from('service_providers')
        .select('id')
        .eq('user_id', user.id)
        .eq('primary_service_type', serviceType)
        .maybeSingle();

      if (error) return false;
      return !!data;
    },
    enabled: !!user,
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
          Ofrecer mis servicios como {serviceName}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ofrecer Servicios como {serviceName}</DialogTitle>
        </DialogHeader>
        <RequestRoleVerification defaultRole={serviceType} />
      </DialogContent>
    </Dialog>
  );
};
