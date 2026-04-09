import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export type VetNoteType =
  | "consulta"
  | "vacuna"
  | "control"
  | "cirugia"
  | "urgencia"
  | "otro";

export interface VetClinicalNote {
  id: string;
  share_token_id: string;
  provider_id: string;
  pet_id: string;
  note_type: VetNoteType;
  title: string;
  description: string | null;
  created_at: string;
  provider_name?: string;
}

interface CreateNoteArgs {
  shareTokenId: string;
  providerId: string;
  petId: string;
  noteType: VetNoteType;
  title: string;
  description?: string;
}

// La tabla vet_clinical_notes no existe aun en los tipos generados de Supabase.
// Usamos un cast para acceder a ella directamente hasta que se regeneren los tipos.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

/**
 * Notas clinicas de veterinarios para una mascota (vista del dueno).
 */
export function useVetClinicalNotesByPet(petId: string | undefined) {
  return useQuery<VetClinicalNote[]>({
    queryKey: ["vet-clinical-notes-pet", petId],
    queryFn: async () => {
      if (!petId) return [];
      const { data, error } = await sb
        .from("vet_clinical_notes")
        .select("*, service_providers(display_name)")
        .eq("pet_id", petId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return ((data ?? []) as any[]).map((row) => {
        const sp = row.service_providers as { display_name: string } | null;
        return {
          ...row,
          provider_name: sp?.display_name ?? "Veterinario",
        } as VetClinicalNote;
      });
    },
    enabled: !!petId,
  });
}

/**
 * Notas clinicas escritas por un provider (vista del vet en su dashboard).
 */
export function useVetClinicalNotesByProvider(providerId: string | undefined) {
  return useQuery<VetClinicalNote[]>({
    queryKey: ["vet-clinical-notes-provider", providerId],
    queryFn: async () => {
      if (!providerId) return [];
      const { data, error } = await sb
        .from("vet_clinical_notes")
        .select("*")
        .eq("provider_id", providerId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as VetClinicalNote[];
    },
    enabled: !!providerId,
  });
}

/**
 * Mutation para crear una nota clinica como vet.
 */
export function useCreateVetClinicalNote() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: CreateNoteArgs) => {
      if (!user) throw new Error("No autenticado");
      const { data, error } = await sb
        .from("vet_clinical_notes")
        .insert({
          share_token_id: args.shareTokenId,
          provider_id: args.providerId,
          pet_id: args.petId,
          note_type: args.noteType,
          title: args.title,
          description: args.description || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data: unknown, args: CreateNoteArgs) => {
      queryClient.invalidateQueries({
        queryKey: ["vet-clinical-notes-pet", args.petId],
      });
      queryClient.invalidateQueries({
        queryKey: ["vet-clinical-notes-provider", args.providerId],
      });
    },
    onError: () => {
      toast.error("Error al guardar la nota clinica");
    },
  });
}
