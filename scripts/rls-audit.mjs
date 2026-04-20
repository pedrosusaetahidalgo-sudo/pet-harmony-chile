#!/usr/bin/env node
/**
 * RLS Audit Script — verifica aislamiento de datos entre usuarios.
 *
 * Origen: INIT-22 del Plan 90d. CLAUDE.md §9.8 exige proteger datos
 * de usuarios existentes; este script es el check automatico.
 *
 * Cómo correrlo:
 *   export SUPABASE_URL=https://gwailbjlvevkhwcrovfd.supabase.co
 *   export SUPABASE_ANON_KEY=<anon_key>
 *   export RLS_USER_A_JWT=<JWT de user A logueado>
 *   export RLS_USER_B_JWT=<JWT de user B logueado>
 *   node scripts/rls-audit.mjs
 *
 * Cómo obtener los JWTs:
 *   1. Crear 2 cuentas de prueba (rls-a@pawfriend.local, rls-b@pawfriend.local).
 *   2. Loguearse en cada una, abrir DevTools → Application → Local Storage.
 *   3. Copiar el campo `access_token` del storage key `pf-auth-v1`.
 *
 * Qué verifica (10 tablas críticas):
 *   - pets (User A no puede ver pets de User B)
 *   - medical_records
 *   - pet_medical_shares (alias: medical_share_tokens)
 *   - pet_reminders
 *   - bookings
 *   - donations
 *   - adoption_centers (user_id propio solo)
 *   - vet_clinical_notes
 *   - pitch_applications (applicant_email match)
 *   - paw_companys (solo lectura publica si active)
 *
 * Output: reporte en stdout + archivo audits/RLS_AUDIT_<fecha>.md.
 */

import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');

const SUPABASE_URL = process.env.SUPABASE_URL;
const ANON_KEY = process.env.SUPABASE_ANON_KEY;
const USER_A_JWT = process.env.RLS_USER_A_JWT;
const USER_B_JWT = process.env.RLS_USER_B_JWT;

if (!SUPABASE_URL || !ANON_KEY || !USER_A_JWT || !USER_B_JWT) {
  console.error('[RLS Audit] Missing env vars. Set SUPABASE_URL, SUPABASE_ANON_KEY, RLS_USER_A_JWT, RLS_USER_B_JWT.');
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────
// REST helpers
// ─────────────────────────────────────────────────────────────

async function query(table, jwt, params = '') {
  const url = `${SUPABASE_URL}/rest/v1/${table}${params ? `?${params}` : ''}`;
  const resp = await fetch(url, {
    method: 'GET',
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${jwt}`,
      Prefer: 'count=exact',
    },
  });
  const count = resp.headers.get('content-range')?.split('/')?.[1];
  const body = await resp.json().catch(() => null);
  return {
    ok: resp.ok,
    status: resp.status,
    count: count && count !== '*' ? parseInt(count, 10) : null,
    rows: Array.isArray(body) ? body : [],
    error: !resp.ok ? body : null,
  };
}

async function userFromJwt(jwt) {
  const resp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${jwt}` },
  });
  return resp.ok ? await resp.json() : null;
}

// ─────────────────────────────────────────────────────────────
// Checks
// ─────────────────────────────────────────────────────────────

const findings = [];
function record(severity, tableName, check, detail) {
  findings.push({
    severity, // 'pass' | 'warn' | 'critical'
    table: tableName,
    check,
    detail,
  });
  const marker = severity === 'pass' ? '✅' : severity === 'warn' ? '⚠️' : '🚨';
  console.log(`${marker} [${tableName}] ${check} — ${detail}`);
}

