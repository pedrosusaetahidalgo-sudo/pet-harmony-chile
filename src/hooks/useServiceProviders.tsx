/**
 * Hook centralizado para gestión de proveedores de servicios
 * 
 * Este hook proporciona acceso a la tabla unificada `service_providers`
 * y `provider_service_offerings` que centraliza todos los tipos de proveedores.
 * 
 * AUTO-APROBACIÓN: Actualmente configurado para aprobar automáticamente nuevos proveedores.
 * Para cambiar a aprobación manual, modificar:
 * 1. En la base de datos: ALTER TABLE service_providers ALTER COLUMN status SET DEFAULT 'pending';
 * 2. En la función get_or_create_service_provider: cambiar 'approved' por 'pending'
 */

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export type ServiceType = 'dog_walker' | 'dogsitter' | 'veterinarian' | 'trainer' | 'grooming';
export type ProviderStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface ServiceOffering {
  id: string;
  service_type: ServiceType;
  price_base: number;
  price_unit: string;
  description?: string;
  max_pets: number;
  specialties: any[];
  is_active: boolean;
}

export interface ServiceProvider {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  city: string | null;
  commune: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  coverage_radius_km: number;
  coverage_zones: any[];
  experience_years: number;
  certifications: any[];
  photos: string[];
  status: ProviderStatus;
  is_verified: boolean;
  verification_documents: string[];
  verified_at: string | null;
  verified_by: string | null;
  rejection_reason: string | null;
  rating: number;
  total_reviews: number;
  total_services_completed: number;
  available_hours: any;
  accepts_emergency: boolean;
  created_at: string;
  updated_at: string;
  services?: ServiceOffering[];
}

interface AddServiceParams {
  service_type: ServiceType;
  price_base: number;
  price_unit?: string;
  description?: string;
  max_pets?: number;
  specialties?: any[];
}

interface UpdateProviderParams {
  display_name?: string;
  bio?: string;
  city?: string;
  commune?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  coverage_radius_km?: number;
  experience_years?: number;
  available_hours?: any;
  accepts_emergency?: boolean;
}

// Mapeo de tipos de servicio a nombres legibles
export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  dog_walker: 'Paseador de Perros',
  dogsitter: 'Cuidador de Mascotas',
  veterinarian: 'Veterinario a Domicilio',
  trainer: 'Entrenador Canino',
  grooming: 'Grooming / Peluquería',
};

export const SERVICE_TYPE_ICONS: Record<ServiceType, string> = {
  dog_walker: '🐕',
  dogsitter: '🏠',
  veterinarian: '🩺',
  trainer: '🎓',
  grooming: '✂️',
};

/**
 * Hook principal para gestión de proveedores
 */
export const useServiceProviders = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Obtener todos los proveedores aprobados
  const { data: providers, isLoading, error, refetch } = useQuery({
    queryKey: ['service-providers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_providers')
        .select(`
          *,
          provider_service_offerings(*)
        `)
        .eq('status', 'approved')
        .order('rating', { ascending: false });

      if (error) throw error;
      
      return data.map(provider => ({
        ...provider,
        services: provider.provider_service_offerings || []
      })) as ServiceProvider[];
    },
  });

  // Obtener proveedores por tipo de servicio
  const getProvidersByServiceType = useCallback((serviceType: ServiceType) => {
    return providers?.filter(p => 
      p.services?.some((s: ServiceOffering) => s.service_type === serviceType && s.is_active)
    ) || [];
  }, [providers]);

  // Obtener un proveedor específico
  const getProvider = useCallback((providerId: string) => {
    return providers?.find(p => p.id === providerId);
  }, [providers]);

  return {
    providers,
    isLoading,
    error,
    refetch,
    getProvidersByServiceType,
    getProvider,
  };
};

/**
 * Hook para gestionar el perfil de proveedor del usuario actual
 */
