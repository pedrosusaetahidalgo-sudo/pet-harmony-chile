/**
 * AdminSystemHealth — catalogo de edge fns + tipos.
 * Extraido de AdminSystemHealth.tsx (E.2 auditoria top-tier 2026-04-20).
 */

export type Category =
  | 'ai'
  | 'payments'
  | 'google'
  | 'medical'
  | 'cron'
  | 'onboarding'
  | 'moderation'
  | 'notifications'
  | 'system';

export interface EdgeFunctionMeta {
  name: string;
  category: Category;
  critical: boolean;
  /** true si usa logEdgeFunctionCall */
  logsHealth: boolean;
  description: string;
}

export const EDGE_FUNCTIONS: EdgeFunctionMeta[] = [
  // Pagos (criticos: tocan dinero)
  {
    name: 'flow-create-subscription',
    category: 'payments',
    critical: true,
    logsHealth: true,
    description: 'Crea suscripcion Premium en Flow.cl',
  },
  {
    name: 'flow-webhook',
    category: 'payments',
    critical: true,
    logsHealth: true,
    description: 'Webhook Flow.cl (activa Premium)',
  },
  // IA (logsHealth: true, usan ai-base)
  {
    name: 'pet-assistant',
    category: 'ai',
    critical: false,
    logsHealth: true,
    description: 'Asistente IA basico de mascotas',
  },
  {
    name: 'symptom-triage',
    category: 'ai',
    critical: false,
    logsHealth: true,
    description: 'Triaje IA por sintomas',
  },
  {
    name: 'nutrition-coach',
    category: 'ai',
    critical: false,
    logsHealth: true,
    description: 'Coach nutricional IA',
  },
  {
    name: 'consultation-prep',
    category: 'ai',
    critical: false,
    logsHealth: true,
    description: 'Prep de consulta para vet',
  },
  {
    name: 'wound-vision',
    category: 'ai',
    critical: false,
    logsHealth: true,
    description: 'Analisis visual de heridas (IA)',
  },
  {
    name: 'breed-tips',
    category: 'ai',
    critical: false,
    logsHealth: true,
    description: 'Tips por raza (IA)',
  },
  {
    name: 'bereavement-assistant',
    category: 'ai',
    critical: false,
    logsHealth: true,
    description: 'Asistente empatico memorial',
  },
  {
    name: 'medical-suggestions',
    category: 'ai',
    critical: false,
    logsHealth: true,
    description: 'Sugerencias medicas IA',
  },
  {
    name: 'ocr-vaccination-card',
    category: 'ai',
    critical: false,
    logsHealth: true,
    description: 'OCR carnet vacunacion',
  },
  {
    name: 'process-consultation-transcript',
    category: 'ai',
    critical: false,
    logsHealth: true,
    description: 'Transcripcion audio consulta',
  },
  // Medical / PDF (criticos: joya de la corona)
  {
    name: 'generate-medical-summary',
    category: 'medical',
    critical: true,
    logsHealth: true,
    description: 'Ficha medica PDF descargable',
  },
  {
    name: 'generate-medical-zip',
    category: 'medical',
    critical: false,
    logsHealth: true,
    description: 'ZIP documentos medicos',
  },
  {
    name: 'generate-vet-patient-summary',
    category: 'medical',
    critical: false,
    logsHealth: true,
    description: 'Resumen consolidado pacientes vet',
  },
  // Google Calendar
  {
    name: 'google-calendar-oauth-init',
    category: 'google',
    critical: false,
    logsHealth: true,
    description: 'Inicia OAuth Google Calendar',
  },
  {
    name: 'google-calendar-callback',
    category: 'google',
    critical: false,
    logsHealth: true,
    description: 'Callback OAuth Google',
  },
  {
    name: 'google-calendar-sync',
    category: 'google',
    critical: false,
    logsHealth: true,
    description: 'Sync eventos Google Calendar',
  },
  {
    name: 'google-calendar-disconnect',
    category: 'google',
    critical: false,
    logsHealth: true,
    description: 'Desconectar Google Calendar',
  },
  // Cron jobs
  {
    name: 'reminder-cron',
    category: 'cron',
    critical: true,
    logsHealth: true,
    description: 'Cron recordatorios (1x/dia)',
  },
  {
    name: 'booking-reminders-cron',
    category: 'cron',
    critical: false,
    logsHealth: true,
    description: 'Cron reservas proximas',
  },
  {
    name: 'generate-weekly-owner-reports',
    category: 'cron',
    critical: false,
    logsHealth: true,
    description: 'Reporte semanal dueno',
  },
  {
    name: 'generate-weekly-vet-reports',
    category: 'cron',
    critical: false,
    logsHealth: true,
    description: 'Reporte semanal vet',
  },
  {
    name: 'generate-sitemap',
    category: 'cron',
    critical: false,
    logsHealth: true,
    description: 'Genera sitemap SEO',
  },
  {
    name: 'generate-shelters',
    category: 'cron',
    critical: false,
    logsHealth: true,
    description: 'Genera data refugios',
  },
  {
    name: 'audit-cron-daily',
    category: 'cron',
    critical: false,
    logsHealth: true,
    description: 'Snapshot diario salud + auto-fixers',
  },
  // Onboarding / provider
  {
    name: 'create-patient',
    category: 'onboarding',
    critical: false,
    logsHealth: true,
    description: 'Vet crea paciente + Paw Card',
  },
  {
    name: 'send-pet-invitation',
    category: 'onboarding',
    critical: false,
    logsHealth: true,
    description: 'Invitar dueno a gestionar mascota',
  },
  {
    name: 'send-lead-outreach',
    category: 'onboarding',
    critical: false,
    logsHealth: true,
    description: 'Outreach leads vets (email/WA)',
  },
  // Moderacion
  {
    name: 'verify-service-provider',
    category: 'moderation',
    critical: false,
    logsHealth: true,
    description: 'Verificacion IA proveedor',
  },
  {
    name: 'verify-vet-document',
    category: 'moderation',
    critical: false,
    logsHealth: true,
    description: 'Verificacion IA documento vet',
  },
  {
    name: 'moderate-service-promotion',
    category: 'moderation',
    critical: false,
    logsHealth: true,
    description: 'Modera promociones',
  },
  // Notificaciones
  {
    name: 'send-whatsapp-reminder',
    category: 'notifications',
    critical: false,
    logsHealth: true,
    description: 'WhatsApp (pend. verif. Meta)',
  },
  // Sistema
  {
    name: 'log-error',
    category: 'system',
    critical: false,
    logsHealth: true,
    description: 'Error logging centralizado',
  },
  {
    name: 'feedback-admin',
    category: 'system',
    critical: false,
    logsHealth: true,
    description: 'Admin feedback endpoint',
  },
];

