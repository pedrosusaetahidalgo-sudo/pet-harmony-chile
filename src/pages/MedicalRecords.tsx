/**
 * Legacy /medical-records → redirect a /mascota/:petId/ficha-clinica
 *
 * Esta página fue unificada con PetClinicalRecord (la ficha clínica completa).
 * Ahora redirige a la ficha de la primera mascota activa del usuario,
 * o a /my-pets si no tiene mascotas.
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LINKS } from '@/lib/links';

const MedicalRecords = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: pets, isLoading } = useQuery({
    queryKey: ['user-pets', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('pets')
        .select('id')
        .eq('owner_id', user.id)
        .eq('lifecycle_status', 'active')
        .order('created_at', { ascending: true })
        .limit(1);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (isLoading) return;
    if (pets && pets.length > 0) {
      navigate(LINKS.petClinical(pets[0].id), { replace: true });
    } else {
      navigate(LINKS.myPets(), { replace: true });
    }
  }, [pets, isLoading, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
    </div>
  );
};

export default MedicalRecords;
