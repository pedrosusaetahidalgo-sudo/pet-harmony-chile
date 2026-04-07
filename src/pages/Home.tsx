import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { OnboardingTutorial } from "@/components/OnboardingTutorial";
import { 
  PawPrint, 
  Plus, 
  Calendar, 
  MapPin, 
  Heart, 
  Dog, 
  Stethoscope, 
  Clock, 
  ArrowRight,
  Sparkles,
  Users,
  AlertCircle,
  Bell,
  CheckCircle2,
  Compass,
  Map,
  Gamepad2,
  Trophy,
  Zap,
  Crown,
  X
} from "@/lib/icons";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { getGreeting } from "@/lib/format";
import { useGamification } from "@/hooks/useGamification";
import { useReminders } from "@/hooks/useReminders";
import PointsWidget from "@/components/PointsWidget";
import MissionCard from "@/components/MissionCard";
import { PartnerAd } from "@/components/PartnerAd";
import { PetAssistant } from "@/components/ai/PetAssistant";
import { isFeatureEnabled } from "@/lib/featureFlags";
import { LINKS } from "@/lib/links";

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
  appointment_type: string;
  pet_id: string;
}

interface Profile {
  display_name: string | null;
  avatar_url: string | null;
  is_premium?: boolean;
}

interface PawGameProgress {
  total_paw_points: number;
  current_level: number;
  streak_days: number;
}

