import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface CommunityGroup {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  group_type: string | null;
  is_public: boolean;
  member_count: number;
  created_at: string;
}

export interface GroupMessage {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: { display_name: string; avatar_url: string | null } | null;
}

export function useCommunityGroups() {
  return useQuery<CommunityGroup[]>({
    queryKey: ["community-groups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_groups")
        .select("*")
        .eq("is_public", true)
        .order("member_count", { ascending: false });
      if (error) throw error;
      return (data || []) as CommunityGroup[];
    },
  });
}

export function useMyGroupMemberships() {
  const { user } = useAuth();
  return useQuery<string[]>({
    queryKey: ["my-group-memberships", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_group_members")
        .select("group_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data || []).map((m: any) => m.group_id);
    },
  });
}

export function useJoinGroup() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (groupId: string) => {
      if (!user) throw new Error("No autenticado");
      const { error } = await supabase
        .from("community_group_members")
        .insert({ group_id: groupId, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-group-memberships"] });
      qc.invalidateQueries({ queryKey: ["community-groups"] });
      toast.success("Te uniste al grupo");
    },
    onError: () => toast.error("No se pudo unir al grupo"),
  });
}

export function useLeaveGroup() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (groupId: string) => {
      if (!user) throw new Error("No autenticado");
      const { error } = await supabase
        .from("community_group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-group-memberships"] });
      qc.invalidateQueries({ queryKey: ["community-groups"] });
      toast.success("Saliste del grupo");
    },
  });
}

export function useGroupMessages(groupId: string | undefined) {
  return useQuery<GroupMessage[]>({
    queryKey: ["group-messages", groupId],
    enabled: !!groupId,
    refetchInterval: 10000, // Poll each 10s
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_group_messages")
        .select("*, profiles:user_id(display_name, avatar_url)")
        .eq("group_id", groupId!)
        .order("created_at", { ascending: true })
        .limit(100);
      if (error) throw error;
      return (data || []) as GroupMessage[];
    },
  });
}

export function useSendGroupMessage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, content }: { groupId: string; content: string }) => {
      if (!user) throw new Error("No autenticado");
      const { error } = await supabase
        .from("community_group_messages")
        .insert({ group_id: groupId, user_id: user.id, content: content.trim() });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["group-messages", vars.groupId] });
    },
    onError: () => toast.error("No se pudo enviar el mensaje"),
  });
}