async function checkPetsIsolation(userA, userB) {
  const table = 'pets';
  // User A should see only their own pets (filter by owner_id)
  const aResult = await query(table, USER_A_JWT, `owner_id=eq.${userA.id}&select=id`);
  if (!aResult.ok) {
    record('critical', table, 'User A reads own pets', `HTTP ${aResult.status}`);
    return;
  }
  // Attempt User A reading User B's pets explicitly → debe dar 0 rows
  const aCrossResult = await query(table, USER_A_JWT, `owner_id=eq.${userB.id}&select=id`);
  if (!aCrossResult.ok) {
    record('pass', table, 'RLS blocks cross-user read by owner_id filter', `HTTP ${aCrossResult.status}`);
  } else if (aCrossResult.rows.length === 0) {
    record('pass', table, 'User A cannot see User B pets', '0 rows when filtering by B');
  } else {
    record('critical', table, 'LEAK: User A sees User B pets', `${aCrossResult.rows.length} rows leaked`);
  }
  // User A intenta traer TODOS los pets sin filtro — debe retornar solo los suyos
  const aAll = await query(table, USER_A_JWT, 'select=id,owner_id');
  if (aAll.ok) {
    const leaked = (aAll.rows || []).filter((r) => r.owner_id !== userA.id);
    if (leaked.length === 0) {
      record('pass', table, 'Unfiltered read returns only own rows', `${aAll.rows.length} rows all owned by A`);
    } else {
      record('critical', table, 'LEAK on unfiltered read', `${leaked.length} foreign rows visible`);
    }
  }
}

async function checkMedicalRecordsIsolation(userA, userB) {
  const table = 'medical_records';
  const aAll = await query(table, USER_A_JWT, 'select=id,owner_id&limit=100');
  if (!aAll.ok) {
    record('warn', table, 'User A read failed', `HTTP ${aAll.status}`);
    return;
  }
  const leaked = (aAll.rows || []).filter((r) => r.owner_id && r.owner_id !== userA.id);
  if (leaked.length === 0) {
    record('pass', table, 'Only own records visible', `${aAll.rows.length} rows`);
  } else {
    record('critical', table, 'LEAK medical records', `${leaked.length} foreign rows`);
  }
}

async function checkShareTokensIsolation(userA) {
  const table = 'medical_share_tokens';
  const aAll = await query(table, USER_A_JWT, 'select=id,owner_id&limit=100');
  if (!aAll.ok) {
    record('warn', table, 'User A read share tokens failed', `HTTP ${aAll.status}`);
    return;
  }
  const leaked = (aAll.rows || []).filter((r) => r.owner_id && r.owner_id !== userA.id);
  if (leaked.length === 0) {
    record('pass', table, 'Only own share tokens visible', `${aAll.rows.length} rows`);
  } else {
    record('critical', table, 'LEAK share tokens', `${leaked.length} foreign tokens`);
  }
}

async function checkRemindersIsolation(userA) {
  const table = 'pet_reminders';
  const aAll = await query(table, USER_A_JWT, 'select=id,owner_id,user_id&limit=100');
  if (!aAll.ok) {
    record('warn', table, 'User A read reminders failed', `HTTP ${aAll.status}`);
    return;
  }
  const leaked = (aAll.rows || []).filter((r) => {
    const o = r.owner_id || r.user_id;
    return o && o !== userA.id;
  });
  if (leaked.length === 0) {
    record('pass', table, 'Only own reminders visible', `${aAll.rows.length} rows`);
  } else {
    record('critical', table, 'LEAK reminders', `${leaked.length} foreign reminders`);
  }
}

async function checkDonationsIsolation(userA) {
  const table = 'donations';
  const aAll = await query(table, USER_A_JWT, 'select=id,user_id&limit=100');
  if (!aAll.ok) {
    record('warn', table, 'User A read donations failed', `HTTP ${aAll.status}`);
    return;
  }
  const leaked = (aAll.rows || []).filter((r) => r.user_id && r.user_id !== userA.id);
  if (leaked.length === 0) {
    record('pass', table, 'Only own donations visible', `${aAll.rows.length} rows`);
  } else {
    record('critical', table, 'LEAK donations', `${leaked.length} foreign donations`);
  }
}

