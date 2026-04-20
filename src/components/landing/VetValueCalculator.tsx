/**
 * VetValueCalculator — Widget de valor para vets en /para-veterinarios.
 *
 * Muestra cuanto puede ahorrar un vet eligiendo Paw Friend vs
 * CuidaPet (comision ~15%) u operando sin software. Ademas recomienda
 * el plan optimo segun volumen de consultas/mes.
 *
 * Origen: INIT-06 del Plan 90d (landing vet con pricing transparente).
 * Data:
 *  - CuidaPet comision ~15% (fuente: cuidapet.cl/veterinario-a-domicilio-santiago).
 *  - Paw Friend comisiones: ver src/lib/plans.ts PROVIDER_PLANS.
 */

import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, Sparkles, CheckCircle2 } from '@/lib/icons';
import { formatCLP } from '@/lib/format';
import { PROVIDER_PLANS, type ProviderPlanId } from '@/lib/plans';
import { cn } from '@/lib/utils';

// Comision estimada de competidores (referencial publico):
// CuidaPet: modelo agregador, toma comision por consulta + abono del cliente.
// QVET/VetPraxis: no publican precio, usamos proxy "software fijo" ~$40.000/mes.
const COMPETITOR_COMMISSION_PCT = 15;
const COMPETITOR_FIXED_SW_CLP = 40_000;

interface CalculatorResult {
  monthlyRevenue: number;
  competitorCommission: number;
  pawFriendCommission: number;
  pawFriendPlanCost: number;
  pawFriendTotal: number;
  monthlySavings: number;
  annualSavings: number;
  recommendedPlan: ProviderPlanId;
}

function recommendPlan(consultationsPerMonth: number): ProviderPlanId {
  // Regla simple (cruce con capacidad de PROVIDER_PLANS):
  // - <=5 consultas/mes: Basica gratis es suficiente (5 pacientes cap).
  // - 6-40 consultas: Premium $9.9k, comision 5%, ilimitado.
  // - 41-150: Clinica Starter $19.9k, 500 pacientes, 3 seats.
  // - >150: Pro Max $29.9k, 0% comision, ilimitado.
  if (consultationsPerMonth <= 5) return 'provider_free';
  if (consultationsPerMonth <= 40) return 'provider_premium';
  if (consultationsPerMonth <= 150) return 'provider_clinic_starter';
  return 'provider_pro_max';
}

function calculate(consultations: number, avgTicket: number): CalculatorResult {
  const monthlyRevenue = consultations * avgTicket;
  const plan = recommendPlan(consultations);
  const planConfig = PROVIDER_PLANS[plan];

  const pawFriendCommission = monthlyRevenue * (planConfig.commissionRate / 100);
  const pawFriendPlanCost = planConfig.monthlyPrice;
  const pawFriendTotal = pawFriendCommission + pawFriendPlanCost;

  const competitorCommission = monthlyRevenue * (COMPETITOR_COMMISSION_PCT / 100);
  // Comparamos contra lo peor de la competencia: software fijo ($40k) +
  // posible comision marketplace (CuidaPet). Si el vet no usa marketplace
  // comparar solo vs software. Mostramos los dos escenarios.

  const monthlySavings = competitorCommission + COMPETITOR_FIXED_SW_CLP - pawFriendTotal;
  const annualSavings = monthlySavings * 12;

  return {
    monthlyRevenue,
    competitorCommission,
    pawFriendCommission,
    pawFriendPlanCost,
    pawFriendTotal,
    monthlySavings,
    annualSavings,
    recommendedPlan: plan,
  };
}

