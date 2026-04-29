/**
 * test-petify.mjs — Smoke test del modelo biometrico de Petify (PetNow).
 *
 * Prueba que tan bueno es Petify para distinguir entre nuestras mascotas
 * de prueba. Usa las fotos en `_pending/nose_print_test_photos/`.
 *
 * Plan del test:
 *   1. Por cada mascota (8 grupos en _pending/nose_print_test_photos):
 *      - Toma la 1ra foto → la registra en Petify (POST /v1/fingerprints:upload
 *        + POST /v1/pets + POST /v1/pets/{petId}:addFingerprints + poll job).
 *   2. Por cada mascota:
 *      - Toma la 2da foto distinta → la identifica (POST /v1/fingerprints:upload
 *        + POST /v1/pets:identify + poll job).
 *      - Verifica que el top-1 sea la misma mascota y reporta el score.
 *      - Verifica que el siguiente perro de la misma raza tenga score MENOR.
 *   3. Imprime tabla:
 *      - Mascota | self-match-score | confused-with | confused-score | OK?
 *
 * Uso:
 *   $env:PETIFY_API_KEY = "tu-key"
 *   node scripts/test-petify.mjs
 *
 * Default contra staging (api.stage-b2b.petnow.io). Para correr contra prod:
 *   $env:PETIFY_BASE_URL = "https://api.b2b.petnow.io"
 *
 * Output:
 *   - Cada paso loggeado a stdout.
 *   - Resumen al final + summary JSON guardado en
 *     `scripts/petify-test-results-<timestamp>.json` para comparar con futuras
 *     corridas o con nuestro pipeline DINOv2 in-house.
 *
 * Cleanup:
 *   El script intenta DELETE /v1/pets/{petId} al final para no contaminar
 *   la base de Petify. Si falla, los pets quedan registrados con metadata
 *   `pawfriend-test:<timestamp>` para que Pedro pueda eliminarlos manualmente.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

// ── Config ───────────────────────────────────────────────────────────────
const API_KEY = process.env.PETIFY_API_KEY;
const BASE_URL = process.env.PETIFY_BASE_URL ?? 'https://api.stage-b2b.petnow.io';
const PHOTOS_DIR = path.resolve(process.cwd(), '_pending', 'nose_print_test_photos');
const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 60_000;
const TEST_TAG = `pawfriend-test-${Date.now()}`;

if (!API_KEY) {
  console.error('❌ Falta PETIFY_API_KEY.');
  console.error('   PowerShell: $env:PETIFY_API_KEY = "tu-key"');
  console.error('   Bash:       export PETIFY_API_KEY=tu-key');
  process.exit(1);
}

// ── HTTP helpers ─────────────────────────────────────────────────────────
async function petify(method, pathSeg, opts = {}) {
  const url = `${BASE_URL}${pathSeg}`;
  const headers = {
    'x-petnow-api-key': API_KEY,
    ...(opts.headers ?? {}),
  };
  if (opts.json !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(url, {
    method,
    headers,
    body: opts.json !== undefined ? JSON.stringify(opts.json) : opts.body,
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { _raw: text };
  }
  if (!res.ok) {
    throw new Error(`${method} ${pathSeg} → ${res.status}: ${text.slice(0, 500)}`);
  }
  return json;
}

/**
 * Crea una capture-session V2 (necesaria antes de cualquier upload).
 * purpose: 'PET_PROFILE_REGISTRATION' | 'PET_VERIFICATION' | 'PET_IDENTIFICATION'
 * species: 'DOG' | 'CAT'
 */
async function createSession(species, purpose, petId) {
  const body = { species, purpose };
  if (petId) body.petId = petId; // requerido para verification
  const result = await petify('POST', '/v2/capture-sessions', { json: body });
  const sessionId = result?.data?.id ?? result?.data?.sessionId;
  if (!sessionId)
    throw new Error(`capture-session no devolvio id: ${JSON.stringify(result).slice(0, 200)}`);
  return sessionId;
}

/**
 * Sube imagen a una capture-session existente.
 * V2 multipart: solo `file` en el body, sessionId en query.
 */
async function uploadFingerprint(sessionId, filePath) {
  const buffer = await fs.readFile(filePath);
  const blob = new Blob([buffer], { type: 'image/jpeg' });
  const form = new FormData();
  form.append('file', blob, path.basename(filePath));
  const res = await fetch(`${BASE_URL}/v2/fingerprints:upload?sessionId=${sessionId}`, {
    method: 'POST',
    headers: { 'x-petnow-api-key': API_KEY },
    body: form,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`upload → ${res.status}: ${text.slice(0, 500)}`);
  }
  return JSON.parse(text);
}

