import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Trophy, 
  Star, 
  Target, 
  Gift, 
  CheckCircle2,
  Award,
  Zap,
  Heart,
  Sparkles,
  Shield,
  Crown,
  PawPrint,
  Calendar,
  MapPin,
  Stethoscope,
  Dog,
  Users,
  MessageCircle,
  Camera,
  BookOpen,
  Syringe,
  Search,
  Home,
  ShoppingBag,
  ArrowRight,
  Lock,
  Play,
  Flame
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { GuardianProgress } from "@/components/pawgame/GuardianProgress";
import { MissionCard } from "@/components/pawgame/MissionCard";
import { BadgeGallery } from "@/components/pawgame/BadgeGallery";
import { PetPawProgress } from "@/components/pawgame/PetPawProgress";
import { PawShopRewards } from "@/components/pawgame/PawShopRewards";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface GuardianLevel {
  id: string;
  level_number: number;
  level_name: string;
  min_points: number;
  max_points: number;
  badge_icon: string | null;
  bonus_multiplier: number;
  description: string | null;
}

interface UserProgress {
  id: string;
  user_id: string;
  total_paw_points: number;
  current_level: number;
  current_level_points: number;
  streak_days: number;
  last_activity_date: string | null;
}

interface Mission {
  id: string;
  title: string;
  description: string;
  mission_type: string;
  category: string;
  target_action: string;
  target_count: number;
  points_reward: number;
  icon: string | null;
  required_level: number;
  story_chapter: number | null;
  is_active: boolean;
}

interface PawBadge {
  id: string;
  badge_key: string;
  name: string;
  description: string;
  category: string;
  unlock_condition: string;
  unlock_value: number;
  points_bonus: number;
  rarity: string;
  icon: string | null;
}

interface Pet {
  id: string;
  name: string;
  species: string;
  photo_url: string | null;
}

