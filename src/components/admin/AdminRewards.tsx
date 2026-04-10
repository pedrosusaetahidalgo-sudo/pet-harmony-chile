import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Gift, Plus, Trash2, Edit, Loader2 } from "@/lib/icons";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

interface Reward {
  id: string;
  name: string;
  description: string | null;
  points_cost: number;
  category: string;
  is_active: boolean | null;
  stock: number | null;
  partner_name: string | null;
  icon: string | null;
}

export default function AdminRewards() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editItem, setEditItem] = useState<Reward | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: rewards = [], isLoading } = useQuery({
    queryKey: ["admin-rewards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("paw_shop_rewards")
        .select("*")
        .order("points_cost", { ascending: true });
      if (error) throw error;
      return data as Reward[];
    },
  });

  const toggleActive = async (id: string, current: boolean | null) => {
    const { error } = await supabase
      .from("paw_shop_rewards")
      .update({ is_active: !current })
      .eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["admin-rewards"] });
    }
  };

  const deleteReward = async (id: string) => {
    const { error } = await supabase.from("paw_shop_rewards").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Eliminado" });
      queryClient.invalidateQueries({ queryKey: ["admin-rewards"] });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Gift className="h-5 w-5" /> Paw Shop Rewards
        </h2>
        <Dialog open={showForm} onOpenChange={(o) => { setShowForm(o); if (!o) setEditItem(null); }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nuevo</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editItem ? "Editar Reward" : "Nuevo Reward"}</DialogTitle>
            </DialogHeader>
            <RewardForm
              initial={editItem}
              onSaved={() => {
                setShowForm(false);
                setEditItem(null);
                queryClient.invalidateQueries({ queryKey: ["admin-rewards"] });
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
      ) : (
        <div className="grid gap-3">
          {rewards.map((r) => (
            <Card key={r.id} className={!r.is_active ? "opacity-60" : ""}>
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm">{r.name}</p>
                    <Badge variant="outline" className="text-xs">{r.category}</Badge>
                    <Badge variant="secondary" className="text-xs">{r.points_cost} pts</Badge>
                    {r.stock !== null && <Badge variant="outline" className="text-xs">Stock: {r.stock}</Badge>}
                  </div>
                  {r.description && <p className="text-xs text-muted-foreground mt-1">{r.description}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch checked={!!r.is_active} onCheckedChange={() => toggleActive(r.id, r.is_active)} />
                  <Button variant="ghost" size="icon" onClick={() => { setEditItem(r); setShowForm(true); }}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteReward(r.id)}>
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

function RewardForm({ initial, onSaved }: { initial: Reward | null; onSaved: () => void }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: initial?.name || "",
    description: initial?.description || "",
    points_cost: initial?.points_cost || 100,
    category: initial?.category || "descuento",
    stock: initial?.stock ?? "",
    partner_name: initial?.partner_name || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      name: form.name,
      description: form.description || null,
      points_cost: form.points_cost,
      category: form.category,
      stock: form.stock === "" ? null : Number(form.stock),
      partner_name: form.partner_name || null,
      is_active: true,
    };

    const { error } = initial
      ? await supabase.from("paw_shop_rewards").update(payload).eq("id", initial.id)
      : await supabase.from("paw_shop_rewards").insert(payload);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: initial ? "Actualizado" : "Creado" });
      onSaved();
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Nombre *</Label>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      </div>
      <div className="space-y-2">
        <Label>Descripción</Label>
        <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Puntos *</Label>
          <Input type="number" min={1} value={form.points_cost} onChange={(e) => setForm({ ...form, points_cost: Number(e.target.value) })} required />
        </div>
        <div className="space-y-2">
          <Label>Categoría *</Label>
          <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Stock (vacío = ilimitado)</Label>
          <Input type="number" min={0} value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Partner</Label>
          <Input value={form.partner_name} onChange={(e) => setForm({ ...form, partner_name: e.target.value })} />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        {initial ? "Guardar cambios" : "Crear reward"}
      </Button>
    </form>
  );
}
