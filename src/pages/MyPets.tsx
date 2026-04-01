import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Edit, Trash2, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BreedTips } from "@/components/BreedTips";

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  birth_date: string | null;
  photo_url: string | null;
  size: string | null;
  color: string | null;
  personality: string[] | null;
  gender: string | null;
  weight: number | null;
  bio: string | null;
}

const MyPets = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchPets();
    }
  }, [user]);

  const fetchPets = async () => {
    try {
      const { data, error } = await supabase
        .from("pets")
        .select("*")
        .eq("owner_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPets(data || []);
    } catch (error: any) {
      toast({
        title: "Error al cargar mascotas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase.from("pets").delete().eq("id", deleteId);

      if (error) throw error;

      toast({
        title: "Mascota eliminada",
        description: "La mascota ha sido eliminada exitosamente",
      });

      fetchPets();
    } catch (error: any) {
      toast({
        title: "Error al eliminar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteId(null);
    }
  };

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const now = new Date();
    const years = now.getFullYear() - birth.getFullYear();
    const months = now.getMonth() - birth.getMonth();

    if (years === 0) {
      return `${months} ${months === 1 ? "mes" : "meses"}`;
    }
    return `${years} ${years === 1 ? "año" : "años"}`;
  };

  if (loading) {
    return (
      <div className="container px-4 py-8 max-w-6xl mx-auto animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-2">
            <div className="h-8 w-40 skeleton" />
            <div className="h-4 w-64 skeleton" />
          </div>
          <div className="h-10 w-40 skeleton" />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="rounded-xl overflow-hidden border border-border">
              <div className="h-48 skeleton" />
              <div className="p-4 space-y-3">
                <div className="h-5 w-32 skeleton" />
                <div className="h-4 w-48 skeleton" />
                <div className="flex gap-2">
                  <div className="h-8 w-20 skeleton" />
                  <div className="h-8 w-20 skeleton" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 max-w-6xl mx-auto animate-fade-in-up">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Mis Mascotas</h1>
            <p className="text-muted-foreground">
              Gestiona los perfiles de tus compañeros peludos
            </p>
          </div>
          <Button
            onClick={() => navigate("/add-pet")}
            className="bg-warm-gradient hover:opacity-90 transition-all shadow-lg hover:shadow-xl hover:scale-105 btn-press"
          >
            <Plus className="mr-2 h-5 w-5" />
            Agregar Mascota
          </Button>
        </div>

        {pets.length === 0 ? (
          <Card className="animate-scale-in">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Heart className="h-16 w-16 text-muted-foreground/50 mb-4 animate-float" />
              <h3 className="text-xl font-semibold mb-2">
                No tienes mascotas registradas
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Comienza agregando el perfil de tu primera mascota para conectar con
                otros dueños y gestionar su historial médico.
              </p>
              <Button
                onClick={() => navigate("/add-pet")}
                className="bg-warm-gradient hover:opacity-90 transition-opacity btn-press"
              >
                <Plus className="mr-2 h-5 w-5" />
                Agregar Mi Primera Mascota
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pets.map((pet, index) => (
              <Card key={pet.id} className={`overflow-hidden card-hover animate-fade-in-up stagger-${Math.min(index + 1, 8)}`}>
                <div className="relative h-48 bg-muted">
                  {pet.photo_url ? (
                    <img
                      src={pet.photo_url}
                      alt={pet.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Heart className="h-16 w-16 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{pet.name}</span>
                    <Badge variant="secondary">{pet.species}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    {pet.breed && (
                      <p>
                        <span className="font-medium">Raza:</span> {pet.breed}
                      </p>
                    )}
                    {pet.birth_date && (
                      <p>
                        <span className="font-medium">Edad:</span>{" "}
                        {calculateAge(pet.birth_date)}
                      </p>
                    )}
                    {pet.size && (
                      <p>
                        <span className="font-medium">Tamaño:</span> {pet.size}
                      </p>
                    )}
                    {pet.color && (
                      <p>
                        <span className="font-medium">Color:</span> {pet.color}
                      </p>
                    )}
                    {pet.gender && (
                      <p>
                        <span className="font-medium">Género:</span>{" "}
                        {pet.gender === "macho" ? "Macho" : pet.gender === "hembra" ? "Hembra" : "Desconocido"}
                      </p>
                    )}
                  </div>

                  {pet.personality && pet.personality.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {pet.personality.map((trait, index) => (
                        <Badge key={index} variant="outline">
                          {trait}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {pet.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {pet.bio}
                    </p>
                  )}

                  {pet.breed && (
                    <BreedTips breed={pet.breed} species={pet.species} />
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/edit-pet/${pet.id}`)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(pet.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará permanentemente el
                perfil de esta mascota y todos sus registros asociados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
  );
};

export default MyPets;
