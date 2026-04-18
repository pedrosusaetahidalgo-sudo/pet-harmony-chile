import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { PawPrint, Trophy, ChevronRight } from '@/lib/icons';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGoToAddPet } from '@/hooks/useCanAddPet';
import { useGamification } from '@/hooks/useGamification';
import { usePlan } from '@/hooks/usePlan';
import { logger } from '@/lib/logger';
import PointsWidget from '@/components/PointsWidget';
import AchievementBadge from '@/components/AchievementBadge';
import MissionCard from '@/components/MissionCard';
import { IntegrationsCard } from '@/components/settings/IntegrationsCard';
import { ProfileIdentityCard } from '@/components/profile/ProfileIdentityCard';
import { PetIdentityCard, AddPetCard } from '@/components/profile/PetIdentityCard';
import { ProfileCompletionCard } from '@/components/profile/ProfileCompletionCard';
import { ProfileSettingsList } from '@/components/profile/ProfileSettingsList';
import { EditProfileDrawer } from '@/components/profile/EditProfileDrawer';
import { BecomeProviderCTA } from '@/components/BecomeProviderCTA';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useActiveRole } from '@/hooks/useActiveRole';

interface ProfileData {
  avatar_url?: string;
  display_name?: string;
  is_premium?: boolean;
  bio?: string;
  location?: string;
}

