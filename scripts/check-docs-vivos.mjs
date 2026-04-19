#!/usr/bin/env node
/**
 * Hook PostToolUse — recordatorio de docs vivos.
 *
 * Lee el payload de Claude Code por stdin y, si el archivo editado es un
 * "dueño" listado en docs-vivos/README.md, emite un aviso stderr sugiriendo
 * actualizar el doc correspondiente. Es un recordatorio soft: no bloquea
 * el commit, sólo empuja a mantener la documentación viva en sincronía.
 *
 * Instalado en .claude/settings.json como hook de Edit/Write/MultiEdit.
 * Ver docs-vivos/README.md para el contrato.
 */

import { readFileSync } from 'node:fs';

/** @type {Array<{re: RegExp, doc: string}>} */
const OWNERS = [
  {
    re: /src[\\/]App\.tsx$/,
    doc: 'diagrams/FLUJO_COMPLETO.mmd + MAPA_FUNCIONAL_COMPLETO.md + INVENTARIO_APP_2026_04_17.md',
  },
  {
    re: /src[\\/]components[\\/](BottomTabBar|AppSidebar|Header)\.tsx$/,
    doc: 'diagrams/FLUJO_COMPLETO.mmd + MAPA_FUNCIONAL_COMPLETO.md',
  },
  {
    re: /src[\\/]lib[\\/]featureFlags\.ts$/,
    doc: 'CLAUDE.md §11 (estado de flags)',
  },
  {
    re: /src[\\/]lib[\\/]plans\.ts$/,
    doc: 'public/pitch/*.html (pricing vet + tiers Paw Companys) + CLAUDE.md §5',
  },
  {
    re: /src[\\/]pages[\\/](PawCore|PawVoices|PawCompanys)\.tsx$/,
    doc: 'public/pitch/*.html (mantener consistencia con copy público)',
  },
  {
    re: /src[\\/]lib[\\/]links\.ts$/,
    doc: 'diagrams/FLUJO_COMPLETO.mmd (si cambiaste semántica de ruta)',
  },
  {
    re: /src[\\/]pages[\\/][^\\/]+\.tsx$/,
    doc: 'MAPA_FUNCIONAL_COMPLETO.md (si es página nueva o cambia contrato)',
  },
  {
    re: /supabase[\\/]functions[\\/][^\\/]+[\\/]index\.ts$/,
    doc: 'CLAUDE.md §6 + MAPA_FUNCIONAL_COMPLETO.md (si cambia contrato público)',
  },
  {
    re: /supabase[\\/]migrations[\\/]/,
    doc: 'MAPA_FUNCIONAL_COMPLETO.md (migración con cambio de esquema/contrato)',
  },
];

try {
  const raw = readFileSync(0, 'utf8');
  if (!raw) process.exit(0);
  const payload = JSON.parse(raw);
  const filePath = payload?.tool_input?.file_path || '';
  if (!filePath) process.exit(0);

  const match = OWNERS.find((o) => o.re.test(filePath));
  if (match) {
    process.stderr.write(
      `\n📘 docs-vivos: tocaste ${filePath}.\n` +
        `   Verificá si hace falta actualizar: ${match.doc}\n` +
        `   Ver docs-vivos/README.md para el contrato.\n\n`
    );
  }
} catch {
  // Si algo falla (payload no-JSON, stdin vacío, etc.), salimos en silencio.
  // El hook nunca debe romper el flujo de edición.
}

process.exit(0);
