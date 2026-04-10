import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useReminders } from "@/hooks/useReminders";

import {
  Heart, Shield, Stethoscope, FileText, Share2,
  AlertTriangle, Dog, Calendar, Activity, Clipboard, Clock,
  Download, Plus,
} from "@/lib/icons";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PetAssistant } from "@/components/ai/PetAssistant";
import { MemorialFlow } from "@/components/memorial/MemorialFlow";
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
import { PageHeader } from "@/components/PageHeader";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { LINKS } from "@/lib/links";
import { REMINDER_TYPES } from "@/lib/reminderTypes";

const PetClinicalRecord = () => {
  const { petId } = useParams<{ petId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { addReminder } = useReminders();
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);
  const [showMemorialFlow, setShowMemorialFlow] = useState(false);
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
    <div className="min-h-screen bg-background">
      <PageHeader
        title={`Ficha clínica de ${pet.name}`}
        subtitle="Registro veterinario completo"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => generatePDF(pet, medicalRecords)}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">PDF</span>
          </Button>
        }
      >
        <Breadcrumbs
          items={[
            { label: "Mascotas", to: LINKS.myPets() },
            { label: pet.name },
            { label: "Ficha clínica" },
          ]}
        />
      </PageHeader>
      <div className="container max-w-4xl mx-auto p-4 md:p-6 space-y-6">
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
          {/* PawPoints nudge */}
          <div
            className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 border border-purple-100 cursor-pointer hover:bg-purple-100/50 transition-colors"
            onClick={() => navigate("/paw-game")}
          >
            <span className="text-lg">🐾</span>
            <p className="text-xs text-purple-700 flex-1">
              Completa la ficha de {pet.name} y gana <strong>30 PawPoints</strong>. Canjea por descuentos y premios.
            </p>
            <span className="text-xs text-purple-500 font-medium flex-shrink-0">Ver premios →</span>
          </div>
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
                          {REMINDER_TYPES.map((rt) => (
                            <SelectItem key={rt.value} value={rt.value}>{rt.label}</SelectItem>
                          ))}
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

      {/* Memorial entry point - subtle, at the bottom */}
      {pet.lifecycle_status !== "memorial" && (
        <div className="text-center pt-4">
          <button
            onClick={() => setShowMemorialFlow(true)}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            Si {pet.name} ya no está con nosotros...
          </button>
        </div>
      )}

      {/* Memorial flow dialog */}
      {showMemorialFlow && (
        <Dialog open={showMemorialFlow} onOpenChange={setShowMemorialFlow}>
          <DialogContent className="max-w-lg">
            <MemorialFlow
              petId={pet.id}
              petName={pet.name}
              onComplete={() => {
                setShowMemorialFlow(false);
                navigate("/en-memoria");
              }}
              onCancel={() => setShowMemorialFlow(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Memorial badge for memorial pets */}
      {pet.lifecycle_status === "memorial" && (
        <Card className="border-purple-100 bg-purple-50/30">
          <CardContent className="p-4 text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-purple-400">
              <Heart className="h-4 w-4" />
              <span className="text-sm font-medium">En nuestro corazón</span>
            </div>
            {pet.memorial_message && (
              <p className="text-sm text-muted-foreground italic">
                "{pet.memorial_message}"
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              El historial médico de {pet.name} se preserva con cuidado.
            </p>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
};

export default PetClinicalRecord;
