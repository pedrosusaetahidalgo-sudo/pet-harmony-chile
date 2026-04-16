import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Gift, Plus, Trash2, Edit, Loader2, Coins, Package } from '@/lib/icons';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

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

const CATEGORY_COLORS: Record<string, string> = {
  descuento: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  producto: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  experiencia: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  donacion: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  servicio: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
};

export default function AdminRewards() {
  const queryClient = useQueryClient();
  const [editItem, setEditItem] = useState<Reward | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: rewards = [], isLoading } = useQuery({
    queryKey: ['admin-rewards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('paw_shop_rewards')
        .select('*')
        .order('points_cost', { ascending: true });
      if (error) throw error;
      return data as Reward[];
    },
  });

  const { data: totalPawCoins } = useQuery({
    queryKey: ['admin-rewards-total-coins'],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_stats').select('total_points');
      if (error) throw error;
      const sum = (data ?? []).reduce(
        (acc: number, r: { total_points: number | null }) => acc + (r.total_points ?? 0),
        0
      );
      return sum;
    },
  });

  const activeCount = rewards.filter((r) => r.is_active).length;
  const totalCount = rewards.length;

  const toggleActive = async (id: string, current: boolean | null) => {
    const { error } = await supabase
      .from('paw_shop_rewards')
      .update({ is_active: !current })
      .eq('id', id);
    if (error) {
      toast.error('Error', { description: error.message });
    } else {
      queryClient.invalidateQueries({ queryKey: ['admin-rewards'] });
    }
  };

  const deleteReward = async (id: string) => {
    const { error } = await supabase.from('paw_shop_rewards').delete().eq('id', id);
    if (error) {
      toast.error('Error', { description: error.message });
    } else {
      toast('Eliminado');
      queryClient.invalidateQueries({ queryKey: ['admin-rewards'] });
    }
  };

  return (
    <div className="space-y-4">
      {/* Metrics header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/20">
              <Coins className="h-5 w-5 text-amber-300" />
            </div>
            <div>
              <p className="text-xs text-slate-400">PawCoins en circulacion</p>
              <p className="text-xl font-bold text-white">
                {(totalPawCoins ?? 0).toLocaleString('es-CL')}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/20">
              <Gift className="h-5 w-5 text-emerald-300" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Rewards activos</p>
              <p className="text-xl font-bold text-white">{activeCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-500/20">
              <Package className="h-5 w-5 text-blue-300" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Total rewards</p>
              <p className="text-xl font-bold text-white">{totalCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
          <Gift className="h-5 w-5" /> Paw Shop Rewards
        </h2>
        <Dialog
          open={showForm}
          onOpenChange={(o) => {
            setShowForm(o);
            if (!o) setEditItem(null);
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" /> Nuevo
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800 text-white">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editItem ? 'Editar Reward' : 'Nuevo Reward'}
              </DialogTitle>
            </DialogHeader>
            <RewardForm
              initial={editItem}
              onSaved={() => {
                setShowForm(false);
                setEditItem(null);
                queryClient.invalidateQueries({ queryKey: ['admin-rewards'] });
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" />
        </div>
      ) : (
        <div className="grid gap-3">
          {rewards.map((r) => (
            <Card
              key={r.id}
              className={`bg-slate-900 border-slate-800 ${!r.is_active ? 'opacity-60' : ''}`}
            >
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm text-white">{r.name}</p>
                    <Badge
                      className={`text-xs border ${CATEGORY_COLORS[r.category] || 'bg-slate-500/20 text-slate-300 border-slate-500/30'}`}
                    >
                      {r.category}
                    </Badge>
                    <Badge className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {r.points_cost} pts
                    </Badge>
                    {r.stock !== null && (
                      <Badge className="text-xs bg-slate-500/20 text-slate-300 border border-slate-500/30">
                        Stock: {r.stock}
                      </Badge>
                    )}
                  </div>
                  {r.description && <p className="text-xs text-slate-400 mt-1">{r.description}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch
                    checked={!!r.is_active}
                    onCheckedChange={() => toggleActive(r.id, r.is_active)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-slate-400 hover:text-white hover:bg-slate-800"
                    onClick={() => {
                      setEditItem(r);
                      setShowForm(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-400 hover:text-red-300 hover:bg-slate-800"
                    onClick={() => deleteReward(r.id)}
                  >
                    <Trash2 className="h-4 w-4" />
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
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: initial?.name || '',
    description: initial?.description || '',
    points_cost: initial?.points_cost || 100,
    category: initial?.category || 'descuento',
    stock: initial?.stock ?? '',
    partner_name: initial?.partner_name || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      name: form.name,
      description: form.description || null,
      points_cost: form.points_cost,
      category: form.category,
      stock: form.stock === '' ? null : Number(form.stock),
      partner_name: form.partner_name || null,
      is_active: true,
    };

    const { error } = initial
      ? await supabase.from('paw_shop_rewards').update(payload).eq('id', initial.id)
      : await supabase.from('paw_shop_rewards').insert(payload);

    if (error) {
      toast.error('Error', { description: error.message });
    } else {
      toast(initial ? 'Actualizado' : 'Creado');
      onSaved();
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label className="text-slate-300">Nombre *</Label>
        <Input
          className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label className="text-slate-300">Descripcion</Label>
        <Input
          className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-slate-300">Puntos *</Label>
          <Input
            className="bg-slate-800 border-slate-700 text-white"
            type="number"
            min={1}
            value={form.points_cost}
            onChange={(e) => setForm({ ...form, points_cost: Number(e.target.value) })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-300">Categoria *</Label>
          <Input
            className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-slate-300">Stock (vacio = ilimitado)</Label>
          <Input
            className="bg-slate-800 border-slate-700 text-white"
            type="number"
            min={0}
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-300">Partner</Label>
          <Input
            className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            value={form.partner_name}
            onChange={(e) => setForm({ ...form, partner_name: e.target.value })}
          />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        {initial ? 'Guardar cambios' : 'Crear reward'}
      </Button>
    </form>
  );
}
