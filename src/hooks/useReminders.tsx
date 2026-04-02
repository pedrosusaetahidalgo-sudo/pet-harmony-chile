import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface Reminder {
  id: string;
  pet_id: string;
  owner_id: string;
  type: string;
  title: string;
  description: string | null;
  due_date: string;
  is_recurring: boolean;
  recurrence_interval: string | null;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  pets?: { name: string; species: string } | null;
}

export const useReminders = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reminders = [], isLoading } = useQuery({
    queryKey: ["pet-reminders", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("pet_reminders")
        .select("*, pets(name, species)")
        .eq("owner_id", user.id)
        .order("due_date", { ascending: true });
      if (error) throw error;
      return (data || []) as Reminder[];
    },
    enabled: !!user,
  });

  const upcomingReminders = reminders.filter(r =>
    !r.is_completed && new Date(r.due_date) >= new Date(new Date().toDateString())
  );

  const overdueReminders = reminders.filter(r =>
    !r.is_completed && new Date(r.due_date) < new Date(new Date().toDateString())
  );

  const addReminder = useMutation({
    mutationFn: async (reminder: { pet_id: string; type: string; title: string; description?: string; due_date: string; is_recurring?: boolean; recurrence_interval?: string }) => {
      const { error } = await supabase.from("pet_reminders").insert({
        ...reminder,
        owner_id: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pet-reminders"] });
      toast({ title: "Recordatorio creado" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const completeReminder = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("pet_reminders")
        .update({ is_completed: true, completed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pet-reminders"] });
      toast({ title: "Recordatorio completado" });
    },
  });

  const deleteReminder = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pet_reminders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pet-reminders"] });
    },
  });

  return { reminders, upcomingReminders, overdueReminders, isLoading, addReminder, completeReminder, deleteReminder };
};
