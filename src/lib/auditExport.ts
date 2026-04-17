/**
 * ============================================================================
 * Audit Export System — Paw Friend
 * ============================================================================
 *
 * Genera un .xlsx con multiples sheets representando tablas del sistema,
 * mas un Data Quality Report con checks de integridad.
 *
 * ## Guia para agentes IA
 *
 * Este archivo esta disenado para ser facilmente modificable por un agente:
 *
 * 1. **Agregar/quitar sheets**: editar el array `SHEET_DEFINITIONS` (linea ~50).
 *    Cada entry define tabla, columnas, nombre del sheet, y campo de fecha.
 *    El sistema genera automaticamente el sheet a partir de la definicion.
 *
 * 2. **Agregar/quitar DQ checks**: editar el array `QUALITY_CHECK_DEFINITIONS` (linea ~140).
 *    Cada entry tiene nombre, query builder, y logica de severidad.
 *
 * 3. **Cambiar visibilidad de un sheet**: poner `enabled: false` en su definicion.
 *
 * 4. **Cambiar orden de sheets**: reordenar entries en SHEET_DEFINITIONS.
 *
 * 5. **Filtrar columnas sensibles**: agregar regex a REDACTED_KEY_PATTERNS.
 *
 * NO es necesario tocar la funcion `generateAuditExport` para cambios normales.
 * ============================================================================
 */
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';

// ── Types ──────────────────────────────────────────────────
export type ExportType = 'full' | 'period';

export interface ExportFilters {
  from_date?: string;
  to_date?: string;
}

interface QualityCheck {
  name: string;
  result: string;
  severity: 'ok' | 'warn' | 'error';
  detail: string;
}

interface SheetResult {
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rows: any[];
  error?: string;
}

// ── Sheet Definitions (CONFIGURABLE) ───────────────────────
//
// Agente: para agregar un sheet, agrega un objeto aqui.
// Para ocultarlo, pon `enabled: false`.
// Para cambiar columnas, edita `select`.
//
interface SheetDefinition {
  /** ID unico interno */
  id: string;
  /** Nombre visible en el Excel */
  sheetName: string;
  /** Nombre de la tabla en Supabase */
  table: string;
  /** Columnas a exportar (formato PostgREST select). '*' = todas */
  select: string;
  /** Campo usado para filtro por periodo. null = no filtrar por fecha */
  dateField: string | null;
  /** Si es false, no se incluye en el export */
  enabled: boolean;
  /** Descripcion para el sheet README */
  description: string;
  /** Transformacion opcional post-fetch */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform?: (rows: any[]) => any[];
}