export const CATEGORY_LABELS: Record<Category | 'all', string> = {
  all: 'Todas',
  payments: 'Pagos',
  ai: 'IA',
  medical: 'Medical',
  google: 'Google',
  cron: 'Cron',
  onboarding: 'Onboarding',
  moderation: 'Moderacion',
  notifications: 'Notifs',
  system: 'Sistema',
};

// Edge fns con umbrales de latencia mayores (respuestas de LLMs tardan mas).
export const AI_EDGE_FUNCTIONS = new Set<string>([
  'consultation-prep',
  'symptom-triage',
  'generate-vet-patient-summary',
  'generate-medical-summary',
  'bereavement-assistant',
  'pet-assistant',
  'medical-suggestions',
  'breed-tips',
  'moderate-service-promotion',
  'ocr-vaccination-card',
  'verify-service-provider',
  'verify-vet-document',
  'process-consultation-transcript',
]);

// ─── Types de runtime ──────────────────────────────────────────────────────

export interface ErrorEntry {
  id: string;
  message: string;
  created_at: string;
  context: Record<string, unknown>;
  severity: string;
  resolved: boolean;
}

export interface FunctionRow extends EdgeFunctionMeta {
  lastStatus: 'success' | 'error' | 'timeout' | 'unknown';
  lastRun: string | null;
  avgLatencyMs: number | null;
  /** fallas reales (5xx, timeouts, excepciones) */
  errorsLast24h: number;
  /** 4xx (rate limit, input invalido) — NO son fallas */
  clientErrorsLast24h: number;
  executionsLast24h: number;
  recentErrors: ErrorEntry[];
}

export type HealthLabel = 'healthy' | 'ok' | 'degraded' | 'failing' | 'unused';
export type TrafficSignal = 'healthy' | 'failing' | 'idle' | 'never';
export type HealthLogEntry = Record<string, unknown>;
