/**
 * AdminProjectHealth — health del proyecto: costos vs revenue + runway.
 *
 * Refactor Maestro §9.5 (costos infra) + §8.3.3 (proyeccion revenue).
 *
 * Calcula:
 *   - Costos mensuales (Supabase, IA, storage, etc) — hardcoded segun §9.5
 *   - Revenue actual estimado (donaciones + paw member + B2B firmado)
 *   - Runway en meses (cash en banco / burn neto)
 *
 * Cash en banco: Pedro lo edita manualmente cada mes via SQL admin
 * (project_treasury.balance_clp). Si no hay tabla, se usa default 0.
 *
 * Lectura: estimacion grosera; este widget no reemplaza contabilidad
 * formal. Sirve para pulso semanal: ¿cuanto runway nos queda?
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Wallet, TrendingDown, TrendingUp, Clock, Server, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

// ─── Costos hardcoded segun plan §9.5 ──────────────────────────────────
// Estos numeros son aproximaciones. Pedro los actualiza editando este
// archivo cuando reciba facturas reales de Supabase/Resend/etc.
const MONTHLY_COSTS_USD = {
  supabase_pro: 25,
  ai_apis: 80, // OpenAI + Anthropic + Hugging Face
  resend_emails: 20,
  storage_extra: 30, // sobre el incluido en Pro
  domain_dns: 2,
  github_pages: 0,
};

const TOTAL_MONTHLY_COSTS_USD = Object.values(MONTHLY_COSTS_USD).reduce((a, b) => a + b, 0);

// USD-CLP rate (rough). Para estimacion solamente; Pedro paga en USD a casi todos.
const USD_CLP = 950;

interface RevenueData {
  // Donaciones (CLP)
  donations_30d_clp: number;
  // Paw Member subs activas (CLP/mes)
  paw_member_active_count: number;
  // B2B keys activas (placeholder $0 hoy; se actualiza cuando primera firma)
  b2b_active_keys: number;
}

export default function AdminProjectHealth() {
  const { data, isLoading } = useQuery<RevenueData | null>({
    queryKey: ['admin-project-health'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      // Donations 30d
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);

      const [donationsRes, pawMembersRes, b2bRes] = await Promise.all([
        sb
          .from('donations')
          .select('amount_clp, paid_at, status')
          .eq('status', 'paid')
          .gte('paid_at', monthAgo.toISOString()),
        sb
          .from('orders')
          .select('id, payment_status, plan_id')
          .eq('payment_status', 'paid')
          .in('plan_id', ['monthly', 'yearly']),
        sb.from('b2b_api_keys').select('id', { count: 'exact', head: true }).eq('is_active', true),
      ]);

      const donations = (donationsRes.data ?? []) as Array<{ amount_clp: number }>;
      const pawMembers = (pawMembersRes.data ?? []) as Array<{ id: string }>;

      return {
        donations_30d_clp: donations.reduce((s, d) => s + (Number(d.amount_clp) || 0), 0),
        paw_member_active_count: pawMembers.length,
        b2b_active_keys: b2bRes.count ?? 0,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  const r = data ?? { donations_30d_clp: 0, paw_member_active_count: 0, b2b_active_keys: 0 };

  // Revenue estimado mensual (CLP → USD para comparar con costos)
  // Paw Member: $3.990 mensual o $39.900 anual. Asumimos 70/30 split.
  const pawMemberMonthlyClp =
    r.paw_member_active_count * 0.7 * 3990 + r.paw_member_active_count * 0.3 * (39900 / 12);
  const monthlyRevenueClp = r.donations_30d_clp + pawMemberMonthlyClp;
  const monthlyRevenueUsd = Math.round(monthlyRevenueClp / USD_CLP);

  // Burn neto (costos - revenue) en USD
  const monthlyBurnUsd = TOTAL_MONTHLY_COSTS_USD - monthlyRevenueUsd;

  // Runway: sin cash data podemos solo calcular el burn. Ajustar cuando
  // exista tabla project_treasury.
  const burnTone = monthlyBurnUsd <= 0 ? 'good' : monthlyBurnUsd < 100 ? 'warn' : 'bad';

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Wallet className="h-4 w-4 text-emerald-400" /> Health del proyecto (§9.5)
        </h2>
        <p className="text-xs text-muted-foreground">
          Costos hardcoded segun plan. Revenue calculado de donations + Paw Member orders. B2B
          revenue a $0 hasta primer deal firmado.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Costos */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Server className="h-4 w-4 text-red-400" />
              Costos mensuales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-3xl font-bold text-red-400">~${TOTAL_MONTHLY_COSTS_USD}</p>
            <p className="text-[11px] text-muted-foreground">USD/mes</p>
            <ul className="text-[11px] text-muted-foreground space-y-0.5 mt-3">
              <li>Supabase Pro: ${MONTHLY_COSTS_USD.supabase_pro}</li>
              <li>AI APIs: ${MONTHLY_COSTS_USD.ai_apis}</li>
              <li>Resend emails: ${MONTHLY_COSTS_USD.resend_emails}</li>
              <li>Storage extra: ${MONTHLY_COSTS_USD.storage_extra}</li>
              <li>DNS + dominio: ${MONTHLY_COSTS_USD.domain_dns}</li>
            </ul>
          </CardContent>
        </Card>

        {/* Revenue */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              Revenue estimado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-3xl font-bold text-emerald-400">~${monthlyRevenueUsd}</p>
            <p className="text-[11px] text-muted-foreground">USD/mes</p>
            <ul className="text-[11px] text-muted-foreground space-y-0.5 mt-3">
              <li>Donaciones 30d: ${Math.round(r.donations_30d_clp / USD_CLP)} USD</li>
              <li>
                Paw Member: {r.paw_member_active_count} subs · $
                {Math.round(pawMemberMonthlyClp / USD_CLP)} USD/mes
              </li>
              <li>B2B keys activas: {r.b2b_active_keys}</li>
            </ul>
          </CardContent>
        </Card>

        {/* Burn */}
        <Card
          className={cn(
            burnTone === 'good' && 'border-emerald-500/30 bg-emerald-500/5',
            burnTone === 'warn' && 'border-amber-500/30 bg-amber-500/5',
            burnTone === 'bad' && 'border-red-500/30 bg-red-500/5'
          )}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingDown
                className={cn(
                  'h-4 w-4',
                  burnTone === 'good' && 'text-emerald-400',
                  burnTone === 'warn' && 'text-amber-400',
                  burnTone === 'bad' && 'text-red-400'
                )}
              />
              Burn neto / mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={cn(
                'font-mono text-3xl font-bold',
                burnTone === 'good' && 'text-emerald-400',
                burnTone === 'warn' && 'text-amber-400',
                burnTone === 'bad' && 'text-red-400'
              )}
            >
              {monthlyBurnUsd <= 0 ? '+' : '-'}$ {Math.abs(monthlyBurnUsd)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {monthlyBurnUsd <= 0 ? 'rentable' : 'USD perdidos/mes'}
            </p>
            <Badge
              variant="outline"
              className={cn(
                'mt-3 text-[10px]',
                burnTone === 'good' && 'border-emerald-500 text-emerald-400',
                burnTone === 'warn' && 'border-amber-500 text-amber-400',
                burnTone === 'bad' && 'border-red-500 text-red-400'
              )}
            >
              {burnTone === 'good'
                ? '✓ Auto-sostenible'
                : burnTone === 'warn'
                  ? '⚠ Cerca de break-even'
                  : '✗ Necesita capital o B2B'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Hitos siguientes (proyeccion §8.3.3) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Hitos para break-even (plan §8.3.3)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="border rounded-lg p-3">
              <p className="font-medium text-muted-foreground">Y1 (~$30-75k revenue total)</p>
              <p className="text-[11px] text-muted-foreground mt-1">
                B2B Y1 dependeria de 1 deal con aseguradora ($5-15k) + scaling Paw Member (~50-100
                subs activas). Hoy: {r.paw_member_active_count} subs.
              </p>
            </div>
            <div className="border rounded-lg p-3">
              <p className="font-medium text-muted-foreground">Y2 break-even Q3-Q4</p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Pharma firmado + retail fulfillment + 200+ subs Paw Member. Costos infra escalan a
                $200-400/mes.
              </p>
            </div>
            <div className="border rounded-lg p-3">
              <p className="font-medium text-muted-foreground">Y3 rentable</p>
              <p className="text-[11px] text-muted-foreground mt-1">
                MRR $10-15k USD/mes. Opcional Serie A. Si no hay Serie A, runway
                {'>'}18 meses con burn cero.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-[10px] text-muted-foreground italic flex items-center gap-1">
        <DollarSign className="h-3 w-3" />
        Estimacion grosera. Para contabilidad formal usar libros SpA SGSE.
      </div>
    </div>
  );
}
