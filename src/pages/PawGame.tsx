import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Trophy,
  Star,
  Target,
  Gift,
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
  Flame,
} from '@/lib/icons';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { track, EVENTS } from '@/lib/analytics';
import { getLevelFromPoints } from '@/lib/levels';
import { awardPoints } from '@/lib/points';
import { GuardianProgress } from '@/components/pawgame/GuardianProgress';
import { PawLabsBanner } from '@/components/PawLabsBanner';
import { MissionCard } from '@/components/pawgame/MissionCard';
import { BadgeGallery } from '@/components/pawgame/BadgeGallery';
import { PetPawProgress } from '@/components/pawgame/PetPawProgress';
import { PawShopRewards } from '@/components/pawgame/PawShopRewards';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

import { logger } from '@/lib/logger';
import { PageHeader } from '@/components/PageHeader';
import { LINKS } from '@/lib/links';

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

// --- Streak Section ---

function StreakSection({
  streakDays,
  lastActivity,
  onCheckIn,
}: {
  streakDays: number;
  lastActivity: string | null | undefined;
  onCheckIn: () => void;
}) {
  const today = new Date().toISOString().split('T')[0];
  const lastDate = lastActivity?.split('T')[0];
  const alreadyCheckedIn = lastDate === today;

  const weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const todayIndex = (new Date().getDay() + 6) % 7; // Monday = 0

  return (
    <Card className="border-0 shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <Flame className="h-8 w-8 text-white mx-auto mb-1" />
              <div className="text-3xl font-bold text-white">{streakDays}</div>
              <div className="text-xs text-white/80">{streakDays === 1 ? 'día' : 'días'}</div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Racha Diaria</h3>
              <p className="text-sm text-white/80">
                {streakDays === 0
                  ? '¡Empieza tu racha hoy!'
                  : streakDays < 7
                    ? `¡${7 - streakDays} ${7 - streakDays === 1 ? 'día' : 'días'} para tu primera semana!`
                    : `¡Increíble! ${streakDays} ${streakDays === 1 ? 'día' : 'días'} seguidos`}
              </p>
            </div>
          </div>
          <Button
            onClick={onCheckIn}
            disabled={alreadyCheckedIn}
            className={`${
              alreadyCheckedIn
                ? 'bg-white/20 text-white cursor-default'
                : 'bg-white text-orange-600 hover:bg-white/90 shadow-lg'
            } font-semibold`}
          >
            {alreadyCheckedIn ? '✓ Hecho' : 'Check-in'}
          </Button>
        </div>

        {/* Week progress */}
        <div className="flex gap-2 mt-4">
          {weekDays.map((day, i) => {
            const isPast = i < todayIndex;
            const isToday = i === todayIndex;
            const isChecked = isPast || (isToday && alreadyCheckedIn);

            return (
              <div key={day} className="flex-1 text-center">
                <div
                  className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isChecked
                      ? 'bg-white text-orange-600'
                      : isToday
                        ? 'bg-white/30 text-white ring-2 ring-white'
                        : 'bg-white/10 text-white/50'
                  }`}
                >
                  {isChecked ? '✓' : day}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

// --- Main Component ---

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
  const [activeTab, setActiveTab] = useState('missions');
  const [rankingData, setRankingData] = useState<
    Array<{
      user_id: string;
      total_paw_points: number;
      display_name: string | null;
      avatar_url: string | null;
    }>
  >([]);
  const [userRank, setUserRank] = useState<{ rank: number; points: number } | null>(null);
  const [rankingLoading, setRankingLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadGameData();
    } else {
      // Si no hay user después del montaje, no dejar el loading infinito
      const timeout = setTimeout(() => setLoading(false), 3000);
      return () => clearTimeout(timeout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadGameData depends on user from closure; adding it would cause infinite loops
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
      setUserProgress(
        activeProgress ||
          ({
            id: '',
            user_id: user?.id || '',
            total_paw_points: 0,
            current_level: 1,
            current_level_points: 0,
            streak_days: 0,
            last_activity_date: null,
          } as UserProgress)
      );

      // Load guardian levels
      const { data: levelsData } = await supabase
        .from('guardian_levels')
        .select('*')
        .order('level_number', { ascending: true });

      const level = activeProgress?.current_level || 1;
      if (levelsData) {
        const current = levelsData.find((l) => l.level_number === level);
        const next = levelsData.find((l) => l.level_number === level + 1);
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

      setUserBadges(userBadgesData?.map((b) => b.badge_id) || []);

      // Load user's pets
      const { data: petsData } = await supabase
        .from('pets')
        .select('id, name, species, photo_url, vaccination_status')
        .eq('owner_id', user?.id);

      setPets(petsData || []);
    } catch (error: unknown) {
      logger.error('Error loading game data:', error);
      // Don't crash - just show the page with empty data
    } finally {
      setLoading(false);
    }
  };

  const loadRanking = async () => {
    if (!user) return;
    try {
      setRankingLoading(true);

      // Get top 20 users by points
      const { data: top20 } = await supabase
        .from('user_guardian_progress' as never)
        .select('user_id, total_paw_points')
        .order('total_paw_points', { ascending: false })
        .limit(20);

      if (!top20 || (top20 as unknown[]).length === 0) {
        setRankingData([]);
        setRankingLoading(false);
        return;
      }

      // Get profile info for those users
      type RankRow = { user_id: string; total_paw_points: number };
      type ProfileRow = { id: string; display_name: string | null; avatar_url: string | null };
      const userIds = (top20 as RankRow[]).map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);

      const profileMap = new Map((profiles || []).map((p: ProfileRow) => [p.id, p]));

      const merged = (top20 as RankRow[]).map((r) => {
        const profile = profileMap.get(r.user_id) as ProfileRow | undefined;
        return {
          user_id: r.user_id,
          total_paw_points: r.total_paw_points || 0,
          display_name: profile?.display_name || null,
          avatar_url: profile?.avatar_url || null,
        };
      });

      setRankingData(merged);

      // Check if current user is in top 20
      const userInTop = merged.findIndex((r: RankRow) => r.user_id === user.id);
      if (userInTop === -1) {
        // Get user's rank
        const { count } = await supabase
          .from('user_guardian_progress' as never)
          .select('*', { count: 'exact', head: true })
          .gt('total_paw_points', userProgress?.total_paw_points || 0);

        setUserRank({
          rank: (count || 0) + 1,
          points: userProgress?.total_paw_points || 0,
        });
      } else {
        setUserRank(null);
      }
    } catch (error) {
      logger.error('Error loading ranking:', error);
    } finally {
      setRankingLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'ranking' && rankingData.length === 0) {
      loadRanking();
    }
  }, [activeTab]);

  const handleDailyCheckIn = async () => {
    if (!user) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      const lastDate = userProgress?.last_activity_date?.split('T')[0];

      if (lastDate === today) {
        toast.info('Ya hiciste check-in hoy. ¡Vuelve mañana!');
        return;
      }

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      const isConsecutive = lastDate === yesterdayStr;
      const newStreak = isConsecutive ? (userProgress?.streak_days || 0) + 1 : 1;

      // Update streak tracking (not points) on guardian progress
      await supabase
        .from('user_guardian_progress')
        .update({
          streak_days: newStreak,
          last_activity_date: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      // Award check-in points via awardPoints utility (handles daily limit)
      const result = await awardPoints(user.id, 'daily_checkin');

      track({
        event: EVENTS.STREAK_CLAIMED,
        properties: { streak: newStreak, points: result.points },
      });

      // Milestone celebrations via awardPoints (handles one-time check)
      if (newStreak === 7) {
        const streakResult = await awardPoints(user.id, 'streak_7');
        if (streakResult.awarded) {
          toast.success('🏆 ¡Racha de 7 días! Eres un Guardián dedicado. +25 puntos bonus');
        }
      } else if (newStreak === 30) {
        const streakResult = await awardPoints(user.id, 'streak_30');
        if (streakResult.awarded) {
          toast.success('🎖️ ¡30 días seguidos! Eres una Leyenda Peluda. +100 puntos bonus');
        }
      } else if (newStreak === 90) {
        const streakResult = await awardPoints(user.id, 'streak_90');
        if (streakResult.awarded) {
          toast.success('💎 ¡90 días seguidos! Eres un Paw Master. +300 puntos bonus');
        }
      }

      if (result.awarded) {
        toast.success(
          `¡Check-in diario! +${result.points} PawPoints 🔥 Racha: ${newStreak} ${newStreak === 1 ? 'día' : 'días'}`
        );
      } else if (result.error === 'Daily limit reached') {
        toast.info('Ya hiciste check-in hoy. ¡Vuelve mañana!');
      }

      loadGameData();
    } catch (error) {
      logger.error('Check-in error:', error);
    }
  };

  const quickActions = [
    {
      title: 'Pasear',
      icon: Dog,
      href: '/services/walkers',
      color: 'from-blue-500 to-cyan-500',
      points: '+15 pts',
    },
    {
      title: 'Vacunar',
      icon: Syringe,
      href: '/medical-records',
      color: 'from-purple-600 to-teal-500',
      points: '+50 pts',
    },
    {
      title: 'Socializar',
      icon: Users,
      href: '/feed',
      color: 'from-purple-500 to-pink-500',
      points: '+20 pts',
    },
    {
      title: 'Adoptar',
      icon: Heart,
      href: '/adoption',
      color: 'from-rose-500 to-red-500',
      points: '+100 pts',
    },
    {
      title: 'Explorar',
      icon: MapPin,
      href: '/maps',
      color: 'from-orange-500 to-amber-500',
      points: '+10 pts',
    },
    {
      title: 'Publicar',
      icon: Camera,
      href: '/feed',
      color: 'from-indigo-500 to-violet-500',
      points: '+5 pts',
    },
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

  const levelInfo = getLevelFromPoints(userProgress?.total_paw_points || 0);
  const progressPercent = levelInfo.progressPercent;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Logros y misiones" onBack={() => navigate(LINKS.profile())} />
      <div className="container px-4 py-6 max-w-7xl mx-auto animate-fade-in space-y-6">
        <PawLabsBanner description="Gana puntos cuidando a tus mascotas. Sistema de logros en desarrollo activo." />
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
                  Cuida a tus mascotas, gana puntos, sube de nivel
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

        {/* Daily Streak & Check-in */}
        <StreakSection
          streakDays={userProgress?.streak_days || 0}
          lastActivity={userProgress?.last_activity_date}
          onCheckIn={handleDailyCheckIn}
        />

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
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-2 group-hover:shadow-lg transition-shadow`}
                  >
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
          <TabsList className="w-full h-auto grid grid-cols-5 gap-2 bg-muted/50 p-2 rounded-xl border border-border/50">
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
              value="ranking"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-yellow-500 data-[state=active]:text-white text-xs md:text-sm"
            >
              <Trophy className="h-4 w-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Ranking</span>
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
            {/* Expandable Mission Lists */}
            <Accordion type="multiple" defaultValue={['daily', 'weekly']} className="space-y-4">
              {/* Daily Missions */}
              <AccordionItem value="daily" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-500" />
                    <h3 className="text-lg font-semibold">Misiones Diarias</h3>
                    <Badge variant="secondary" className="ml-2">
                      {missions.filter((m) => m.mission_type === 'daily').length} disponibles
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid md:grid-cols-2 gap-4 pt-2">
                    {missions
                      .filter((m) => m.mission_type === 'daily')
                      .map((mission) => (
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
                    <Target className="h-5 w-5 text-purple-600" />
                    <h3 className="text-lg font-semibold">Misiones Semanales</h3>
                    <Badge variant="outline" className="ml-2">
                      {missions.filter((m) => m.mission_type === 'weekly').length} disponibles
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid md:grid-cols-2 gap-4 pt-2">
                    {missions
                      .filter((m) => m.mission_type === 'weekly')
                      .map((mission) => (
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
              {missions.filter((m) => m.mission_type === 'monthly').length > 0 && (
                <AccordionItem value="monthly" className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-purple-500" />
                      <h3 className="text-lg font-semibold">Misiones Mensuales</h3>
                      <Badge variant="outline" className="ml-2">
                        {missions.filter((m) => m.mission_type === 'monthly').length} disponibles
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid md:grid-cols-2 gap-4 pt-2">
                      {missions
                        .filter((m) => m.mission_type === 'monthly')
                        .map((mission) => (
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
                    <Badge className="ml-2 bg-purple-500/10 text-purple-600">Capítulo 1</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid md:grid-cols-2 gap-4 pt-2">
                    {missions
                      .filter((m) => m.mission_type === 'story')
                      .map((mission) => (
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
            <BadgeGallery badges={badges} userBadges={userBadges} />
          </TabsContent>

          {/* Ranking Tab */}
          <TabsContent value="ranking" className="mt-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Ranking de Guardianes
                </CardTitle>
                <CardDescription>Los mejores guardianes de mascotas en Paw Friend</CardDescription>
              </CardHeader>
              <CardContent>
                {rankingLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center space-y-3">
                      <PawPrint className="h-10 w-10 text-primary mx-auto animate-bounce" />
                      <p className="text-sm text-muted-foreground">Cargando ranking...</p>
                    </div>
                  </div>
                ) : rankingData.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <Trophy className="h-12 w-12 text-muted-foreground/30 mx-auto" />
                    <p className="text-muted-foreground">Aún no hay guardianes en el ranking.</p>
                    <p className="text-sm text-muted-foreground">¡Sé el primero en ganar puntos!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {rankingData.map((entry, index) => {
                      const rank = index + 1;
                      const isCurrentUser = entry.user_id === user?.id;
                      const entryLevel = getLevelFromPoints(entry.total_paw_points);
                      const medalEmoji =
                        rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;

                      return (
                        <div
                          key={entry.user_id}
                          className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                            isCurrentUser
                              ? 'bg-primary/10 ring-2 ring-primary/30'
                              : rank <= 3
                                ? 'bg-yellow-50 dark:bg-yellow-500/5'
                                : 'hover:bg-muted/50'
                          }`}
                        >
                          {/* Rank */}
                          <div className="w-10 text-center flex-shrink-0">
                            {medalEmoji ? (
                              <span className="text-xl">{medalEmoji}</span>
                            ) : (
                              <span className="text-sm font-bold text-muted-foreground">
                                #{rank}
                              </span>
                            )}
                          </div>

                          {/* Avatar */}
                          <Avatar className="h-10 w-10 flex-shrink-0">
                            <AvatarImage src={entry.avatar_url || undefined} />
                            <AvatarFallback
                              className={`${rank <= 3 ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white' : 'bg-muted'}`}
                            >
                              {entry.display_name?.charAt(0)?.toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>

                          {/* Name & Level */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-semibold text-sm truncate ${isCurrentUser ? 'text-primary' : ''}`}
                              >
                                {isCurrentUser ? 'Tú' : entry.display_name || 'Guardián Anónimo'}
                              </span>
                              {isCurrentUser && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                  Tú
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <span>{entryLevel.icon}</span>
                              <span className={entryLevel.color}>{entryLevel.name}</span>
                              <span>· Nivel {entryLevel.level}</span>
                            </div>
                          </div>

                          {/* Points */}
                          <div className="text-right flex-shrink-0">
                            <div className="font-bold text-sm">
                              {entry.total_paw_points.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-muted-foreground">PawPoints</div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Current user position if not in top 20 */}
                    {userRank && (
                      <>
                        <div className="flex items-center gap-2 py-2">
                          <div className="flex-1 border-t border-dashed border-muted-foreground/30" />
                          <span className="text-xs text-muted-foreground">···</span>
                          <div className="flex-1 border-t border-dashed border-muted-foreground/30" />
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 ring-2 ring-primary/30">
                          <div className="w-10 text-center flex-shrink-0">
                            <span className="text-sm font-bold text-primary">#{userRank.rank}</span>
                          </div>
                          <Avatar className="h-10 w-10 flex-shrink-0">
                            <AvatarImage src={user?.user_metadata?.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary/20">
                              {user?.user_metadata?.display_name?.charAt(0)?.toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <span className="font-semibold text-sm text-primary">Tu posición</span>
                            <div className="text-xs text-muted-foreground">
                              {levelInfo.icon} {levelInfo.name} · Nivel {levelInfo.level}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="font-bold text-sm">
                              {userRank.points.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-muted-foreground">PawPoints</div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
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
    </div>
  );
};

export default PawGame;