async function pollJob(jobEndpoint) {
  const start = Date.now();
  while (Date.now() - start < POLL_TIMEOUT_MS) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    const result = await petify('GET', jobEndpoint);
    const status = result?.data?.status ?? result?.status;
    if (status === 'SUCCESS' || status === 'FAILED') return result;
  }
  throw new Error(`Job ${jobEndpoint} timed out after ${POLL_TIMEOUT_MS / 1000}s`);
}

// ── Test logic ───────────────────────────────────────────────────────────

/**
 * Lee carpetas de fotos. Retorna {petKey, species, photos[]}.
 * Mapea nombre de carpeta → species:
 *   border_collie_*, pastor_suizo_*, terrier_* → 'dog'
 *   mi_gato → 'cat'
 */
async function loadPhotoGroups() {
  const dirs = await fs.readdir(PHOTOS_DIR, { withFileTypes: true });
  const groups = [];
  for (const d of dirs) {
    if (!d.isDirectory()) continue;
    const key = d.name;
    // V2 PetSpeciesEnum: 'DOG' | 'CAT' (mayusculas).
    const species = key.startsWith('mi_gato') ? 'CAT' : 'DOG';
    const subDir = path.join(PHOTOS_DIR, key);
    const files = (await fs.readdir(subDir))
      .filter((f) => /\.(jpe?g|png)$/i.test(f))
      .sort()
      .map((f) => path.join(subDir, f));
    if (files.length < 2) {
      console.log(`⚠️  ${key} solo tiene ${files.length} foto, salto (mínimo 2 para test).`);
      continue;
    }
    groups.push({ key, species, photos: files });
  }
  return groups;
}

/**
 * Registra una mascota: sube foto, crea pet, attacha fingerprint.
 * Retorna { petifyPetId, fileId }.
 */
async function registerPet(group) {
  const photo = group.photos[0]; // 1ra foto
  console.log(`\n📥 Register: ${group.key} (${group.species})`);
  console.log(`   foto: ${path.basename(photo)}`);

  // 1. Crear pet PRIMERO (PET_PROFILE_REGISTRATION session necesita petId).
  const created = await petify('POST', '/v2/pets', {
    json: {
      species: group.species,
      breed: group.key,
      metadata: JSON.stringify({ pawfriendKey: group.key, tag: TEST_TAG }),
    },
  });
  const petifyPetId = created?.data?.id;
  if (!petifyPetId)
    throw new Error(`pets POST no devolvio id: ${JSON.stringify(created).slice(0, 200)}`);
  console.log(`   ✓ pet creado petifyPetId=${petifyPetId}`);

  // 2. Crear capture-session DE REGISTRO (requiere petId).
  const sessionId = await createSession(group.species, 'PET_PROFILE_REGISTRATION', petifyPetId);
  console.log(`   ✓ session creada (${sessionId})`);

  // 3. Subir imagen a la session.
  await uploadFingerprint(sessionId, photo);
  console.log(`   ✓ upload OK`);

  // 4. Attachar fingerprint al pet.
  const addReq = await petify('POST', `/v2/pets/${petifyPetId}:addFingerprints`, {
    json: { sessionId },
  });
  const jobId = addReq?.data?.jobId;
  if (!jobId) throw new Error(`addFingerprints no devolvio jobId`);
  console.log(`   ⏳ procesando fingerprint (jobId=${jobId})`);
  const jobResult = await pollJob(`/v2/fingerprint-addition-jobs/${jobId}`);
  const status = jobResult?.data?.status;
  if (status !== 'SUCCESS') {
    throw new Error(`fingerprint job no exitoso: ${JSON.stringify(jobResult).slice(0, 300)}`);
  }
  console.log(`   ✓ fingerprint procesado`);
  return { petifyPetId, sessionId };
}

/**
 * Identifica una mascota usando una foto distinta (la 2da).
 * Retorna [{ id, score, metadata }].
 */
async function identifyPet(group) {
  const photo = group.photos[1]; // 2da foto distinta
  console.log(`\n🔍 Identify: ${group.key} usando ${path.basename(photo)}`);

  // V2: nueva session para identificar.
  const sessionId = await createSession(group.species, 'PET_IDENTIFICATION');
  await uploadFingerprint(sessionId, photo);
  console.log(`   ✓ upload OK (session=${sessionId})`);

  const identify = await petify('POST', '/v2/pets:identify', {
    json: { sessionId },
  });
  const jobId = identify?.data?.jobId;
  console.log(`   ⏳ identificando (jobId=${jobId})`);
  const jobResult = await pollJob(`/v2/identification-jobs/${jobId}`);
  const pets = jobResult?.data?.pets ?? [];
  return pets;
}