export const useMyProviderProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Obtener perfil del proveedor actual
  const { data: myProfile, isLoading, error, refetch } = useQuery({
    queryKey: ['my-provider-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('service_providers')
        .select(`
          *,
          provider_service_offerings(*)
        `)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) return null;
      
      return {
        ...data,
        services: data.provider_service_offerings || []
      } as ServiceProvider;
    },
    enabled: !!user,
  });

  // Crear o actualizar perfil de proveedor
  const createOrUpdateProfile = useMutation({
    mutationFn: async (params: UpdateProviderParams) => {
      if (!user) throw new Error('Usuario no autenticado');

      // Verificar si ya existe
      const { data: existing } = await supabase
        .from('service_providers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        // Actualizar
        const { data, error } = await supabase
          .from('service_providers')
          .update(params)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Crear nuevo (auto-aprobado)
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, avatar_url, bio')
          .eq('id', user.id)
          .single();

        const { data, error } = await supabase
          .from('service_providers')
          .insert({
            user_id: user.id,
            display_name: params.display_name || profile?.display_name,
            avatar_url: profile?.avatar_url,
            bio: params.bio || profile?.bio,
            status: 'approved', // AUTO-APROBACIÓN: Cambiar a 'pending' para aprobación manual
            ...params,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-provider-profile'] });
      queryClient.invalidateQueries({ queryKey: ['service-providers'] });
      toast.success('Perfil de proveedor actualizado');
    },
    onError: (error) => {
      toast.error('Error al actualizar perfil');
      console.error(error);
    },
  });

  // Agregar un servicio
  const addService = useMutation({
    mutationFn: async (params: AddServiceParams) => {
      if (!user) throw new Error('Usuario no autenticado');

      // Primero asegurar que existe el perfil de proveedor
      let providerId = myProfile?.id;

      if (!providerId) {
        // Crear perfil de proveedor
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, avatar_url, bio')
          .eq('id', user.id)
          .single();

        const { data: newProvider, error: providerError } = await supabase
          .from('service_providers')
          .insert({
            user_id: user.id,
            display_name: profile?.display_name,
            avatar_url: profile?.avatar_url,
            bio: profile?.bio,
            status: 'approved', // AUTO-APROBACIÓN
          })
          .select()
          .single();

        if (providerError) throw providerError;
        providerId = newProvider.id;
      }

      // Insertar o actualizar el servicio
      const { data, error } = await supabase
        .from('provider_service_offerings')
        .upsert({
          provider_id: providerId,
          service_type: params.service_type,
          price_base: params.price_base,
          price_unit: params.price_unit || 'hour',
          description: params.description,
          max_pets: params.max_pets || 3,
          specialties: params.specialties || [],
          is_active: true,
        }, {
          onConflict: 'provider_id,service_type',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-provider-profile'] });
      queryClient.invalidateQueries({ queryKey: ['service-providers'] });
      toast.success('Servicio agregado correctamente');
    },
    onError: (error) => {
      toast.error('Error al agregar servicio');
      console.error(error);
    },
  });

  // Desactivar un servicio
  const toggleService = useMutation({
    mutationFn: async ({ serviceId, isActive }: { serviceId: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from('provider_service_offerings')
        .update({ is_active: isActive })
        .eq('id', serviceId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-provider-profile'] });
      queryClient.invalidateQueries({ queryKey: ['service-providers'] });
      toast.success('Servicio actualizado');
    },
    onError: (error) => {
      toast.error('Error al actualizar servicio');
      console.error(error);
    },
  });

  return {
    myProfile,
    isLoading,
    error,
    refetch,
    createOrUpdateProfile,
    addService,
    toggleService,
    isProvider: !!myProfile,
    isApproved: myProfile?.status === 'approved',
  };
};

/**
 * Hook para administradores - gestión de todos los proveedores
 */
export const useAdminServiceProviders = () => {
  const queryClient = useQueryClient();

  // Obtener TODOS los proveedores (incluyendo pendientes y rechazados)
  const { data: allProviders, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-service-providers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_providers')
        .select(`
          *,
          provider_service_offerings(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return data.map(provider => ({
        ...provider,
        services: provider.provider_service_offerings || []
      })) as ServiceProvider[];
    },
  });

  // Cambiar estado de un proveedor
  const updateProviderStatus = useMutation({
    mutationFn: async ({ providerId, status, rejectionReason }: { 
      providerId: string; 
      status: ProviderStatus;
      rejectionReason?: string;
    }) => {
      const updateData: any = { status };
      if (rejectionReason) {
        updateData.rejection_reason = rejectionReason;
      }

      const { data, error } = await supabase
        .from('service_providers')
        .update(updateData)
        .eq('id', providerId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-service-providers'] });
      queryClient.invalidateQueries({ queryKey: ['service-providers'] });
      toast.success('Estado del proveedor actualizado');
    },
    onError: (error) => {
      toast.error('Error al actualizar estado');
      console.error(error);
    },
  });

  // Verificar un proveedor
  const verifyProvider = useMutation({
    mutationFn: async ({ providerId, verified }: { providerId: string; verified: boolean }) => {
      const { data, error } = await supabase
        .from('service_providers')
        .update({ 
          is_verified: verified,
          verified_at: verified ? new Date().toISOString() : null,
        })
        .eq('id', providerId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-service-providers'] });
      queryClient.invalidateQueries({ queryKey: ['service-providers'] });
      toast.success('Verificación actualizada');
    },
    onError: (error) => {
      toast.error('Error al actualizar verificación');
      console.error(error);
    },
  });

  // Estadísticas
  const stats = {
    total: allProviders?.length || 0,
    approved: allProviders?.filter(p => p.status === 'approved').length || 0,
    pending: allProviders?.filter(p => p.status === 'pending').length || 0,
    rejected: allProviders?.filter(p => p.status === 'rejected').length || 0,
    verified: allProviders?.filter(p => p.is_verified).length || 0,
  };

  return {
    allProviders,
    isLoading,
    error,
    refetch,
    updateProviderStatus,
    verifyProvider,
    stats,
  };
};
