import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { OnboardingTutorial } from "@/components/OnboardingTutorial";
import { HomeOnboardingHints } from "@/components/HomeOnboardingHints";
import {
  PawPrint,
  Plus,
  Calendar,
  Stethoscope,
  AlertCircle,
  Bell,
  CheckCircle2,
  Map,
  Crown,
  Syringe,
  FileText,
  TrendingUp,
} from "@/lib/icons";
import { getGreeting } from "@/lib/format";
import { useGamification } from "@/hooks/useGamification";
import { useReminders } from "@/hooks/useReminders";
import { StatusCard } from "@/components/home/StatusCard";
import ActivityFeed from "@/components/social/ActivityFeed";
import { LINKS } from "@/lib/links";
import { useGoToAddPet } from "@/hooks/useCanAddPet";
import { logger } from "@/lib/logger";
import { formatDistanceToNowStrict, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  photo_url: string | null;
}

interface Appointment {
  id: string;
  title: string;
  scheduled_date: string;
  pet_id: string;
}

interface Profile {
  display_name: string | null;
  avatar_url: string | null;
  is_premium?: boolean;
}

interface VaccineStatusByPet {
  [petId: string]: { upToDate: boolean; pendingName?: string };
}

interface CompletenessByPet {
  [petId: string]: number;
}

