import { useNavigate } from "react-router-dom";
import { RadialBar, RadialBarChart, PolarAngleAxis } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { Heart } from "@/lib/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { useProAnalytics } from "@/hooks/useProAnalytics";
import { ProUpgradeCTA } from "./ProUpgradeCTA";
import { usePlan } from "@/hooks/usePlan";
import { LINKS } from "@/lib/links";

interface PetWellnessPreviewProps {
  petId: string;
  petName: string;
}

function getScoreColor(score: number): string {
  if (score >= 70) return "hsl(142, 71%, 45%)";
  if (score >= 40) return "hsl(47, 96%, 53%)";
  return "hsl(0, 84%, 60%)";
}

function getScoreLabel(score: number): string {
  if (score >= 70) return "Excelente";
  if (score >= 40) return "Regular";
  return "Necesita atención";
}

const chartConfig: ChartConfig = {
  wellness: { label: "Bienestar", color: "hsl(142, 71%, 45%)" },
};

export function PetWellnessPreview({ petId, petName }: PetWellnessPreviewProps) {
  const navigate = useNavigate();
  const { isPremium } = usePlan();
  const { data, isLoading } = useProAnalytics({ petId, period: "current_month" });

  if (isLoading) {
    return <Skeleton className="h-28 w-full rounded-xl" />;
  }

  const score = data?.summary.wellnessScore ?? 0;
  if (score === 0) return null;

  const color = getScoreColor(score);
  const label = getScoreLabel(score);
  const radialData = [{ name: "wellness", value: score, fill: color }];

  return (
    <Card
      className="border-green-200/60 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => navigate(LINKS.proDashboard())}
    >
      <CardContent className="flex items-center gap-4 py-3">
        {/* Radial chart */}
        <div className="flex-shrink-0">
          <ChartContainer config={chartConfig} className="h-[72px] w-[72px] aspect-square">
            <RadialBarChart
              data={radialData}
              startAngle={90}
              endAngle={-270}
              innerRadius="70%"
              outerRadius="100%"
              barSize={8}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} angleAxisId={0} />
              <RadialBar
                dataKey="value"
                cornerRadius={4}
                background
                angleAxisId={0}
              />
              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="central"
                className="text-lg font-bold fill-foreground"
              >
                {score}
              </text>
            </RadialBarChart>
          </ChartContainer>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <Heart className="h-3.5 w-3.5" style={{ color }} />
            <p className="text-sm font-semibold truncate">Bienestar de {petName}</p>
          </div>
          <p className="text-xs font-medium" style={{ color }}>
            {label}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Basado en vacunas, controles y cuidados
          </p>
          {!isPremium && (
            <div className="mt-1.5">
              <ProUpgradeCTA variant="minimal" context="wellness_preview" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
