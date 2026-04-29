/**
 * Hook para gestión de leads de clínicas veterinarias (schema leads).
 *
 * @deprecated 2026-04-29 — Sin imports activos en codebase.
 * Candidato a eliminación post-launch (ver docs/audit/cleanup-fase1.md).
 * Si lo necesitás, verificá primero con git blame qué feature lo usaba y
 * si la lógica es duplicada con otro hook activo (ej: useLeadsVets).
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { EstadoLead, PrioridadOutreach } from './useLeadsVets';

export interface VetClinicaLead {
  id: string;
  nombre_clinica: string;
  razon_social: string | null;
  direccion: string | null;
  comuna: string | null;
  latitud: number | null;
  longitud: number | null;
  telefono_principal: string | null;
  whatsapp: string | null;
  email: string | null;
  sitio_web: string | null;
  instagram: string | null;
  instagram_seguidores: number | null;
  facebook: string | null;
  tiktok: string | null;
  horario_atencion: Record<string, string>;
  atiende_24h: boolean;
  atiende_urgencias: boolean;
  tiene_hospitalizacion: boolean;
  tiene_laboratorio: boolean;
  tiene_peluqueria: boolean;
  ofrece_domicilio: boolean;
  especies_atendidas: string[];
  cantidad_veterinarios: number | null;
  rango_precio_consulta_clp: string;
  cadena: string | null;
  es_cadena: boolean;
  google_rating: number | null;
  google_reviews_count: number | null;
  presencia_digital_score: number | null;
  tamano_estimado: string;
  prioridad_outreach: PrioridadOutreach;
  estado_validacion: EstadoLead;
  fuente_dato: string;
  notas: string | null;
  fecha_captura: string;
  intentos_contacto: number;
  fecha_ultimo_contacto: string | null;
  notas_seguimiento: string | null;
  hash_dedup: string;
}

export interface ClinicasFilters {
  estado?: EstadoLead | 'todos';
  prioridad?: PrioridadOutreach | 'todas';
  comuna?: string;
  busqueda?: string;
  tamano?: string;
  es_cadena?: boolean | null;
}

export function useLeadsClinicas(filters: ClinicasFilters = {}) {
  return useQuery({
    queryKey: ['leads-clinicas', filters],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_leads_clinicas', {
        p_estado: filters.estado === 'todos' ? null : filters.estado || null,
        p_prioridad: filters.prioridad === 'todas' ? null : filters.prioridad || null,
        p_comuna: filters.comuna || null,
        p_busqueda: filters.busqueda || null,
        p_tamano: filters.tamano || null,
        p_es_cadena: filters.es_cadena ?? null,
      });
      if (error) throw error;
      return (data || []) as VetClinicaLead[];
    },
    staleTime: 30_000,
  });
}

export function useLeadsClinicasStats() {
  return useQuery({
    queryKey: ['leads-clinicas-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_leads_clinicas_stats');
      if (error) throw error;
      return data as {
        total: number;
        por_estado: Record<string, number>;
        por_prioridad: Record<string, number>;
        por_comuna: Record<string, number>;
        por_tamano: Record<string, number>;
        cadenas: number;
        independientes: number;
        con_whatsapp: number;
      };
    },
    staleTime: 60_000,
  });
}

export function useUpdateClinicaEstado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      leadId,
      estado,
      notas,
    }: {
      leadId: string;
      estado: EstadoLead;
      notas?: string;
    }) => {
      const { error } = await supabase.rpc('update_lead_clinica_estado', {
        p_lead_id: leadId,
        p_estado: estado,
        p_notas: notas || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads-clinicas'] });
      qc.invalidateQueries({ queryKey: ['leads-clinicas-stats'] });
      toast.success('Estado actualizado');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useRegistrarContactoClinica() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      leadId,
      canal,
      notas,
      templateUsado,
    }: {
      leadId: string;
      canal: 'email' | 'whatsapp' | 'telefono' | 'instagram';
      notas?: string;
      templateUsado?: string;
    }) => {
      const { error } = await supabase.rpc('registrar_contacto_clinica', {
        p_lead_id: leadId,
        p_canal: canal,
        p_notas: notas || null,
        p_template: templateUsado || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads-clinicas'] });
      toast.success('Contacto registrado');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
