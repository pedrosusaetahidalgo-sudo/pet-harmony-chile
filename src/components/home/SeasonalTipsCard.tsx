import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf, Sun, Snowflake, Flower2 } from '@/lib/icons';
import { getSeasonalTips, getSeasonLabel, getSeason } from '@/lib/seasonalTips';

const seasonIcons = {
  verano: Sun,
  otono: Leaf,
  invierno: Snowflake,
  primavera: Flower2,
};

const seasonColors = {
  verano: 'text-amber-600',
  otono: 'text-orange-600',
  invierno: 'text-blue-600',
  primavera: 'text-green-600',
};

export function SeasonalTipsCard({ species }: { species: string }) {
  const season = getSeason();
  const Icon = seasonIcons[season];
  const color = seasonColors[season];
  const tips = getSeasonalTips(species);
  const label = getSeasonLabel();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Icon className={`h-5 w-5 ${color}`} />
          Tips de {label.toLowerCase()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {tips.slice(0, 3).map((tip, i) => (
            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
              <span className={`font-bold ${color} mt-0.5`}>·</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
