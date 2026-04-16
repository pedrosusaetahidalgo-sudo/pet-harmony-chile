/**
 * Audit Export System — Generador de Excel con datos reales de Paw Friend.
 *
 * Genera un .xlsx con multiples sheets representando tablas del sistema,
 * mas un Data Quality Report con checks de integridad.
 *
 * Usa SheetJS (xlsx) client-side para generar el archivo.
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

interface SheetData {
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rows: any[];
}

// ── Helpers ────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyDateFilter(rows: any[], filters: ExportFilters, dateField = 'created_at'): any[] {
  if (!filters.from_date && !filters.to_date) return rows;
  return rows.filter((r) => {
    const d = r[dateField] as string | null;
    if (!d) return true;
    if (filters.from_date && d < filters.from_date) return false;
    if (filters.to_date && d > filters.to_date + 'T23:59:59') return false;
    return true;
  });
}

async function fetchAll(table: string, select = '*', limit = 10000) {
  const { data, error } = await supabase.from(table).select(select).limit(limit);
  if (error) throw new Error(`Error fetching ${table}: ${error.message}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []) as any[];
}

// ── Sheet builders ─────────────────────────────────────────

async function buildProfilesSheet(filters: ExportFilters): Promise<SheetData> {
  const raw = await fetchAll(
    'profiles',
    'id, display_name, location, is_premium, is_admin, is_demo, level, points, plan_id, premium_plan, created_at, updated_at'
  );
  const rows = applyDateFilter(raw, filters);
  return { name: 'Usuarios', rows };
}

async function buildPetsSheet(filters: ExportFilters): Promise<SheetData> {
  const raw = await fetchAll(
    'pets',
    'id, name, species, breed, gender, birth_date, weight, neutered, microchip_number, lifecycle_status, owner_id, created_by_vet_id, paw_card_id, vaccination_status, created_at, updated_at'
  );
  const rows = applyDateFilter(raw, filters);
  return { name: 'Mascotas', rows };
}

async function buildMedicalRecordsSheet(filters: ExportFilters): Promise<SheetData> {
  const raw = await fetchAll(
    'medical_records',
    'id, pet_id, owner_id, record_type, title, date, description, diagnosis, treatment, vet_name, clinic_name, batch_number, serial_number, antiparasitic_type, product_brand, next_date, created_at'
  );
  const rows = applyDateFilter(raw, filters, 'date');
  // Flatten treatment JSON
  return {
    name: 'Fichas_Medicas',
    rows: rows.map((r) => ({
      ...r,
      treatment: r.treatment ? JSON.stringify(r.treatment) : null,
    })),
  };
}

async function buildServiceProvidersSheet(filters: ExportFilters): Promise<SheetData> {
  const raw = await fetchAll(
    'service_providers',
    'id, user_id, display_name, business_name, provider_type, primary_service_type, status, commune, city, is_verified, is_directory_visible, is_featured, avg_rating, total_reviews, total_services_completed, provider_plan, experience_years, license_number, slug, is_demo, created_at, updated_at'
  );
  const rows = applyDateFilter(raw, filters);
  return { name: 'Proveedores', rows };
}

async function buildBookingsSheet(filters: ExportFilters): Promise<SheetData> {
  const raw = await fetchAll(
    'bookings',
    'id, user_id, provider_id, pet_id, service_type, status, payment_status, total_price, notes, booked_at, confirmed_at, completed_at, cancelled_at'
  );
  const rows = applyDateFilter(raw, filters, 'booked_at');
  return { name: 'Reservas', rows };
}

async function buildPaymentHistorySheet(filters: ExportFilters): Promise<SheetData> {
  const raw = await fetchAll(
    'payment_history',
    'id, user_id, payment_type, description, amount, net_amount, commission, status, payment_method, payment_reference, completed_at, refunded_at, created_at'
  );
  const rows = applyDateFilter(raw, filters);
  return { name: 'Pagos', rows };
}

async function buildProviderSubscriptionsSheet(filters: ExportFilters): Promise<SheetData> {
  const raw = await fetchAll(
    'provider_subscriptions',
    'id, user_id, provider_id, plan_id, price, status, billing_cycle, current_period_start, current_period_end, created_at'
  );
  const rows = applyDateFilter(raw, filters);
  return { name: 'Suscripciones_B2B', rows };
}

async function buildServiceReviewsSheet(filters: ExportFilters): Promise<SheetData> {
  const raw = await fetchAll('service_reviews', '*');
  const rows = applyDateFilter(raw, filters);
  return { name: 'Resenas', rows };
}

async function buildRemindersSheet(filters: ExportFilters): Promise<SheetData> {
  const raw = await fetchAll(
    'pet_reminders',
    'id, pet_id, user_id, title, description, reminder_date, reminder_type, is_recurring, recurrence_pattern, status, created_at'
  );
  const rows = applyDateFilter(raw, filters);
  return { name: 'Recordatorios', rows };
}

async function buildPlatformConfigSheet(): Promise<SheetData> {
  const { data } = await supabase.from('platform_config').select('key, value, updated_at');
  const BLOCKED_KEYS = /key|secret|token|password|api_key/i;
  const rows = (data ?? []).map((r) => ({
    key: r.key,
    value: BLOCKED_KEYS.test(r.key)
      ? '[REDACTED]'
      : typeof r.value === 'object'
        ? JSON.stringify(r.value)
        : r.value,
    updated_at: r.updated_at,
  }));
  return { name: 'Config_Sistema', rows };
}

async function buildPostsSheet(filters: ExportFilters): Promise<SheetData> {
  const raw = await fetchAll(
    'posts',
    'id, user_id, content, image_url, likes_count, comments_count, created_at'
  );
  const rows = applyDateFilter(raw, filters);
  return { name: 'Posts_Feed', rows };
}

// ── Data Quality Checks ────────────────────────────────────

async function runQualityChecks(filters: ExportFilters): Promise<QualityCheck[]> {
  const checks: QualityCheck[] = [];

  // 1. Mascotas sin dueno
  const { count: orphanPets } = await supabase
    .from('pets')
    .select('id', { count: 'exact', head: true })
    .is('owner_id', null)
    .is('pending_owner_email', null);
  checks.push({
    name: 'Mascotas sin dueno ni email pendiente',
    result: `${orphanPets ?? 0} encontradas`,
    severity: (orphanPets ?? 0) > 0 ? 'warn' : 'ok',
    detail: (orphanPets ?? 0) > 0 ? 'Mascotas creadas por vet sin invitacion enviada' : 'OK',
  });

  // 2. Medical records sin pet_id valido
  const { count: orphanRecords } = await supabase
    .from('medical_records')
    .select('id', { count: 'exact', head: true })
    .is('pet_id', null);
  checks.push({
    name: 'Fichas medicas sin pet_id',
    result: `${orphanRecords ?? 0} encontradas`,
    severity: (orphanRecords ?? 0) > 0 ? 'error' : 'ok',
    detail: (orphanRecords ?? 0) > 0 ? 'Registros huerfanos — integridad referencial rota' : 'OK',
  });

  // 3. Proveedores pending hace mas de 7 dias
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const { count: stalePending } = await supabase
    .from('service_providers')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')
    .lt('created_at', sevenDaysAgo);
  checks.push({
    name: 'Proveedores pending >7 dias',
    result: `${stalePending ?? 0} encontrados`,
    severity: (stalePending ?? 0) > 0 ? 'warn' : 'ok',
    detail: (stalePending ?? 0) > 0 ? 'Revisar y aprobar o rechazar' : 'OK',
  });

  // 4. Bookings confirmed sin completed_at ni cancelled_at (posible leak)
  const { count: staleBookings } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'confirmed')
    .is('completed_at', null)
    .is('cancelled_at', null);
  checks.push({
    name: 'Reservas confirmadas sin cierre',
    result: `${staleBookings ?? 0} encontradas`,
    severity: (staleBookings ?? 0) > 5 ? 'warn' : 'ok',
    detail: (staleBookings ?? 0) > 0 ? 'Reservas que nunca se completaron ni cancelaron' : 'OK',
  });

  // 5. Pagos pending
  const { count: pendingPayments } = await supabase
    .from('payment_history')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending');
  checks.push({
    name: 'Pagos en estado pending',
    result: `${pendingPayments ?? 0} encontrados`,
    severity: (pendingPayments ?? 0) > 0 ? 'warn' : 'ok',
    detail: (pendingPayments ?? 0) > 0 ? 'Pagos que no se completaron — revisar con Flow' : 'OK',
  });

  // 6. Usuarios premium con plan expirado
  const now = new Date().toISOString();
  const { count: expiredPremium } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('is_premium', true)
    .lt('premium_expires_at', now);
  checks.push({
    name: 'Usuarios premium con plan expirado',
    result: `${expiredPremium ?? 0} encontrados`,
    severity: (expiredPremium ?? 0) > 0 ? 'error' : 'ok',
    detail: (expiredPremium ?? 0) > 0 ? 'is_premium=true pero plan ya vencio' : 'OK',
  });

  // 7. Providers verificados sin slug (no aparecen en directorio)
  const { count: noSlug } = await supabase
    .from('service_providers')
    .select('id', { count: 'exact', head: true })
    .eq('is_verified', true)
    .is('slug', null);
  checks.push({
    name: 'Proveedores verificados sin slug',
    result: `${noSlug ?? 0} encontrados`,
    severity: (noSlug ?? 0) > 0 ? 'warn' : 'ok',
    detail: (noSlug ?? 0) > 0 ? 'No tienen URL publica en directorio' : 'OK',
  });

  // 8. Mascotas con lifecycle_status=deceased sin passed_away_at
  const { count: deadNoDate } = await supabase
    .from('pets')
    .select('id', { count: 'exact', head: true })
    .eq('lifecycle_status', 'deceased')
    .is('passed_away_at', null);
  checks.push({
    name: 'Mascotas deceased sin fecha de fallecimiento',
    result: `${deadNoDate ?? 0} encontradas`,
    severity: (deadNoDate ?? 0) > 0 ? 'warn' : 'ok',
    detail: (deadNoDate ?? 0) > 0 ? 'Inconsistencia en datos memorial' : 'OK',
  });

  // 9. Reminders vencidos sin completar
  const { count: overdueReminders } = await supabase
    .from('pet_reminders')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')
    .lt('reminder_date', now);
  checks.push({
    name: 'Recordatorios vencidos sin completar',
    result: `${overdueReminders ?? 0} encontrados`,
    severity: (overdueReminders ?? 0) > 10 ? 'warn' : 'ok',
    detail: (overdueReminders ?? 0) > 0 ? 'Recordatorios pasados que siguen activos' : 'OK',
  });

  // 10. Demo data en produccion
  const { count: demoProfiles } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('is_demo', true);
  const { count: demoProviders } = await supabase
    .from('service_providers')
    .select('id', { count: 'exact', head: true })
    .eq('is_demo', true);
  const totalDemo = (demoProfiles ?? 0) + (demoProviders ?? 0);
  checks.push({
    name: 'Datos demo en produccion',
    result: `${totalDemo} registros demo`,
    severity: totalDemo > 0 ? 'warn' : 'ok',
    detail:
      totalDemo > 0
        ? `${demoProfiles ?? 0} perfiles + ${demoProviders ?? 0} proveedores demo`
        : 'OK',
  });

  // 11. Config con posibles secrets expuestos
  const { data: configData } = await supabase.from('platform_config').select('key');
  const suspiciousKeys = (configData ?? []).filter((r) => /key|secret|token|password/i.test(r.key));
  checks.push({
    name: 'Config con keys sensibles',
    result: `${suspiciousKeys.length} keys detectadas`,
    severity: suspiciousKeys.length > 0 ? 'warn' : 'ok',
    detail:
      suspiciousKeys.length > 0
        ? `Keys: ${suspiciousKeys.map((k) => k.key).join(', ')} — redactadas en export`
        : 'OK',
  });

  // 12. Tablas con 0 registros (posible problema)
  const tablesToCheck = [
    'bookings',
    'payment_history',
    'service_reviews',
    'provider_subscriptions',
  ];
  const emptyTables: string[] = [];
  for (const table of tablesToCheck) {
    const { count } = await supabase.from(table).select('id', { count: 'exact', head: true });
    if ((count ?? 0) === 0) emptyTables.push(table);
  }
  checks.push({
    name: 'Tablas con 0 registros',
    result: emptyTables.length > 0 ? emptyTables.join(', ') : 'Todas tienen datos',
    severity: emptyTables.length > 0 ? 'warn' : 'ok',
    detail: emptyTables.length > 0 ? 'Puede ser normal si la feature no se ha usado aun' : 'OK',
  });

  return checks;
}

// ── README sheet builder ───────────────────────────────────

function buildReadmeSheet(
  exportType: ExportType,
  filters: ExportFilters,
  userEmail: string,
  sheets: SheetData[],
  totalRows: number
): SheetData {
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
    { Campo: 'Total de sheets', Valor: String(sheets.length + 2) }, // +2 = README + DQ Report
    { Campo: 'Total de registros', Valor: String(totalRows) },
    { Campo: 'Sistema', Valor: 'Paw Friend — pawfriend.cl' },
    { Campo: '', Valor: '' },
    { Campo: '--- Contenido ---', Valor: '--- Registros ---' },
    ...sheets.map((s) => ({ Campo: s.name, Valor: String(s.rows.length) })),
  ];
  return { name: 'README', rows };
}

// ── Main export generator ──────────────────────────────────

export interface ExportProgress {
  step: string;
  pct: number;
}

export async function generateAuditExport(
  exportType: ExportType,
  filters: ExportFilters,
  userEmail: string,
  onProgress?: (p: ExportProgress) => void
): Promise<{ blob: Blob; totalRows: number; sheetsCount: number }> {
  const report = (step: string, pct: number) => onProgress?.({ step, pct });

  report('Consultando usuarios...', 5);
  const profiles = await buildProfilesSheet(filters);

  report('Consultando mascotas...', 15);
  const pets = await buildPetsSheet(filters);

  report('Consultando fichas medicas...', 25);
  const medical = await buildMedicalRecordsSheet(filters);

  report('Consultando proveedores...', 35);
  const providers = await buildServiceProvidersSheet(filters);

  report('Consultando reservas...', 45);
  const bookings = await buildBookingsSheet(filters);

  report('Consultando pagos...', 52);
  const payments = await buildPaymentHistorySheet(filters);

  report('Consultando suscripciones B2B...', 58);
  const subs = await buildProviderSubscriptionsSheet(filters);

  report('Consultando resenas...', 64);
  const reviews = await buildServiceReviewsSheet(filters);

  report('Consultando recordatorios...', 70);
  const reminders = await buildRemindersSheet(filters);

  report('Consultando configuracion...', 75);
  const config = await buildPlatformConfigSheet();

  report('Consultando posts...', 80);
  const posts = await buildPostsSheet(filters);

  report('Ejecutando checks de calidad...', 85);
  const qualityChecks = await runQualityChecks(filters);

  const sheets: SheetData[] = [
    profiles,
    pets,
    medical,
    providers,
    bookings,
    payments,
    subs,
    reviews,
    reminders,
    config,
    posts,
  ];
  const totalRows = sheets.reduce((sum, s) => sum + s.rows.length, 0);

  // Build README
  const readme = buildReadmeSheet(exportType, filters, userEmail, sheets, totalRows);

  report('Generando archivo Excel...', 92);

  // Create workbook
  const wb = XLSX.utils.book_new();

  // README sheet
  const readmeWs = XLSX.utils.json_to_sheet(readme.rows);
  XLSX.utils.book_append_sheet(wb, readmeWs, 'README');

  // Data sheets
  for (const sheet of sheets) {
    if (sheet.rows.length === 0) {
      const emptyWs = XLSX.utils.aoa_to_sheet([['Sin datos para este periodo']]);
      XLSX.utils.book_append_sheet(wb, emptyWs, sheet.name);
    } else {
      const ws = XLSX.utils.json_to_sheet(sheet.rows);
      // Auto-width columns
      const colWidths = Object.keys(sheet.rows[0]).map((key) => {
        const maxLen = Math.max(
          key.length,
          ...sheet.rows.slice(0, 100).map((r) => String(r[key] ?? '').length)
        );
        return { wch: Math.min(maxLen + 2, 50) };
      });
      ws['!cols'] = colWidths;
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
  dqWs['!cols'] = [{ wch: 40 }, { wch: 25 }, { wch: 15 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, dqWs, 'Calidad_Datos');

  report('Finalizando...', 98);

  // Generate blob
  const wbOut = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbOut], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  return {
    blob,
    totalRows,
    sheetsCount: sheets.length + 2, // +README +DQ
  };
}