export const SHEET_DEFINITIONS: SheetDefinition[] = [
  {
    id: 'profiles',
    sheetName: 'Usuarios',
    table: 'profiles',
    select:
      'id, display_name, location, is_premium, is_admin, is_demo, level, points, plan_id, premium_plan, created_at, updated_at',
    dateField: 'created_at',
    enabled: true,
    description: 'Perfiles de usuarios registrados',
  },
  {
    id: 'pets',
    sheetName: 'Mascotas',
    table: 'pets',
    select:
      'id, name, species, breed, gender, birth_date, weight, neutered, microchip_number, lifecycle_status, owner_id, created_by_vet_id, paw_card_id, vaccination_status, created_at, updated_at',
    dateField: 'created_at',
    enabled: true,
    description: 'Todas las mascotas registradas',
  },
  {
    id: 'medical_records',
    sheetName: 'Fichas_Medicas',
    table: 'medical_records',
    select:
      'id, pet_id, owner_id, record_type, title, date, description, diagnosis, treatment, vet_name, clinic_name, batch_number, serial_number, antiparasitic_type, product_brand, next_date, created_at',
    dateField: 'date',
    enabled: true,
    description: 'Registros medicos (consultas, vacunas, antiparasitarios, etc.)',
    transform: (rows) =>
      rows.map((r) => ({
        ...r,
        treatment: r.treatment ? JSON.stringify(r.treatment) : null,
      })),
  },
  {
    id: 'service_providers',
    sheetName: 'Proveedores',
    table: 'service_providers',
    select:
      'id, user_id, display_name, business_name, provider_type, primary_service_type, status, commune, city, is_verified, is_directory_visible, is_featured, avg_rating, total_reviews, total_services_completed, provider_plan, experience_years, license_number, slug, is_demo, created_at, updated_at',
    dateField: 'created_at',
    enabled: true,
    description: 'Veterinarios y profesionales registrados',
  },
  {
    id: 'bookings',
    sheetName: 'Reservas',
    table: 'bookings',
    select:
      'id, user_id, provider_id, pet_id, service_type, status, payment_status, total_price, notes, booked_at, confirmed_at, completed_at, cancelled_at',
    dateField: 'booked_at',
    enabled: true,
    description: 'Reservas de servicios',
  },
  {
    id: 'payment_history',
    sheetName: 'Pagos',
    table: 'payment_history',
    select:
      'id, user_id, payment_type, description, amount, net_amount, commission, status, payment_method, payment_reference, completed_at, refunded_at, created_at',
    dateField: 'created_at',
    enabled: true,
    description: 'Historial de pagos Flow.cl',
  },
  {
    id: 'provider_subscriptions',
    sheetName: 'Suscripciones_B2B',
    table: 'provider_subscriptions',
    select:
      'id, user_id, provider_id, plan_id, price, status, billing_cycle, current_period_start, current_period_end, created_at',
    dateField: 'created_at',
    enabled: true,
    description: 'Suscripciones de proveedores (planes B2B)',
  },
  {
    id: 'service_reviews',
    sheetName: 'Resenas',
    table: 'service_reviews',
    select: '*',
    dateField: 'created_at',
    enabled: true,
    description: 'Resenas de servicios',
  },
  {
    id: 'pet_reminders',
    sheetName: 'Recordatorios',
    table: 'pet_reminders',
    select:
      'id, pet_id, user_id, title, description, reminder_date, reminder_type, is_recurring, recurrence_pattern, status, created_at',
    dateField: 'created_at',
    enabled: true,
    description: 'Recordatorios de mascotas',
  },
  {
    id: 'posts',
    sheetName: 'Posts_Feed',
    table: 'posts',
    select: 'id, user_id, content, image_url, likes_count, comments_count, created_at',
    dateField: 'created_at',
    enabled: true,
    description: 'Posts del feed social',
  },
  {
    id: 'adoption_posts',
    sheetName: 'Adopciones',
    table: 'adoption_posts',
    select:
      'id, user_id, pet_name, species, breed, age_text, gender, description, location, status, contact_phone, photo_url, created_at',
    dateField: 'created_at',
    enabled: true,
    description: 'Posts de adopcion',
  },
  {
    id: 'paw_point_transactions',
    sheetName: 'Paw_Points',
    table: 'paw_point_transactions',
    select: 'id, user_id, points, transaction_type, description, created_at',
    dateField: 'created_at',
    enabled: true,
    description: 'Transacciones de Paw Points (gamificacion)',
  },
  {
    id: 'community_groups',
    sheetName: 'Comunidades',
    table: 'community_groups',
    select:
      'id, name, description, group_type, breed_filter, condition_filter, member_count, is_active, created_by, created_at',
    dateField: 'created_at',
    enabled: true,
    description: 'Grupos de comunidad',
  },
  {
    id: 'platform_config',
    sheetName: 'Config_Sistema',
    table: 'platform_config',
    select: 'key, value, updated_at',
    dateField: null, // no filtrar por fecha
    enabled: true,
    description: 'Configuracion del sistema (keys sensibles redactadas)',
    transform: (rows) => {
      const BLOCKED = /key|secret|token|password|api_key/i;
      return rows.map((r) => ({
        key: r.key,
        value: BLOCKED.test(r.key)
          ? '[REDACTED]'
          : typeof r.value === 'object'
            ? JSON.stringify(r.value)
            : r.value,
        updated_at: r.updated_at,
      }));
    },
  },
  {
    id: 'subscriptions',
    sheetName: 'Suscripciones_B2C',
    table: 'subscriptions',
    select:
      'id, user_id, plan_type, status, start_date, end_date, payment_amount_clp, auto_renew, cancelled_at, cancellation_reason, created_at',
    dateField: 'created_at',
    enabled: true,
    description: 'Suscripciones Premium B2C (Flow.cl)',
  },
  {
    id: 'orders',
    sheetName: 'Ordenes',
    table: 'orders',
    select:
      'id, user_id, order_number, subtotal_clp, platform_fee_clp, total_clp, payment_method, payment_status, paid_at, created_at',
    dateField: 'created_at',
    enabled: true,
    description: 'Ordenes de pago (incluye webpay legacy)',
  },
  {
    id: 'vet_bookings',
    sheetName: 'Consultas_Vet',
    table: 'vet_bookings',
    select:
      'id, owner_id, vet_id, pet_id, scheduled_date, service_type, status, is_emergency, total_price, payment_status, canceled_at, cancellation_reason, created_at',
    dateField: 'created_at',
    enabled: true,
    description: 'Reservas veterinarias (flow vet domicilio)',
  },
  {
    id: 'content_reports',
    sheetName: 'Reportes_Contenido',
    table: 'content_reports',
    select:
      'id, post_id, reporter_id, reason, details, status, reviewed_by, reviewed_at, created_at',
    dateField: 'created_at',
    enabled: true,
    description: 'Denuncias de contenido del feed (moderacion)',
  },
  {
    id: 'error_logs',
    sheetName: 'Errores',
    table: 'error_logs',
    select:
      'id, source, severity, message, user_id, resolved, resolved_at, resolved_by, created_at',
    dateField: 'created_at',
    enabled: true,
    description: 'Log centralizado de errores (frontend + edge functions)',
  },
  {
    id: 'feedback_in_app',
    sheetName: 'Feedback_Usuarios',
    table: 'feedback_in_app',
    select:
      'id, user_id, type, description, route, role, status, admin_notes, app_rating, created_at',
    dateField: 'created_at',
    enabled: true,
    description: 'Feedback in-app (bugs, ideas, experiencias, rating)',
  },
  {
    id: 'verification_requests',
    sheetName: 'Verificaciones',
    table: 'verification_requests',
    select: 'id, user_id, requested_role, status, notes, reviewed_by, reviewed_at, created_at',
    dateField: 'created_at',
    enabled: true,
    description: 'Solicitudes de verificacion de roles',
  },
  {
    id: 'partner_submissions',
    sheetName: 'Partners_Solicitudes',
    table: 'partner_submissions',
    select:
      'id, categoria, nombre_negocio, nombre_contacto, email, telefono, website, comuna, ciudad, status, notas_admin, created_at',
    dateField: 'created_at',
    enabled: true,
    description: 'Solicitudes de ingreso como partner',
  },
  {
    id: 'partners',
    sheetName: 'Partners_Activos',
    table: 'partners',
    select:
      'id, brand_name, ad_text, ad_link, placement, category, is_active, impressions, clicks, priority, start_date, end_date, created_at',
    dateField: 'created_at',
    enabled: true,
    description: 'Anuncios de partners activos (ads)',
  },
  {
    id: 'admin_audit_log',
    sheetName: 'Audit_Log',
    table: 'admin_audit_log',
    select: 'id, admin_user_id, action, target_type, target_id, details, created_at',
    dateField: 'created_at',
    enabled: true,
    description: 'Registro de acciones admin (compliance)',
    transform: (rows) =>
      rows.map((r) => ({
        ...r,
        details: r.details ? JSON.stringify(r.details) : null,
      })),
  },
];

