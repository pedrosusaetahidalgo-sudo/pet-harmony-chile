import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Area, AreaChart, XAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { Activity, CheckCircle2, Stethoscope, Syringe } from "@/lib/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { useProAnalytics } from "@/hooks/useProAnalytics";
import { ProUpgradeCTA } from "./ProUpgradeCTA";
import { usePlan } from "@/hooks/usePlan";
import { track, EVENTS } from "@/lib/analytics";
import { LINKS } from "@/lib/links";

const chartConfig: ChartConfig = {
  reminders: { label: "Recordatorios", color: "hsl(262, 83%, 58%)" },
  visits: { label: "Visitas vet", color: "hsl(173, 80%, 40%)" },
  vaccines: { label: "Vacunas", color: "hsl(47, 96%, 53%)" },
};

export function AnalyticsPreviewCard() {
  const navigate = useNavigate();
  const { isPremium } = usePlan();
  const { data, isLoading } = useProAnalytics({ period: "current_month" });

  useEffect(() => {
    if (data) {
      track({ event: EVENTS.ANALYTICS_PREVIEW_VIEWED, properties: { source: "home" } });
    }
  }, [!!data]);

  if (isLoading) {
    return <Skeleton className="h-40 w-full rounded-xl" />;
  }

  if (!data) return null;

  const { summary, activityTimeline } = data;
  const hasActivity = summary.remindersCompleted + summary.vetVisits + summary.vaccinesGiven > 0;

  return (
    <Card
      className="border-purple-200/60 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => navigate(LINKS.proDashboard())}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="h-4 w-4 text-purple-600" />
          Resumen del mes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Mini stats row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-purple-500" />
            <div>
              <p className="text-lg font-bold leading-none">{summary.remindersCompleted}</p>
              <p className="text-[10px] text-muted-foreground">recordatorios</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Stethoscope className="h-3.5 w-3.5 text-teal-500" />
            <div>
              <p className="text-lg font-bold leading-none">{summary.vetVisits}</p>
              <p className="text-[10px] text-muted-foreground">visitas vet</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Syringe className="h-3.5 w-3.5 text-amber-500" />
            <div>
              <p className="text-lg font-bold leading-none">{summary.vaccinesGiven}</p>
              <p className="text-[10px] text-muted-foreground">vacunas</p>
            </div>
          </div>
        </div>

        {/* Sparkline chart */}
        {hasActivity && activityTimeline.length > 1 && (
          <ChartContainer config={chartConfig} className="h-[60px] w-full aspect-auto">
            <AreaChart data={activityTimeline} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="fillReminders" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-reminders)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-reminders)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" hide />
              <Area
                type="monotone"
                dataKey="reminders"
                stroke="var(--color-reminders)"
                strokeWidth={1.5}
                fill="url(#fillReminders)"
                dot={false}
              />
            </AreaChart>
          </ChartContainer>
        )}

        {/* CTA */}
        {!isPremium && <ProUpgradeCTA variant="minimal" context="analytics_preview_card" />}
      </CardContent>
    </Card>
  );
}
