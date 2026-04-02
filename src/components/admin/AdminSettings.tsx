import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Settings, Save, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import type { Json } from "@/integrations/supabase/types";

const AdminSettings = () => {
  const queryClient = useQueryClient();
  const [platformFee, setPlatformFee] = useState({
    percentage: 5,
    min_fee_clp: 500,
    max_fee_clp: 50000,
  });

  const { data: config, isLoading } = useQuery({
    queryKey: ["platform-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_config")
        .select("*");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (config) {
      const feeConfig = config.find(c => c.config_key === "platform_fee");
      if (feeConfig?.config_value) {
        const value = feeConfig.config_value as Record<string, number>;
        setPlatformFee({
          percentage: value.percentage || 5,
          min_fee_clp: value.min_fee_clp || 500,
          max_fee_clp: value.max_fee_clp || 50000,
        });
      }
    }
  }, [config]);

  const updateConfigMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: Json }) => {
      const { error } = await supabase
        .from("platform_config")
        .update({ config_value: value })
        .eq("config_key", key);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-config"] });
      toast.success("Configuración actualizada");
    },
    onError: () => {
      toast.error("Error al actualizar configuración");
    },
  });

  const handleSaveFee = () => {
    updateConfigMutation.mutate({
      key: "platform_fee",
      value: platformFee,
    });
  };

  const { data: stats } = useQuery({
    queryKey: ["admin-platform-stats"],
    queryFn: async () => {
      const [profiles, pets, posts, orders] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("pets").select("id", { count: "exact", head: true }),
        supabase.from("posts").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id, total_clp, payment_status"),
      ]);

      const paidOrders = orders.data?.filter(o => o.payment_status === "paid") || [];
      const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.total_clp || 0), 0);

      return {
        totalUsers: profiles.count || 0,
        totalPets: pets.count || 0,
        totalPosts: posts.count || 0,
        totalOrders: orders.data?.length || 0,
        paidOrders: paidOrders.length,
        totalRevenue,
      };
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Estadísticas de la Plataforma
          </CardTitle>
          <CardDescription>Vista general de la actividad en Paw Friend</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Usuarios</p>
              <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Mascotas</p>
              <p className="text-2xl font-bold">{stats?.totalPets || 0}</p>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Publicaciones</p>
              <p className="text-2xl font-bold">{stats?.totalPosts || 0}</p>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Órdenes Totales</p>
              <p className="text-2xl font-bold">{stats?.totalOrders || 0}</p>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Órdenes Pagadas</p>
              <p className="text-2xl font-bold">{stats?.paidOrders || 0}</p>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Ingresos Totales</p>
              <p className="text-2xl font-bold">
                ${(stats?.totalRevenue || 0).toLocaleString("es-CL")} CLP
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configuración de Comisiones</CardTitle>
          <CardDescription>Define las comisiones de la plataforma por cada servicio</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Porcentaje de comisión (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={platformFee.percentage}
                    onChange={(e) => setPlatformFee(prev => ({ ...prev, percentage: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Comisión mínima (CLP)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="100"
                    value={platformFee.min_fee_clp}
                    onChange={(e) => setPlatformFee(prev => ({ ...prev, min_fee_clp: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Comisión máxima (CLP)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="1000"
                    value={platformFee.max_fee_clp}
                    onChange={(e) => setPlatformFee(prev => ({ ...prev, max_fee_clp: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>
              <Button onClick={handleSaveFee} disabled={updateConfigMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                Guardar Configuración
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;
