import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { logger } from "@/lib/logger";
import { describeSupabaseError } from "@/lib/supabaseErrors";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  PawPrint,
  Activity,
  Stethoscope,
  Syringe,
  Pill,
  Scissors,
  TrendingUp,
  Trophy,
  Sparkles,
  ThumbsUp,
} from "@/lib/icons";
import type { LucideIcon } from "lucide-react";
import { formatDistanceToNowStrict, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export interface ActivityFeedProps {
  limit?: number;
  petId?: string;
}

type PetActivityRow = {
  id: string;
  pet_id: string;
  owner_id: string;
  activity_type: string;
  title: string;
  metadata: Record<string, unknown>;
  cheers_count: number;
  created_at: string;
  pets: { name: string; photo_url: string | null } | null;
};

const ACTIVITY_ICONS: Record<string, LucideIcon> = {
  walk: TrendingUp,
  vet_visit: Stethoscope,
  vaccine: Syringe,
  medication: Pill,
  grooming: Scissors,
  weight_check: Activity,
  achievement: Trophy,
  streak_milestone: Sparkles,
};

export function ActivityFeed({ limit = 20, petId }: ActivityFeedProps) {
  const { user } = useAuth();
  const [items, setItems] = useState<PetActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myCheers, setMyCheers] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // pet_activities is not yet in types.ts until migration is applied.
      const client = supabase as unknown as {
        from: (table: string) => {
          select: (cols: string) => {
            order: (
              col: string,
              opts: { ascending: boolean }
            ) => {
              limit: (n: number) => Promise<{ data: unknown; error: unknown }>;
              eq: (
                col: string,
                val: string
              ) => {
                limit: (n: number) => Promise<{ data: unknown; error: unknown }>;
              };
            };
          };
        };
      };

      const base = client
        .from("pet_activities")
        .select("*, pets(name, photo_url)")
        .order("created_at", { ascending: false });
      const { data, error: err } = petId
        ? await base.eq("pet_id", petId).limit(limit)
        : await base.limit(limit);

      if (err) {
        setError(describeSupabaseError(err as Parameters<typeof describeSupabaseError>[0]));
        setItems([]);
        return;
      }
      if (data) {
        // Dedupe defensivo: el seed inserta a veces actividades repetidas con
        // el mismo (pet_id + activity_type + title) en ventanas cortas. Las
        // colapsamos para no mostrar 3 cards idénticas seguidas.
        const rows = data as unknown as PetActivityRow[];
        const seen = new Set<string>();
        const deduped: PetActivityRow[] = [];
        for (const r of rows) {
          const bucket = new Date(r.created_at);
          bucket.setMinutes(0, 0, 0);
          const key = `${r.pet_id}|${r.activity_type}|${r.title}|${bucket.toISOString()}`;
          if (seen.has(key)) continue;
          seen.add(key);
          deduped.push(r);
        }
        setItems(deduped);
      }

      // Load current user's cheers for these activities
      if (user?.id && data) {
        const ids = (data as unknown as PetActivityRow[]).map((a) => a.id);
        if (ids.length > 0) {
          const cheerClient = supabase as unknown as {
            from: (table: string) => {
              select: (cols: string) => {
                eq: (
                  col: string,
                  val: string
                ) => {
                  in: (col: string, vals: string[]) => Promise<{ data: unknown; error: unknown }>;
                };
              };
            };
          };
          const { data: cheersData } = await cheerClient
            .from("pet_activity_cheers")
            .select("activity_id")
            .eq("user_id", user.id)
            .in("activity_id", ids);
          if (cheersData) {
            setMyCheers(
              new Set((cheersData as unknown as { activity_id: string }[]).map((c) => c.activity_id))
            );
          }
        }
      }
    } catch (e) {
      logger.error("[ActivityFeed] load failed", e);
      setError("No se pudo cargar el feed.");
    } finally {
      setLoading(false);
    }
  }, [limit, petId, user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleCheer = async (activityId: string) => {
    if (!user?.id) return;
    const hasCheered = myCheers.has(activityId);

    // Optimistic update
    setMyCheers((prev) => {
      const next = new Set(prev);
      if (hasCheered) next.delete(activityId);
      else next.add(activityId);
      return next;
    });
    setItems((prev) =>
      prev.map((it) =>
        it.id === activityId
          ? { ...it, cheers_count: Math.max(0, it.cheers_count + (hasCheered ? -1 : 1)) }
          : it
      )
    );

    try {
      const client = supabase as unknown as {
        from: (table: string) => {
          insert: (row: Record<string, unknown>) => Promise<{ error: unknown }>;
          delete: () => {
            eq: (
              col: string,
              val: string
            ) => {
              eq: (col: string, val: string) => Promise<{ error: unknown }>;
            };
          };
        };
      };
      if (hasCheered) {
        const { error: delErr } = await client
          .from("pet_activity_cheers")
          .delete()
          .eq("activity_id", activityId)
          .eq("user_id", user.id);
        if (delErr) throw delErr;
      } else {
        const { error: insErr } = await client
          .from("pet_activity_cheers")
          .insert({ activity_id: activityId, user_id: user.id });
        if (insErr) throw insErr;
      }
    } catch (e) {
      logger.error("[ActivityFeed] toggleCheer failed", e);
      // Rollback optimistic
      setMyCheers((prev) => {
        const next = new Set(prev);
        if (hasCheered) next.add(activityId);
        else next.delete(activityId);
        return next;
      });
      setItems((prev) =>
        prev.map((it) =>
          it.id === activityId
            ? { ...it, cheers_count: Math.max(0, it.cheers_count + (hasCheered ? 1 : -1)) }
            : it
        )
      );
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="h-14 rounded-lg bg-muted/40 animate-pulse" />
        <div className="h-14 rounded-lg bg-muted/40 animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">{error}</p>
    );
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        Todavía no hay actividad. ¡Sé el primero!
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const Icon = ACTIVITY_ICONS[item.activity_type] || Activity;
        const hasCheered = myCheers.has(item.id);
        let rel = "";
        try {
          rel = `hace ${formatDistanceToNowStrict(parseISO(item.created_at), { locale: es })}`;
        } catch {
          rel = "";
        }
        return (
          <div
            key={item.id}
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <Avatar className="h-9 w-9 flex-shrink-0">
              <AvatarImage src={item.pets?.photo_url || undefined} />
              <AvatarFallback>
                <PawPrint className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-shrink-0 rounded-full bg-background p-1.5">
              <Icon className="h-3.5 w-3.5 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium line-clamp-2">{item.title}</p>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {item.pets?.name ?? "Mascota"} · {rel}
              </p>
            </div>
            <Button
              size="sm"
              variant={hasCheered ? "default" : "ghost"}
              onClick={() => toggleCheer(item.id)}
              className="flex-shrink-0 h-7 px-2 text-xs"
            >
              <ThumbsUp className="h-3 w-3 mr-1" />
              {item.cheers_count}
            </Button>
          </div>
        );
      })}
    </div>
  );
}

export default ActivityFeed;