const PET_PROFILE_FIELDS = [
  "name",
  "species",
  "breed",
  "birth_date",
  "gender",
  "size",
  "color",
  "weight",
  "photo_url",
  "microchip_number",
] as const;

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const goToAddPet = useGoToAddPet();
  const [pets, setPets] = useState<Pet[]>([]);
  const [activePetId, setActivePetId] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [vaccineStatus, setVaccineStatus] = useState<VaccineStatusByPet>({});
  const [completeness, setCompleteness] = useState<CompletenessByPet>({});
  const [showTutorial, setShowTutorial] = useState(false);
  const [loading, setLoading] = useState(true);
  const { stats } = useGamification();
  const { upcomingReminders, overdueReminders, completeReminder } = useReminders();

  useEffect(() => {
    if (user) {
      void loadData();
      checkOnboarding();
    }
  }, [user]);

  const checkOnboarding = () => {
    const hasSeenTutorial = localStorage.getItem("hasSeenTutorial");
    if (!hasSeenTutorial) {
      setShowTutorial(true);
    }
  };

  const loadData = async () => {
    if (!user) return;

    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("display_name, avatar_url, is_premium")
        .eq("id", user.id)
        .maybeSingle();
      if (profileData) setProfile(profileData);

      const { data: petsData } = await supabase
        .from("pets")
        .select("*")
        .eq("owner_id", user.id);

      const petsList: Pet[] = (petsData || []).map((p) => ({
        id: p.id,
        name: p.name,
        species: p.species,
        breed: p.breed,
        photo_url: p.photo_url,
      }));
      setPets(petsList);
      if (petsList.length > 0 && !activePetId) {
        setActivePetId(petsList[0].id);
      }

      // Compute completeness from full pet rows
      const compMap: CompletenessByPet = {};
      (petsData || []).forEach((p) => {
        const total = PET_PROFILE_FIELDS.length;
        const filled = PET_PROFILE_FIELDS.reduce((acc, key) => {
          const v = (p as Record<string, unknown>)[key];
          return acc + (v !== null && v !== undefined && v !== "" ? 1 : 0);
        }, 0);
        compMap[p.id] = Math.round((filled / total) * 100);
      });
      setCompleteness(compMap);

      const { data: appointmentsData } = await supabase
        .from("appointments")
        .select("id, title, scheduled_date, pet_id")
        .gte("scheduled_date", new Date().toISOString())
        .order("scheduled_date", { ascending: true })
        .limit(5);
      if (appointmentsData) setAppointments(appointmentsData);

      // Vaccine status: use pet_reminders type=vaccine to find pending; if none pending => al día
      if (petsList.length > 0) {
        const petIds = petsList.map((p) => p.id);
        const { data: vaccineReminders } = await supabase
          .from("pet_reminders")
          .select("pet_id, title, due_date, is_completed")
          .in("pet_id", petIds)
          .eq("type", "vaccine");
        const status: VaccineStatusByPet = {};
        petsList.forEach((p) => {
          const pending = (vaccineReminders || []).find(
            (r) => r.pet_id === p.id && !r.is_completed && new Date(r.due_date) <= new Date()
          );
          status[p.id] = pending
            ? { upToDate: false, pendingName: pending.title }
            : { upToDate: true };
        });
        setVaccineStatus(status);
      }
    } catch (error) {
      logger.error("Error loading home data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTutorialComplete = () => {
    setShowTutorial(false);
  };

  const activePet = useMemo(
    () => pets.find((p) => p.id === activePetId) || null,
    [pets, activePetId]
  );

  const nextAppointmentForActive = useMemo(() => {
    if (!activePet) return null;
    return appointments.find((a) => a.pet_id === activePet.id) || appointments[0] || null;
  }, [appointments, activePet]);

  const nextAppointmentLabel = (() => {
    if (!nextAppointmentForActive) return "Sin agendar";
    try {
      return `en ${formatDistanceToNowStrict(parseISO(nextAppointmentForActive.scheduled_date), { locale: es })}`;
    } catch {
      return "Próxima";
    }
  })();

  const activeVaccine = activePet ? vaccineStatus[activePet.id] : undefined;
  const activeCompleteness = activePet ? completeness[activePet.id] ?? 0 : 0;
  const streakDays = (stats as unknown as { streak_days?: number } | null | undefined)?.streak_days ?? 0;

  if (loading) {
    return (
      <div className="container max-w-6xl mx-auto p-4 md:p-6 space-y-4 animate-fade-in">
        <div className="rounded-2xl bg-muted/40 p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full skeleton" />
            <div className="space-y-2">
              <div className="h-4 w-40 skeleton" />
              <div className="h-3 w-24 skeleton" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="h-20 rounded-xl skeleton" />
          <div className="h-20 rounded-xl skeleton" />
          <div className="h-20 rounded-xl skeleton" />
          <div className="h-20 rounded-xl skeleton" />
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto p-4 md:p-6 space-y-4 md:space-y-6 animate-fade-in">
      {showTutorial && <OnboardingTutorial onComplete={handleTutorialComplete} />}

      {/* === Header mínimo === */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative flex-shrink-0">
            <Avatar className="h-10 w-10 ring-2 ring-background shadow">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-warm-gradient text-white text-sm font-bold">
                {(() => {
                  if (profile?.display_name) {
                    const parts = profile.display_name.trim().split(/\s+/);
                    if (parts.length >= 2) {
                      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
                    }
                    return profile.display_name[0].toUpperCase();
                  }
                  return user?.email?.[0]?.toUpperCase() || "U";
                })()}
              </AvatarFallback>
            </Avatar>
            {stats && stats.level > 1 && (
              <div className="absolute -bottom-1 -right-1 bg-yellow-400 rounded-full p-0.5 border border-background">
                <Crown className="h-3 w-3 text-yellow-900" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">
              {getGreeting()}, {profile?.display_name?.split(/\s+/)[0] || user?.email?.split("@")[0] || "Amigo"}
            </p>
            {stats && (
              <p className="text-xs text-muted-foreground">Nivel {stats.level}</p>
            )}
          </div>
        </div>
      </div>

      {/* === Onboarding hints dirigidos para usuarios sin mascotas === */}
      <HomeOnboardingHints hasPets={pets.length > 0} />

      {/* === Contenido principal cuando ya hay mascotas === */}
      {pets.length === 0 ? null : (
        <>
          {/* === Pet switcher (avatares circulares estilo stories) === */}
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
            {pets.map((pet) => {
              const isActive = activePetId === pet.id;
              return (
                <button
                  key={pet.id}
                  onClick={() => setActivePetId(pet.id)}
                  className="flex flex-col items-center gap-1 flex-shrink-0 group"
                  aria-label={`Seleccionar ${pet.name}`}
                >
                  <div
                    className={`relative rounded-full p-[3px] transition-all ${
                      isActive
                        ? "bg-gradient-to-tr from-emerald-500 via-teal-400 to-emerald-600 shadow-lg shadow-emerald-500/30 scale-105"
                        : "bg-muted group-hover:bg-muted/70"
                    }`}
                  >
                    <Avatar className="h-16 w-16 ring-2 ring-background">
                      <AvatarImage src={pet.photo_url || undefined} alt={pet.name} />
                      <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xl font-bold">
                        {pet.name[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {isActive && (
                      <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-emerald-500 border-2 border-background" />
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium max-w-[72px] truncate ${
                      isActive ? "text-emerald-700 font-bold" : "text-muted-foreground"
                    }`}
                  >
                    {pet.name}
                  </span>
                </button>
              );
            })}

            {/* Botón "+" agregar mascota */}
            <button
              onClick={goToAddPet}
              className="flex flex-col items-center gap-1 flex-shrink-0 group"
              aria-label="Agregar mascota"
            >
              <div className="rounded-full p-[3px] bg-muted group-hover:bg-emerald-100 transition-colors">
                <div className="h-16 w-16 rounded-full border-2 border-dashed border-emerald-400 group-hover:border-emerald-600 bg-background flex items-center justify-center transition-colors">
                  <Plus className="h-7 w-7 text-emerald-500 group-hover:text-emerald-700 transition-colors" />
                </div>
              </div>
              <span className="text-xs font-medium text-muted-foreground group-hover:text-emerald-700">
                Agregar
              </span>
            </button>
          </div>

          {/* === Status cards 2x2 mobile, 4x1 desktop === */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatusCard
              icon={Calendar}
              title="Próxima cita"
              value={nextAppointmentLabel}
              accent={nextAppointmentForActive ? "default" : "warning"}
              onClick={() => navigate(LINKS.bookings())}
            />
            <StatusCard
              icon={Syringe}
              title="Vacunas"
              value={
                activeVaccine?.upToDate
                  ? "Al día"
                  : activeVaccine?.pendingName
                    ? `Pendiente: ${activeVaccine.pendingName}`
                    : "Sin datos"
              }
              accent={activeVaccine?.upToDate ? "success" : "warning"}
              onClick={() =>
                navigate(activePet ? `/medical-records?pet=${activePet.id}` : LINKS.medicalRecords())
              }
            />
            <StatusCard
              icon={FileText}
              title="Ficha médica"
              value={`${activeCompleteness}% completa`}
              accent={activeCompleteness >= 80 ? "success" : "default"}
              onClick={() =>
                navigate(activePet ? `/medical-records?pet=${activePet.id}` : LINKS.medicalRecords())
              }
            />
            <StatusCard
              icon={TrendingUp}
              title="Racha paseos"
              value={streakDays > 0 ? `${streakDays} ${streakDays === 1 ? "día" : "días"}` : "Empieza hoy"}
              accent={streakDays > 0 ? "success" : "default"}
              onClick={() => navigate(LINKS.pawGame())}
            />
          </div>
        </>
      )}

      {/* === HEALTH ALERTS === */}
      {(overdueReminders.length > 0 || upcomingReminders.length > 0) && (
        <Card
          className={`border-l-4 ${overdueReminders.length > 0 ? "border-l-red-500 bg-red-50/50" : "border-l-amber-400 bg-amber-50/50"}`}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              {overdueReminders.length > 0 ? (
                <>
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="text-red-900">Requiere atención</span>
                </>
              ) : (
                <>
                  <Bell className="h-5 w-5 text-amber-600" />
                  <span className="text-amber-900">Próximos cuidados</span>
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {overdueReminders.slice(0, 2).map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between p-2 rounded-lg bg-white border border-red-200"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{r.title}</p>
                  <p className="text-xs text-red-700 truncate">
                    {r.pets?.name} · vencido
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => completeReminder.mutate(r.id)}
                  title="Marcar como hecho"
                >
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {upcomingReminders.slice(0, 2).map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between p-2 rounded-lg bg-white border border-amber-200"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{r.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{r.pets?.name}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => completeReminder.mutate(r.id)}
                >
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {(overdueReminders.length + upcomingReminders.length > 4) && (
              <Button
                variant="link"
                size="sm"
                onClick={() => navigate("/reminders")}
                className="w-full text-xs h-8 mt-1"
              >
                Ver todos los recordatorios →
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* === Activity feed slot === */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Actividad de la comunidad</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityFeed limit={3} />
        </CardContent>
      </Card>

      {/* === Acciones rápidas horizontales === */}
      <div>
        <h3 className="text-sm font-semibold mb-2">Acciones rápidas</h3>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 lg:grid lg:grid-cols-4 lg:overflow-visible">
          <Button
            variant="outline"
            className="flex-shrink-0 lg:w-full justify-start h-auto py-2.5"
            onClick={() => navigate(LINKS.vets())}
          >
            <Stethoscope className="h-4 w-4 mr-2 text-emerald-600" />
            <span className="text-xs">Reservar vet</span>
          </Button>
          <Button
            variant="outline"
            className="flex-shrink-0 lg:w-full justify-start h-auto py-2.5"
            onClick={() =>
              navigate(activePet ? `/medical-records?pet=${activePet.id}` : LINKS.medicalRecords())
            }
          >
            <FileText className="h-4 w-4 mr-2 text-blue-600" />
            <span className="text-xs">Ficha médica</span>
          </Button>
          <Button
            variant="outline"
            className="flex-shrink-0 lg:w-full justify-start h-auto py-2.5"
            onClick={() => navigate("/precios-veterinarios")}
          >
            <TrendingUp className="h-4 w-4 mr-2 text-amber-600" />
            <span className="text-xs">Precios vets</span>
          </Button>
          <Button
            variant="outline"
            className="flex-shrink-0 lg:w-full justify-start h-auto py-2.5"
            onClick={() => navigate(LINKS.maps())}
          >
            <Map className="h-4 w-4 mr-2 text-indigo-600" />
            <span className="text-xs">Mapa</span>
          </Button>
          <Button
            variant="outline"
            className="flex-shrink-0 lg:w-full justify-start h-auto py-2.5"
            onClick={goToAddPet}
          >
            <Plus className="h-4 w-4 mr-2 text-emerald-600" />
            <span className="text-xs">Agregar mascota</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
