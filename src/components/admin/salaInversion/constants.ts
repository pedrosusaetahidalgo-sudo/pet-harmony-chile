/**
 * Sala de Inversion — constantes extraidas de AdminSalaInversion.tsx
 * (E.1 auditoria top-tier 2026-04-20). Sin logica: solo data.
 */

// ── Plan 90 dias (modelo v2 post-Roberto Camhi 2026-04-22) ──────────────
// El dueno NUNCA paga; la metrica "premium_b2c" antes era objetivo de
// conversion a Paw Member ($3.990/mes voluntario). En modelo v2 sigue
// siendo proxy NPS (cuantos duenos quieren apoyar voluntariamente) pero
// NO es revenue core. Revenue real viene de pharma + seguros + retail.
// Meta bajada a 30 (de 100) — proxy NPS, no driver ARR.
export const TARGETS_90D = {
  /** Paw Member voluntario (proxy NPS, no revenue core) */
  premium_b2c: 30,
  paying_b2b: 20,
  /** MRR proviene de B2B vets + Paw Companys + futuros pilotos pharma */
  mrr_clp: 1_900_000,
  retention_d30_pct: 35,
  /** Vets activos creando fichas (gratis) — leading indicator del moat ficha */
  vets_active_min: 50,
  /** Fichas con OCR completado (% de pets con vacunas escaneadas) */
  fichas_ocr_pct: 30,
  /** Research consent opt-in % — pre-requisito Pharma deals */
  research_consent_pct: 25,
  wau_min: 500,
  /** Paw Support (ex-donaciones) — proxy NPS */
  donations_clp: 500_000,
  paw_companys: 3,
  /** Pilotos pharma firmados (Centrovet/Virbac primero) — empieza mes 4-6 */
  pharma_pilots: 0,
  willingness_yes_pct: 40,
  rating_avg: 4.3,
};

export const ANGEL_READY_THRESHOLD = {
  mrr_clp: 1_000_000,
  b2b_min: 5,
  premium_min: 30,
};

export const SEED_READY_THRESHOLD = {
  mrr_clp: 8_000_000,
  b2b_min: 60,
  premium_min: 500,
};

// ── Provider plans ──────────────────────────────────────────
export const PAID_PROVIDER_PLANS = [
  'provider_premium',
  'provider_clinic_starter',
  'provider_pro_max',
  'provider_individual',
  'provider_clinic_basic',
  'provider_clinic_pro',
];

export const PROVIDER_PLAN_PRICES: Record<string, number> = {
  provider_free: 0,
  provider_premium: 9900,
  provider_clinic_starter: 19900,
  provider_pro_max: 29900,
  provider_individual: 9900,
  provider_clinic_basic: 19900,
  provider_clinic_pro: 29900,
};

// ── Brand palette ───────────────────────────────────────────
export const BRAND = {
  primary: '#9333ea',
  primaryLight: '#a855f7',
  primaryDeep: '#7e22ce',
  gold: '#d97706',
  emerald: '#16a34a',
  sky: '#0284c7',
  coral: '#dc2626',
};

// ── Readiness tier ──────────────────────────────────────────
export type Tier = 'pre-traccion' | 'angel-ready' | 'pre-seed-ready' | 'seed-ready';

export const TIER_LABELS: Record<
  Tier,
  { label: string; badgeClass: string; dotClass: string; desc: string }
> = {
  'pre-traccion': {
    label: 'Pre-traccion',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    dotClass: 'bg-slate-400',
    desc: 'Todavia no hay tesis cuantitativa. Foco: primeras ventas.',
  },
  'angel-ready': {
    label: 'Angel-ready',
    badgeClass: 'bg-brand-50 text-brand-700 border-brand-200',
    dotClass: 'bg-brand-500',
    desc: 'Listo para conversar con angels LATAM y Start-Up Chile Ignite.',
  },
  'pre-seed-ready': {
    label: 'Pre-seed ready',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotClass: 'bg-emerald-500',
    desc: 'Cumple metas 90d del plan. Postular a CORFO SSAF-I y Platanus/Magma.',
  },
  'seed-ready': {
    label: 'Seed ready',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    dotClass: 'bg-amber-500',
    desc: 'ARR > USD $100K. Kaszek, Monashees, Cometa en rango.',
  },
};

