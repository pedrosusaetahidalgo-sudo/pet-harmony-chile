import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, MapPin, Phone, Mail, Award, CheckCircle } from "lucide-react";
import LostPetsMap from "@/components/LostPetsMap";
import ReportLostPetForm from "@/components/ReportLostPetForm";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const LostPets = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<"lost" | "found">("lost");

  const { data: lostPets, refetch, isError } = useQuery({
    queryKey: ["lostPets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lost_pets")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleReportCreated = () => {
    setIsReportDialogOpen(false);
    refetch();
  };

  const markAsFound = async (petId: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('lost_pets')
      .update({
        is_active: false,
        status: 'found',
      })
      .eq('id', petId)
      .eq('reporter_id', user.id);

    if (!error) {
      toast({ title: "¡Genial!", description: "Nos alegra que haya aparecido" });
      refetch();
    }
  };

  const lostPetsList = lostPets?.filter(p => p.report_type === "lost");
  const foundPetsList = lostPets?.filter(p => p.report_type === "found");

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-muted-foreground">No pudimos cargar las publicaciones. Intenta de nuevo.</p>
        <Button variant="outline" onClick={() => refetch()} className="mt-4">Reintentar</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-warm-gradient bg-clip-text text-transparent">
            Mascotas Perdidas y Encontradas
          </h1>
          <p className="text-muted-foreground mt-2">
            Sistema de alertas estilo SOSafe para ayudar a reunir mascotas con sus dueños
          </p>
        </div>
        <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-warm-gradient hover:opacity-90">
              <AlertCircle className="mr-2 h-4 w-4" />
              Reportar Mascota
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Reportar Mascota</DialogTitle>
            </DialogHeader>
            <ReportLostPetForm onSuccess={handleReportCreated} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Mapa de Ubicaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LostPetsMap pets={lostPets || []} />
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Reportes Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="lost" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="lost">Perdidas ({lostPetsList?.length || 0})</TabsTrigger>
                <TabsTrigger value="found">Encontradas ({foundPetsList?.length || 0})</TabsTrigger>
              </TabsList>

              <TabsContent value="lost" className="space-y-4 mt-4 max-h-[500px] overflow-y-auto">
                {lostPetsList?.map((pet) => (
                  <Card key={pet.id} className="border-l-4 border-l-red-500">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {pet.photo_url && (
                          <img
                            src={pet.photo_url}
                            alt={pet.pet_name}
                            className="w-20 h-20 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-lg">{pet.pet_name}</h3>
                              <Badge variant="outline" className="text-xs">
                                {pet.species} - {pet.breed}
                              </Badge>
                            </div>
                            {pet.reward_offered && (
                              <Badge className="bg-green-500">
                                <Award className="h-3 w-3 mr-1" />
                                ${pet.reward_amount}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {pet.description}
                          </p>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {pet.last_seen_location}
                            </div>
                            <div>
                              Visto hace: {formatDistanceToNow(new Date(pet.last_seen_date), { 
                                addSuffix: true, 
                                locale: es 
                              })}
                            </div>
                            {pet.contact_phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {pet.contact_phone}
                              </div>
                            )}
                            {pet.contact_email && (
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {pet.contact_email}
                              </div>
                            )}
                          </div>
                          {user && pet.reporter_id === user.id && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-2 text-green-600 border-green-300 hover:bg-green-50"
                              onClick={() => markAsFound(pet.id)}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              ¡Lo encontré!
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {(!lostPetsList || lostPetsList.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">
                    No hay mascotas perdidas reportadas
                  </p>
                )}
              </TabsContent>

              <TabsContent value="found" className="space-y-4 mt-4 max-h-[500px] overflow-y-auto">
                {foundPetsList?.map((pet) => (
                  <Card key={pet.id} className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {pet.photo_url && (
                          <img
                            src={pet.photo_url}
                            alt={pet.pet_name}
                            className="w-20 h-20 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1 space-y-2">
                          <div>
                            <h3 className="font-semibold text-lg">{pet.pet_name || "Mascota sin identificar"}</h3>
                            <Badge variant="outline" className="text-xs">
                              {pet.species} - {pet.breed || "Raza desconocida"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {pet.description}
                          </p>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {pet.last_seen_location}
                            </div>
                            <div>
                              Encontrada hace: {formatDistanceToNow(new Date(pet.last_seen_date), { 
                                addSuffix: true, 
                                locale: es 
                              })}
                            </div>
                            {pet.contact_phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {pet.contact_phone}
                              </div>
                            )}
                            {pet.contact_email && (
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {pet.contact_email}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {(!foundPetsList || foundPetsList.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">
                    No hay mascotas encontradas reportadas
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LostPets;
