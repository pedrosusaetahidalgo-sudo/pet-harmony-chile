import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { CheckCircle, Eye, Dog, Home, Stethoscope, GraduationCap, Scissors } from '@/lib/icons';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type ServiceTypeKey = 'veterinarian' | 'dog_walker' | 'dogsitter' | 'trainer' | 'grooming';

interface ProviderWithProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  rating: number | null;
  total_reviews: number | null;
  is_verified: boolean;
  status: string;
  experience_years: number | null;
  primary_service_type: string | null;
  commune: string | null;
  [key: string]: unknown;
}

const SERVICE_TABS: {
  key: ServiceTypeKey;
  label: string;
  icon: typeof Dog;
}[] = [
  { key: 'veterinarian', label: 'Veterinarios', icon: Stethoscope },
  { key: 'dog_walker', label: 'Paseadores', icon: Dog },
  { key: 'dogsitter', label: 'Cuidadores', icon: Home },
  { key: 'trainer', label: 'Entrenadores', icon: GraduationCap },
  { key: 'grooming', label: 'Peluqueros', icon: Scissors },
];

const AdminProviders = () => {
  const queryClient = useQueryClient();
  const [selectedProvider, setSelectedProvider] = useState<ProviderWithProfile | null>(null);
  const [activeTab, setActiveTab] = useState<ServiceTypeKey>('veterinarian');

  // Fetch all providers from unified service_providers table
  const { data: allProviders, isLoading } = useQuery({
    queryKey: ['admin-all-providers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_providers')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ProviderWithProfile[];
    },
  });

  const getProvidersByType = (type: ServiceTypeKey) =>
    allProviders?.filter((p) => p.primary_service_type === type) ?? [];

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, unknown> }) => {
      const { error } = await supabase.from('service_providers').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-providers'] });
      toast.success('Proveedor actualizado');
      setSelectedProvider(null);
    },
    onError: () => {
      toast.error('Error al actualizar proveedor');
    },
  });

  const handleVerify = (id: string, verified: boolean) => {
    updateStatusMutation.mutate({
      id,
      updates: {
        is_verified: verified,
        verified_at: verified ? new Date().toISOString() : null,
      },
    });
  };

  const handleToggleStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'approved' ? 'suspended' : 'approved';
    updateStatusMutation.mutate({
      id,
      updates: {
        status: newStatus,
        is_directory_visible: newStatus === 'approved',
      },
    });
  };

  const handleApprove = (id: string) => {
    updateStatusMutation.mutate({
      id,
      updates: {
        status: 'approved',
        is_directory_visible: true,
      },
    });
  };

  const renderProviderTable = (providers: ProviderWithProfile[]) => {
    if (!providers || providers.length === 0) {
      return <p className="text-slate-400 text-center py-8">No hay proveedores registrados</p>;
    }

    return (
      <Table>
        <TableHeader>
          <TableRow className="border-slate-800 hover:bg-transparent">
            <TableHead className="text-slate-400 uppercase text-xs">Nombre</TableHead>
            <TableHead className="text-slate-400 uppercase text-xs">Comuna</TableHead>
            <TableHead className="text-slate-400 uppercase text-xs">Rating</TableHead>
            <TableHead className="text-slate-400 uppercase text-xs">Estado</TableHead>
            <TableHead className="text-slate-400 uppercase text-xs">Verificado</TableHead>
            <TableHead className="text-slate-400 uppercase text-xs">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {providers.map((provider) => (
            <TableRow key={provider.id} className="border-slate-800 hover:bg-slate-800/50">
              <TableCell className="font-medium text-white">
                {provider.display_name || 'Sin nombre'}
              </TableCell>
              <TableCell className="text-slate-300">{provider.commune || '—'}</TableCell>
              <TableCell className="text-slate-300">
                {provider.rating?.toFixed(1) || 'N/A'}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={
                    provider.status === 'approved'
                      ? 'bg-green-500/20 text-green-300 border-green-500/30'
                      : provider.status === 'pending'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-red-500/20 text-red-300 border-red-500/30'
                  }
                >
                  {provider.status === 'approved'
                    ? 'Aprobado'
                    : provider.status === 'pending'
                      ? 'Pendiente'
                      : provider.status === 'suspended'
                        ? 'Suspendido'
                        : 'Rechazado'}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={
                    provider.is_verified
                      ? 'bg-green-500/20 text-green-300 border-green-500/30'
                      : 'bg-slate-500/20 text-slate-300 border-slate-500/30'
                  }
                >
                  {provider.is_verified ? 'Verificado' : 'No'}
                </Badge>
              </TableCell>
              <TableCell className="space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
                  onClick={() => setSelectedProvider(provider)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                {provider.status === 'pending' && (
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => handleApprove(provider.id)}
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white">Gestión de Proveedores de Servicios</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ServiceTypeKey)}>
          <TabsList className="grid grid-cols-5 mb-4 bg-slate-800">
            {SERVICE_TABS.map(({ key, label, icon: Icon }) => (
              <TabsTrigger
                key={key}
                value={key}
                className="flex items-center gap-2 data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {SERVICE_TABS.map(({ key }) => (
            <TabsContent key={key} value={key}>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : (
                renderProviderTable(getProvidersByType(key))
              )}
            </TabsContent>
          ))}
        </Tabs>

        <Dialog open={!!selectedProvider} onOpenChange={() => setSelectedProvider(null)}>
          <DialogContent className="max-w-2xl bg-slate-900 border-slate-800">
            <DialogHeader>
              <DialogTitle className="text-white">Detalles del Proveedor</DialogTitle>
            </DialogHeader>
            {selectedProvider && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-400">Nombre</p>
                    <p className="font-medium text-white">
                      {selectedProvider.display_name || 'Sin nombre'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Tipo de servicio</p>
                    <p className="font-medium text-white">
                      {selectedProvider.primary_service_type || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Rating</p>
                    <p className="font-medium text-white">
                      {selectedProvider.rating?.toFixed(1) || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Experiencia</p>
                    <p className="font-medium text-white">
                      {selectedProvider.experience_years || 0} años
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Comuna</p>
                    <p className="font-medium text-white">{selectedProvider.commune || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Reseñas</p>
                    <p className="font-medium text-white">{selectedProvider.total_reviews || 0}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Bio</p>
                  <p className="text-slate-300">{selectedProvider.bio || 'Sin descripción'}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleVerify(selectedProvider.id, !selectedProvider.is_verified)}
                  >
                    {selectedProvider.is_verified ? 'Quitar verificación' : 'Verificar'}
                  </Button>
                  {selectedProvider.status === 'pending' && (
                    <Button
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleApprove(selectedProvider.id)}
                    >
                      Aprobar
                    </Button>
                  )}
                  <Button
                    variant={selectedProvider.status === 'approved' ? 'destructive' : 'default'}
                    onClick={() => handleToggleStatus(selectedProvider.id, selectedProvider.status)}
                  >
                    {selectedProvider.status === 'approved' ? 'Suspender' : 'Activar'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default AdminProviders;
