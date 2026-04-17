/**
 * Hook para gestión de leads de veterinarios a domicilio (schema leads).
 * Conecta con leads.vet_profesionales via RPC para acceder al schema dedicado.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ── Tipos ────────────────────────────────────────────────

export type EstadoLead =
  | 'pendiente'
  | 'contactado'
  | 'respondio'
  | 'interesado'
  | 'convertido'
  | 'descartado';

export type PrioridadOutreach = 'alta' | 'media' | 'baja';

export interface VetLead {
  id: string;
  nombre_completo: string;
  registro_cmv: string | null;
  telefono: string | null;
  whatsapp: string | null;
  es_whatsapp_business: boolean | null;
  email: string | null;
  instagram: string | null;
  instagram_seguidores: number | null;
  tiktok: string | null;
  facebook: string | null;
  sitio_web: string | null;
  comunas_cobertura: string[];
  especialidades: string[];
  servicios: string[];
  tarifa_consulta_clp_min: number | null;
  tarifa_consulta_clp_max: number | null;
  tiene_clinica_fisica: boolean;
  presencia_digital_score: number | null;
  fuente_dato: string;
  url_fuente: string | null;
  fecha_captura: string;
  fecha_actualizacion: string | null;
  estado_validacion: EstadoLead;
  notas: string | null;
  prioridad_outreach: PrioridadOutreach;
  hash_dedup: string;
  // CRM fields (de la migración extendida)
  fecha_primer_contacto: string | null;
  fecha_ultimo_contacto: string | null;
  intentos_contacto: number;
  canal_contacto_preferido: string | null;
  notas_seguimiento: string | null;
  asignado_a: string | null;
  template_enviado: string | null;
}

export interface LeadsFilters {
  estado?: EstadoLead | 'todos';
  prioridad?: PrioridadOutreach | 'todas';
  comuna?: string;
  busqueda?: string;
  fuente?: string;
}

export interface LeadsStats {
  total: number;
  por_estado: Record<string, number>;
  por_prioridad: Record<string, number>;
  por_fuente: Record<string, number>;
  con_contacto: number;
  contactados_hoy: number;
}

// ── Queries ──────────────────────────────────────────────

/**
 * RPC para listar leads desde schema leads.
 * Necesita una función SQL que haga bridge al schema leads.
 */
export function useLeadsVets(filters: LeadsFilters = {}) {
  return useQuery({
    queryKey: ['leads-vets', filters],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_leads_vets', {
        p_estado: filters.estado === 'todos' ? null : filters.estado || null,
        p_prioridad: filters.prioridad === 'todas' ? null : filters.prioridad || null,
        p_comuna: filters.comuna || null,
        p_busqueda: filters.busqueda || null,
        p_fuente: filters.fuente || null,
      });
      if (error) throw error;
      return (data || []) as VetLead[];
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}

export function useLeadsStats() {
  return useQuery({
    queryKey: ['leads-vets-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_leads_vets_stats');
      if (error) throw error;
      return data as LeadsStats;
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}

// ── Mutations ────────────────────────────────────────────

export function useUpdateLeadEstado() {
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
      const { error } = await supabase.rpc('update_lead_vet_estado', {
        p_lead_id: leadId,
        p_estado: estado,
        p_notas: notas || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads-vets'] });
      qc.invalidateQueries({ queryKey: ['leads-vets-stats'] });
      toast.success('Estado actualizado');
    },
    onError: (err: Error) => {
      toast.error(`Error: ${err.message}`);
    },
  });
}

export function useRegistrarContacto() {
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
      const { error } = await supabase.rpc('registrar_contacto_lead', {
        p_lead_id: leadId,
        p_canal: canal,
        p_notas: notas || null,
        p_template: templateUsado || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads-vets'] });
      qc.invalidateQueries({ queryKey: ['leads-vets-stats'] });
      toast.success('Contacto registrado');
    },
    onError: (err: Error) => {
      toast.error(`Error: ${err.message}`);
    },
  });
}

export function useEnviarOutreach() {
  return useMutation({
    mutationFn: async ({
      leadIds,
      canal,
      template,
    }: {
      leadIds: string[];
      canal: 'email' | 'whatsapp';
      template: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('send-lead-outreach', {
        body: { lead_ids: leadIds, canal, template },
      });
      if (error) throw error;
      return data as { enviados: number; errores: number };
    },
    onSuccess: (data) => {
      toast.success(`Outreach enviado: ${data.enviados} exitosos, ${data.errores} errores`);
    },
    onError: (err: Error) => {
      toast.error(`Error enviando outreach: ${err.message}`);
    },
  });
}
