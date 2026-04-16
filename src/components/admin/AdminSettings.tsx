import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  Settings,
  Save,
  RefreshCw,
  ToggleLeft,
  Power,
  Users,
  PawPrint,
  ShieldAlert,
} from '@/lib/icons';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { Json } from '@/integrations/supabase/types';

const FEATURE_FLAGS = [
  { key: 'paw_game', label: 'Paw Game' },
  { key: 'missions', label: 'Misiones' },
  { key: 'paw_collection', label: 'Paw Collection' },
  { key: 'community', label: 'Comunidad' },
  { key: 'adoption', label: 'Adopcion' },
  { key: 'blood_donors', label: 'Donantes de Sangre' },
] as const;

const AdminSettings = () => {
  const queryClient = useQueryClient();
  const [platformFee, setPlatformFee] = useState({
    percentage: 5,
    min_fee_clp: 500,
    max_fee_clp: 50000,
  });
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const { data: config, isLoading } = useQuery({
    queryKey: ['platform-config'],
    queryFn: async () => {
      const { data, error } = await supabase.from('platform_config').select('*');
      if (error) throw error;
      return data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['admin-platform-stats'],
    queryFn: async () => {
      const [profiles, pets, posts, orders] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('pets').select('id', { count: 'exact', head: true }),
        supabase.from('posts').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id, total_clp, payment_status'),
      ]);

      const paidOrders = orders.data?.filter((o) => o.payment_status === 'paid') || [];
      const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.total_clp || 0), 0);

      return {
        totalUsers: profiles.count || 0,
        totalPets: pets.count || 0,
        totalPosts: posts.count || 0,
        paidOrders: paidOrders.length,
        totalRevenue,
      };
    },
  });

  useEffect(() => {
    if (config) {
      const feeConfig = config.find((c) => c.config_key === 'platform_fee');
      if (feeConfig?.config_value) {
        const value = feeConfig.config_value as Record<string, number>;
        setPlatformFee({
          percentage: value.percentage || 5,
          min_fee_clp: value.min_fee_clp || 500,
          max_fee_clp: value.max_fee_clp || 50000,
        });
      }

      const flagsConfig = config.find((c) => c.config_key === 'feature_flags');
      if (flagsConfig?.config_value) {
        setFlags(flagsConfig.config_value as Record<string, boolean>);
      }

      const maintConfig = config.find((c) => c.config_key === 'maintenance_mode');
      if (maintConfig?.config_value) {
        const val = maintConfig.config_value as Record<string, boolean>;
        setMaintenanceMode(!!val.enabled);
      }
    }
  }, [config]);

  const upsertConfigMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: Json }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('platform_config') as any).upsert(
        { config_key: key, config_value: value },
        { onConflict: 'config_key' }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-config'] });
      toast.success('Configuracion actualizada');
    },
    onError: () => {
      toast.error('Error al actualizar configuracion');
    },
  });

  const handleSaveFee = () => {
    upsertConfigMutation.mutate({ key: 'platform_fee', value: platformFee });
  };

  const handleToggleFlag = (key: string, enabled: boolean) => {
    const next = { ...flags, [key]: enabled };
    setFlags(next);
    upsertConfigMutation.mutate({ key: 'feature_flags', value: next });
  };

  const handleToggleMaintenance = (enabled: boolean) => {
    setMaintenanceMode(enabled);
    upsertConfigMutation.mutate({ key: 'maintenance_mode', value: { enabled } });
  };

  return (
    <div className="space-y-6">
      {/* Maintenance mode */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn('p-2 rounded-lg', maintenanceMode ? 'bg-red-500/20' : 'bg-slate-800')}
              >
                <Power
                  className={cn('h-5 w-5', maintenanceMode ? 'text-red-400' : 'text-slate-400')}
                />
              </div>
              <div>
                <p className="font-medium text-white">Modo mantenimiento</p>
                <p className="text-xs text-slate-400">
                  {maintenanceMode
                    ? 'La plataforma esta en mantenimiento. Los usuarios veran un aviso.'
                    : 'La plataforma esta funcionando normalmente.'}
                </p>
              </div>
            </div>
            <Switch checked={maintenanceMode} onCheckedChange={handleToggleMaintenance} />
          </div>
        </CardContent>
      </Card>

      {/* Compact stats row */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-300">Resumen rapido</span>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-xs text-slate-400">Usuarios</span>
              <span className="text-sm font-bold text-white font-mono">
                {stats?.totalUsers || 0}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <PawPrint className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs text-slate-400">Mascotas</span>
              <span className="text-sm font-bold text-white font-mono">
                {stats?.totalPets || 0}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Posts</span>
              <span className="text-sm font-bold text-white font-mono">
                {stats?.totalPosts || 0}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Pagadas</span>
              <span className="text-sm font-bold text-green-400 font-mono">
                {stats?.paidOrders || 0}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Ingresos</span>
              <span className="text-sm font-bold text-green-400 font-mono">
                ${(stats?.totalRevenue || 0).toLocaleString('es-CL')}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature flags */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-white">
            <ToggleLeft className="h-5 w-5 text-purple-400" />
            Feature Flags
          </CardTitle>
          <CardDescription className="text-slate-400">
            Activa o desactiva modulos Paw Labs para todos los usuarios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {FEATURE_FLAGS.map(({ key, label }) => (
              <div
                key={key}
                className={cn(
                  'flex items-center justify-between p-3 rounded-lg border transition-colors',
                  flags[key]
                    ? 'bg-purple-500/10 border-purple-500/30'
                    : 'bg-slate-800/50 border-slate-700'
                )}
              >
                <span className="text-sm text-slate-200">{label}</span>
                <Switch
                  checked={flags[key] || false}
                  onCheckedChange={(v) => handleToggleFlag(key, v)}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Commission config */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Settings className="h-5 w-5 text-slate-400" />
            Configuracion de Comisiones
          </CardTitle>
          <CardDescription className="text-slate-400">
            Define las comisiones de la plataforma por cada servicio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <RefreshCw className="h-6 w-6 animate-spin text-slate-500" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Porcentaje de comision (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={platformFee.percentage}
                    onChange={(e) =>
                      setPlatformFee((prev) => ({
                        ...prev,
                        percentage: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Comision minima (CLP)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="100"
                    value={platformFee.min_fee_clp}
                    onChange={(e) =>
                      setPlatformFee((prev) => ({
                        ...prev,
                        min_fee_clp: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Comision maxima (CLP)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="1000"
                    value={platformFee.max_fee_clp}
                    onChange={(e) =>
                      setPlatformFee((prev) => ({
                        ...prev,
                        max_fee_clp: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>
              <Button
                onClick={handleSaveFee}
                disabled={upsertConfigMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="h-4 w-4 mr-2" />
                Guardar Configuracion
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;