export function VetValueCalculator() {
  const [consultations, setConsultations] = useState(30);
  const [avgTicket, setAvgTicket] = useState(25_000);

  const result = useMemo(() => calculate(consultations, avgTicket), [consultations, avgTicket]);

  const recPlan = PROVIDER_PLANS[result.recommendedPlan];

  return (
    <section className="container mx-auto px-4 py-16 md:py-20 max-w-4xl">
      <div className="text-center mb-10">
        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 mb-3">
          <BarChart3 className="h-3 w-3 mr-1" />
          Cuanto ahorras
        </Badge>
        <h2 className="text-3xl md:text-4xl font-display font-semibold text-purple-900 mb-3">
          Calculadora de valor
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Mueve los sliders para ver cuanto puedes ahorrar usando Paw Friend frente a marketplaces
          con comision alta o software veterinario tradicional.
        </p>
      </div>

      <Card className="border-purple-100 overflow-hidden">
        <CardContent className="p-6 md:p-8 space-y-8">
          {/* Sliders de input */}
          <div className="space-y-6">
            <div>
              <div className="flex items-end justify-between mb-2">
                <label htmlFor="calc-consultations" className="text-sm font-medium text-slate-700">
                  Consultas por mes
                </label>
                <span className="font-mono text-2xl font-bold text-purple-700">
                  {consultations}
                </span>
              </div>
              <Slider
                id="calc-consultations"
                value={[consultations]}
                onValueChange={(v) => setConsultations(v[0] ?? 30)}
                min={5}
                max={200}
                step={1}
                aria-label="Consultas por mes"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>5</span>
                <span>50</span>
                <span>100</span>
                <span>200</span>
              </div>
            </div>

            <div>
              <div className="flex items-end justify-between mb-2">
                <label htmlFor="calc-ticket" className="text-sm font-medium text-slate-700">
                  Ticket promedio por consulta
                </label>
                <span className="font-mono text-2xl font-bold text-purple-700">
                  {formatCLP(avgTicket)}
                </span>
              </div>
              <Slider
                id="calc-ticket"
                value={[avgTicket]}
                onValueChange={(v) => setAvgTicket(v[0] ?? 25_000)}
                min={15_000}
                max={80_000}
                step={1_000}
                aria-label="Ticket promedio"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>{formatCLP(15_000)}</span>
                <span>{formatCLP(40_000)}</span>
                <span>{formatCLP(80_000)}</span>
              </div>
            </div>
          </div>

          {/* Resultado */}
          <div className="border-t border-slate-200 pt-6 space-y-5">
            {/* Ingreso bruto */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Ingreso bruto mensual</span>
              <span className="font-mono text-lg font-bold text-slate-900">
                {formatCLP(result.monthlyRevenue)}
              </span>
            </div>

            {/* Comparativa */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Escenario 1: sin Paw Friend */}
              <div className="rounded-xl bg-red-50/60 border border-red-100 p-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-red-700">
                  Sin Paw Friend
                </p>
                <p className="text-[11px] text-red-600/80">
                  Software fijo ({formatCLP(COMPETITOR_FIXED_SW_CLP)}) + marketplace{' '}
                  {COMPETITOR_COMMISSION_PCT}% comision
                </p>
                <div className="font-mono text-3xl font-bold text-red-700">
                  {formatCLP(result.competitorCommission + COMPETITOR_FIXED_SW_CLP)}
                </div>
                <p className="text-[11px] text-red-600">costo mensual estimado</p>
              </div>

              {/* Escenario 2: con Paw Friend */}
              <div className="rounded-xl bg-emerald-50/60 border border-emerald-200 p-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                  Con Paw Friend
                </p>
                <p className="text-[11px] text-emerald-700/80">
                  Plan {recPlan.name} ({formatCLP(recPlan.monthlyPrice)}) + {recPlan.commissionRate}
                  % comision
                </p>
                <div className="font-mono text-3xl font-bold text-emerald-700">
                  {formatCLP(result.pawFriendTotal)}
                </div>
                <p className="text-[11px] text-emerald-700">costo mensual real</p>
              </div>
            </div>

            {/* Ahorro destacado */}
            <div
              className={cn(
                'rounded-xl border p-5',
                result.monthlySavings > 0
                  ? 'bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border-emerald-300'
                  : 'bg-slate-50 border-slate-200'
              )}
            >
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    'h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0',
                    result.monthlySavings > 0
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
                      : 'bg-slate-200 text-slate-500'
                  )}
                >
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 mb-1">
                    {result.monthlySavings > 0 ? 'Ahorras' : 'Diferencia'}
                  </p>
                  <div className="flex items-end gap-3 flex-wrap">
                    <span
                      className={cn(
                        'font-mono text-4xl font-black leading-none',
                        result.monthlySavings > 0 ? 'text-emerald-700' : 'text-slate-600'
                      )}
                    >
                      {formatCLP(result.monthlySavings)}
                    </span>
                    <span className="text-sm text-slate-600 pb-1">por mes</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1.5">
                    Equivalente a{' '}
                    <strong className="text-emerald-700">{formatCLP(result.annualSavings)}</strong>{' '}
                    al año.
                  </p>
                </div>
              </div>
            </div>

            {/* Plan recomendado */}
            <div className="rounded-xl border-2 border-purple-200 bg-purple-50/50 p-4 flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-purple-900">
                  Te recomendamos: plan <span className="underline">{recPlan.name}</span>
                  {recPlan.badge ? ` ${recPlan.badge}` : ''}
                </p>
                <p className="text-xs text-purple-700/80 mt-0.5">
                  Con {consultations} consultas/mes, {recPlan.name} optimiza tu relacion
                  comision-volumen ({recPlan.commissionRate}% comision).
                </p>
              </div>
            </div>

            {/* Disclaimer */}
            <p className="text-[10px] text-muted-foreground">
              Calculo referencial. Comision CuidaPet y costo software tradicional son estimaciones
              publicas. Tu escenario real depende de tu mix de servicios, cobertura y uso.
            </p>
          </div>

          {/* Badges rapidos de valor */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-4 border-t border-slate-100">
            {[
              'Sin setup fee',
              'Cancelas cuando quieras',
              'Pricing en CLP transparente',
              'Soporte chileno',
            ].map((b) => (
              <div key={b} className="flex items-center gap-1.5 text-xs text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
                <span>{b}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
