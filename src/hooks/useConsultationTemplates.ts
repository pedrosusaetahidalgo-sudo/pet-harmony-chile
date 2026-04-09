import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export type TemplateCategory =
  | "vacunacion"
  | "control_sano"
  | "post_esterilizacion"
  | "dermatologia"
  | "geriatrico"
  | "urgencia"
  | "otro";

export interface ConsultationTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  template_body: Record<string, unknown>;
  is_system: boolean;
  provider_id: string | null;
  created_at: string;
}

interface CreateTemplateArgs {
  name: string;
  category: TemplateCategory;
  templateBody: Record<string, unknown>;
}

// Tabla nueva, no existe en tipos generados aun.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

/**
 * Plantillas de consulta: las del sistema + las custom del provider actual.
 */
export function useConsultationTemplates(providerId: string | undefined) {
  return useQuery<ConsultationTemplate[]>({
    queryKey: ["consultation-templates", providerId],
    queryFn: async () => {
      // Plantillas del sistema
      const { data: system, error: sysErr } = await sb
        .from("consultation_templates")
        .select("*")
        .eq("is_system", true)
        .order("category")
        .order("name");
      if (sysErr) throw sysErr;

      // Plantillas custom del provider
      let custom: ConsultationTemplate[] = [];
      if (providerId) {
        const { data, error } = await sb
          .from("consultation_templates")
          .select("*")
          .eq("provider_id", providerId)
          .eq("is_system", false)
          .order("category")
          .order("name");
        if (error) throw error;
        custom = (data ?? []) as ConsultationTemplate[];
      }

      return [
        ...((system ?? []) as ConsultationTemplate[]),
        ...custom,
      ];
    },
    enabled: true,
  });
}

/**
 * Crear una plantilla custom para el provider autenticado.
 */
export function useCreateConsultationTemplate() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: CreateTemplateArgs & { providerId: string }) => {
      if (!user) throw new Error("No autenticado");
      const { data, error } = await sb
        .from("consultation_templates")
        .insert({
          name: args.name,
          category: args.category,
          template_body: args.templateBody,
          is_system: false,
          provider_id: args.providerId,
        })
        .select()
        .single();
      if (error) throw error;
      return data as ConsultationTemplate;
    },
    onSuccess: (_data: unknown, args) => {
      queryClient.invalidateQueries({
        queryKey: ["consultation-templates", args.providerId],
      });
      toast.success("Plantilla guardada correctamente");
    },
    onError: () => {
      toast.error("Error al guardar la plantilla");
    },
  });
}

/**
 * Eliminar una plantilla custom del provider.
 */
export function useDeleteConsultationTemplate() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: { id: string; providerId: string }) => {
      if (!user) throw new Error("No autenticado");
      const { error } = await sb
        .from("consultation_templates")
        .delete()
        .eq("id", args.id)
        .eq("provider_id", args.providerId);
      if (error) throw error;
    },
    onSuccess: (_data: unknown, args) => {
      queryClient.invalidateQueries({
        queryKey: ["consultation-templates", args.providerId],
      });
      toast.success("Plantilla eliminada");
    },
    onError: () => {
      toast.error("Error al eliminar la plantilla");
    },
  });
}
