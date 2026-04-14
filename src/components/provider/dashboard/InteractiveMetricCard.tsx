import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from '@/lib/icons';
import { InfoTooltip } from '@/components/InfoTooltip';

interface InteractiveMetricCardProps {
  label: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  iconColor?: string;
  trend?: number;
  sparklineData?: number[];
  onClick?: () => void;
  accentColor?: string;
  tooltip?: string;
  tooltipWhere?: string;
}

export function InteractiveMetricCard({
  label,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-muted-foreground',
  trend,
  sparklineData,
  onClick,
  accentColor = '#9333ea',
  tooltip,
  tooltipWhere,
}: InteractiveMetricCardProps) {
  const hasTrend = trend !== undefined && trend !== 0;
  const isPositive = (trend ?? 0) >= 0;

  return (
    <Card
      className={`relative overflow-hidden transition-all ${onClick ? 'cursor-pointer hover:shadow-md hover:border-purple-200 active:scale-[0.98]' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-3 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground flex items-center gap-1">
            {label}
            {tooltip && <InfoTooltip text={tooltip} where={tooltipWhere} />}
          </span>
          <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
        </div>

        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-2xl font-bold leading-none">{value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>
          </div>

          {hasTrend && (
            <div
              className={`flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                isPositive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
              }`}
            >
              {isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {Math.abs(trend!)}%
            </div>
          )}
        </div>

        {sparklineData && sparklineData.length > 1 && (
          <div className="h-8 -mx-1 mt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData.map((v, i) => ({ v, i }))}>
                <defs>
                  <linearGradient id={`spark-${label}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={accentColor} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={accentColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke={accentColor}
                  strokeWidth={1.5}
                  fill={`url(#spark-${label})`}
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
