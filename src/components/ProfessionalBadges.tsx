import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Stethoscope, Home, GraduationCap, Dog, Heart } from "lucide-react";

interface ProfessionalBadgesProps {
  userId: string;
}

export const ProfessionalBadges = ({ userId }: ProfessionalBadgesProps) => {
  const { data: roles } = useQuery({
    queryKey: ['user-roles', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      if (error) throw error;
      return data;
    }
  });

  if (!roles || roles.length === 0) return null;

  const getRoleConfig = (role: string) => {
    switch (role) {
      case 'dog_walker':
        return {
          label: 'Paseador',
          icon: Dog,
          className: 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300'
        };
      case 'dogsitter':
        return {
          label: 'Cuidador',
          icon: Heart,
          className: 'bg-pink-100 text-pink-800 hover:bg-pink-200 dark:bg-pink-900/30 dark:text-pink-300'
        };
      case 'veterinarian':
        return {
          label: 'Veterinario',
          icon: Stethoscope,
          className: 'bg-teal-100 text-teal-800 hover:bg-teal-200 dark:bg-teal-900/30 dark:text-teal-300'
        };
      case 'trainer':
        return {
          label: 'Entrenador',
          icon: GraduationCap,
          className: 'bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-300'
        };
      case 'admin':
        return {
          label: 'Admin',
          icon: Briefcase,
          className: 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300'
        };
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {roles.map((roleData) => {
        const config = getRoleConfig(roleData.role);
        if (!config) return null;

        const Icon = config.icon;
        
        return (
          <Badge
            key={roleData.role}
            variant="secondary"
            className={`${config.className} flex items-center gap-1 px-3 py-1`}
          >
            <Icon className="h-3 w-3" />
            {config.label}
          </Badge>
        );
      })}
    </div>
  );
};