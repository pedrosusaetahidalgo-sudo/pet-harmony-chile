/**
 * Context + localStorage para persistir el rol activo (dueño vs profesional).
 */
import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

type ActiveRole = "owner" | "provider";

interface ActiveRoleCtx {
  role: ActiveRole;
  isProvider: boolean;
  isProviderLoading: boolean;
  toggle: () => void;
  setRole: (r: ActiveRole) => void;
}

const Ctx = createContext<ActiveRoleCtx>({
  role: "owner",
  isProvider: false,
  isProviderLoading: true,
  toggle: () => {},
  setRole: () => {},
});

export function ActiveRoleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  // Check if user is a provider
  const { data: isProvider, isLoading: isProviderLoading } = useQuery({
    queryKey: ["is-provider-role", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data } = await supabase
        .from("service_providers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user?.id,
  });

  const [role, setRoleState] = useState<ActiveRole>(() => {
    try {
      return (localStorage.getItem("pf_active_role") as ActiveRole) || "owner";
    } catch {
      return "owner";
    }
  });

  // If not a provider, force owner mode
  useEffect(() => {
    if (isProvider === false && role === "provider") {
      setRoleState("owner");
    }
  }, [isProvider, role]);

  const setRole = (r: ActiveRole) => {
    setRoleState(r);
    try { localStorage.setItem("pf_active_role", r); } catch {}
  };

  const toggle = () => setRole(role === "owner" ? "provider" : "owner");

  return (
    <Ctx.Provider value={{ role, isProvider: !!isProvider, isProviderLoading: !!user?.id && isProviderLoading, toggle, setRole }}>
      {children}
    </Ctx.Provider>
  );
}

export function useActiveRole() {
  return useContext(Ctx);
}
