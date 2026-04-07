import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export function useBlockedUsers() {
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: ["blocked-users", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from("user_blocks")
        .select("blocked_id")
        .eq("blocker_id", user.id);
      return data?.map((b) => b.blocked_id) || [];
    },
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000, // 10 min cache
  });

  const blockedIds = new Set(data || []);

  return {
    blockedIds,
    isBlocked: (userId: string) => blockedIds.has(userId),
    filterBlocked: <T extends { user_id?: string; owner_id?: string; id?: string }>(
      items: T[],
      userIdField: keyof T = "user_id" as keyof T
    ) => items.filter((item) => !blockedIds.has(String(item[userIdField] || ""))),
  };
}