// ── Data room checklist ─────────────────────────────────────
export interface DataRoomItem {
  id: string;
  label: string;
  detail: string;
  done: boolean;
  critical?: boolean;
}

export const DATA_ROOM_DEFAULT: DataRoomItem[] = [
  {
    id: 'spa',
    label: 'SpA constituida',
    detail: 'SUSAETA GARNHAM SOFTWARE ENGINEERING 78.328.659-9',
    done: true,
    critical: true,
  },
  {
    id: 'kpis',
    label: 'Dashboard KPIs',
    detail: 'Sala de Inversion en Admin (este modulo)',
    done: true,
    critical: true,
  },
  { id: 'terms', label: 'Terminos y condiciones publicados', detail: '/terms', done: true },
  { id: 'privacy', label: 'Politica de privacidad', detail: '/privacy', done: true },
  {
    id: 'pitch',
    label: 'Pitch deck 12 slides',
    detail: 'Problema, solucion, mercado, traccion, ask',
    done: false,
    critical: true,
  },
  {
    id: 'financials',
    label: 'Proyeccion financiera 24 meses',
    detail: 'P&L, cash flow, unit economics',
    done: false,
    critical: true,
  },
  {
    id: 'captable',
    label: 'Cap table + pool empleados',
    detail: 'Fundador 90%, ESOP 10%, proyectado',
    done: false,
  },
  {
    id: 'cofounder',
    label: 'Co-founder comercial o clinico',
    detail: 'Condicion de angel LATAM',
    done: false,
    critical: true,
  },
  {
    id: 'testimonials',
    label: 'Testimonios (2+ clinicas, 5+ duenos)',
    detail: 'Con nombre, foto y cita',
    done: false,
  },
  { id: 'demos', label: 'Demos grabadas (B2C y B2B)', detail: '3-5 min cada una', done: false },
  {
    id: 'roadmap',
    label: 'Roadmap 12 meses publico',
    detail: 'Milestones cuantitativos, responsables',
    done: false,
  },
  {
    id: 'corfo',
    label: 'Postulacion CORFO SSAF-I',
    detail: 'Requiere incubadora patrocinante',
    done: false,
  },
  {
    id: 'startupchile',
    label: 'Postulacion Start-Up Chile Ignite',
    detail: 'USD $15K equity-free',
    done: false,
  },
  {
    id: 'dpa',
    label: 'DPA Supabase firmado',
    detail: 'Data Processing Agreement para GDPR/CCPA',
    done: false,
  },
  {
    id: 'donations-live',
    label: 'Flujo de donaciones en vivo',
    detail: '/donaciones activo con Flow + mails de gracias',
    done: true,
  },
  {
    id: 'paw-voices-public',
    label: 'Muralla Paw Voices publica',
    detail: 'Mensajes reales de donantes visibles en /donaciones',
    done: false,
  },
  {
    id: 'paw-companys-first',
    label: 'Primeros 3 Paw Companys',
    detail: 'Sponsors empresariales con badge en /donaciones',
    done: false,
    critical: true,
  },
  {
    id: 'transparencia-dashboard',
    label: 'Dashboard publico de transparencia',
    detail: 'Recaudado / destinado / refugios aliados',
    done: false,
  },
  {
    id: 'convenio-refugio',
    label: 'Convenio con refugio aliado',
    detail: 'Al menos 1 organizacion recibiendo excedente',
    done: false,
  },
];

// ── Financing routes ────────────────────────────────────────
export interface FinancingRoute {
  id: string;
  nombre: string;
  montoCLP: string;
  montoUSD: string;
  etapa: string;
  requisito: string;
  status: 'no-iniciado' | 'en-preparacion' | 'postulado' | 'en-comite' | 'aprobado' | 'rechazado';
  dilutivo: boolean;
}

