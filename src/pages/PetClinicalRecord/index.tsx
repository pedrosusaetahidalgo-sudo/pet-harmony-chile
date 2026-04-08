import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useReminders } from "@/hooks/useReminders";

import {
  Heart, Shield, Stethoscope, FileText, Share2,
  AlertTriangle, Dog, Calendar, Activity, Clipboard, Clock,
  ArrowLeft, Download, Plus,
} from "@/lib/icons";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PetAssistant } from "@/components/ai/PetAssistant";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import type { PetData } from "./types";
import { ClinicalRecordSkeleton, EmptyState, PetHeader } from "./shared";
import { TabResumen } from "./tabs/TabResumen";
import { TabHistorial } from "./tabs/TabHistorial";
import { TabAlimentacion } from "./tabs/TabAlimentacion";
import { TabDocumentos } from "./tabs/TabDocumentos";
import { TabCompartir } from "./tabs/TabCompartir";
import { generatePDF } from "./pdf";

const PetClinicalRecord = () => {
  const { petId } = useParams<{ petId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { addReminder } = useReminders();
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);
  const [reminderData, setReminderData] = useState({ type: "vaccine", title: "", due_date: "" });

  const { data: pet, isLoading: petLoading, error } = useQuery({
    queryKey: ["pet-clinical", petId],
    queryFn: async () => {
      if (!petId) return null;
      const { data, error } = await supabase
        .from("pets")
        .select("*")
        .eq("id", petId)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown) as PetData | null;
    },
    enabled: !!petId && !authLoading,
  });

  const { data: userPets } = useQuery({
    queryKey: ["user-pets", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("pets")
        .select("id, name, species, photo_url")
        .eq("owner_id", user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: medicalRecords = [] } = useQuery({
    queryKey: ["pet-medical-records-pdf", petId],
    queryFn: async () => {
      if (!petId) return [];
      const { data } = await supabase
        .from("medical_records")
        .select("*")
        .eq("pet_id", petId)
        .order("date", { ascending: false });
      return data || [];
    },
    enabled: !!petId && !authLoading,
  });

  if (authLoading || petLoading) {
    return <ClinicalRecordSkeleton />;
  }

  if (error) {
    return (
      <div className="container max-w-4xl mx-auto p-4 md:p-6">
        <EmptyState
          icon={AlertTriangle}
          title="Error al cargar"
          description="No se pudo cargar la ficha clínica. Intenta nuevamente."
        />
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="container max-w-4xl mx-auto p-4 md:p-6">
        <EmptyState
          icon={Dog}
          title="Mascota no encontrada"
          description="No se encontro la mascota solicitada o no tienes permisos para verla."
        />
      </div>
    );
  }

  if (pet.owner_id !== user?.id) {
    return (
      <div className="container max-w-4xl mx-auto p-4 md:p-6">
        <EmptyState
          icon={Shield}
          title="Acceso restringido"
          description="Solo el dueño de la mascota puede ver su ficha clínica."
        />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="text-muted-foreground hover:text-foreground -ml-2"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Volver
      </Button>

      {userPets && userPets.length > 1 && (
        <div className="flex items-center gap-3">
          <Label className="text-sm text-muted-foreground whitespace-nowrap">Mascota:</Label>
          <Select value={petId} onValueChange={(id) => navigate(`/pet/${id}/clinical`)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {userPets.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} ({p.species})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Ficha Clínica</h1>
          <p className="text-sm text-muted-foreground">
            Registro veterinario completo de {pet.name}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => generatePDF(pet, medicalRecords)}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Descargar PDF</span>
        </Button>
      </div>

      <PetHeader pet={pet} />

      {showAssistant ? (
        <PetAssistant petId={pet.id} petName={pet.name} onClose={() => setShowAssistant(false)} />
      ) : (
        <Button variant="outline" size="sm" onClick={() => setShowAssistant(true)} className="gap-2 mb-4">
          <Stethoscope className="h-3.5 w-3.5" />
          Preguntar a la IA sobre {pet.name}
        </Button>
      )}

      <Tabs defaultValue="resumen" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="resumen" className="text-xs sm:text-sm">
            <Heart className="h-3.5 w-3.5 mr-1 hidden sm:inline-block" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="historial" className="text-xs sm:text-sm">
            <Clock className="h-3.5 w-3.5 mr-1 hidden sm:inline-block" />
            Historial
          </TabsTrigger>
          <TabsTrigger value="alimentacion" className="text-xs sm:text-sm">
            <Activity className="h-3.5 w-3.5 mr-1 hidden sm:inline-block" />
            Hábitos
          </TabsTrigger>
          <TabsTrigger value="documentos" className="text-xs sm:text-sm">
            <FileText className="h-3.5 w-3.5 mr-1 hidden sm:inline-block" />
            Documentos
          </TabsTrigger>
          <TabsTrigger value="compartir" className="text-xs sm:text-sm">
            <Share2 className="h-3.5 w-3.5 mr-1 hidden sm:inline-block" />
            Compartir
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="mt-4 space-y-4">
          <TabResumen pet={pet} />
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground mb-3">
                ¿Necesitas actualizar la información clínica de {pet.name}?
              </p>
              <Button variant="outline" size="sm" onClick={() => navigate(`/edit-pet/${pet.id}`)}>
                <Clipboard className="h-4 w-4 mr-2" />
                Editar datos clínicos
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground mb-3">
                Programa recordatorios de vacunas, controles y medicamentos
              </p>
              <Dialog open={showReminderForm} onOpenChange={setShowReminderForm}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Recordatorio
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nuevo Recordatorio</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select value={reminderData.type} onValueChange={(v) => setReminderData(d => ({...d, type: v}))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="vaccine">Vacuna</SelectItem>
                          <SelectItem value="checkup">Control veterinario</SelectItem>
                          <SelectItem value="medication">Medicamento</SelectItem>
                          <SelectItem value="grooming">Peluquería</SelectItem>
                          <SelectItem value="weight">Control de peso</SelectItem>
                          <SelectItem value="custom">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Título</Label>
                      <Input
                        value={reminderData.title}
                        onChange={(e) => setReminderData(d => ({...d, title: e.target.value}))}
                        placeholder="Ej: Vacuna antirrábica"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha</Label>
                      <Input
                        type="date"
                        value={reminderData.due_date}
                        onChange={(e) => setReminderData(d => ({...d, due_date: e.target.value}))}
                      />
                    </div>
                    <Button
                      className="w-full"
                      disabled={!reminderData.title || !reminderData.due_date}
                      onClick={() => {
                        addReminder.mutate({
                          pet_id: pet.id,
                          type: reminderData.type,
                          title: reminderData.title,
                          due_date: reminderData.due_date,
                        });
                        setShowReminderForm(false);
                        setReminderData({ type: "vaccine", title: "", due_date: "" });
                      }}
                    >
                      Crear Recordatorio
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historial" className="mt-4">
          <TabHistorial petId={pet.id} />
        </TabsContent>

        <TabsContent value="alimentacion" className="mt-4 space-y-4">
          <TabAlimentacion pet={pet} />
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground mb-3">
                ¿Necesitas actualizar la información clínica de {pet.name}?
              </p>
              <Button variant="outline" size="sm" onClick={() => navigate(`/edit-pet/${pet.id}`)}>
                <Clipboard className="h-4 w-4 mr-2" />
                Editar datos clínicos
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentos" className="mt-4">
          <TabDocumentos petId={pet.id} />
        </TabsContent>

        <TabsContent value="compartir" className="mt-4">
          <TabCompartir petId={pet.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PetClinicalRecord;
