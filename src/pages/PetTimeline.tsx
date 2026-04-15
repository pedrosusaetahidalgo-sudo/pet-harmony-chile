import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { LINKS } from '@/lib/links';
import {
  Syringe,
  Stethoscope,
  FileText,
  CheckCircle2,
  Calendar,
  Activity,
  PawPrint,
  Scissors,
  Weight,
  AlertCircle,
} from '@/lib/icons';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface TimelineEvent {
  id: string;
  date: string;
  type: 'medical' | 'reminder' | 'booking' | 'activity';
  subtype: string;
  title: string;
  description?: string;
  icon: typeof Syringe;
  color: string;
}

const SUBTYPE_CONFIG: Record<string, { icon: typeof Syringe; color: string }> = {
  vacuna: { icon: Syringe, color: 'text-green-600 bg-green-50 border-green-200' },
  consulta: { icon: Stethoscope, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  tratamiento: { icon: Activity, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  cirugia: { icon: AlertCircle, color: 'text-red-600 bg-red-50 border-red-200' },
  alergia: { icon: AlertCircle, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  peso: { icon: Weight, color: 'text-teal-600 bg-teal-50 border-teal-200' },
  checkup: { icon: Stethoscope, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  vaccine: { icon: Syringe, color: 'text-green-600 bg-green-50 border-green-200' },
  medication: { icon: Activity, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  grooming: { icon: Scissors, color: 'text-pink-600 bg-pink-50 border-pink-200' },
  walk: { icon: PawPrint, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  vet_visit: { icon: Stethoscope, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  booking: { icon: Calendar, color: 'text-violet-600 bg-violet-50 border-violet-200' },
  default: { icon: FileText, color: 'text-gray-600 bg-gray-50 border-gray-200' },
};

function getConfig(subtype: string) {
  return SUBTYPE_CONFIG[subtype] || SUBTYPE_CONFIG.default;
}

export default function PetTimeline() {
  const { petId } = useParams<{ petId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: pet } = useQuery({
    queryKey: ['pet-timeline-info', petId],
    queryFn: async () => {
      if (!petId) return null;
      const { data } = await supabase
        .from('pets')
        .select('id, name, species, photo_url')
        .eq('id', petId)
        .maybeSingle();
      return data;
    },
    enabled: !!petId,
  });

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['pet-timeline', petId],
    queryFn: async (): Promise<TimelineEvent[]> => {
      if (!petId) return [];

      const [medicalRes, remindersRes, activitiesRes] = await Promise.all([
        // Medical records
        supabase
          .from('medical_records')
          .select('id, record_type, title, description, date')
          .eq('pet_id', petId)
          .order('date', { ascending: false })
          .limit(50),
        // Completed reminders
        supabase
          .from('pet_reminders')
          .select('id, type, title, completed_at')
          .eq('pet_id', petId)
          .eq('is_completed', true)
          .not('completed_at', 'is', null)
          .order('completed_at', { ascending: false })
          .limit(30),
        // Pet activities
        supabase
          .from('pet_activities')
          .select('id, activity_type, title, created_at')
          .eq('pet_id', petId)
          .order('created_at', { ascending: false })
          .limit(30),
      ]);

      const timeline: TimelineEvent[] = [];

      (medicalRes.data || []).forEach((r) => {
        const cfg = getConfig(r.record_type);
        timeline.push({
          id: `med-${r.id}`,
          date: r.date,
          type: 'medical',
          subtype: r.record_type,
          title: r.title,
          description: r.description || undefined,
          icon: cfg.icon,
          color: cfg.color,
        });
      });

      (remindersRes.data || []).forEach((r) => {
        const cfg = getConfig(r.type);
        timeline.push({
          id: `rem-${r.id}`,
          date: r.completed_at!,
          type: 'reminder',
          subtype: r.type,
          title: r.title,
          icon: CheckCircle2,
          color: 'text-green-600 bg-green-50 border-green-200',
        });
      });

      (activitiesRes.data || []).forEach((a) => {
        const cfg = getConfig(a.activity_type);
        timeline.push({
          id: `act-${a.id}`,
          date: a.created_at,
          type: 'activity',
          subtype: a.activity_type,
          title: a.title,
          icon: cfg.icon,
          color: cfg.color,
        });
      });

      // Sort descending by date
      timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return timeline;
    },
    enabled: !!petId,
  });

  // Group by month
  const grouped: Record<string, TimelineEvent[]> = {};
  events.forEach((e) => {
    const monthKey = format(parseISO(e.date.split('T')[0]), 'MMMM yyyy', { locale: es });
    if (!grouped[monthKey]) grouped[monthKey] = [];
    grouped[monthKey].push(e);
  });

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title={pet ? `Historia de ${pet.name}` : 'Timeline'}
        subtitle="Todos los eventos de salud y cuidado"
        actions={
          petId ? (
            <Button variant="outline" size="sm" onClick={() => navigate(LINKS.petClinical(petId))}>
              <FileText className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Ficha</span>
            </Button>
          ) : undefined
        }
      />

      <main className="container max-w-2xl mx-auto px-3 py-4 space-y-6 pb-24">
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        )}

        {!isLoading && events.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center">
              <PawPrint className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium">Sin eventos todavía</p>
              <p className="text-xs text-muted-foreground mt-1">
                Los eventos aparecerán cuando registres vacunas, consultas o completes
                recordatorios.
              </p>
            </CardContent>
          </Card>
        )}

        {Object.entries(grouped).map(([month, monthEvents]) => (
          <div key={month}>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 capitalize">
              {month}
            </h3>
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-[19px] top-3 bottom-3 w-px bg-border" />

              <div className="space-y-2">
                {monthEvents.map((event) => {
                  const Icon = event.icon;
                  const colorParts = event.color.split(' ');
                  const textColor = colorParts[0];
                  const bgColor = colorParts[1];

                  return (
                    <div key={event.id} className="flex gap-3 relative">
                      <div
                        className={cn(
                          'h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 border z-10',
                          bgColor,
                          colorParts[2]
                        )}
                      >
                        <Icon className={cn('h-4 w-4', textColor)} />
                      </div>
                      <div className="flex-1 min-w-0 py-1">
                        <p className="text-sm font-medium truncate">{event.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-muted-foreground">
                            {format(parseISO(event.date.split('T')[0]), 'd MMM yyyy', {
                              locale: es,
                            })}
                          </span>
                          <span className={cn('text-[10px] font-medium capitalize', textColor)}>
                            {event.subtype.replace(/_/g, ' ')}
                          </span>
                        </div>
                        {event.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {event.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