export const FINANCING_DEFAULT: FinancingRoute[] = [
  {
    id: 'su-chile-ignite',
    nombre: 'Start-Up Chile Ignite',
    montoCLP: '~$14M',
    montoUSD: '$15K',
    etapa: 'Pre-seed',
    requisito: 'SpA + MVP funcional',
    status: 'no-iniciado',
    dilutivo: false,
  },
  {
    id: 'corfo-ssaf-i',
    nombre: 'CORFO SSAF-I (Semilla Inicia)',
    montoCLP: 'Hasta $25M',
    montoUSD: '$28K',
    etapa: 'Pre-traccion a traccion inicial',
    requisito: 'SpA + incubadora patrocinante',
    status: 'no-iniciado',
    dilutivo: false,
  },
  {
    id: 'corfo-ssaf-e',
    nombre: 'CORFO SSAF-E (Semilla Expansion)',
    montoCLP: 'Hasta $60M',
    montoUSD: '$67K',
    etapa: 'Traccion validada',
    requisito: 'MRR + pilotos con clientes',
    status: 'no-iniciado',
    dilutivo: false,
  },
  {
    id: 'su-chile-seed',
    nombre: 'Start-Up Chile Seed',
    montoCLP: '~$47M',
    montoUSD: '$50K',
    etapa: 'Seed',
    requisito: 'SpA + traccion + ingles',
    status: 'no-iniciado',
    dilutivo: false,
  },
  {
    id: 'sercotec',
    nombre: 'SERCOTEC Capital Semilla',
    montoCLP: 'Hasta $3.5M',
    montoUSD: '$4K',
    etapa: 'Pre-traccion micro',
    requisito: 'Iniciacion de actividades',
    status: 'no-iniciado',
    dilutivo: false,
  },
  {
    id: 'angels-latam',
    nombre: 'Angels LATAM',
    montoCLP: '$95M-$190M',
    montoUSD: '$100-200K',
    etapa: 'Pre-seed',
    requisito: '100 Premium + 20 B2B + co-founder',
    status: 'no-iniciado',
    dilutivo: true,
  },
  {
    id: 'platanus',
    nombre: 'Platanus Ventures',
    montoCLP: '~$142M',
    montoUSD: '$150K',
    etapa: 'Pre-seed',
    requisito: 'ARR USD $100K run-rate',
    status: 'no-iniciado',
    dilutivo: true,
  },
  {
    id: 'magma',
    nombre: 'Magma Partners',
    montoCLP: '$95M-$475M',
    montoUSD: '$100-500K',
    etapa: 'Pre-seed/Seed',
    requisito: 'Tesis LATAM expansion',
    status: 'no-iniciado',
    dilutivo: true,
  },
  {
    id: 'paw-companys',
    nombre: 'Paw Companys (sponsors empresariales)',
    montoCLP: '$49.9K-$199.9K / mes',
    montoUSD: '$55-220 / mes',
    etapa: 'Traccion inicial',
    requisito: '/donaciones publico + Paw Voices + dashboard de transparencia',
    status: 'no-iniciado',
    dilutivo: false,
  },
];

export const FINANCING_STATUS_LABEL: Record<
  FinancingRoute['status'],
  { label: string; color: string }
> = {
  'no-iniciado': {
    label: 'No iniciado',
    color: 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200',
  },
  'en-preparacion': {
    label: 'En preparacion',
    color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
  },
  postulado: {
    label: 'Postulado',
    color: 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100',
  },
  'en-comite': {
    label: 'En comite',
    color: 'bg-brand-50 text-brand-700 border-brand-200 hover:bg-brand-100',
  },
  aprobado: {
    label: 'Aprobado',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
  },
  rechazado: {
    label: 'Rechazado',
    color: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
  },
};

// ── Lead outreach funnel ────────────────────────────────────
export const LEAD_STAGES: { key: string; label: string; color: string }[] = [
  { key: 'pendiente', label: 'Pendientes', color: '#94a3b8' },
  { key: 'contactado', label: 'Contactados', color: '#9333ea' },
  { key: 'respondio', label: 'Respondieron', color: '#0284c7' },
  { key: 'interesado', label: 'Interesados', color: '#d97706' },
  { key: 'convertido', label: 'Convertidos', color: '#16a34a' },
  { key: 'descartado', label: 'Descartados', color: '#dc2626' },
];
