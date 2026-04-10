import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target, Plus, Trash2, Edit, Loader2 } from "@/lib/icons";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

interface Mission {
  id: string;
  mission_type: string;
  category: string;
  title: string;
  description: string;
  target_action: string;
  target_count: number;
  points_reward: number;
  is_active: boolean | null;
}

export default function AdminMissions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editItem, setEditItem] = useState<Mission | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: missions = [], isLoading } = useQuery({
    queryKey: ["admin-missions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("paw_missions")
        .select("*")
        .order("mission_type")
        .order("category");
      if (error) throw error;
      return data as Mission[];
    },
  });

  const toggleActive = async (id: string, current: boolean | null) => {
    const { error } = await supabase.from("paw_missions").update({ is_active: !current }).eq("id", id);
    if (!error) queryClient.invalidateQueries({ queryKey: ["admin-missions"] });
  };

  const deleteMission = async (id: string) => {
    const { error } = await supabase.from("paw_missions").delete().eq("id", id);
    if (!error) {
      toast({ title: "Misión eliminada" });
      queryClient.invalidateQueries({ queryKey: ["admin-missions"] });
    }
  };

  const typeColors: Record<string, string> = {
    daily: "bg-blue-100 text-blue-700",
    weekly: "bg-purple-100 text-purple-700",
    story: "bg-amber-100 text-amber-700",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Target className="h-5 w-5" /> Paw Missions
        </h2>
        <Dialog open={showForm} onOpenChange={(o) => { setShowForm(o); if (!o) setEditItem(null); }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nueva</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editItem ? "Editar Misión" : "Nueva Misión"}</DialogTitle>
            </DialogHeader>
            <MissionForm
              initial={editItem}
              onSaved={() => {
                setShowForm(false);
                setEditItem(null);
                queryClient.invalidateQueries({ queryKey: ["admin-missions"] });
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
      ) : (
        <div className="grid gap-3">
          {missions.map((m) => (
            <Card key={m.id} className={!m.is_active ? "opacity-60" : ""}>
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm">{m.title}</p>
                    <Badge className={`text-xs ${typeColors[m.mission_type] || ""}`}>{m.mission_type}</Badge>
                    <Badge variant="outline" className="text-xs">{m.category}</Badge>
                    <Badge variant="secondary" className="text-xs">{m.points_reward} pts</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{m.description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch checked={!!m.is_active} onCheckedChange={() => toggleActive(m.id, m.is_active)} />
                  <Button variant="ghost" size="icon" onClick={() => { setEditItem(m); setShowForm(true); }}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteMission(m.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function MissionForm({ initial, onSaved }: { initial: Mission | null; onSaved: () => void }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: initial?.title || "",
    description: initial?.description || "",
    mission_type: initial?.mission_type || "daily",
    category: initial?.category || "health",
    target_action: initial?.target_action || "",
    target_count: initial?.target_count || 1,
    points_reward: initial?.points_reward || 10,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = { ...form, is_active: true };

    const { error } = initial
      ? await supabase.from("paw_missions").update(payload).eq("id", initial.id)
      : await supabase.from("paw_missions").insert(payload);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: initial ? "Actualizada" : "Creada" });
      onSaved();
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Título *</Label>
        <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
      </div>
      <div className="space-y-2">
        <Label>Descripción *</Label>
        <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tipo *</Label>
          <Select value={form.mission_type} onValueChange={(v) => setForm({ ...form, mission_type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Diaria</SelectItem>
              <SelectItem value="weekly">Semanal</SelectItem>
              <SelectItem value="story">Historia</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Categoría *</Label>
          <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="health">Salud</SelectItem>
              <SelectItem value="activity">Actividad</SelectItem>
              <SelectItem value="community">Comunidad</SelectItem>
              <SelectItem value="exploration">Exploración</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Acción *</Label>
          <Input value={form.target_action} onChange={(e) => setForm({ ...form, target_action: e.target.value })} required placeholder="log_weight" />
        </div>
        <div className="space-y-2">
          <Label>Meta *</Label>
          <Input type="number" min={1} value={form.target_count} onChange={(e) => setForm({ ...form, target_count: Number(e.target.value) })} required />
        </div>
        <div className="space-y-2">
          <Label>Puntos *</Label>
          <Input type="number" min={1} value={form.points_reward} onChange={(e) => setForm({ ...form, points_reward: Number(e.target.value) })} required />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        {initial ? "Guardar cambios" : "Crear misión"}
      </Button>
    </form>
  );
}
