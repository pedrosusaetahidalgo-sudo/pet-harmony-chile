import { useState, useEffect, useMemo, memo, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { HomeOnboardingHints } from '@/components/HomeOnboardingHints';
import { GoogleCalendarStatusBanner } from '@/components/GoogleCalendarStatusBanner';
import { TrialWelcomeOverlay, TrialBanner } from '@/components/TrialWelcomeBanner';
import { ViewTutorial, TUTORIALS } from '@/components/ViewTutorial';
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
  Star,
  Phone,
  Compass,
  ChevronRight,
} from '@/lib/icons';
import { getGreeting } from '@/lib/format';
import { useGamification } from '@/hooks/useGamification';
import { useReminders } from '@/hooks/useReminders';
import { StatusCard } from '@/components/home/StatusCard';
import { LINKS } from '@/lib/links';
import { useGoToAddPet } from '@/hooks/useCanAddPet';
import { logger } from '@/lib/logger';
import { WeeklyReportCard } from '@/components/home/WeeklyReportCard';
import { TodayRoutinesCard } from '@/components/home/TodayRoutinesCard';
import { FirstPdfNudge } from '@/components/home/FirstPdfNudge';
import { PawFriendPicks } from '@/components/home/PawFriendPicks';
import { NextBookingCard } from '@/components/home/NextBookingCard';
import { WeekActivitiesCard } from '@/components/home/WeekActivitiesCard';
import { CareStreakCard } from '@/components/home/CareStreakCard';
import { PetsHealthPanel } from '@/components/home/PetsHealthPanel';
// PWAInstallPrompt + CoOwnerInviteReceivedDialog + NamePromptDialog son
// dialogs que solo se montan condicionalmente (instalacion PWA, invitacion
// co-dueno, prompt de nombre primer-login). Lazy save ~500L del initial.
const PWAInstallPrompt = lazy(() =>
  import('@/components/PWAInstallPrompt').then((m) => ({ default: m.PWAInstallPrompt }))
);
// AnalyticsPreviewCard and PetWellnessPreview removed from home — accessible via /panel-pro
import { isGenericDisplayName } from '@/lib/format';
const NamePromptDialog = lazy(() =>
  import('@/components/NamePromptDialog').then((m) => ({ default: m.NamePromptDialog }))
);
import { computeHealthScore } from '@/lib/health-score';
import { getRarity } from '@/components/PetCardCompact';
import { RARITY_BORDER_STYLES } from '@/lib/paw-cards';
import { Skeleton } from '@/components/ui/skeleton';
import { usePendingReviewCount } from '@/hooks/usePendingReviews';
import { usePublicDonationStats } from '@/hooks/usePublicDonations';
const CoOwnerInviteReceivedDialog = lazy(() =>
  import('@/components/CoOwnerInviteReceivedDialog').then((m) => ({
    default: m.CoOwnerInviteReceivedDialog,
  }))
);
import { formatDistanceToNowStrict, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useActiveRole } from '@/hooks/useActiveRole';
// Sprint 1 P1 ARCH-001 fase 2 (2026-04-28): ProviderDashboard lazy.
// Solo se renderiza si role === 'provider'. Owners no descargan los 341L
// + tabs negocio/clinico/pacientes/reservas que arrastra ProviderDashboard.
const ProviderDashboard = lazy(() => import('@/components/provider/ProviderDashboard'));
import { isFeatureEnabled } from '@/lib/featureFlags';
// HomePetFocusV2 lazy: 459L con muchos sub-widgets. Solo se carga si flag
// HOME_PET_FOCUS y role !== 'provider'.
const HomePetFocusV2 = lazy(() =>
  import('@/components/home/HomePetFocusV2').then((m) => ({ default: m.HomePetFocusV2 }))
);

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  photo_url: string | null;
  holo_pattern?: string | null;
  paw_score?: number;
  weight?: number | null;
  microchip_number?: string | null;
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
  'name',
  'species',
  'breed',
  'birth_date',
  'gender',
  'size',
  'color',
  'weight',
  'photo_url',
  'microchip_number',
] as const;

