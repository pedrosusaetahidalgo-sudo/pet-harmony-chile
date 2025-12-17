import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Eye, Search, Shield, ShieldOff, UserCog } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const roleLabels: Record<string, string> = {
  user: "Usuario",
  admin: "Administrador",
  moderator: "Moderador",
  dog_walker: "Paseador",
  dog_sitter: "Cuidador",
  vet: "Veterinario",
  trainer: "Entrenador",
};

const AdminUsers = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: userRoles } = useQuery({
    queryKey: ["admin-user-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: userStats } = useQuery({
    queryKey: ["admin-user-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_stats")
        .select("*");
      if (error) throw error;
      return data;
    },
  });

  const addRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "admin" | "dog_walker" | "dogsitter" | "trainer" | "user" | "veterinarian" }) => {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
      toast.success("Rol agregado correctamente");
    },
    onError: (error: any) => {
      if (error.message?.includes("duplicate")) {
        toast.error("El usuario ya tiene este rol");
      } else {
        toast.error("Error al agregar rol");
      }
    },
  });

  const removeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "admin" | "dog_walker" | "dogsitter" | "trainer" | "user" | "veterinarian" }) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
      toast.success("Rol eliminado correctamente");
    },
    onError: () => {
      toast.error("Error al eliminar rol");
    },
  });

  const getUserRoles = (userId: string) => {
    return userRoles?.filter(r => r.user_id === userId).map(r => r.role) || [];
  };

  const getUserStats = (userId: string) => {
    return userStats?.find(s => s.user_id === userId);
  };

  const filteredProfiles = profiles?.filter(profile => 
    profile.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    profile.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCog className="h-5 w-5" />
          Gestión de Usuarios
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : !filteredProfiles || filteredProfiles.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No se encontraron usuarios</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Nivel</TableHead>
                <TableHead>Puntos</TableHead>
                <TableHead>Registro</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProfiles.map((profile) => {
                const roles = getUserRoles(profile.id);
                const stats = getUserStats(profile.id);
                return (
                  <TableRow key={profile.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={profile.avatar_url || ""} />
                          <AvatarFallback>
                            {profile.display_name?.[0]?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{profile.display_name || "Sin nombre"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {roles.map(role => (
                          <Badge key={role} variant={role === "admin" ? "default" : "secondary"} className="text-xs">
                            {roleLabels[role] || role}
                          </Badge>
                        ))}
                        {roles.length === 0 && (
                          <span className="text-muted-foreground text-xs">Sin roles</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{stats?.level || 1}</TableCell>
                    <TableCell>{stats?.total_points || 0}</TableCell>
                    <TableCell>
                      {new Date(profile.created_at).toLocaleDateString("es-CL")}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedUser(profile)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Gestionar Usuario</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedUser.avatar_url || ""} />
                    <AvatarFallback className="text-xl">
                      {selectedUser.display_name?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-lg">{selectedUser.display_name || "Sin nombre"}</p>
                    <p className="text-sm text-muted-foreground">{selectedUser.location || "Sin ubicación"}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Bio</p>
                  <p className="bg-muted p-2 rounded text-sm">{selectedUser.bio || "Sin descripción"}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Roles actuales</p>
                  <div className="flex flex-wrap gap-2">
                    {getUserRoles(selectedUser.id).map(role => (
                      <Badge key={role} variant="secondary" className="flex items-center gap-1">
                        {roleLabels[role] || role}
                        <button
                          onClick={() => removeRoleMutation.mutate({ userId: selectedUser.id, role })}
                          className="ml-1 hover:text-destructive"
                        >
                          <ShieldOff className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Agregar rol</p>
                  <Select
                    onValueChange={(role) => addRoleMutation.mutate({ userId: selectedUser.id, role: role as "admin" | "dog_walker" | "dogsitter" | "trainer" | "user" | "veterinarian" })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="moderator">Moderador</SelectItem>
                      <SelectItem value="dog_walker">Paseador</SelectItem>
                      <SelectItem value="dog_sitter">Cuidador</SelectItem>
                      <SelectItem value="vet">Veterinario</SelectItem>
                      <SelectItem value="trainer">Entrenador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">Nivel</p>
                    <p className="font-medium">{getUserStats(selectedUser.id)?.level || 1}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Puntos</p>
                    <p className="font-medium">{getUserStats(selectedUser.id)?.total_points || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Mascotas</p>
                    <p className="font-medium">{getUserStats(selectedUser.id)?.pets_count || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Posts</p>
                    <p className="font-medium">{getUserStats(selectedUser.id)?.posts_count || 0}</p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default AdminUsers;
