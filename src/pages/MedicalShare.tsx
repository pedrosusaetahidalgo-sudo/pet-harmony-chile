import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  AlertCircle, Calendar, Download, FileText, Heart, Loader2, PawPrint,
  Phone, Scale, Shield, Stethoscope, Syringe, Share2,
} from "@/lib/icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { PublicHeader, PublicFooter } from "./DirectorioVets";
import { logger } from "@/lib/logger";

interface SharedPet {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  birth_date: string | null;
  weight: number | null;
  gender: string | null;
  photo_url: string | null;
  vaccination_status: string | null;
  chronic_conditions: string[] | null;
  allergies: string[] | null;
  current_medications: any;
  neutered: boolean | null;
  microchip_number: string | null;
}

interface MedicalRecord {
  id: string;
  record_type: string;
  title: string;
  description: string | null;
  date: string;
  vet_name: string | null;
  clinic_name: string | null;
}

function calculateAge(birthDate: string | null): string {
  if (!birthDate) return "Edad desconocida";
  const birth = new Date(birthDate);
  const now = new Date();
  const years = now.getFullYear() - birth.getFullYear();
  const months = now.getMonth() - birth.getMonth();
  if (years > 0) return `${years} año${years > 1 ? "s" : ""}`;
  if (months > 0) return `${months} mes${months > 1 ? "es" : ""}`;
  return "Menos de 1 mes";
}