interface BorderStyleDef {
  gradient: string;
  speed: string;
  shadow: string;
  shadowHover: string;
  padding: string;
}

/** Memoized pet avatar for the switcher — avoids recomputing styles and
 *  ensures the holo-shift animation only runs on the active pet. */
const PetSwitcherAvatar = memo(function PetSwitcherAvatar({
  pet,
  isActive,
  borderStyle,
  onSelect,
}: {
  pet: Pet;
  isActive: boolean;
  borderStyle: BorderStyleDef;
  onSelect: (id: string) => void;
}) {
  const activeOuterStyle = useMemo<React.CSSProperties>(
    () => ({
      padding: '3px',
      background: borderStyle.gradient,
      backgroundSize: '300% 300%',
      animation: `holo-shift ${borderStyle.speed} ease-in-out infinite`,
      boxShadow: borderStyle.shadow,
    }),
    [borderStyle.gradient, borderStyle.speed, borderStyle.shadow]
  );

  const inactiveOuterStyle = useMemo<React.CSSProperties>(() => ({ padding: '3px' }), []);

  const inactiveInnerStyle = useMemo<React.CSSProperties>(
    () => ({
      background: borderStyle.gradient,
      backgroundSize: '300% 300%',
      opacity: 0.5,
    }),
    [borderStyle.gradient]
  );

  return (
    <button
      key={pet.id}
      onClick={() => onSelect(pet.id)}
      className="flex flex-col items-center gap-1 flex-shrink-0 group"
      aria-label={`Seleccionar ${pet.name}`}
    >
      <div
        className={`relative rounded-full transition-all ${isActive ? 'scale-105' : 'group-hover:scale-102'}`}
        style={isActive ? activeOuterStyle : inactiveOuterStyle}
      >
        <div
          className={`rounded-full p-[2px] ${!isActive ? 'bg-muted group-hover:bg-muted/70' : ''}`}
          style={!isActive ? inactiveInnerStyle : undefined}
        >
          <Avatar className="h-16 w-16 ring-2 ring-background">
            <AvatarImage src={pet.photo_url || undefined} alt={pet.name} />
            <AvatarFallback className="bg-purple-100 text-purple-700 text-xl font-bold">
              {pet.name[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
        {isActive && (
          <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-purple-600 border-2 border-background" />
        )}
      </div>
      <span
        className={`text-xs font-medium max-w-[72px] truncate ${
          isActive ? 'text-purple-700 font-bold' : 'text-muted-foreground'
        }`}
      >
        {pet.name}
      </span>
    </button>
  );
});

// Wrapper que elige entre el Home legacy (dashboard completo) y el
// Home PetFocus V2 (Refactor Maestro 2026-04-23 §5.2.2) segun el flag.
// El switch esta en un wrapper aparte para evitar violar rules-of-hooks
// (el legacy tiene 30+ hooks que no deben ser condicionales).
function HomeLoadingFallback() {
  return (
    <div className="container mx-auto p-4 space-y-4">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

export default function Home() {
  const { role } = useActiveRole();
  if (isFeatureEnabled('HOME_PET_FOCUS') && role !== 'provider') {
    return (
      <Suspense fallback={<HomeLoadingFallback />}>
        <HomePetFocusV2 />
      </Suspense>
    );
  }
  return <HomeLegacyDashboard />;
}

function HomeLegacyDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const goToAddPet = useGoToAddPet();
  const { role } = useActiveRole();
  const [pets, setPets] = useState<Pet[]>([]);
  const [activePetId, setActivePetId] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [vaccineStatus, setVaccineStatus] = useState<VaccineStatusByPet>({});
  const [completeness, setCompleteness] = useState<CompletenessByPet>({});
  const [loading, setLoading] = useState(true);
  const { stats } = useGamification();
  const { upcomingReminders, overdueReminders, completeReminder } = useReminders();
  const pendingReviewCount = usePendingReviewCount();
  const { data: publicDonationStats } = usePublicDonationStats();
  const [showNamePrompt, setShowNamePrompt] = useState(false);

  useEffect(() => {
    if (user && role === 'owner') {
      void loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadData depends on user from closure; adding it would cause infinite loops
  }, [user, role]);

  const loadData = async () => {
    if (!user) return;

    try {
      // Queries independientes en paralelo
      const [profileResult, petsResult, appointmentsResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('display_name, avatar_url, is_premium')
          .eq('id', user.id)
          .maybeSingle(),
        supabase
          .from('pets')
          .select(
            'id, name, species, breed, birth_date, gender, size, color, weight, photo_url, microchip_number, holo_pattern, paw_card_id'
          )
          .eq('owner_id', user.id)
          .eq('lifecycle_status', 'active'),
        supabase
          .from('appointments')
          .select('id, title, scheduled_date, pet_id')
          .gte('scheduled_date', new Date().toISOString())
          .order('scheduled_date', { ascending: true })
          .limit(5),
      ]);

      const profileData = profileResult.data;
      if (profileData) {
        setProfile(profileData);
        // Show name prompt if display_name is generic/missing
        if (isGenericDisplayName(profileData.display_name)) {
          const dismissed = localStorage.getItem('pf_name_prompt_dismissed');
          if (!dismissed) setShowNamePrompt(true);
        }
      }

      if (appointmentsResult.data) setAppointments(appointmentsResult.data);

      const petsData = petsResult.data;

      // Fetch paw scores for rarity display
      const petIds = (petsData || []).map((p: { id: string }) => p.id);
      const scoreMap: Record<string, number> = {};
      if (petIds.length > 0) {
        const { data: progressData } = await supabase
          .from('pet_paw_progress')
          .select('pet_id, health_score, activity_score, happiness_score, social_score')
          .in('pet_id', petIds);
        (progressData || []).forEach((row) => {
          const avg = Math.round(
            ((row.health_score || 0) +
              (row.activity_score || 0) +
              (row.happiness_score || 0) +
              (row.social_score || 0)) /
              4
          );
          scoreMap[row.pet_id] = avg;
        });
      }

      const petsList: Pet[] = (petsData || []).map((p) => ({
        id: p.id,
        name: p.name,
        species: p.species,
        breed: p.breed,
        photo_url: p.photo_url,
        holo_pattern: (p as Record<string, unknown>).holo_pattern as string | null,
        paw_score: scoreMap[p.id] ?? 0,
        weight: p.weight ?? null,
        microchip_number: p.microchip_number ?? null,
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
          return acc + (v !== null && v !== undefined && v !== '' ? 1 : 0);
        }, 0);
        compMap[p.id] = Math.round((filled / total) * 100);
      });
      setCompleteness(compMap);

      // Vaccine status: use pet_reminders type=vaccine to find pending; if none pending => al día
      if (petsList.length > 0) {
        const petIds = petsList.map((p) => p.id);
        const { data: vaccineReminders } = await supabase
          .from('pet_reminders')
          .select('pet_id, title, due_date, is_completed')
          .in('pet_id', petIds)
          .eq('type', 'vaccine');
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
      logger.error('Error loading home data:', error);
    } finally {
      setLoading(false);
    }
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
    if (!nextAppointmentForActive) return 'Sin agendar';
    try {
      return `en ${formatDistanceToNowStrict(parseISO(nextAppointmentForActive.scheduled_date), { locale: es })}`;
    } catch {
      return 'Próxima';
    }
  })();

  const activeVaccine = activePet ? vaccineStatus[activePet.id] : undefined;
  const activeCompleteness = activePet ? (completeness[activePet.id] ?? 0) : 0;
  // Health score for active pet
  const healthScore = useMemo(() => {
    if (!activePet) return null;
    const petOverdue = overdueReminders.filter((r) => r.pet_id === activePet.id).length;
    const petUpcoming = upcomingReminders.filter((r) => r.pet_id === activePet.id).length;
    return computeHealthScore({
      overdueCount: petOverdue,
      upcomingCount: petUpcoming,
      vaccinesUpToDate: activeVaccine?.upToDate ?? false,
      lastVetVisit: null,
      hasWeight: !!activePet.weight,
      hasPhoto: !!activePet.photo_url,
      hasMicrochip: !!activePet.microchip_number,
    });
  }, [activePet, overdueReminders, upcomingReminders, activeVaccine]);

  // Providers ven su dashboard profesional directamente en /home
  if (role === 'provider') {
    return (
      <div className="container max-w-6xl mx-auto p-4 md:p-6">
        <Suspense fallback={<HomeLoadingFallback />}>
          <ProviderDashboard />
        </Suspense>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container max-w-6xl mx-auto p-4 md:p-6 space-y-4 animate-fade-in">
        {/* Header skeleton: avatar + greeting */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>

        {/* Pet switcher skeleton */}
        <div className="flex gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <Skeleton className="h-16 w-16 rounded-full" />
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>

        {/* Status cards skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto p-4 md:p-6 space-y-4 animate-fade-in min-h-screen">
      <GoogleCalendarStatusBanner settingsHref="/profile" />

      {/* === Header compact === */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative flex-shrink-0">
            <Avatar className="h-10 w-10 ring-2 ring-background shadow">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-warm-gradient text-white text-sm font-bold">
                {(() => {
                  if (profile?.display_name) {
                    const parts = profile.display_name.trim().split(/\s+/);
                    if (parts.length >= 2)
                      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
                    return profile.display_name[0].toUpperCase();
                  }
                  return user?.email?.[0]?.toUpperCase() || 'U';
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
            <p className="font-display font-semibold text-base md:text-lg truncate tracking-tight flex items-center gap-1.5">
              <span className="truncate">
                {getGreeting()},{' '}
                {profile?.display_name?.split(/\s+/)[0] || user?.email?.split('@')[0] || 'Amigo'}
              </span>
              {/* Badge Paw Member — signal de confianza y reconocimiento
                  (QW-12 auditoría top-tier 2026-04-20). */}
              {profile?.is_premium && (
                <button
                  type="button"
                  onClick={() => navigate(LINKS.pawMember())}
                  className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-pink-100 to-amber-100 border border-pink-200 px-2 py-0.5 text-[10px] font-semibold text-pink-800 hover:scale-105 transition-transform"
                  title="Eres Paw Member 💛 — ver tu aporte"
                  aria-label="Eres Paw Member, ver tu aporte"
                >
                  💛 Paw Member
                </button>
              )}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {pets.length > 0 && (
                <span>
                  {pets.length} {pets.length === 1 ? 'mascota' : 'mascotas'}
                </span>
              )}
              {/* Contador público — micro-prueba social, enlazado a /donaciones */}
              {publicDonationStats && publicDonationStats.donors_total > 0 && (
                <>
                  {pets.length > 0 && <span aria-hidden>·</span>}
                  <button
                    type="button"
                    onClick={() => navigate(LINKS.donaciones())}
                    className="underline decoration-dotted underline-offset-2 hover:text-pink-600 transition-colors"
                    title="Ver aportes y transparencia"
                  >
                    {publicDonationStats.donors_total.toLocaleString('es-CL')} tutores sosteniendo
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        {/* Quick actions inline + PawPoints chip (visible, feedback Palo) */}
        <div className="flex items-center gap-1.5">
          {stats && stats.points > 0 && (
            <button
              type="button"
              onClick={() => navigate('/misiones')}
              className="flex items-center gap-1 bg-gradient-to-r from-amber-100 to-yellow-100 border border-amber-200 rounded-full px-2.5 py-1 hover:scale-105 transition-transform"
              title={`${stats.points} Paw Points · los ganas cuidando a tus peludos. Tocá para ver misiones.`}
              aria-label={`${stats.points} Paw Points ganados. Ver misiones para ganar más.`}
            >
              <Crown className="h-3 w-3 text-amber-600" />
              <span className="text-[11px] font-bold text-amber-800">{stats.points}</span>
            </button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => navigate('/veterinarios?emergencia=true')}
            title="SOS Vet"
          >
            <Phone className="h-4 w-4 text-red-500" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => navigate(LINKS.maps())}
            title="Mapa"
          >
            <Map className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* NamePromptDialog: lazy. open=false → no descarga. */}
      {showNamePrompt && (
        <Suspense fallback={null}>
          <NamePromptDialog
            open={showNamePrompt}
            currentName=""
            onDone={(newName) => {
              setShowNamePrompt(false);
              setProfile((prev) => (prev ? { ...prev, display_name: newName } : prev));
              localStorage.setItem('pf_name_prompt_dismissed', '1');
            }}
          />
        </Suspense>
      )}
      <TrialWelcomeOverlay />
      <TrialBanner />
      <HomeOnboardingHints hasPets={pets.length > 0} />

      {/* Nudge joya de la corona: empujar primer PDF (playbook §9.3) */}
      <FirstPdfNudge firstPetId={pets[0]?.id ?? null} petsCount={pets.length} />

      {/* Tu próxima cita confirmada / pendiente */}
      {pets.length > 0 && <NextBookingCard />}

      {/* Actividades de la próxima semana (reminders + bookings) */}
      {pets.length > 0 && <WeekActivitiesCard />}

      {/* Racha de cuidado — gamificación light */}
      {pets.length > 0 && <CareStreakCard />}

      {/* Panel de salud por mascota (solo si hay 2+) */}
      {pets.length >= 2 && <PetsHealthPanel />}

      {/* Paw Friend Recomendados: descubrir vets con rating alto en 1 tap */}
      {pets.length > 0 && <PawFriendPicks />}

      {/* PWA install prompt contextual (solo user con 3+ sesiones, no standalone) */}
      <Suspense fallback={null}>
        <PWAInstallPrompt />
      </Suspense>

      {/* === Empty state === */}
      {pets.length === 0 && (
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
          <CardContent className="flex flex-col items-center text-center py-10 gap-4">
            <div className="rounded-full bg-purple-100 p-4">
              <PawPrint className="h-10 w-10 text-purple-500" />
            </div>
            <div>
              <p className="font-semibold text-base text-purple-900">Tu dashboard aparecera aqui</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                Agrega tu primera mascota para ver su ficha clinica, recordatorios y mas.
              </p>
            </div>
            <Button
              onClick={() => navigate('/add-pet')}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" /> Agregar mascota
            </Button>
          </CardContent>
        </Card>
      )}

      {pets.length > 0 && (
        <>
          {/* === Franja "Tu mascota hoy": switcher + CTA ficha + status === */}
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Tu mascota hoy
          </h2>
          {/* === Pet switcher === */}
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
            {pets.map((pet) => (
              <PetSwitcherAvatar
                key={pet.id}
                pet={pet}
                isActive={activePetId === pet.id}
                borderStyle={RARITY_BORDER_STYLES[getRarity(pet.paw_score ?? 0)]}
                onSelect={setActivePetId}
              />
            ))}
            <button
              onClick={goToAddPet}
              className="flex flex-col items-center gap-1 flex-shrink-0 group"
              aria-label="Agregar mascota"
            >
              <div className="rounded-full p-[3px] bg-muted group-hover:bg-purple-100 transition-colors">
                <div className="h-16 w-16 rounded-full border-2 border-dashed border-purple-400 bg-background flex items-center justify-center">
                  <Plus className="h-7 w-7 text-purple-600" />
                </div>
              </div>
              <span className="text-xs font-medium text-muted-foreground">Agregar</span>
            </button>
          </div>

          {/* === CTA principal: joya de la corona en 1 tap === */}
          {activePet && (
            <Button
              size="lg"
              className="w-full h-12 gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-md shadow-purple-500/20 text-white font-semibold"
              onClick={() => navigate(LINKS.petClinical(activePet.id))}
            >
              <FileText className="h-5 w-5" />
              Abrir ficha clínica de {activePet.name}
            </Button>
          )}

          {/* === Status cards 2x2 → 4x1 === */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <StatusCard
              icon={Calendar}
              title="Proxima cita"
              value={nextAppointmentLabel}
              cta={nextAppointmentForActive ? 'Ver' : 'Agendar'}
              accent={nextAppointmentForActive ? 'default' : 'warning'}
              onClick={() => navigate(nextAppointmentForActive ? LINKS.bookings() : LINKS.vets())}
            />
            <StatusCard
              icon={Syringe}
              title="Vacunas"
              value={
                activeVaccine?.upToDate
                  ? 'Al dia'
                  : activeVaccine?.pendingName
                    ? `Pend.`
                    : 'Sin datos'
              }
              cta={activeVaccine?.upToDate ? 'Historial' : 'Ver'}
              accent={activeVaccine?.upToDate ? 'success' : 'warning'}
              onClick={() =>
                navigate(activePet ? LINKS.petClinical(activePet.id) : LINKS.medicalRecords())
              }
            />
            <StatusCard
              icon={FileText}
              title="Ficha"
              value={`${activeCompleteness}%`}
              cta={activeCompleteness >= 80 ? 'Compartir' : 'Completar'}
              accent={activeCompleteness >= 80 ? 'success' : 'default'}
              onClick={() =>
                navigate(activePet ? LINKS.petClinical(activePet.id) : LINKS.medicalRecords())
              }
            />
            <StatusCard
              icon={TrendingUp}
              title="Salud"
              value={healthScore?.label ?? 'Sin datos'}
              cta="Ver"
              accent={
                healthScore?.status === 'good'
                  ? 'success'
                  : healthScore?.status === 'critical'
                    ? 'warning'
                    : 'default'
              }
              onClick={() =>
                navigate(activePet ? LINKS.petClinical(activePet.id) : LINKS.remindersTab())
              }
            />
          </div>

          {/* === Franja "Tu agenda": alerts + rutinas + reporte semanal === */}
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2">
            Tu agenda
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Health alerts + Routines */}
            <div className="space-y-3">
              {/* Health alerts */}
              {(overdueReminders.length > 0 || upcomingReminders.length > 0) && (
                <Card
                  className={`border-l-4 ${overdueReminders.length > 0 ? 'border-l-red-500 bg-red-50/30' : 'border-l-amber-400 bg-amber-50/30'}`}
                >
                  <CardContent className="p-3 space-y-2">
                    <p className="text-xs font-semibold flex items-center gap-1.5">
                      {overdueReminders.length > 0 ? (
                        <>
                          <AlertCircle className="h-3.5 w-3.5 text-red-600" />
                          <span className="text-red-800">Requiere atencion</span>
                        </>
                      ) : (
                        <>
                          <Bell className="h-3.5 w-3.5 text-amber-600" />
                          <span className="text-amber-800">Proximos cuidados</span>
                        </>
                      )}
                    </p>
                    {overdueReminders.slice(0, 2).map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between p-1.5 rounded bg-white border border-red-100 text-xs"
                      >
                        <div className="min-w-0">
                          <p className="font-medium truncate">{r.title}</p>
                          <p className="text-[10px] text-red-600 truncate">
                            {r.pets?.name} · vencido
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => completeReminder.mutate(r.id)}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                    {upcomingReminders.slice(0, 2).map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between p-1.5 rounded bg-white border border-amber-100 text-xs"
                      >
                        <div className="min-w-0">
                          <p className="font-medium truncate">{r.title}</p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {r.pets?.name}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => completeReminder.mutate(r.id)}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => navigate(LINKS.remindersTab())}
                      className="w-full text-[10px] h-6"
                    >
                      Ver todos →
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Today's routines */}
              <TodayRoutinesCard />

              <WeeklyReportCard />

              <Card
                className="border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 cursor-pointer hover:shadow-md transition-all"
                onClick={() => navigate(LINKS.proDashboard())}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="rounded-xl bg-white p-2 shadow-sm">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-purple-900">Panel Pro</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      Analytics avanzados de la salud de tus mascotas
                    </p>
                  </div>
                  <Crown className="h-4 w-4 text-amber-500 flex-shrink-0" />
                </CardContent>
              </Card>
            </div>

            {/* Right: Primary CTAs + secondary info */}
            <div className="space-y-3">
              {/* Primary CTA: Completa tu ficha (if <80%) or Buscar vet */}
              {activeCompleteness < 80 && activePet && (
                <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50">
                  <CardContent className="p-4">
                    <p className="text-sm font-semibold text-purple-900 mb-1">
                      Completa la ficha de {activePet.name}
                    </p>
                    <p className="text-xs text-muted-foreground mb-3">
                      Tu ficha esta al {activeCompleteness}%. Una ficha completa ayuda a tu vet a
                      dar mejor atencion.
                    </p>
                    <Button
                      size="sm"
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                      onClick={() => navigate(LINKS.petClinical(activePet.id))}
                    >
                      <FileText className="h-3.5 w-3.5 mr-1.5" /> Completar ficha
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Primary CTA: Buscar vet */}
              <Card className="border-teal-200 bg-gradient-to-br from-teal-50 to-emerald-50">
                <CardContent className="p-4">
                  <p className="text-sm font-semibold text-teal-900 mb-1">Busca un veterinario</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Encuentra vets cerca de ti, compara precios y agenda una hora.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
                      onClick={() => navigate(LINKS.vets())}
                    >
                      <Stethoscope className="h-3.5 w-3.5 mr-1.5" /> Buscar vet
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-teal-300 text-teal-700"
                      onClick={() => navigate('/precios-veterinarios')}
                    >
                      <TrendingUp className="h-3.5 w-3.5 mr-1.5" /> Precios
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick actions compact */}
              <Card>
                <CardContent className="p-3">
                  <p className="text-xs font-semibold mb-2 text-muted-foreground">
                    Acciones rapidas
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 text-xs justify-start gap-1.5"
                      onClick={() =>
                        navigate(
                          activePet ? LINKS.petClinical(activePet.id) : LINKS.medicalRecords()
                        )
                      }
                    >
                      <FileText className="h-3.5 w-3.5 text-blue-600" /> Ficha medica
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 text-xs justify-start gap-1.5"
                      onClick={() => navigate('/calendario')}
                    >
                      <Calendar className="h-3.5 w-3.5 text-indigo-600" /> Calendario
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Pending reviews */}
              {pendingReviewCount > 0 && (
                <Card
                  className="border-amber-100 bg-amber-50/30 cursor-pointer hover:bg-amber-50/50 transition-colors"
                  onClick={() => navigate(LINKS.bookingsTab())}
                >
                  <CardContent className="flex items-center gap-3 p-3">
                    <Star className="h-4 w-4 text-amber-600 flex-shrink-0" />
                    <p className="text-xs font-medium text-amber-800 flex-1">
                      {pendingReviewCount}{' '}
                      {pendingReviewCount === 1 ? 'resena pendiente' : 'resenas pendientes'}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </>
      )}

      {/* === Explorar más: opt-in a Paw Labs (modelo v2 producto invisible) ===
          Antes: 4 cards inline (Feed/Comunidad/Misiones/Paw Game) en home.
          Después: un solo CTA que lleva a /explorar (hub agrupado).
          El home se mantiene en foco médico (ficha + recordatorios + urgencia
          + directorio); las features experimentales viven en /explorar. */}
      {pets.length > 0 && (
        <section aria-label="Explorar más">
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow border-purple-200/70 bg-gradient-to-br from-purple-50/40 to-fuchsia-50/30"
            onClick={() => navigate('/explorar')}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                <Compass className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">Explorar más</p>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  Comunidad, adopciones, donantes de sangre, mapa pet-friendly, misiones y más.
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </CardContent>
          </Card>
        </section>
      )}

      <ViewTutorial {...TUTORIALS.home} />

      {/* Dialog aceptar/rechazar invitación co-owner (2026-04-21) */}
      <Suspense fallback={null}>
        <CoOwnerInviteReceivedDialog />
      </Suspense>
    </div>
  );
}