async function checkPitchApplicationsIsolation(userA) {
  const table = 'pitch_applications';
  const aAll = await query(table, USER_A_JWT, 'select=id,contact_email&limit=100');
  if (!aAll.ok) {
    // OK — RLS probablemente bloquea a usuarios normales
    record('pass', table, 'Read restricted to admin or applicant', `HTTP ${aAll.status}`);
    return;
  }
  const totalVisible = aAll.rows.length;
  if (totalVisible === 0) {
    record('pass', table, 'User A sees 0 pitch applications', 'Expected (not admin, not own)');
  } else {
    const foreign = aAll.rows.filter((r) => r.contact_email !== userA.email);
    if (foreign.length === 0) {
      record('pass', table, 'Only own applications visible', `${totalVisible} rows (own)`);
    } else {
      record('critical', table, 'LEAK pitch applications', `${foreign.length} foreign rows`);
    }
  }
}

async function checkPawCompanysPublicOnly(userA) {
  const table = 'paw_companys';
  const aAll = await query(table, USER_A_JWT, 'select=id,status&limit=100');
  if (!aAll.ok) {
    record('warn', table, 'User A read paw_companys failed', `HTTP ${aAll.status}`);
    return;
  }
  const nonActive = (aAll.rows || []).filter((r) => r.status && r.status !== 'active');
  if (nonActive.length === 0) {
    record('pass', table, 'Only active paw_companys visible to non-admin', `${aAll.rows.length} rows`);
  } else {
    record('warn', table, 'Non-active paw_companys visible', `${nonActive.length} non-active rows (verify RLS intent)`);
  }
}

async function checkAdoptionCentersPublicRead(userA) {
  const table = 'adoption_centers';
  const aAll = await query(table, USER_A_JWT, 'select=id,status,user_id&limit=100');
  if (!aAll.ok) {
    record('warn', table, 'User A read adoption_centers failed', `HTTP ${aAll.status}`);
    return;
  }
  record('pass', table, 'Read succeeds (public directory allowed)', `${aAll.rows.length} rows visible`);
  // Intentar UPDATE sobre un centro ajeno (deberia fallar)
  const foreign = aAll.rows.find((r) => r.user_id && r.user_id !== userA.id);
  if (foreign) {
    const resp = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}?id=eq.${foreign.id}`,
      {
        method: 'PATCH',
        headers: {
          apikey: ANON_KEY,
          Authorization: `Bearer ${USER_A_JWT}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({ legal_name: 'RLS-AUDIT-HACK' }),
      }
    );
    if (!resp.ok) {
      record('pass', table, 'Cross-user UPDATE blocked', `HTTP ${resp.status}`);
    } else {
      record('critical', table, 'Cross-user UPDATE succeeded', 'RLS insufficient for UPDATE');
    }
  }
}

async function checkBookingsIsolation(userA) {
  const table = 'bookings';
  const aAll = await query(table, USER_A_JWT, 'select=id,user_id&limit=100');
  if (!aAll.ok) {
    record('warn', table, 'User A read bookings failed', `HTTP ${aAll.status}`);
    return;
  }
  const leaked = (aAll.rows || []).filter((r) => r.user_id && r.user_id !== userA.id);
  if (leaked.length === 0) {
    record('pass', table, 'Only own bookings visible', `${aAll.rows.length} rows`);
  } else {
    record('critical', table, 'LEAK bookings', `${leaked.length} foreign bookings`);
  }
}

