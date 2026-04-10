import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { es } from "date-fns/locale";
import { Bell, CheckCircle2, Plus, AlertTriangle, Calendar as CalendarIcon } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";
import { useReminders } from "@/hooks/useReminders";
import { LINKS } from "@/lib/links";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";

/**
 * Pagina agregadora de recordatorios.
 *
 * Muestra todos los `pet_reminders` del usuario en 3 secciones:
 *  - Vencidos (urgente, rojo)
 *  - Hoy / proximos 24h (amber)
 *  - Proximos (mas adelante)
 *
 * No es feature nueva: solo UI sobre data que ya existe via `useReminders`.
 * Permite marcar como completado y navegar al detalle de la mascota.
 */
export default function Reminders() {
  const navigate = useNavigate();
  const { reminders, overdueReminders, upcomingReminders, isLoading, completeReminder } =
    useReminders();

  const grouped = useMemo(() => {
    const today: typeof reminders = [];
    const later: typeof reminders = [];
    upcomingReminders.forEach((r) => {
      const d = new Date(r.due_date);
      if (isToday(d) || isTomorrow(d)) today.push(r);
      else later.push(r);
    });
    return { today, later };
  }, [upcomingReminders]);

  const formatDue = (iso: string) => {
    const d = new Date(iso);
    if (isToday(d)) return "Hoy";
    if (isTomorrow(d)) return "Mañana";
    if (isPast(d)) return `Vencido · ${format(d, "d MMM", { locale: es })}`;
    return format(d, "EEEE d MMM", { locale: es });
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Recordatorios"
        subtitle={
          reminders.length === 0
            ? undefined
            : `${overdueReminders.length} vencido${overdueReminders.length === 1 ? "" : "s"} · ${upcomingReminders.length} próximo${upcomingReminders.length === 1 ? "" : "s"}`
        }
        back
        actions={
          <Button
            size="sm"
            onClick={() => navigate(LINKS.myPets())}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            Agregar
          </Button>
        }
      />

      <main className="container max-w-5xl mx-auto px-3 py-4 space-y-6">
        {isLoading && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted/60 rounded-lg animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && reminders.length === 0 && (
          <EmptyState
            icon={Bell}
            title="Aún no tienes recordatorios"
            description="Crea tu primer recordatorio desde la ficha de tu mascota."
            action={
              <Button onClick={() => navigate(LINKS.myPets())} className="bg-purple-600 hover:bg-purple-700">
                Ir a mis mascotas
              </Button>
            }
          />
        )}

        {overdueReminders.length > 0 && (
          <Section
            title="Vencidos"
            icon={<AlertTriangle className="h-4 w-4 text-rose-600" />}
            tone="rose"
            count={overdueReminders.length}
          >
            {overdueReminders.map((r) => (
              <ReminderCard
                key={r.id}
                reminder={r}
                onComplete={() => completeReminder.mutate(r.id)}
                onOpen={() => navigate(`/pet/${r.pet_id}/clinical`)}
                dueLabel={formatDue(r.due_date)}
                tone="rose"
              />
            ))}
          </Section>
        )}

        {grouped.today.length > 0 && (
          <Section
            title="Hoy y mañana"
            icon={<Bell className="h-4 w-4 text-amber-600" />}
            tone="amber"
            count={grouped.today.length}
          >
            {grouped.today.map((r) => (
              <ReminderCard
                key={r.id}
                reminder={r}
                onComplete={() => completeReminder.mutate(r.id)}
                onOpen={() => navigate(`/pet/${r.pet_id}/clinical`)}
                dueLabel={formatDue(r.due_date)}
                tone="amber"
              />
            ))}
          </Section>
        )}

        {grouped.later.length > 0 && (
          <Section
            title="Próximos"
            icon={<CalendarIcon className="h-4 w-4 text-purple-600" />}
            tone="purple"
            count={grouped.later.length}
          >
            {grouped.later.map((r) => (
              <ReminderCard
                key={r.id}
                reminder={r}
                onComplete={() => completeReminder.mutate(r.id)}
                onOpen={() => navigate(`/pet/${r.pet_id}/clinical`)}
                dueLabel={formatDue(r.due_date)}
                tone="purple"
              />
            ))}
          </Section>
        )}
      </main>
    </div>
  );
}

function Section({
  title,
  icon,
  count,
  tone,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  tone: "rose" | "amber" | "purple";
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-2 px-1">
        {icon}
        <h2 className="text-sm font-semibold">{title}</h2>
        <Badge
          variant="secondary"
          className={cn(
            "ml-auto text-xs",
            tone === "rose" && "bg-rose-100 text-rose-700",
            tone === "amber" && "bg-amber-100 text-amber-700",
            tone === "purple" && "bg-purple-100 text-purple-700"
          )}
        >
          {count}
        </Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">{children}</div>
    </section>
  );
}

function ReminderCard({
  reminder,
  onComplete,
  onOpen,
  dueLabel,
  tone,
}: {
  reminder: { id: string; title: string; type: string; pets?: { name: string; species: string } | null };
  onComplete: () => void;
  onOpen: () => void;
  dueLabel: string;
  tone: "rose" | "amber" | "purple";
}) {
  return (
    <Card
      className={cn(
        "border-l-4 transition hover:shadow-sm",
        tone === "rose" && "border-l-rose-500",
        tone === "amber" && "border-l-amber-500",
        tone === "purple" && "border-l-purple-600"
      )}
    >
      <CardContent className="py-3 px-3 flex items-center gap-3">
        <button
          onClick={onOpen}
          className="flex-1 text-left min-w-0"
          aria-label={`Abrir ficha de ${reminder.pets?.name || "mascota"}`}
        >
          <p className="font-medium text-sm truncate">{reminder.title}</p>
          <p className="text-xs text-muted-foreground truncate">
            {reminder.pets?.name ? `${reminder.pets.name} · ` : ""}
            {dueLabel}
          </p>
        </button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onComplete}
          aria-label="Marcar como hecho"
          className="h-11 w-11 flex-shrink-0 text-purple-600 hover:bg-purple-50 hover:text-purple-700"
        >
          <CheckCircle2 className="h-5 w-5" />
        </Button>
      </CardContent>
    </Card>
  );
}
