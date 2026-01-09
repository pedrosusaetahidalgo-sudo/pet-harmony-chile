import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, FileText, Syringe, Pill, Stethoscope, Activity, MapPin, User, Heart, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AddMedicalRecord } from "@/components/AddMedicalRecord";
import { MedicalDocumentsTab } from "@/components/medical/MedicalDocumentsTab";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const MedicalRecords = () => {
  const { user } = useAuth();
  const [selectedPetId, setSelectedPetId] = useState<string>("");

  const { data: pets } = useQuery({
    queryKey: ["user-pets", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("pets")
        .select("*")
        .eq("owner_id", user.id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: medicalRecords, isLoading } = useQuery({
    queryKey: ["medical-records", selectedPetId],
    queryFn: async () => {
      if (!selectedPetId) return [];

      const { data, error } = await supabase
        .from("medical_records")
        .select("*")
        .eq("pet_id", selectedPetId)
        .order("date", { ascending: false }) // Most recent first for chronological timeline
        .order("created_at", { ascending: false }); // Secondary sort by creation time
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedPetId,
  });

  const selectedPet = pets?.find(p => p.id === selectedPetId);

  const getRecordIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "vacuna":
        return <Syringe className="h-5 w-5" />;
      case "consulta":
        return <Stethoscope className="h-5 w-5" />;
      case "medicamento":
      case "tratamiento":
        return <Pill className="h-5 w-5" />;
      case "cirugia":
        return <Activity className="h-5 w-5" />;
      case "examen":
        return <FileText className="h-5 w-5" />;
      case "emergencia":
        return <Activity className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getRecordColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "vacuna":
        return "bg-medical/10 text-medical border-medical/20";
      case "consulta":
        return "bg-secondary/10 text-secondary border-secondary/20";
      case "medicamento":
      case "tratamiento":
        return "bg-primary/10 text-primary border-primary/20";
      case "cirugia":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "examen":
        return "bg-appointment/10 text-appointment border-appointment/20";
      case "emergencia":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted/10 text-muted-foreground border-muted/20";
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "d 'de' MMMM, yyyy", { locale: es });
  };

  const groupRecordsByYear = (records: any[]) => {
    const grouped: Record<string, any[]> = {};
    records.forEach(record => {
      const year = new Date(record.date).getFullYear().toString();
      if (!grouped[year]) {
        grouped[year] = [];
      }
      grouped[year].push(record);
    });
    return grouped;
  };

  return (
    <div className="container max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-medical-gradient bg-clip-text text-transparent">
              Historial Médico
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestiona y revisa el historial médico completo de tus mascotas
            </p>
          </div>
        </div>

        {!pets || pets.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tienes mascotas registradas</h3>
              <p className="text-muted-foreground text-center mb-4">
                Primero debes agregar una mascota para gestionar su historial médico
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Pet Selector */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex-1">
                <Select value={selectedPetId} onValueChange={setSelectedPetId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona una mascota" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {pets.map((pet) => (
                      <SelectItem key={pet.id} value={pet.id}>
                        {pet.name} ({pet.species} - {pet.breed})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedPetId && selectedPet && (
                <AddMedicalRecord 
                  petId={selectedPetId} 
                  petBreed={selectedPet.breed || ""} 
                  petSpecies={selectedPet.species}
                />
              )}
            </div>

            {selectedPetId ? (
              <Tabs defaultValue="timeline" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger 
                    value="timeline" 
                    className="data-[state=active]:bg-medical-gradient data-[state=active]:text-white"
                  >
                    <Heart className="h-4 w-4 mr-2" />
                    Timeline
                  </TabsTrigger>
                  <TabsTrigger 
                    value="documents"
                    className="data-[state=active]:bg-primary data-[state=active]:text-white"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Documentos
                  </TabsTrigger>
                  <TabsTrigger 
                    value="upcoming"
                    className="data-[state=active]:bg-appointment-gradient data-[state=active]:text-white"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Próximas Citas
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="timeline" className="space-y-6">
                  {!medicalRecords || medicalRecords.length === 0 ? (
                    <Card className="border-dashed">
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No hay registros médicos</h3>
                        <p className="text-muted-foreground text-center mb-4">
                          Comienza a agregar el historial médico de {selectedPet?.name}
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-8">
                      {Object.entries(groupRecordsByYear(medicalRecords))
                        .sort(([yearA], [yearB]) => parseInt(yearB) - parseInt(yearA))
                        .map(([year, records]) => (
                          <div key={year} className="space-y-4">
                            <h2 className="text-2xl font-bold text-primary sticky top-0 bg-background py-2 z-10">
                              {year}
                            </h2>
                            <div className="relative space-y-6 pl-8 before:absolute before:left-3 before:top-0 before:bottom-0 before:w-0.5 before:bg-border">
                              {records
                                .sort((a: any, b: any) => {
                                  // Sort by date descending (most recent first), then by created_at
                                  const dateA = new Date(a.date).getTime();
                                  const dateB = new Date(b.date).getTime();
                                  if (dateA !== dateB) return dateB - dateA;
                                  return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
                                })
                                .map((record: any) => (
                                <div key={record.id} className="relative">
                                  <div className={`absolute -left-8 top-6 w-10 h-10 rounded-full flex items-center justify-center shadow-soft ${getRecordColor(record.record_type)}`}>
                                    {getRecordIcon(record.record_type)}
                                  </div>
                                  
                                  <Card className="hover:shadow-medium transition-all duration-300 border-l-4 border-l-transparent hover:border-l-medical">
                                    <CardHeader className="pb-3">
                                      <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                          <CardTitle className="text-lg">{record.title}</CardTitle>
                                          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                            <Clock className="h-3.5 w-3.5" />
                                            {formatDate(record.date)}
                                          </p>
                                        </div>
                                        <Badge className={`capitalize ${getRecordColor(record.record_type)}`}>
                                          {record.record_type}
                                        </Badge>
                                      </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                      {record.description && (
                                        <p className="text-sm text-muted-foreground">
                                          {record.description}
                                        </p>
                                      )}
                                      
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                        {record.clinic_name && (
                                          <div className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                                            <span className="text-muted-foreground">{record.clinic_name}</span>
                                          </div>
                                        )}
                                        
                                        {record.veterinarian_name && (
                                          <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-primary flex-shrink-0" />
                                            <span className="text-muted-foreground">Dr. {record.veterinarian_name}</span>
                                          </div>
                                        )}
                                      </div>

                                      {record.next_date && (
                                        <div className="flex items-center gap-2 text-sm bg-primary/5 p-3 rounded-md border border-primary/20">
                                          <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
                                          <div>
                                            <span className="font-medium text-primary">
                                              Próxima cita:
                                            </span>
                                            <span className="ml-2 text-muted-foreground">
                                              {formatDate(record.next_date)}
                                            </span>
                                          </div>
                                        </div>
                                      )}
                                      
                                      {record.notes && (
                                        <div className="bg-muted/50 p-3 rounded-md">
                                          <p className="text-sm font-medium mb-1">Notas:</p>
                                          <p className="text-sm text-muted-foreground">{record.notes}</p>
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="documents" className="space-y-4">
                  <MedicalDocumentsTab petId={selectedPetId} />
                </TabsContent>

                <TabsContent value="upcoming" className="space-y-4">
                  {medicalRecords?.filter(r => r.next_date && new Date(r.next_date) >= new Date()).length === 0 ? (
                    <Card className="border-dashed">
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No hay citas próximas</h3>
                        <p className="text-muted-foreground text-center">
                          Las citas programadas aparecerán aquí
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-4">
                      {medicalRecords
                        ?.filter(r => r.next_date && new Date(r.next_date) >= new Date())
                        .sort((a, b) => new Date(a.next_date!).getTime() - new Date(b.next_date!).getTime())
                        .map((record: any) => (
                          <Card key={record.id} className="hover:shadow-medium transition-all duration-300 border-l-4 border-l-appointment bg-appointment-gradient/5">
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-full ${getRecordColor(record.record_type)}`}>
                                    {getRecordIcon(record.record_type)}
                                  </div>
                                  <div>
                                    <h3 className="font-semibold text-lg">{record.title}</h3>
                                    <Badge className={`capitalize mt-1 ${getRecordColor(record.record_type)}`}>
                                      {record.record_type}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm text-muted-foreground flex items-center gap-1 justify-end">
                                    <Calendar className="h-3.5 w-3.5" />
                                    Próxima cita
                                  </div>
                                  <div className="font-semibold text-appointment">
                                    {formatDate(record.next_date)}
                                  </div>
                                </div>
                              </div>

                              {record.clinic_name && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <MapPin className="h-4 w-4" />
                                  {record.clinic_name}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Selecciona una mascota</h3>
                  <p className="text-muted-foreground text-center">
                    Elige una mascota para ver y gestionar su historial médico
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
  );
};

export default MedicalRecords;