interface GuardianLevel {
  level_name: string;
  min_points: number;
  max_points: number;
}

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pets, setPets] = useState<Pet[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [loading, setLoading] = useState(true);
  const [assistantPet, setAssistantPet] = useState<Pet | null>(null);
  const { stats, missions, achievements } = useGamification();
  const { upcomingReminders, overdueReminders, completeReminder } = useReminders();

  useEffect(() => {
    if (user) {
      loadData();
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
      // Load profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("display_name, avatar_url, is_premium")
        .eq("id", user.id)
        .maybeSingle();
      
      if (profileData) setProfile(profileData);

      // Load pets
      const { data: petsData } = await supabase
        .from("pets")
        .select("id, name, species, breed, photo_url")
        .eq("owner_id", user.id)
        .limit(4);
      
      if (petsData) setPets(petsData);

      // Load upcoming appointments
      const { data: appointmentsData } = await supabase
        .from("appointments")
        .select("id, title, scheduled_date, appointment_type, pet_id")
        .gte("scheduled_date", new Date().toISOString())
        .order("scheduled_date", { ascending: true })
        .limit(3);
      
      if (appointmentsData) setAppointments(appointmentsData);

      // Paw Game progress is now loaded via useGamification hook
    } catch (error) {
      console.error("Error loading home data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTutorialComplete = () => {
    setShowTutorial(false);
  };

  const quickActions = [
    {
      title: "Buscar veterinario",
      icon: Stethoscope,
      href: "/veterinarios",
      color: "from-emerald-500 to-teal-600",
      description: "Directorio con reseñas"
    },
    {
      title: "Historial médico",
      icon: Calendar,
      href: "/medical-records",
      color: "from-blue-500 to-cyan-500",
      description: "Vacunas y controles"
    },
    {
      title: "Mapa",
      icon: Map,
      href: "/maps",
      color: "from-indigo-500 to-purple-500",
      description: "Vets cercanos"
    },
    {
      title: "Adopción",
      icon: Heart,
      href: "/adoption",
      color: "from-orange-500 to-red-500",
      description: "Encuentra tu compañero"
    },
  ];


  if (loading) {
    return (
      <div className="container max-w-6xl mx-auto p-4 md:p-6 space-y-6 animate-fade-in">
        {/* Skeleton Welcome Header */}
        <div className="rounded-2xl bg-muted/40 p-6 md:p-8 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl skeleton" />
            <div className="space-y-2">
              <div className="h-6 w-48 skeleton" />
              <div className="h-4 w-32 skeleton" />
            </div>
          </div>
        </div>
        {/* Skeleton Content Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 rounded-xl skeleton" />
          <div className="h-64 rounded-xl skeleton" />
        </div>
      </div>
    );
  }

  return (<>
    <div className="container max-w-6xl mx-auto p-4 md:p-6 space-y-6 animate-fade-in">
      {showTutorial && <OnboardingTutorial onComplete={handleTutorialComplete} />}
      
      {/* Welcome Header — paleta verde médica (pivot) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-100 via-teal-50 to-emerald-50 p-6 md:p-8 animate-fade-in">
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-16 w-16 ring-4 ring-background shadow-lg">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-warm-gradient text-white text-xl font-bold">
                  {(() => {
                    // Show initials from real name (e.g., "Pedro Susaeta" -> "P.S.")
                    if (profile?.display_name) {
                      const nameParts = profile.display_name.trim().split(/\s+/);
                      if (nameParts.length >= 2) {
                        return `${nameParts[0][0].toUpperCase()}.${nameParts[nameParts.length - 1][0].toUpperCase()}.`;
                      }
                      return profile.display_name[0].toUpperCase();
                    }
                    return user?.email?.[0]?.toUpperCase() || "U";
                  })()}
                </AvatarFallback>
              </Avatar>
              {/* Show level badge if user has level > 1 */}
              {stats && stats.level > 1 && (
                <div className="absolute -bottom-1 -right-1 bg-yellow-400 rounded-full p-1 border-2 border-background shadow-lg">
                  <Crown className="h-4 w-4 text-yellow-900" />
                </div>
              )}
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                {getGreeting()}, {profile?.display_name || user?.email?.split("@")[0] || "Amigo"} 👋
              </h1>
              <p className="text-muted-foreground mt-1">
                {pets.length > 0 
                  ? `Tienes ${pets.length} mascota${pets.length > 1 ? 's' : ''} registrada${pets.length > 1 ? 's' : ''}`
                  : "¡Comienza agregando tu primera mascota!"
                }
                {stats && (
                  <span className="ml-2">
                    • Nivel {stats.level}
                  </span>
                )}
              </p>
            </div>
          </div>
          
          <Button
            onClick={() => navigate(LINKS.addPet())}
            className="bg-emerald-600 hover:bg-emerald-700 shadow-lg"
            size="lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Agregar Mascota
          </Button>
        </div>
      </div>

      {/* === Estado vacío segmentado === */}
      {pets.length === 0 && (
        <Card className="border-l-4 border-l-emerald-500 bg-emerald-50/50">
          <CardContent className="p-6 text-center space-y-3">
            <div className="inline-flex p-3 rounded-full bg-emerald-100">
              <PawPrint className="h-8 w-8 text-emerald-700" />
            </div>
            <h2 className="text-xl font-bold text-emerald-900">
              Bienvenido a Paw Friend
            </h2>
            <p className="text-sm text-emerald-800/80 max-w-md mx-auto">
              Para empezar a cuidar la salud de tu mascota, agrega su perfil. Así podrás llevar su ficha clínica, recibir recordatorios y reservar con veterinarios.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
              <Button onClick={() => navigate(LINKS.addPet())} className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="h-4 w-4 mr-1" />
                Agregar mi primera mascota
              </Button>
              <Button variant="outline" onClick={() => navigate(LINKS.vets())}>
                <Stethoscope className="h-4 w-4 mr-1" />
                Explorar veterinarios
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* === Estado tranquilo: tiene mascotas pero todo al día === */}
      {pets.length > 0 &&
        overdueReminders.length === 0 &&
        upcomingReminders.length === 0 && (
          <Card className="border-l-4 border-l-emerald-500 bg-emerald-50/30">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-full bg-emerald-100 p-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-700" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-emerald-900">Tus mascotas están al día ✓</p>
                <p className="text-xs text-emerald-800/70">
                  No tienes recordatorios pendientes. Te avisaremos cuando se acerque algún control.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(LINKS.vets())}
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-100"
              >
                <Stethoscope className="h-4 w-4 mr-1" /> Buscar vet
              </Button>
            </CardContent>
          </Card>
        )}

      {/* HEALTH ALERTS — siempre primero, prominente */}
      {(overdueReminders.length > 0 || upcomingReminders.length > 0) && (
        <Card className={`border-l-4 ${overdueReminders.length > 0 ? 'border-l-red-500 bg-red-50/50' : 'border-l-amber-400 bg-amber-50/50'}`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              {overdueReminders.length > 0 ? (
                <>
                  <AlertCircle className="h-6 w-6 text-red-600" />
                  <span className="text-red-900">Salud de tus mascotas — requiere atención</span>
                </>
              ) : (
                <>
                  <Bell className="h-6 w-6 text-amber-600" />
                  <span className="text-amber-900">Próximos cuidados</span>
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {overdueReminders.slice(0, 3).map(r => (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-white border border-red-200">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <div>
                    <p className="text-sm font-semibold">{r.title}</p>
                    <p className="text-xs text-red-700">
                      {r.pets?.name} · Vencido el {new Date(r.due_date).toLocaleDateString("es-CL")}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => navigate(LINKS.vets())}>
                    Reservar vet
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => completeReminder.mutate(r.id)} title="Marcar como hecho">
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {upcomingReminders.slice(0, 2).map(r => (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-white border border-amber-200">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  <div>
                    <p className="text-sm font-medium">{r.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.pets?.name} · {new Date(r.due_date).toLocaleDateString("es-CL")}
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => completeReminder.mutate(r.id)}>
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* PRÓXIMA CITA VETERINARIA */}
      {appointments.length > 0 && (
        <Card className="border-l-4 border-l-amber-500 bg-gradient-to-r from-amber-50 to-white">
          <CardContent className="p-4 md:p-5 flex items-center gap-4">
            <div className="rounded-full bg-amber-100 p-3 flex-shrink-0">
              <Stethoscope className="h-6 w-6 text-amber-700" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs uppercase tracking-wider text-amber-700 font-semibold mb-0.5">
                Próxima cita veterinaria
              </p>
              <p className="font-semibold truncate">{appointments[0].title}</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(appointments[0].scheduled_date), "EEEE d 'de' MMMM, HH:mm", { locale: es })}
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => navigate(LINKS.medicalRecords())}
              className="bg-amber-600 hover:bg-amber-700 hidden sm:inline-flex"
            >
              Ver detalle
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {quickActions.map((action) => (
          <Card 
            key={action.title}
            className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 overflow-hidden"
            onClick={() => navigate(action.href)}
          >
            <CardContent className="p-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <action.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-sm md:text-base">{action.title}</h3>
              <p className="text-xs text-muted-foreground mt-1 hidden md:block">{action.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Paw Game Widget - DESHABILITADO en pivot médico (flag PAWGAME_SIDEBAR) */}
      {isFeatureEnabled("PAWGAME_SIDEBAR") && (
      <div className="space-y-4">
        <PointsWidget
          points={stats?.points || 0}
          level={stats?.level || 1}
          showProgress={true}
        />

        {/* Active Missions or Welcome CTA */}
        {missions && missions.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                Misiones Activas
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(LINKS.pawGame())}
              >
                Ver todas
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {missions.slice(0, 2).map((mission) => (
                <MissionCard key={mission.id} mission={mission} />
              ))}
            </div>
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="p-4 text-center">
              <Sparkles className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
              <p className="font-medium text-sm">Gana puntos cuidando a tus mascotas</p>
              <p className="text-xs text-muted-foreground mb-3">Agrega tu mascota, completa su ficha y gana recompensas</p>
              <Button size="sm" variant="outline" onClick={() => navigate(LINKS.pawGame())}>
                Ver Paw Game
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
      )}

      {/* Premium Upsell - floating banner */}

      {/* Featured Partner Ad */}
      <PartnerAd placement="home" className="mb-6" />

      {/* Main Content Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* My Pets Section */}
        <Card className="border-l-4 border-l-emerald-500 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <PawPrint className="h-5 w-5 text-emerald-600" />
              Mis Mascotas
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate(LINKS.myPets())}>
              Ver todas
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {pets.length === 0 ? (
              <div className="text-center py-6">
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-emerald-100 flex items-center justify-center">
                  <PawPrint className="h-7 w-7 text-emerald-600" />
                </div>
                <p className="font-medium mb-1">Agrega tu primera mascota</p>
                <p className="text-xs text-muted-foreground mb-3">Ficha clínica + recordatorios automáticos</p>
                <Button onClick={() => navigate(LINKS.addPet())} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar mascota
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  {pets.map((pet) => (
                    <div
                      key={pet.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                      onClick={() => navigate(LINKS.myPets())}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={pet.photo_url || undefined} />
                        <AvatarFallback className="bg-secondary/20">
                          <PawPrint className="h-5 w-5 text-secondary" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{pet.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {pet.breed || pet.species}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 flex-shrink-0"
                        title={`Preguntar a la IA sobre ${pet.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setAssistantPet(assistantPet?.id === pet.id ? null : pet);
                        }}
                      >
                        <Stethoscope className="h-3.5 w-3.5 text-primary" />
                      </Button>
                    </div>
                  ))}
                </div>
                {assistantPet && (
                  <div className="mt-3">
                    <PetAssistant
                      petId={assistantPet.id}
                      petName={assistantPet.name}
                      onClose={() => setAssistantPet(null)}
                    />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card className="border-l-4 border-l-emerald-500 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-600" />
              Próximas Citas
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate(LINKS.medicalRecords())}>
              Ver historial
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {appointments.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Calendar className="h-8 w-8 text-emerald-600" />
                </div>
                <p className="text-muted-foreground mb-4">
                  No tienes citas próximas
                </p>
                <Button onClick={() => navigate(LINKS.vets())} variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                  <Stethoscope className="h-4 w-4 mr-2" />
                  Buscar veterinario
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.map((appointment) => (
                  <div 
                    key={appointment.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{appointment.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(appointment.scheduled_date), "d 'de' MMMM, HH:mm", { locale: es })}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {appointment.appointment_type}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recommendations Section eliminada en pivot médico — feature ahora redundante con quick actions */}
    </div>

    {/* Premium Banner eliminado en pivot médico */}
  </>);
}