interface PetData {
  id: string;
  name: string;
  species: string;
  breed?: string;
  photo_url?: string;
  birth_date?: string;
  paw_score?: number;
}

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const goToAddPet = useGoToAddPet();
  const { stats, achievements, missions } = useGamification();
  const { isPremium } = usePlan();
  const { isProvider } = useActiveRole();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [pets, setPets] = useState<PetData[]>([]);
  const [socialStats, setSocialStats] = useState({ posts: 0, followers: 0, following: 0 });
  const [loading, setLoading] = useState(true);

  // Drawer states
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [achievementsDrawerOpen, setAchievementsDrawerOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const [integrationsDrawerOpen, setIntegrationsDrawerOpen] = useState(
    searchParams.get('tab') === 'integrations'
  );
  const [notificationsDrawerOpen, setNotificationsDrawerOpen] = useState(false);

  // Notification prefs
  const [healthReminders, setHealthReminders] = useState(true);
  const [messages, setMessages] = useState(true);
  const [socialActivity, setSocialActivity] = useState(false);
  const [quietMode, setQuietMode] = useState(() => localStorage.getItem('pf_quiet_mode') === '1');

  useEffect(() => {
    if (user) loadProfileData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadProfileData = async () => {
    try {
      setLoading(true);

      const [profileRes, petsRes, statsRes, postsRes, notifRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user!.id).maybeSingle(),
        supabase
          .from('pets')
          .select('id, name, species, breed, photo_url, birth_date')
          .eq('owner_id', user!.id)
          .eq('lifecycle_status', 'active')
          .order('created_at', { ascending: false }),
        Promise.all([
          supabase
            .from('user_follows')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', user!.id),
          supabase
            .from('user_follows')
            .select('*', { count: 'exact', head: true })
            .eq('follower_id', user!.id),
        ]).then(([followersRes, followingRes]) => ({
          data: {
            followers_count: followersRes.count || 0,
            following_count: followingRes.count || 0,
          },
        })),
        supabase.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', user!.id),
        supabase.from('notification_preferences').select('*').eq('user_id', user!.id).maybeSingle(),
      ]);

      setProfile(profileRes.data as ProfileData | null);

      // Fetch paw scores for rarity display on pet identity cards
      const rawPets = petsRes.data || [];
      if (rawPets.length > 0) {
        const petIds = rawPets.map((p: { id: string }) => p.id);
        const { data: progressData } = await supabase
          .from('pet_paw_progress')
          .select('pet_id, health_score, activity_score, happiness_score, social_score')
          .in('pet_id', petIds);
        const scoreMap: Record<string, number> = {};
        (progressData || []).forEach((row) => {
          scoreMap[row.pet_id] = Math.round(
            ((row.health_score || 0) +
              (row.activity_score || 0) +
              (row.happiness_score || 0) +
              (row.social_score || 0)) /
              4
          );
        });
        setPets(rawPets.map((p) => ({ ...p, paw_score: scoreMap[p.id] ?? 0 })));
      } else {
        setPets(rawPets);
      }
      setSocialStats({
        posts: postsRes.count || 0,
        followers: statsRes.data?.followers_count || 0,
        following: statsRes.data?.following_count || 0,
      });

      if (notifRes.data) {
        setHealthReminders(notifRes.data.reminder_notifications);
        setMessages(notifRes.data.push_enabled);
        setSocialActivity(notifRes.data.social_notifications);
      }
    } catch (error) {
      logger.error('Error loading profile:', error);
      toast.error('Algo salió mal', { description: 'No se pudo cargar la información del perfil' });
    } finally {
      setLoading(false);
    }
  };

  const saveNotificationPref = async (field: string, value: boolean) => {
    if (!user) return;
    await supabase
      .from('notification_preferences')
      .upsert(
        { user_id: user.id, [field]: value, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );
  };

  if (loading) {
    return (
      <div className="px-4 py-4 max-w-4xl mx-auto space-y-4 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-40 bg-muted rounded" />
            <div className="h-4 w-56 bg-muted/70 rounded" />
          </div>
        </div>
        <div className="flex gap-3 overflow-hidden">
          <div className="w-36 h-52 bg-muted rounded-2xl flex-shrink-0" />
          <div className="w-36 h-52 bg-muted rounded-2xl flex-shrink-0" />
        </div>
        <div className="h-16 bg-muted rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="px-4 py-4 max-w-4xl mx-auto space-y-4 animate-fade-in pb-24">
      {/* ── Bloque A: Identity Card ── */}
      <ProfileIdentityCard profile={profile} onEditProfile={() => setEditDrawerOpen(true)} />

      {/* ── Bloque B: Pets Carousel ── */}
      <section>
        <h2 className="text-base font-semibold mb-3">Mis Mascotas</h2>
        {pets.length === 0 ? (
          <Card>
            <CardContent className="py-10 flex flex-col items-center text-center">
              <PawPrint className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground mb-4">Aún no has registrado mascotas</p>
              <button
                onClick={goToAddPet}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Registrar mi primera mascota
              </button>
            </CardContent>
          </Card>
        ) : (
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 scrollbar-hide">
            {pets.map((pet) => (
              <PetIdentityCard key={pet.id} pet={pet} />
            ))}
            <AddPetCard onClick={goToAddPet} />
          </div>
        )}
      </section>

      {/* ── Bloque C: Profile Completion + Health Signals ── */}
      <ProfileCompletionCard
        profile={profile}
        petCount={pets.length}
        onEditProfile={() => setEditDrawerOpen(true)}
      />

      {/* ── Bloque D: Social Mini-bar ── */}
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center justify-around text-center">
            <button
              onClick={() => navigate('/feed')}
              className="flex-1 hover:bg-muted/50 rounded-lg py-1 transition-colors"
            >
              <p className="text-lg font-bold">{socialStats.posts}</p>
              <p className="text-xs text-muted-foreground">Posts</p>
            </button>
            <Separator orientation="vertical" className="h-8" />
            <div className="flex-1 py-1">
              <p className="text-lg font-bold">{socialStats.followers}</p>
              <p className="text-xs text-muted-foreground">Seguidores</p>
            </div>
            <Separator orientation="vertical" className="h-8" />
            <div className="flex-1 py-1">
              <p className="text-lg font-bold">{socialStats.following}</p>
              <p className="text-xs text-muted-foreground">Siguiendo</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Bloque E: Gamificación compacta ── */}
      {stats && (
        <Card>
          <CardContent className="p-3">
            <button
              onClick={() => setAchievementsDrawerOpen(true)}
              className="flex items-center justify-between w-full group"
            >
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" />
                <span className="text-sm">
                  Nivel {stats.level} · {stats.points} puntos
                </span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          </CardContent>
        </Card>
      )}

      {/* ── Acceso rápido al perfil veterinario (solo usuarios con rol proveedor) ── */}
      {isProvider && (
        <Card className="p-4 bg-purple-50 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Perfil veterinario</p>
              <p className="text-xs text-muted-foreground">
                Edita tu perfil público del directorio
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/provider/profile-edit')}>
              Editar perfil
            </Button>
          </div>
        </Card>
      )}

      {/* ── CTA para convertirse en profesional ── */}
      <BecomeProviderCTA />

      {/* ── Bloque F: Ajustes y cuenta ── */}
      <ProfileSettingsList
        onEditProfile={() => setEditDrawerOpen(true)}
        onOpenIntegrations={() => setIntegrationsDrawerOpen(true)}
        onOpenNotifications={() => setNotificationsDrawerOpen(true)}
        isPremium={isPremium}
      />

      {/* ═══════════════ Drawers ═══════════════ */}

      {/* Edit Profile Drawer */}
      <EditProfileDrawer
        open={editDrawerOpen}
        onOpenChange={setEditDrawerOpen}
        profile={profile}
        onSaved={loadProfileData}
      />

      {/* Achievements Drawer */}
      <Sheet open={achievementsDrawerOpen} onOpenChange={setAchievementsDrawerOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Mis logros</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-6">
            {stats && <PointsWidget points={stats.points} level={stats.level} showProgress />}

            {achievements.length > 0 ? (
              <div>
                <h3 className="font-semibold text-sm mb-3">Logros desbloqueados</h3>
                <div className="grid grid-cols-2 gap-3">
                  {achievements.map((a) => (
                    <AchievementBadge
                      key={a.id}
                      code={a.code}
                      name={a.name}
                      description={a.description}
                      unlockedAt={a.unlocked_at}
                      size="md"
                      showTooltip
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Trophy className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  Completa acciones para desbloquear tus primeros logros
                </p>
              </div>
            )}

            {missions.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm mb-3">Misiones activas</h3>
                <div className="space-y-2">
                  {missions.map((m) => (
                    <MissionCard key={m.id} mission={m} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Integrations Drawer */}
      <Sheet open={integrationsDrawerOpen} onOpenChange={setIntegrationsDrawerOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Integraciones</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <IntegrationsCard />
          </div>
        </SheetContent>
      </Sheet>

      {/* Notifications Drawer */}
      <Sheet open={notificationsDrawerOpen} onOpenChange={setNotificationsDrawerOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Notificaciones</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Recordatorios de salud</p>
                <p className="text-xs text-muted-foreground">Vacunas, controles y citas</p>
              </div>
              <Switch
                checked={healthReminders}
                onCheckedChange={(v) => {
                  setHealthReminders(v);
                  saveNotificationPref('reminder_notifications', v);
                }}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Mensajes</p>
                <p className="text-xs text-muted-foreground">Nuevos mensajes directos</p>
              </div>
              <Switch
                checked={messages}
                onCheckedChange={(v) => {
                  setMessages(v);
                  saveNotificationPref('push_enabled', v);
                }}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Actividad social</p>
                <p className="text-xs text-muted-foreground">Likes, comentarios y seguidores</p>
              </div>
              <Switch
                checked={socialActivity}
                onCheckedChange={(v) => {
                  setSocialActivity(v);
                  saveNotificationPref('social_notifications', v);
                }}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Modo silencioso</p>
                <p className="text-xs text-muted-foreground">
                  Desactiva animaciones y efectos de gamificación
                </p>
              </div>
              <Switch
                checked={quietMode}
                onCheckedChange={(v) => {
                  setQuietMode(v);
                  localStorage.setItem('pf_quiet_mode', v ? '1' : '0');
                }}
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Profile;