// ── Quality Check Definitions (CONFIGURABLE) ───────────────
//
// Agente: para agregar un check, agrega un objeto aqui.
// Para desactivarlo, pon `enabled: false`.
//
interface QualityCheckDefinition {
  id: string;
  name: string;
  enabled: boolean;
  run: () => Promise<QualityCheck>;
}

const QUALITY_CHECK_DEFINITIONS: QualityCheckDefinition[] = [
  {
    id: 'orphan_pets',
    name: 'Mascotas sin dueno ni email pendiente',
    enabled: true,
    run: async () => {
      const { count } = await supabase
        .from('pets')
        .select('id', { count: 'exact', head: true })
        .is('owner_id', null)
        .is('pending_owner_email', null);
      const n = count ?? 0;
      return {
        name: 'Mascotas sin dueno ni email pendiente',
        result: `${n} encontradas`,
        severity: n > 0 ? 'warn' : 'ok',
        detail: n > 0 ? 'Mascotas creadas por vet sin invitacion enviada' : 'OK',
      };
    },
  },
  {
    id: 'orphan_medical_records',
    name: 'Fichas medicas sin pet_id',
    enabled: true,
    run: async () => {
      const { count } = await supabase
        .from('medical_records')
        .select('id', { count: 'exact', head: true })
        .is('pet_id', null);
      const n = count ?? 0;
      return {
        name: 'Fichas medicas sin pet_id',
        result: `${n} encontradas`,
        severity: n > 0 ? 'error' : 'ok',
        detail: n > 0 ? 'Registros huerfanos — integridad referencial rota' : 'OK',
      };
    },
  },
  {
    id: 'stale_pending_providers',
    name: 'Proveedores pending >7 dias',
    enabled: true,
    run: async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const { count } = await supabase
        .from('service_providers')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending')
        .lt('created_at', sevenDaysAgo);
      const n = count ?? 0;
      return {
        name: 'Proveedores pending >7 dias',
        result: `${n} encontrados`,
        severity: n > 0 ? 'warn' : 'ok',
        detail: n > 0 ? 'Revisar y aprobar o rechazar' : 'OK',
      };
    },
  },
  {
    id: 'stale_bookings',
    name: 'Reservas confirmadas sin cierre',
    enabled: true,
    run: async () => {
      const { count } = await supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'confirmed')
        .is('completed_at', null)
        .is('cancelled_at', null);
      const n = count ?? 0;
      return {
        name: 'Reservas confirmadas sin cierre',
        result: `${n} encontradas`,
        severity: n > 5 ? 'warn' : 'ok',
        detail: n > 0 ? 'Reservas que nunca se completaron ni cancelaron' : 'OK',
      };
    },
  },
  {
    id: 'pending_payments',
    name: 'Pagos en estado pending',
    enabled: true,
    run: async () => {
      const { count } = await supabase
        .from('payment_history')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');
      const n = count ?? 0;
      return {
        name: 'Pagos en estado pending',
        result: `${n} encontrados`,
        severity: n > 0 ? 'warn' : 'ok',
        detail: n > 0 ? 'Pagos que no se completaron — revisar con Flow' : 'OK',
      };
    },
  },
  {
    id: 'expired_premium',
    name: 'Usuarios premium con plan expirado',
    enabled: true,
    run: async () => {
      const now = new Date().toISOString();
      const { count } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('is_premium', true)
        .lt('premium_expires_at', now);
      const n = count ?? 0;
      return {
        name: 'Usuarios premium con plan expirado',
        result: `${n} encontrados`,
        severity: n > 0 ? 'error' : 'ok',
        detail: n > 0 ? 'is_premium=true pero plan ya vencio' : 'OK',
      };
    },
  },
  {
    id: 'providers_no_slug',
    name: 'Proveedores verificados sin slug',
    enabled: true,
    run: async () => {
      const { count } = await supabase
        .from('service_providers')
        .select('id', { count: 'exact', head: true })
        .eq('is_verified', true)
        .is('slug', null);
      const n = count ?? 0;
      return {
        name: 'Proveedores verificados sin slug',
        result: `${n} encontrados`,
        severity: n > 0 ? 'warn' : 'ok',
        detail: n > 0 ? 'No tienen URL publica en directorio' : 'OK',
      };
    },
  },
  {
    id: 'deceased_no_date',
    name: 'Mascotas deceased sin fecha de fallecimiento',
    enabled: true,
    run: async () => {
      const { count } = await supabase
        .from('pets')
        .select('id', { count: 'exact', head: true })
        .eq('lifecycle_status', 'deceased')
        .is('passed_away_at', null);
      const n = count ?? 0;
      return {
        name: 'Mascotas deceased sin fecha de fallecimiento',
        result: `${n} encontradas`,
        severity: n > 0 ? 'warn' : 'ok',
        detail: n > 0 ? 'Inconsistencia en datos memorial' : 'OK',
      };
    },
  },
  {
    id: 'overdue_reminders',
    name: 'Recordatorios vencidos sin completar',
    enabled: true,
    run: async () => {
      const now = new Date().toISOString();
      const { count } = await supabase
        .from('pet_reminders')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active')
        .lt('reminder_date', now);
      const n = count ?? 0;
      return {
        name: 'Recordatorios vencidos sin completar',
        result: `${n} encontrados`,
        severity: n > 10 ? 'warn' : 'ok',
        detail: n > 0 ? 'Recordatorios pasados que siguen activos' : 'OK',
      };
    },
  },
  {
    id: 'demo_data',
    name: 'Datos demo en produccion',
    enabled: true,
    run: async () => {
      const [{ count: dp }, { count: dv }] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_demo', true),
        supabase
          .from('service_providers')
          .select('id', { count: 'exact', head: true })
          .eq('is_demo', true),
      ]);
      const total = (dp ?? 0) + (dv ?? 0);
      return {
        name: 'Datos demo en produccion',
        result: `${total} registros demo`,
        severity: total > 0 ? 'warn' : 'ok',
        detail: total > 0 ? `${dp ?? 0} perfiles + ${dv ?? 0} proveedores demo` : 'OK',
      };
    },
  },
  {
    id: 'sensitive_config',
    name: 'Config con keys sensibles',
    enabled: true,
    run: async () => {
      const { data } = await supabase.from('platform_config').select('key');
      const suspicious = (data ?? []).filter((r) => /key|secret|token|password/i.test(r.key));
      return {
        name: 'Config con keys sensibles',
        result: `${suspicious.length} keys detectadas`,
        severity: suspicious.length > 0 ? 'warn' : 'ok',
        detail:
          suspicious.length > 0
            ? `Keys: ${suspicious.map((k) => k.key).join(', ')} — redactadas en export`
            : 'OK',
      };
    },
  },
  {
    id: 'empty_tables',
    name: 'Tablas con 0 registros',
    enabled: true,
    run: async () => {
      const tables = ['bookings', 'payment_history', 'service_reviews', 'provider_subscriptions'];
      const results = await Promise.all(
        tables.map(async (t) => {
          const { count } = await supabase.from(t).select('id', { count: 'exact', head: true });
          return { table: t, count: count ?? 0 };
        })
      );
      const empty = results.filter((r) => r.count === 0).map((r) => r.table);
      return {
        name: 'Tablas con 0 registros',
        result: empty.length > 0 ? empty.join(', ') : 'Todas tienen datos',
        severity: empty.length > 0 ? 'warn' : 'ok',
        detail: empty.length > 0 ? 'Puede ser normal si la feature no se ha usado aun' : 'OK',
      };
    },
  },
];