export default function MedicalShare() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pet, setPet] = useState<SharedPet | null>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [ownerName, setOwnerName] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Link inválido");
      setLoading(false);
      return;
    }

    loadSharedData(token);
  }, [token]);

  const loadSharedData = async (shareToken: string) => {
    try {
      // 1. Validar token
      const { data: tokenData, error: tokenErr } = await supabase
        .from("medical_share_tokens")
        .select("*")
        .eq("token", shareToken)
        .maybeSingle();

      if (tokenErr || !tokenData) {
        setError("Este link no es válido o ha sido eliminado.");
        setLoading(false);
        return;
      }

      if (tokenData.is_revoked) {
        setError("Este link fue revocado por el dueño de la mascota.");
        setLoading(false);
        return;
      }

      if (new Date(tokenData.expires_at) < new Date()) {
        setError("Este link ha expirado. Pide al dueño que genere uno nuevo.");
        setLoading(false);
        return;
      }

      // 2. Actualizar last_accessed_at
      await supabase
        .from("medical_share_tokens")
        .update({ last_accessed_at: new Date().toISOString() })
        .eq("id", tokenData.id);

      // 3. Cargar pet
      const { data: petData, error: petErr } = await supabase
        .from("pets")
        .select(
          "id, name, species, breed, birth_date, weight, gender, photo_url, vaccination_status, chronic_conditions, allergies, current_medications, neutered, microchip_number"
        )
        .eq("id", tokenData.pet_id)
        .single();

      if (petErr || !petData) {
        setError("No se encontró la mascota asociada a este link.");
        setLoading(false);
        return;
      }

      setPet(petData as SharedPet);

      // 4. Cargar historial médico
      const { data: recordsData } = await supabase
        .from("medical_records")
        .select("id, record_type, title, description, date, vet_name, clinic_name")
        .eq("pet_id", tokenData.pet_id)
        .order("date", { ascending: false });

      if (recordsData) {
        setRecords(recordsData.map((r: any) => ({
          id: r.id,
          record_type: r.record_type,
          title: r.title,
          description: r.description,
          date: r.date,
          vet_name: r.vet_name,
          clinic_name: r.clinic_name,
        })));
      }

      // 5. Cargar nombre del dueño
      const { data: ownerData } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", tokenData.owner_id)
        .single();

      setOwnerName(ownerData?.display_name || null);
    } catch (err) {
      logger.error("[MedicalShare] error loading", err);
      setError("Ocurrió un error al cargar la ficha. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppShare = () => {
    if (!pet) return;
    const url = window.location.href;
    const text = `Ficha clínica de ${pet.name}: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-purple-50">
        <PublicHeader />
        <main className="container mx-auto px-4 py-10 max-w-2xl space-y-4">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-purple-50">
        <PublicHeader />
        <main className="container mx-auto px-4 py-10 md:py-16 max-w-md text-center">
          <div className="inline-flex p-4 rounded-full bg-amber-100 mb-4">
            <AlertCircle className="h-12 w-12 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">No se puede acceder</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Link to="/">
            <Button>Ir al inicio</Button>
          </Link>
        </main>
        <PublicFooter />
      </div>
    );
  }

  if (!pet) return null;

  const vaccines = records.filter((r) => r.record_type === "vacuna");
  const consultations = records.filter((r) =>
    ["consulta", "consulta_general", "control_sano", "seguimiento", "urgencia", "emergencia"].includes(r.record_type)
  );
  const dewormings = records.filter((r) =>
    ["desparasitacion", "antipulgas"].includes(r.record_type)
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <PublicHeader />
      <main className="container mx-auto px-4 py-6 max-w-2xl space-y-4">
        {/* Header con datos del pet */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-4 text-white">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 border-2 border-white/30">
                {pet.photo_url ? (
                  <AvatarImage src={pet.photo_url} alt={pet.name} />
                ) : null}
                <AvatarFallback className="text-2xl bg-white/20">
                  <PawPrint className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">{pet.name}</h1>
                <p className="text-white/80">
                  {pet.species} {pet.breed ? `· ${pet.breed}` : ""} · {calculateAge(pet.birth_date)}
                </p>
                {ownerName && (
                  <p className="text-white/60 text-sm mt-1">Dueño/a: {ownerName}</p>
                )}
              </div>
            </div>
          </div>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              {pet.weight && (
                <div className="flex items-center gap-2">
                  <Scale className="h-4 w-4 text-muted-foreground" />
                  <span>{pet.weight} kg</span>
                </div>
              )}
              {pet.gender && (
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-muted-foreground" />
                  <span>{pet.gender === "macho" ? "Macho" : "Hembra"}</span>
                </div>
              )}
              {pet.neutered !== null && (
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span>{pet.neutered ? "Esterilizado/a" : "No esterilizado/a"}</span>
                </div>
              )}
              {pet.microchip_number && (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">Chip: {pet.microchip_number}</span>
                </div>
              )}
            </div>

            {/* Condiciones y alergias */}
            {(pet.chronic_conditions?.length || pet.allergies?.length) && (
              <div className="mt-4 space-y-2">
                {pet.chronic_conditions && pet.chronic_conditions.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Condiciones crónicas</p>
                    <div className="flex flex-wrap gap-1">
                      {pet.chronic_conditions.map((c) => (
                        <Badge key={c} variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                          {c}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {pet.allergies && pet.allergies.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Alergias</p>
                    <div className="flex flex-wrap gap-1">
                      {pet.allergies.map((a) => (
                        <Badge key={a} variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                          {a}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Vaccination status */}
            {pet.vaccination_status && (
              <div className="mt-3">
                <Badge
                  variant="outline"
                  className={
                    pet.vaccination_status === "up_to_date"
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }
                >
                  <Syringe className="h-3 w-3 mr-1" />
                  {pet.vaccination_status === "up_to_date" ? "Vacunas al día" : "Vacunas pendientes"}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Botones de acción */}
        <div className="flex gap-2">
          <Button onClick={handleWhatsAppShare} variant="outline" className="flex-1">
            <Share2 className="h-4 w-4 mr-2" />
            Compartir por WhatsApp
          </Button>
          <Button variant="outline" className="flex-1" asChild>
            <a
              href={`${window.location.origin}/api/medical-pdf/${pet.id}?token=${token}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download className="h-4 w-4 mr-2" />
              Descargar PDF
            </a>
          </Button>
        </div>

        {/* Vacunas */}
        <RecordSection
          title="Vacunas"
          icon={<Syringe className="h-5 w-5 text-green-600" />}
          records={vaccines}
          emptyText="Sin vacunas registradas"
        />

        {/* Consultas */}
        <RecordSection
          title="Consultas veterinarias"
          icon={<Stethoscope className="h-5 w-5 text-purple-600" />}
          records={consultations}
          emptyText="Sin consultas registradas"
        />

        {/* Desparasitaciones */}
        <RecordSection
          title="Desparasitaciones"
          icon={<Shield className="h-5 w-5 text-blue-600" />}
          records={dewormings}
          emptyText="Sin desparasitaciones registradas"
        />

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground py-4">
          Ficha compartida desde Paw Friend · pawfriend.cl
        </p>
      </main>
      <PublicFooter />
    </div>
  );
}

function RecordSection({
  title,
  icon,
  records,
  emptyText,
}: {
  title: string;
  icon: React.ReactNode;
  records: MedicalRecord[];
  emptyText: string;
}) {
  if (records.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            {icon} {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{emptyText}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          {icon} {title}
          <Badge variant="secondary" className="ml-auto text-xs">
            {records.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {records.map((r) => (
          <div key={r.id} className="flex items-start gap-3 text-sm">
            <div className="flex items-center gap-1 text-muted-foreground shrink-0 w-20">
              <Calendar className="h-3 w-3" />
              <span className="text-xs">
                {format(new Date(r.date), "dd MMM yyyy", { locale: es })}
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-medium">{r.title}</p>
              {r.description && (
                <p className="text-muted-foreground text-xs line-clamp-2">{r.description}</p>
              )}
              {(r.vet_name || r.clinic_name) && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {[r.vet_name, r.clinic_name].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