async function deletePet(petifyPetId) {
  try {
    await petify('DELETE', `/v2/pets/${petifyPetId}`);
    return true;
  } catch (e) {
    console.log(`   ⚠️  cleanup ${petifyPetId} fallo: ${e.message}`);
    return false;
  }
}

// ── Main ─────────────────────────────────────────────────────────────────
async function main() {
  console.log(`🐾 Test Petify (PetNow)`);
  console.log(`   Endpoint: ${BASE_URL}`);
  console.log(`   Photos:   ${PHOTOS_DIR}`);
  console.log(`   Tag:      ${TEST_TAG}\n`);

  const groups = await loadPhotoGroups();
  console.log(`Encontre ${groups.length} grupos de mascotas:`);
  for (const g of groups) {
    console.log(`  - ${g.key} (${g.species}, ${g.photos.length} fotos)`);
  }

  // Fase 1: registrar todos
  console.log(`\n${'═'.repeat(60)}`);
  console.log('FASE 1: REGISTER (1 foto por mascota)');
  console.log('═'.repeat(60));
  const registered = {};
  for (const g of groups) {
    try {
      registered[g.key] = await registerPet(g);
    } catch (e) {
      console.error(`   ❌ register ${g.key} fallo: ${e.message}`);
      registered[g.key] = { error: e.message };
    }
  }

  // Fase 2: identificar cada uno con foto distinta
  console.log(`\n${'═'.repeat(60)}`);
  console.log('FASE 2: IDENTIFY (2da foto distinta)');
  console.log('═'.repeat(60));
  const results = [];
  for (const g of groups) {
    if (registered[g.key]?.error) {
      results.push({ key: g.key, error: 'no registrado' });
      continue;
    }
    try {
      const pets = await identifyPet(g);
      const expectedId = registered[g.key].petifyPetId;
      const top1 = pets[0];
      const selfMatch = pets.find((p) => p.id === expectedId);
      const confused = pets.find((p) => p.id !== expectedId);
      const ok = top1?.id === expectedId;
      console.log(`   top1: ${top1?.id} score=${top1?.score} | selfMatch: ${selfMatch?.score ?? 'NO'} | OK=${ok}`);
      results.push({
        key: g.key,
        species: g.species,
        ok,
        topId: top1?.id,
        topScore: top1?.score,
        selfScore: selfMatch?.score,
        confusedWith: confused?.id,
        confusedScore: confused?.score,
        rawPets: pets,
      });
    } catch (e) {
      console.error(`   ❌ identify ${g.key} fallo: ${e.message}`);
      results.push({ key: g.key, error: e.message });
    }
  }

  // Fase 3: cleanup
  console.log(`\n${'═'.repeat(60)}`);
  console.log('FASE 3: CLEANUP');
  console.log('═'.repeat(60));
  let cleanedCount = 0;
  for (const g of groups) {
    if (registered[g.key]?.petifyPetId) {
      const ok = await deletePet(registered[g.key].petifyPetId);
      if (ok) cleanedCount++;
    }
  }
  console.log(`   ${cleanedCount}/${Object.keys(registered).length} mascotas eliminadas.`);

  // Resumen
  console.log(`\n${'═'.repeat(60)}`);
  console.log('RESUMEN');
  console.log('═'.repeat(60));
  console.log('Mascota              | OK  | top score | self score | confundido con');
  console.log('-'.repeat(80));
  for (const r of results) {
    if (r.error) {
      console.log(`${r.key.padEnd(20)} | ERR | ${r.error}`);
      continue;
    }
    const ok = r.ok ? '✓' : '✗';
    console.log(
      `${r.key.padEnd(20)} | ${ok}   | ${String(r.topScore ?? '-').padEnd(9)} | ${String(r.selfScore ?? '-').padEnd(10)} | ${r.confusedWith ?? '-'}`
    );
  }
  const okCount = results.filter((r) => r.ok).length;
  const errCount = results.filter((r) => r.error).length;
  console.log(
    `\nResultado: ${okCount}/${results.length} mascotas matchearon consigo mismas (${errCount} errores).`
  );

  // Save JSON
  const outFile = path.join('scripts', `petify-test-results-${Date.now()}.json`);
  await fs.writeFile(
    outFile,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        baseUrl: BASE_URL,
        tag: TEST_TAG,
        registered,
        results,
        summary: {
          ok: okCount,
          total: results.length,
          errors: errCount,
        },
      },
      null,
      2
    )
  );
  console.log(`\n💾 Resultados completos: ${outFile}`);
}

main().catch((e) => {
  console.error(`\n❌ Test interrumpido: ${e.message}`);
  console.error(e.stack);
  process.exit(1);
});
