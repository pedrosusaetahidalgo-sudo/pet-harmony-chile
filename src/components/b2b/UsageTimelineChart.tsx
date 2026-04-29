/**
 * UsageTimelineChart — chart de uso 24h hourly para un partner B2B.
 *
 * Lazy-loaded desde /b2b portal cuando el partner pega su key y se
 * validan stats. RPC get_b2b_usage_timeline (mig 20260922) devuelve
 * filas por hora con request_count.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { format } from 'date-fns';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

interface TimelinePoint {
  hour_bucket: string;
  request_count: number;
}

interface Props {
  apiKey: string;
}

export default function UsageTimelineChart({ apiKey }: Props) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['b2b_timeline', apiKey],
    queryFn: async () => {
      const { data, error } = await sb.rpc('get_b2b_usage_timeline', {
        p_api_key: apiKey,
        p_hours: 24,
      });
      if (error) throw error;
      return (data as TimelinePoint[]) || [];
    },
    enabled: !!apiKey && apiKey.length >= 16,
    staleTime: 60_000,
  });

  if (isLoading) {
    return <div className="h-32 bg-muted/30 rounded animate-pulse" />;
  }

  if (error) {
    return (
      <p className="text-xs text-muted-foreground italic">
        No pudimos cargar el chart. La key sigue siendo valida.
      </p>
    );
  }

  if (!data || data.length === 0) {
    return <p className="text-xs text-muted-foreground italic">Sin uso en las ultimas 24 horas.</p>;
  }

  // Llenar gaps: cada hora del rango debe tener un punto (0 si no hay).
  const now = new Date();
  const filled: TimelinePoint[] = [];
  const map = new Map(
    data.map((d) => [new Date(d.hour_bucket).toISOString().slice(0, 13), d.request_count])
  );

  for (let i = 23; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 13);
    filled.push({
      hour_bucket: d.toISOString(),
      request_count: map.get(key) || 0,
    });
  }

  return (
    <div className="h-32">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={filled}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="hour_bucket"
            tickFormatter={(v) => format(new Date(v), 'HH:00')}
            tick={{ fontSize: 10 }}
            interval="preserveStartEnd"
          />
          <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
          <Tooltip
            labelFormatter={(v) => format(new Date(v), "d MMM 'a las' HH:00")}
            formatter={(value: number) => [value, 'requests']}
          />
          <Line
            type="monotone"
            dataKey="request_count"
            stroke="#9333ea"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