// ── Helpers ────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyDateFilter(rows: any[], filters: ExportFilters, dateField: string | null): any[] {
  if (!dateField || (!filters.from_date && !filters.to_date)) return rows;
  return rows.filter((r) => {
    const d = r[dateField] as string | null;
    if (!d) return true;
    if (filters.from_date && d < filters.from_date) return false;
    if (filters.to_date && d > filters.to_date + 'T23:59:59') return false;
    return true;
  });
}

async function fetchSheet(def: SheetDefinition, filters: ExportFilters): Promise<SheetResult> {
  try {
    const { data, error } = await supabase.from(def.table).select(def.select).limit(10000);
    if (error) throw new Error(error.message);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let rows = (data ?? []) as any[];
    rows = applyDateFilter(rows, filters, def.dateField);
    if (def.transform) rows = def.transform(rows);
    return { name: def.sheetName, rows };
  } catch (err) {
    // Error resilience: si una tabla falla, devolver sheet vacio con warning
    return {
      name: def.sheetName,
      rows: [],
      error: `Error consultando ${def.table}: ${err instanceof Error ? err.message : 'desconocido'}`,
    };
  }
}

// ── README Sheet ───────────────────────────────────────────

function buildReadmeSheet(
  exportType: ExportType,
  filters: ExportFilters,
  userEmail: string,
  sheets: SheetResult[],
  totalRows: number,
  errors: string[]
): SheetResult {
  const rows = [
    { Campo: 'Tipo de export', Valor: exportType === 'full' ? 'Full Snapshot' : 'Periodo' },
    { Campo: 'Generado por', Valor: userEmail },
    {
      Campo: 'Generado el',
      Valor: new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' }),
    },
    {
      Campo: 'Rango de fechas',
      Valor: filters.from_date ? `${filters.from_date} a ${filters.to_date}` : 'Todo el historico',
    },
    { Campo: 'Total de sheets', Valor: String(sheets.length + 2) },
    { Campo: 'Total de registros', Valor: String(totalRows) },
    { Campo: 'Errores durante export', Valor: errors.length > 0 ? errors.join('; ') : 'Ninguno' },
    { Campo: 'Sistema', Valor: 'Paw Friend — pawfriend.cl' },
    { Campo: '', Valor: '' },
    { Campo: '--- Contenido ---', Valor: '--- Registros ---' },
    ...sheets.map((s) => ({
      Campo: s.name + (s.error ? ' [ERROR]' : ''),
      Valor: String(s.rows.length),
    })),
  ];
  return { name: 'README', rows };
}