async function checkVetClinicalNotesRestricted(userA) {
  const table = 'vet_clinical_notes';
  const aAll = await query(table, USER_A_JWT, 'select=id,provider_id&limit=100');
  if (!aAll.ok) {
    record('pass', table, 'Notes restricted (not a vet, read denied)', `HTTP ${aAll.status}`);
    return;
  }
  if (aAll.rows.length === 0) {
    record('pass', table, 'No notes visible (user A is not a vet)', '0 rows');
  } else {
    record('warn', table, 'Notes visible to non-vet user', `${aAll.rows.length} rows — verify intent (owner of pet should see notes)`);
  }
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────

async function main() {
  console.log('\n=== RLS AUDIT — Paw Friend ===\n');

  const [userA, userB] = await Promise.all([
    userFromJwt(USER_A_JWT),
    userFromJwt(USER_B_JWT),
  ]);

  if (!userA || !userB) {
    console.error('[RLS Audit] No se pudo resolver alguno de los users. Verifica JWTs.');
    process.exit(2);
  }

  if (userA.id === userB.id) {
    console.error('[RLS Audit] User A y User B tienen el mismo ID. Usa 2 cuentas distintas.');
    process.exit(2);
  }

  console.log(`User A: ${userA.email} (${userA.id})`);
  console.log(`User B: ${userB.email} (${userB.id})`);
  console.log('');

  await checkPetsIsolation(userA, userB);
  await checkMedicalRecordsIsolation(userA, userB);
  await checkShareTokensIsolation(userA);
  await checkRemindersIsolation(userA);
  await checkDonationsIsolation(userA);
  await checkBookingsIsolation(userA);
  await checkPitchApplicationsIsolation(userA);
  await checkPawCompanysPublicOnly(userA);
  await checkAdoptionCentersPublicRead(userA);
  await checkVetClinicalNotesRestricted(userA);

  // Summary
  const critical = findings.filter((f) => f.severity === 'critical').length;
  const warnings = findings.filter((f) => f.severity === 'warn').length;
  const passed = findings.filter((f) => f.severity === 'pass').length;

  console.log('\n=== SUMMARY ===');
  console.log(`✅ Passed:   ${passed}`);
  console.log(`⚠️  Warnings: ${warnings}`);
  console.log(`🚨 Critical: ${critical}`);

  // Write report
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '_');
  const reportPath = join(REPO_ROOT, 'audits', `RLS_AUDIT_${today}.md`);
  const report = buildReport(userA, userB, passed, warnings, critical);
  writeFileSync(reportPath, report, 'utf-8');
  console.log(`\nReport: audits/RLS_AUDIT_${today}.md`);

  if (critical > 0) {
    console.log('\n🚨 CRITICAL issues found — revisar inmediatamente.');
    process.exit(1);
  }
  if (warnings > 0) {
    console.log('\n⚠️  Warnings found — revisar cuando sea posible.');
  }
  process.exit(0);
}

function buildReport(userA, userB, passed, warnings, critical) {
  const lines = [];
  lines.push('# RLS Audit — Paw Friend');
  lines.push('');
  lines.push(`> Generado: ${new Date().toISOString()}`);
  lines.push(`> Origen: INIT-22 del Plan de Éxito 90 días.`);
  lines.push(`> Script: \`scripts/rls-audit.mjs\``);
  lines.push('');
  lines.push('## Setup');
  lines.push(`- User A: ${userA.email} (${userA.id})`);
  lines.push(`- User B: ${userB.email} (${userB.id})`);
  lines.push('');
  lines.push('## Summary');
  lines.push(`| Severity | Count |`);
  lines.push(`|---|---|`);
  lines.push(`| ✅ Passed | ${passed} |`);
  lines.push(`| ⚠️ Warnings | ${warnings} |`);
  lines.push(`| 🚨 Critical | ${critical} |`);
  lines.push('');
  lines.push('## Findings');
  lines.push('');
  lines.push('| Severity | Table | Check | Detail |');
  lines.push('|---|---|---|---|');
  for (const f of findings) {
    const marker = f.severity === 'pass' ? '✅' : f.severity === 'warn' ? '⚠️' : '🚨';
    lines.push(`| ${marker} ${f.severity} | \`${f.table}\` | ${f.check} | ${f.detail} |`);
  }
  lines.push('');
  if (critical > 0) {
    lines.push('## 🚨 Acción inmediata requerida');
    lines.push('');
    lines.push('Tablas con leaks críticos arriba. Revisar políticas RLS en Supabase Dashboard → Authentication → Policies.');
    lines.push('');
  }
  return lines.join('\n');
}

main().catch((err) => {
  console.error('[RLS Audit] Error:', err);
  process.exit(3);
});
