import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Trophy, 
  Star, 
  Target, 
  MapPin, 
  Gift, 
  CheckCircle2,
  TrendingUp,
  Award,
  Zap,
  Heart,
  Sparkles,
  Shield,
  Users,
  PawPrint
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const Gamification = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userStats, setUserStats] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [rewards, setRewards] = useState<any[]>([]);
  const [userActivities, setUserActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load user stats
      const { data: stats } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();
      
      setUserStats(stats);

      // Load activities
      const { data: activitiesData } = await supabase
        .from('activities')
        .select('*')
        .order('points', { ascending: false });
      
      setActivities(activitiesData || []);

      // Load today's challenges
      const today = new Date().toISOString().split('T')[0];
      const { data: challengesData } = await supabase
        .from('daily_challenges')
        .select(`
          *,
          user_challenges (
            completed,
            current_value,
            completed_at
          )
        `)
        .eq('valid_date', today)
        .eq('user_challenges.user_id', user?.id);
      
      setChallenges(challengesData || []);

      // Load virtual routes
      const { data: routesData } = await supabase
        .from('virtual_routes')
        .select('*')
        .order('difficulty', { ascending: true });
      
      setRoutes(routesData || []);

      // Load rewards
      const { data: rewardsData } = await supabase
        .from('rewards')
        .select('*')
        .eq('is_active', true)
        .order('points_cost', { ascending: true });
      
      setRewards(rewardsData || []);

      // Load user's recent activities
      const { data: userActivitiesData } = await supabase
        .from('user_activities')
        .select(`
          *,
          activities (name, icon, points)
        `)
        .eq('user_id', user?.id)
        .order('completed_at', { ascending: false })
        .limit(10);
      
      setUserActivities(userActivitiesData || []);

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cargar la información de gamificación"
      });
    } finally {
      setLoading(false);
    }
  };

  const completeActivity = async (activityId: string) => {
    try {
      const { error } = await supabase
        .from('user_activities')
        .insert({
          user_id: user?.id,
          activity_id: activityId,
          completed_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "¡Actividad completada! 🎉",
        description: "Has ganado puntos por completar esta actividad",
        className: "animate-scale-in"
      });

      loadData();
    } catch (error) {
      console.error('Error completing activity:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo registrar la actividad"
      });
    }
  };

  const redeemReward = async (rewardId: string, pointsCost: number) => {
    if (!userStats || userStats.total_points < pointsCost) {
      toast({
        variant: "destructive",
        title: "Puntos insuficientes",
        description: `Necesitas ${pointsCost} puntos para canjear esta recompensa`
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('user_rewards')
        .insert({
          user_id: user?.id,
          reward_id: rewardId
        });

      if (error) throw error;

      toast({
        title: "¡Recompensa canjeada! 🎁",
        description: "Revisa tus recompensas en la sección Mis Recompensas",
        className: "animate-scale-in"
      });

      loadData();
    } catch (error) {
      console.error('Error redeeming reward:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo canjear la recompensa"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Sparkles className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Cargando gamificación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 max-w-7xl mx-auto animate-fade-in">
        {/* Header with Stats */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            <span className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
              Centro de Recompensas
            </span>
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mb-6">
            Completa actividades, supera desafíos y gana recompensas increíbles
          </p>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
              <CardContent className="p-4 text-center">
                <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                <p className="text-2xl font-bold">{userStats?.total_points || 0}</p>
                <p className="text-xs text-muted-foreground">Puntos Totales</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
              <CardContent className="p-4 text-center">
                <Star className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                <p className="text-2xl font-bold">{userStats?.level || 1}</p>
                <p className="text-xs text-muted-foreground">Nivel</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
              <CardContent className="p-4 text-center">
                <Target className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <p className="text-2xl font-bold">{challenges.filter((c: any) => c.user_challenges?.[0]?.completed).length}</p>
                <p className="text-xs text-muted-foreground">Desafíos Hoy</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
              <CardContent className="p-4 text-center">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p className="text-2xl font-bold">{userActivities.length}</p>
                <p className="text-xs text-muted-foreground">Actividades</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs for different sections */}
        <Tabs defaultValue="activities" className="w-full">
          <TabsList className="w-full h-auto grid grid-cols-2 md:grid-cols-4 gap-2 bg-muted/50 p-2 rounded-xl border border-border/50">
            <TabsTrigger 
              value="activities"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-orange-500 data-[state=active]:text-white"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Actividades
            </TabsTrigger>
            <TabsTrigger 
              value="challenges"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white"
            >
              <Target className="h-4 w-4 mr-2" />
              Desafíos
            </TabsTrigger>
            <TabsTrigger 
              value="routes"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Recorridos
            </TabsTrigger>
            <TabsTrigger 
              value="rewards"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white"
            >
              <Gift className="h-4 w-4 mr-2" />
              Recompensas
            </TabsTrigger>
          </TabsList>

          {/* Activities Tab */}
          <TabsContent value="activities" className="space-y-4 mt-6">
            {/* Achievements Section */}
            <Card className="mb-6 bg-gradient-to-br from-yellow-500/5 via-orange-500/5 to-red-500/5 border-yellow-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Logros Desbloqueados
                </CardTitle>
                <CardDescription>
                  Completa desafíos para desbloquear logros especiales
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {/* Achievement: First Pet */}
                  <div className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-all group">
                    <div className="flex flex-col items-center text-center gap-3">
                      <div className="p-3 rounded-full bg-gradient-to-br from-pink-500 to-rose-500">
                        <Heart className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Primera Mascota</h3>
                        <p className="text-xs text-muted-foreground">Registraste tu primera mascota</p>
                      </div>
                      <Badge className="bg-yellow-500/10 text-yellow-700">
                        +50 pts
                      </Badge>
                    </div>
                  </div>

                  {/* Achievement: Caring Owner */}
                  <div className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-all group">
                    <div className="flex flex-col items-center text-center gap-3">
                      <div className="p-3 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500">
                        <Star className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Dueño Cuidadoso</h3>
                        <p className="text-xs text-muted-foreground">10 actividades completadas</p>
                      </div>
                      <Badge className="bg-yellow-500/10 text-yellow-700">
                        +100 pts
                      </Badge>
                    </div>
                  </div>

                  {/* Achievement: Health Guardian */}
                  <div className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-all group">
                    <div className="flex flex-col items-center text-center gap-3">
                      <div className="p-3 rounded-full bg-gradient-to-br from-green-500 to-emerald-500">
                        <Shield className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Guardián de Salud</h3>
                        <p className="text-xs text-muted-foreground">Mantén vacunas al día</p>
                      </div>
                      <Badge className="bg-yellow-500/10 text-yellow-700">
                        +150 pts
                      </Badge>
                    </div>
                  </div>

                  {/* Achievement: Social Butterfly */}
                  <div className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-all group">
                    <div className="flex flex-col items-center text-center gap-3">
                      <div className="p-3 rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
                        <Users className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Mariposa Social</h3>
                        <p className="text-xs text-muted-foreground">5 paseos en grupo</p>
                      </div>
                      <Badge className="bg-yellow-500/10 text-yellow-700">
                        +200 pts
                      </Badge>
                    </div>
                  </div>

                  {/* Achievement: Multi-Pet Parent */}
                  <div className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-all group opacity-50">
                    <div className="flex flex-col items-center text-center gap-3">
                      <div className="p-3 rounded-full bg-gradient-to-br from-orange-500 to-red-500">
                        <PawPrint className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Familia Múltiple</h3>
                        <p className="text-xs text-muted-foreground">Registra 3+ mascotas</p>
                      </div>
                      <Badge variant="outline">
                        Bloqueado
                      </Badge>
                    </div>
                  </div>

                  {/* Achievement: Adventure Seeker */}
                  <div className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-all group opacity-50">
                    <div className="flex flex-col items-center text-center gap-3">
                      <div className="p-3 rounded-full bg-gradient-to-br from-teal-500 to-blue-500">
                        <MapPin className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Buscador de Aventuras</h3>
                        <p className="text-xs text-muted-foreground">Completa 3 recorridos virtuales</p>
                      </div>
                      <Badge variant="outline">
                        Bloqueado
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Leaderboard Section */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Tabla de Líderes
                </CardTitle>
                <CardDescription>
                  Los dueños más dedicados del mes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { rank: 1, name: "María González", points: 2450, pets: 2, badge: "🥇" },
                    { rank: 2, name: "Carlos Pérez", points: 2180, pets: 3, badge: "🥈" },
                    { rank: 3, name: "Ana Martínez", points: 1920, pets: 1, badge: "🥉" },
                    { rank: 4, name: "Tú", points: userStats?.total_points || 0, pets: userStats?.pets_count || 0, badge: "🏆" }
                  ].map((player) => (
                    <div 
                      key={player.rank}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        player.name === "Tú" 
                          ? "bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20" 
                          : "bg-card"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-2xl font-bold w-8 text-center">
                          {player.badge}
                        </div>
                        <div>
                          <p className="font-semibold">{player.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {player.pets} {player.pets === 1 ? 'mascota' : 'mascotas'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-yellow-600">{player.points}</p>
                        <p className="text-xs text-muted-foreground">puntos</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Checklist de Actividades Diarias
                </CardTitle>
                <CardDescription>
                  Completa actividades con tu mascota y gana puntos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {activities.map((activity) => (
                  <div 
                    key={activity.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 rounded-full bg-primary/10">
                        <Heart className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{activity.name}</p>
                        <p className="text-sm text-muted-foreground">{activity.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-700">
                        +{activity.points} pts
                      </Badge>
                      <Button 
                        size="sm"
                        onClick={() => completeActivity(activity.id)}
                        className="bg-warm-gradient hover:opacity-90"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Completar
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Challenges Tab */}
          <TabsContent value="challenges" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  Desafíos Diarios
                </CardTitle>
                <CardDescription>
                  Completa los desafíos del día para ganar puntos extra
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {challenges.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No hay desafíos disponibles para hoy
                  </p>
                ) : (
                  challenges.map((challenge) => {
                    const userChallenge = challenge.user_challenges?.[0];
                    const progress = userChallenge 
                      ? (userChallenge.current_value / challenge.target_value) * 100 
                      : 0;
                    
                    return (
                      <Card key={challenge.id} className="bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border-blue-500/20">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg mb-1">{challenge.title}</h3>
                              <p className="text-sm text-muted-foreground mb-3">{challenge.description}</p>
                              <Badge className="bg-blue-500/10 text-blue-700">
                                {challenge.challenge_type}
                              </Badge>
                            </div>
                            <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-700 ml-4">
                              +{challenge.points} pts
                            </Badge>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Progreso</span>
                              <span className="font-semibold">
                                {userChallenge?.current_value || 0} / {challenge.target_value}
                              </span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>

                          {userChallenge?.completed && (
                            <div className="mt-4 flex items-center gap-2 text-green-600">
                              <CheckCircle2 className="h-5 w-5" />
                              <span className="font-semibold">¡Completado!</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Routes Tab */}
          <TabsContent value="routes" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-green-500" />
                  Recorridos Virtuales
                </CardTitle>
                <CardDescription>
                  Completa recorridos virtuales y desbloquea recompensas especiales
                </CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                {routes.map((route) => (
                  <Card key={route.id} className="bg-gradient-to-br from-green-500/5 to-emerald-500/5 border-green-500/20 overflow-hidden group hover:shadow-lg transition-all">
                    <CardContent className="p-0">
                      {route.image_url && (
                        <div className="h-48 overflow-hidden">
                          <img 
                            src={route.image_url} 
                            alt={route.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <div className="p-6 space-y-4">
                        <div>
                          <h3 className="font-semibold text-lg mb-1">{route.name}</h3>
                          <p className="text-sm text-muted-foreground">{route.description}</p>
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          <Badge variant="outline">
                            {route.difficulty}
                          </Badge>
                          <span className="text-muted-foreground">
                            {route.total_distance} km
                          </span>
                          <Badge className="bg-yellow-500/10 text-yellow-700">
                            +{route.points} pts
                          </Badge>
                        </div>

                        <Button 
                          className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90"
                        >
                          <MapPin className="h-4 w-4 mr-2" />
                          Comenzar Recorrido
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rewards Tab */}
          <TabsContent value="rewards" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-purple-500" />
                  Canjea tus Puntos
                </CardTitle>
                <CardDescription>
                  Descuentos en servicios locales y productos para mascotas
                </CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                {rewards.map((reward) => (
                  <Card key={reward.id} className="bg-gradient-to-br from-purple-500/5 to-pink-500/5 border-purple-500/20 overflow-hidden group hover:shadow-lg transition-all">
                    <CardContent className="p-6 space-y-4">
                      {reward.partner_logo && (
                        <img 
                          src={reward.partner_logo} 
                          alt={reward.partner_name}
                          className="h-12 object-contain"
                        />
                      )}
                      
                      <div>
                        <h3 className="font-semibold text-lg mb-1">{reward.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{reward.description}</p>
                        {reward.partner_name && (
                          <Badge variant="outline" className="text-xs">
                            {reward.partner_name}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center gap-2">
                          <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                          <span className="font-bold text-lg">{reward.points_cost} pts</span>
                        </div>
                        <Button 
                          onClick={() => redeemReward(reward.id, reward.points_cost)}
                          disabled={!userStats || userStats.total_points < reward.points_cost}
                          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 disabled:opacity-50"
                        >
                          <Gift className="h-4 w-4 mr-2" />
                          Canjear
                        </Button>
                      </div>

                      {reward.stock !== null && (
                        <p className="text-xs text-muted-foreground text-center">
                          Stock disponible: {reward.stock}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  );
};

export default Gamification;