// ── Main Export Generator ──────────────────────────────────

export interface ExportProgress {
  step: string;
  pct: number;
}

/** Limite de exports por dia. El hook lo valida antes de llamar a esta funcion. */
export const MAX_EXPORTS_PER_DAY = 5;

export async function generateAuditExport(
  exportType: ExportType,
  filters: ExportFilters,
  userEmail: string,
  onProgress?: (p: ExportProgress) => void
): Promise<{
  blob: Blob;
  jsonBlob: Blob;
  totalRows: number;
  sheetsCount: number;
}> {
  const report = (step: string, pct: number) => onProgress?.({ step, pct });
  const enabledSheets = SHEET_DEFINITIONS.filter((d) => d.enabled);
  const enabledChecks = QUALITY_CHECK_DEFINITIONS.filter((d) => d.enabled);

  // 1. Fetch all sheets (sequential for progress reporting, but with error resilience)
  const sheets: SheetResult[] = [];
  const errors: string[] = [];

  for (let i = 0; i < enabledSheets.length; i++) {
    const def = enabledSheets[i];
    const pct = Math.round(5 + (i / enabledSheets.length) * 70);
    report(`Consultando ${def.sheetName}...`, pct);
    const result = await fetchSheet(def, filters);
    if (result.error) errors.push(result.error);
    sheets.push(result);
  }

  // 2. Run quality checks in PARALLEL
  report('Ejecutando checks de calidad...', 80);
  const qualityChecks = await Promise.all(
    enabledChecks.map(async (def) => {
      try {
        return await def.run();
      } catch (err) {
        return {
          name: def.name,
          result: 'Error ejecutando check',
          severity: 'error' as const,
          detail: err instanceof Error ? err.message : 'Error desconocido',
        };
      }
    })
  );

  // Add errors from sheet fetching as additional DQ checks
  for (const err of errors) {
    qualityChecks.push({
      name: 'Error de fetch en sheet',
      result: 'Error',
      severity: 'error',
      detail: err,
    });
  }

  const totalRows = sheets.reduce((sum, s) => sum + s.rows.length, 0);

  // 3. Build README
  const readme = buildReadmeSheet(exportType, filters, userEmail, sheets, totalRows, errors);

  report('Generando archivo Excel...', 92);

  // 4. Create workbook
  const wb = XLSX.utils.book_new();

  // README sheet
  const readmeWs = XLSX.utils.json_to_sheet(readme.rows);
  readmeWs['!cols'] = [{ wch: 35 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, readmeWs, 'README');

  // Data sheets
  for (const sheet of sheets) {
    if (sheet.rows.length === 0) {
      const msg = sheet.error ? `Error: ${sheet.error}` : 'Sin datos para este periodo';
      const emptyWs = XLSX.utils.aoa_to_sheet([[msg]]);
      XLSX.utils.book_append_sheet(wb, emptyWs, sheet.name);
    } else {
      const ws = XLSX.utils.json_to_sheet(sheet.rows);
      const keys = Object.keys(sheet.rows[0]);
      ws['!cols'] = keys.map((key) => {
        const maxLen = Math.max(
          key.length,
          ...sheet.rows.slice(0, 100).map((r) => String(r[key] ?? '').length)
        );
        return { wch: Math.min(maxLen + 2, 50) };
      });
      XLSX.utils.book_append_sheet(wb, ws, sheet.name);
    }
  }

  // Data Quality Report sheet
  const dqRows = qualityChecks.map((c) => ({
    Check: c.name,
    Resultado: c.result,
    Severidad: c.severity === 'ok' ? 'OK' : c.severity === 'warn' ? 'ADVERTENCIA' : 'ERROR',
    Detalle: c.detail,
  }));
  const dqWs = XLSX.utils.json_to_sheet(dqRows);
  dqWs['!cols'] = [{ wch: 42 }, { wch: 28 }, { wch: 15 }, { wch: 65 }];
  XLSX.utils.book_append_sheet(wb, dqWs, 'Calidad_Datos');

  report('Finalizando...', 98);

  // 5. Generate Excel blob
  const wbOut = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbOut], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  // 6. Generate Claude-readable JSON blob con misma data (tablas + checks)
  //    Formato plano y parseable para que Claude Code pueda leer y proponer
  //    fixes sin abrir Excel. Incluye metadatos, cada tabla con rows, y los
  //    quality checks con su severidad.
  const jsonPayload = {
    meta: {
      app: 'Paw Friend',
      export_type: exportType,
      filters: exportType === 'period' ? filters : null,
      generated_at: new Date().toISOString(),
      generated_by: userEmail,
      total_rows: totalRows,
      tables_count: sheets.length,
      sheets_count: sheets.length + 2,
      fetch_errors: errors,
    },
    tables: sheets.map((s) => {
      const def = enabledSheets.find((d) => d.sheetName === s.name);
      return {
        id: def?.id ?? s.name,
        sheet_name: s.name,
        table: def?.table ?? null,
        description: def?.description ?? null,
        row_count: s.rows.length,
        error: s.error ?? null,
        rows: s.rows,
      };
    }),
    quality_checks: qualityChecks.map((c) => ({
      name: c.name,
      severity: c.severity,
      result: c.result,
      detail: c.detail,
    })),
    quality_summary: {
      total: qualityChecks.length,
      ok: qualityChecks.filter((c) => c.severity === 'ok').length,
      warn: qualityChecks.filter((c) => c.severity === 'warn').length,
      error: qualityChecks.filter((c) => c.severity === 'error').length,
    },
  };
  const jsonBlob = new Blob([JSON.stringify(jsonPayload, null, 2)], {
    type: 'application/json',
  });

  return {
    blob,
    jsonBlob,
    totalRows,
    sheetsCount: sheets.length + 2, // +README +DQ
  };
}
