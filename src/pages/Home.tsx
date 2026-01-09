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
  Compass,
  Map,
  Gamepad2,
  Trophy,
  Zap,
  Crown
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useGamification } from "@/hooks/useGamification";
import PointsWidget from "@/components/PointsWidget";
import MissionCard from "@/components/MissionCard";
import { PartnerAd } from "@/components/PartnerAd";

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
  const { stats, missions, achievements } = useGamification();

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
        .select("display_name, avatar_url")
        .eq("id", user.id)
        .single();
      
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
      title: "Mapa", 
      icon: Map, 
      href: "/maps",
      color: "from-indigo-500 to-purple-500",
      description: "Servicios, adopción, perdidos"
    },
    { 
      title: "Paseadores", 
      icon: Dog, 
      href: "/dog-walkers",
      color: "from-blue-500 to-cyan-500",
      description: "Reservar paseo"
    },
    { 
      title: "Adopción", 
      icon: Heart, 
      href: "/adoption",
      color: "from-orange-500 to-red-500",
      description: "Encuentra tu compañero"
    },
    { 
      title: "Perdidos", 
      icon: AlertCircle, 
      href: "/lost-pets",
      color: "from-red-500 to-rose-500",
      description: "Reportar o buscar"
    },
  ];

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "¡Buenos días";
    if (hour < 18) return "¡Buenas tardes";
    return "¡Buenas noches";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <PawPrint className="h-12 w-12 text-primary mx-auto animate-bounce" />
          <p className="text-muted-foreground">Cargando tu espacio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      {showTutorial && <OnboardingTutorial onComplete={handleTutorialComplete} />}
      
      {/* Welcome Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 p-6 md:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
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
                {greeting()}, {profile?.display_name || user?.email?.split("@")[0] || "Amigo"}! 👋
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
            onClick={() => navigate("/add-pet")}
            className="bg-warm-gradient hover:opacity-90 shadow-lg"
            size="lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Agregar Mascota
          </Button>
        </div>
      </div>

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

      {/* Paw Game Widget - New Gamification System */}
      {stats && (
        <div className="space-y-4">
          <PointsWidget 
            points={stats.points} 
            level={stats.level}
            showProgress={true}
          />
          
          {/* Active Missions */}
          {missions && missions.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-500" />
                  Misiones Activas
                </h3>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate("/paw-game")}
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
            )}
        </div>
      )}

      {/* Featured Partner Ad */}
      <PartnerAd placement="home" className="mb-6" />

      {/* Main Content Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* My Pets Section */}
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <PawPrint className="h-5 w-5 text-primary" />
              Mis Mascotas
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/my-pets")}>
              Ver todas
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {pets.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <PawPrint className="h-8 w-8 text-primary" />
                </div>
                <p className="text-muted-foreground mb-4">
                  Aún no tienes mascotas registradas
                </p>
                <Button onClick={() => navigate("/add-pet")} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar mi primera mascota
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {pets.map((pet) => (
                  <div 
                    key={pet.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => navigate("/my-pets")}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={pet.photo_url || undefined} />
                      <AvatarFallback className="bg-secondary/20">
                        <PawPrint className="h-5 w-5 text-secondary" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{pet.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {pet.breed || pet.species}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Próximas Citas
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/medical-records")}>
              Ver historial
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {appointments.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-8 w-8 text-primary" />
                </div>
                <p className="text-muted-foreground mb-4">
                  No tienes citas próximas
                </p>
                <Button onClick={() => navigate("/home-vets")} variant="outline">
                  <Stethoscope className="h-4 w-4 mr-2" />
                  Agendar consulta
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

      {/* Recommendations Section */}
      <Card className="border-0 shadow-md bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Más servicios para ti
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div 
              className="p-3 rounded-xl bg-background/80 backdrop-blur cursor-pointer hover:shadow-md transition-all group text-center"
              onClick={() => navigate("/home-vets")}
            >
              <div className="w-10 h-10 mx-auto rounded-lg bg-emerald-500/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Stethoscope className="h-5 w-5 text-emerald-500" />
              </div>
              <span className="text-sm font-medium group-hover:text-primary transition-colors">Veterinarios</span>
            </div>
            
            <div 
              className="p-3 rounded-xl bg-background/80 backdrop-blur cursor-pointer hover:shadow-md transition-all group text-center"
              onClick={() => navigate("/dog-sitters")}
            >
              <div className="w-10 h-10 mx-auto rounded-lg bg-purple-500/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Heart className="h-5 w-5 text-purple-500" />
              </div>
              <span className="text-sm font-medium group-hover:text-primary transition-colors">Cuidadores</span>
            </div>
            
            <div 
              className="p-3 rounded-xl bg-background/80 backdrop-blur cursor-pointer hover:shadow-md transition-all group text-center"
              onClick={() => navigate("/shared-walks")}
            >
              <div className="w-10 h-10 mx-auto rounded-lg bg-teal-500/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Users className="h-5 w-5 text-teal-500" />
              </div>
              <span className="text-sm font-medium group-hover:text-primary transition-colors">Paseos grupales</span>
            </div>
            
            <div 
              className="p-3 rounded-xl bg-background/80 backdrop-blur cursor-pointer hover:shadow-md transition-all group text-center"
              onClick={() => navigate("/feed")}
            >
              <div className="w-10 h-10 mx-auto rounded-lg bg-pink-500/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Heart className="h-5 w-5 text-pink-500" />
              </div>
              <span className="text-sm font-medium group-hover:text-primary transition-colors">Pet Social</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
