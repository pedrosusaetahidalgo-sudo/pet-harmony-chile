import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { CheckCircle, XCircle, Eye, Dog, Home, Stethoscope, GraduationCap } from "@/lib/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ProviderType = "walker" | "sitter" | "vet" | "trainer";

const AdminProviders = () => {
  const queryClient = useQueryClient();
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [providerType, setProviderType] = useState<ProviderType>("walker");

  /**
   * Fetch helper que evita el join PostgREST `profiles:user_id(...)`.
   * La FK explícita no existe en migraciones, así que el join devuelve 400.
   * Patrón: traer la tabla principal, después traer profiles por user_ids
   * y mergear en cliente. Mismo enfoque que `adoption_posts` post-fix.
   */
  const fetchWithProfiles = async (
    table: "dog_walker_profiles" | "dogsitter_profiles" | "trainer_profiles"
  ) => {
    const { data: rows, error } = await supabase
      .from(table)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    if (!rows || rows.length === 0) return [];

    const userIds = Array.from(new Set(rows.map((r: any) => r.user_id).filter(Boolean)));
    if (userIds.length === 0) return rows.map((r: any) => ({ ...r, profiles: null }));

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", userIds);

    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
    return rows.map((r: any) => ({
      ...r,
      profiles: profileMap.get(r.user_id) || null,
    }));
  };

  const { data: walkers, isLoading: loadingWalkers } = useQuery({
    queryKey: ["admin-walkers"],
    queryFn: () => fetchWithProfiles("dog_walker_profiles"),
  });

  const { data: sitters, isLoading: loadingSitters } = useQuery({
    queryKey: ["admin-sitters"],
    queryFn: () => fetchWithProfiles("dogsitter_profiles"),
  });

  const { data: trainers, isLoading: loadingTrainers } = useQuery({
    queryKey: ["admin-trainers"],
    queryFn: () => fetchWithProfiles("trainer_profiles"),
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ id, type, verified }: { id: string; type: ProviderType; verified: boolean }) => {
      let error;
      if (type === "walker") {
        ({ error } = await supabase.from("dog_walker_profiles").update({ is_verified: verified }).eq("id", id));
      } else if (type === "sitter") {
        ({ error } = await supabase.from("dogsitter_profiles").update({ is_verified: verified }).eq("id", id));
      } else if (type === "trainer") {
        ({ error } = await supabase.from("trainer_profiles").update({ is_verified: verified }).eq("id", id));
      }
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-walkers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-sitters"] });
      queryClient.invalidateQueries({ queryKey: ["admin-trainers"] });
      toast.success("Proveedor actualizado");
      setSelectedProvider(null);
    },
    onError: () => {
      toast.error("Error al actualizar proveedor");
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, type, active }: { id: string; type: ProviderType; active: boolean }) => {
      let error;
      if (type === "walker") {
        ({ error } = await supabase.from("dog_walker_profiles").update({ is_active: active }).eq("id", id));
      } else if (type === "sitter") {
        ({ error } = await supabase.from("dogsitter_profiles").update({ is_active: active }).eq("id", id));
      } else if (type === "trainer") {
        ({ error } = await supabase.from("trainer_profiles").update({ is_active: active }).eq("id", id));
      }
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-walkers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-sitters"] });
      queryClient.invalidateQueries({ queryKey: ["admin-trainers"] });
      toast.success("Estado actualizado");
    },
    onError: () => {
      toast.error("Error al actualizar estado");
    },
  });

  const renderProviderTable = (providers: any[], type: ProviderType) => {
    if (!providers || providers.length === 0) {
      return <p className="text-muted-foreground text-center py-8">No hay proveedores registrados</p>;
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Rating</TableHead>
            <TableHead>Verificado</TableHead>
            <TableHead>Activo</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {providers.map((provider) => (
            <TableRow key={provider.id}>
              <TableCell className="font-medium">
                {provider.profiles?.display_name || "Sin nombre"}
              </TableCell>
              <TableCell>{provider.rating?.toFixed(1) || "N/A"}</TableCell>
              <TableCell>
                <Badge variant={provider.is_verified ? "default" : "secondary"}>
                  {provider.is_verified ? "Verificado" : "Pendiente"}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={provider.is_active ? "default" : "destructive"}>
                  {provider.is_active ? "Activo" : "Inactivo"}
                </Badge>
              </TableCell>
              <TableCell className="space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedProvider(provider);
                    setProviderType(type);
                  }}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                {!provider.is_verified && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => verifyMutation.mutate({ id: provider.id, type, verified: true })}
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant={provider.is_active ? "destructive" : "default"}
                  onClick={() => toggleActiveMutation.mutate({ id: provider.id, type, active: !provider.is_active })}
                >
                  {provider.is_active ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestión de Proveedores de Servicios</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="walkers">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="walkers" className="flex items-center gap-2">
              <Dog className="h-4 w-4" />
              <span className="hidden sm:inline">Paseadores</span>
            </TabsTrigger>
            <TabsTrigger value="sitters" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Cuidadores</span>
            </TabsTrigger>
            <TabsTrigger value="vets" className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4" />
              <span className="hidden sm:inline">Veterinarios</span>
            </TabsTrigger>
            <TabsTrigger value="trainers" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              <span className="hidden sm:inline">Entrenadores</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="walkers">
            {loadingWalkers ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              renderProviderTable(walkers || [], "walker")
            )}
          </TabsContent>

          <TabsContent value="sitters">
            {loadingSitters ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              renderProviderTable(sitters || [], "sitter")
            )}
          </TabsContent>

          <TabsContent value="vets">
            <p className="text-muted-foreground text-center py-8">
              La tabla de veterinarios aún no está implementada en el sistema
            </p>
          </TabsContent>

          <TabsContent value="trainers">
            {loadingTrainers ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              renderProviderTable(trainers || [], "trainer")
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={!!selectedProvider} onOpenChange={() => setSelectedProvider(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalles del Proveedor</DialogTitle>
            </DialogHeader>
            {selectedProvider && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nombre</p>
                    <p className="font-medium">{selectedProvider.profiles?.display_name || "Sin nombre"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Rating</p>
                    <p className="font-medium">{selectedProvider.rating?.toFixed(1) || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Experiencia</p>
                    <p className="font-medium">{selectedProvider.experience_years || 0} años</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Reseñas</p>
                    <p className="font-medium">{selectedProvider.total_reviews || 0}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bio</p>
                  <p>{selectedProvider.bio || "Sin descripción"}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => verifyMutation.mutate({ 
                      id: selectedProvider.id, 
                      type: providerType, 
                      verified: !selectedProvider.is_verified 
                    })}
                  >
                    {selectedProvider.is_verified ? "Quitar verificación" : "Verificar"}
                  </Button>
                  <Button
                    variant={selectedProvider.is_active ? "destructive" : "default"}
                    onClick={() => toggleActiveMutation.mutate({ 
                      id: selectedProvider.id, 
                      type: providerType, 
                      active: !selectedProvider.is_active 
                    })}
                  >
                    {selectedProvider.is_active ? "Desactivar" : "Activar"}
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