const PawGame = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [currentLevel, setCurrentLevel] = useState<GuardianLevel | null>(null);
  const [nextLevel, setNextLevel] = useState<GuardianLevel | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [badges, setBadges] = useState<PawBadge[]>([]);
  const [userBadges, setUserBadges] = useState<string[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [activeTab, setActiveTab] = useState("missions");
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if (user) {
      loadGameData();
      // Check if user has seen tutorial
      const hasSeenTutorial = localStorage.getItem("hasSeenPawGameTutorial");
      if (!hasSeenTutorial) {
        setShowTutorial(true);
      }
    }
  }, [user]);

  const loadGameData = async () => {
    try {
      setLoading(true);

      // Load user guardian progress
      const { data: progressData } = await supabase
        .from('user_guardian_progress')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      // If no progress exists, try to create it
      let activeProgress = progressData;
      if (!activeProgress) {
        const { data: newProgress } = await supabase
          .from('user_guardian_progress')
          .insert({ user_id: user?.id })
          .select()
          .maybeSingle();
        activeProgress = newProgress;
      }

      // Set a default progress if DB operations failed
      setUserProgress(activeProgress || {
        id: '',
        user_id: user?.id || '',
        total_paw_points: 0,
        current_level: 1,
        current_level_points: 0,
        streak_days: 0,
        last_activity_date: null,
      } as UserProgress);

      // Load guardian levels
      const { data: levelsData } = await supabase
        .from('guardian_levels')
        .select('*')
        .order('level_number', { ascending: true });

      const level = activeProgress?.current_level || 1;
      if (levelsData) {
        const current = levelsData.find(l => l.level_number === level);
        const next = levelsData.find(l => l.level_number === level + 1);
        setCurrentLevel(current || null);
        setNextLevel(next || null);
      }

      // Load missions
      const { data: missionsData } = await supabase
        .from('paw_missions')
        .select('*')
        .eq('is_active', true)
        .order('mission_type', { ascending: true });

      setMissions(missionsData || []);

      // Load badges
      const { data: badgesData } = await supabase
        .from('paw_badges')
        .select('*')
        .order('category', { ascending: true });

      setBadges(badgesData || []);

      // Load user badges
      const { data: userBadgesData } = await supabase
        .from('user_paw_badges')
        .select('badge_id')
        .eq('user_id', user?.id);

      setUserBadges(userBadgesData?.map(b => b.badge_id) || []);

      // Load user's pets
      const { data: petsData } = await supabase
        .from('pets')
        .select('id, name, species, photo_url')
        .eq('owner_id', user?.id);

      setPets(petsData || []);

    } catch (error) {
      console.error('Error loading game data:', error);
      toast.error("No se pudo cargar la información del juego");
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { title: "Pasear", icon: Dog, href: "/dog-walkers", color: "from-blue-500 to-cyan-500", points: "+15 pts" },
    { title: "Vacunar", icon: Syringe, href: "/medical-records", color: "from-emerald-500 to-teal-500", points: "+50 pts" },
    { title: "Socializar", icon: Users, href: "/shared-walks", color: "from-purple-500 to-pink-500", points: "+20 pts" },
    { title: "Adoptar", icon: Heart, href: "/adoption", color: "from-rose-500 to-red-500", points: "+100 pts" },
    { title: "Explorar", icon: MapPin, href: "/maps", color: "from-orange-500 to-amber-500", points: "+10 pts" },
    { title: "Publicar", icon: Camera, href: "/feed", color: "from-indigo-500 to-violet-500", points: "+5 pts" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="relative">
            <PawPrint className="h-16 w-16 text-primary mx-auto animate-bounce" />
            <Sparkles className="h-6 w-6 text-yellow-500 absolute -top-2 -right-2 animate-pulse" />
          </div>
          <p className="text-muted-foreground">Cargando Paw Game...</p>
        </div>
      </div>
    );
  }

  const progressPercent = currentLevel && nextLevel && userProgress
    ? ((userProgress.total_paw_points - currentLevel.min_points) / (nextLevel.min_points - currentLevel.min_points)) * 100
    : 0;

  return (
    <div className="container px-4 py-6 max-w-7xl mx-auto animate-fade-in space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/30 via-secondary/30 to-accent/30 p-6 md:p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 shadow-lg">
              <PawPrint className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">
                <span className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
                  Paw Game
                </span>
              </h1>
              <p className="text-muted-foreground text-sm">
                Cuida a tus peludos, gana puntos, sube de nivel
              </p>
            </div>
          </div>

          {/* Guardian Progress */}
          <GuardianProgress 
            userProgress={userProgress}
            currentLevel={currentLevel}
            nextLevel={nextLevel}
            progressPercent={progressPercent}
          />
        </div>
      </div>

      {/* Quick Actions - Ways to Earn Points */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-background to-muted/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Gana PawPoints
          </CardTitle>
          <CardDescription>
            Realiza acciones en la app para ganar puntos y subir de nivel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.title}
                onClick={() => navigate(action.href)}
                className="group flex flex-col items-center p-3 rounded-xl hover:bg-muted/50 transition-all hover:scale-105"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-2 group-hover:shadow-lg transition-shadow`}>
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs font-medium">{action.title}</span>
                <span className="text-[10px] text-yellow-600 font-semibold">{action.points}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full h-auto grid grid-cols-4 gap-2 bg-muted/50 p-2 rounded-xl border border-border/50">
          <TabsTrigger 
            value="missions"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white text-xs md:text-sm"
          >
            <Target className="h-4 w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Misiones</span>
          </TabsTrigger>
          <TabsTrigger 
            value="badges"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-orange-500 data-[state=active]:text-white text-xs md:text-sm"
          >
            <Award className="h-4 w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Logros</span>
          </TabsTrigger>
          <TabsTrigger 
            value="pets"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-rose-500 data-[state=active]:text-white text-xs md:text-sm"
          >
            <Heart className="h-4 w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Peludos</span>
          </TabsTrigger>
          <TabsTrigger 
            value="shop"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white text-xs md:text-sm"
          >
            <Gift className="h-4 w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Tienda</span>
          </TabsTrigger>
        </TabsList>

        {/* Missions Tab */}
        <TabsContent value="missions" className="mt-6 space-y-4">
          {/* Tutorial Button */}
          <div className="flex justify-end mb-4">
            <Dialog open={showTutorial} onOpenChange={setShowTutorial}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Play className="h-4 w-4 mr-2" />
                  Ver Tutorial
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl flex items-center gap-2">
                    <PawPrint className="h-6 w-6 text-primary" />
                    Bienvenido al Paw Game
                  </DialogTitle>
                  <DialogDescription>
                    Aprende cómo ganar puntos, subir de nivel y desbloquear recompensas
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-500" />
                      ¿Cómo ganar PawPoints?
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Realiza acciones en la app para ganar puntos y subir de nivel:
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span><strong>Reservas:</strong> Reserva servicios (paseadores, cuidadores, veterinarios) - +15 a +50 pts</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span><strong>Paseos:</strong> Completa paseos con tu mascota - +15 pts</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span><strong>Visitas al veterinario:</strong> Registra citas y vacunas - +50 pts</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span><strong>Adopción:</strong> Adopta una mascota - +100 pts</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span><strong>Publicaciones:</strong> Comparte momentos en Pet Social - +5 pts</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span><strong>Misiones:</strong> Completa misiones diarias, semanales y mensuales - +10 a +200 pts</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                      Niveles y Recompensas
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      A medida que subes de nivel, desbloqueas:
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <Crown className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <span><strong>Multiplicadores de puntos:</strong> Gana más puntos por acción</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Award className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                        <span><strong>Insignias y logros:</strong> Desbloquea logros especiales</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Gift className="h-4 w-4 text-pink-500 mt-0.5 flex-shrink-0" />
                        <span><strong>Recompensas en la tienda:</strong> Canjea puntos por descuentos y premios</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                      <Flame className="h-5 w-5 text-orange-500" />
                      Racha de Días
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Mantén una racha activa usando la app diariamente. Las rachas más largas te dan bonificaciones adicionales.
                    </p>
                  </div>

                  <div className="pt-4 border-t">
                    <Button 
                      className="w-full" 
                      onClick={() => {
                        localStorage.setItem("hasSeenPawGameTutorial", "true");
                        setShowTutorial(false);
                      }}
                    >
                      ¡Entendido! Empecemos
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Expandable Mission Lists */}
          <Accordion type="multiple" defaultValue={["daily", "weekly"]} className="space-y-4">
            {/* Daily Missions */}
            <AccordionItem value="daily" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  <h3 className="text-lg font-semibold">Misiones Diarias</h3>
                  <Badge variant="secondary" className="ml-2">
                    {missions.filter(m => m.mission_type === 'daily').length} disponibles
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid md:grid-cols-2 gap-4 pt-2">
                  {missions.filter(m => m.mission_type === 'daily').map((mission) => (
                    <MissionCard 
                      key={mission.id} 
                      mission={mission} 
                      userLevel={userProgress?.current_level || 1}
                      onNavigate={navigate}
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Weekly Missions */}
            <AccordionItem value="weekly" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-emerald-500" />
                  <h3 className="text-lg font-semibold">Misiones Semanales</h3>
                  <Badge variant="outline" className="ml-2">
                    {missions.filter(m => m.mission_type === 'weekly').length} disponibles
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid md:grid-cols-2 gap-4 pt-2">
                  {missions.filter(m => m.mission_type === 'weekly').map((mission) => (
                    <MissionCard 
                      key={mission.id} 
                      mission={mission} 
                      userLevel={userProgress?.current_level || 1}
                      onNavigate={navigate}
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Monthly Missions (if any) */}
            {missions.filter(m => m.mission_type === 'monthly').length > 0 && (
              <AccordionItem value="monthly" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-purple-500" />
                    <h3 className="text-lg font-semibold">Misiones Mensuales</h3>
                    <Badge variant="outline" className="ml-2">
                      {missions.filter(m => m.mission_type === 'monthly').length} disponibles
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid md:grid-cols-2 gap-4 pt-2">
                    {missions.filter(m => m.mission_type === 'monthly').map((mission) => (
                      <MissionCard 
                        key={mission.id} 
                        mission={mission} 
                        userLevel={userProgress?.current_level || 1}
                        onNavigate={navigate}
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Story Missions */}
            <AccordionItem value="story" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-purple-500" />
                  <h3 className="text-lg font-semibold">Historia del Guardián</h3>
                  <Badge className="ml-2 bg-purple-500/10 text-purple-600">
                    Capítulo 1
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid md:grid-cols-2 gap-4 pt-2">
                  {missions.filter(m => m.mission_type === 'story').map((mission) => (
                    <MissionCard 
                      key={mission.id} 
                      mission={mission} 
                      userLevel={userProgress?.current_level || 1}
                      onNavigate={navigate}
                      isStory
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>

        {/* Badges Tab */}
        <TabsContent value="badges" className="mt-6">
          <BadgeGallery 
            badges={badges} 
            userBadges={userBadges} 
          />
        </TabsContent>

        {/* Pets Progress Tab */}
        <TabsContent value="pets" className="mt-6">
          <PetPawProgress pets={pets} userId={user?.id || ''} />
        </TabsContent>

        {/* Shop Tab */}
        <TabsContent value="shop" className="mt-6">
          <PawShopRewards 
            userPoints={userProgress?.total_paw_points || 0} 
            userId={user?.id || ''}
            onPurchase={loadGameData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PawGame;
