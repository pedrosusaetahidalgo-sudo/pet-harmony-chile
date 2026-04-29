/**
 * test-petify-multi.mjs — Variante del test que registra 3 fotos por pet
 * para evaluar si la robustez mejora vs el test single-photo.
 *
 * Diferencia con test-petify.mjs:
 *   - Register: usa fotos [0], [1], [2] (3 fingerprints en la misma session).
 *   - Identify: usa foto [3] (la 4ta, distinta de las 3 registradas).
 *   - Pets con <4 fotos se omiten.
 *
 * Uso:
 *   $env:PETIFY_API_KEY = "tu-key"
 *   node scripts/test-petify-multi.mjs
 *
 * Compara los resultados con scripts/petify-test-results-*.json (single foto)
 * para medir el delta de mejora.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

const API_KEY = process.env.PETIFY_API_KEY;
const BASE_URL = process.env.PETIFY_BASE_URL ?? 'https://api.stage-b2b.petnow.io';
const PHOTOS_DIR = path.resolve(process.cwd(), '_pending', 'nose_print_test_photos');
const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 60_000;
const PHOTOS_PER_REGISTRATION = 3;
const TEST_TAG = `pawfriend-multi-${Date.now()}`;

if (!API_KEY) {
  console.error('❌ Falta PETIFY_API_KEY.');
  process.exit(1);
}

async function petify(method, pathSeg, opts = {}) {
  const url = `${BASE_URL}${pathSeg}`;
  const headers = { 'x-petnow-api-key': API_KEY, ...(opts.headers ?? {}) };
  if (opts.json !== undefined) headers['Content-Type'] = 'application/json';
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
  if (!res.ok) throw new Error(`${method} ${pathSeg} → ${res.status}: ${text.slice(0, 500)}`);
  return json;
}

async function createSession(species, purpose, petId) {
  const body = { species, purpose };
  if (petId) body.petId = petId;
  const result = await petify('POST', '/v2/capture-sessions', { json: body });
  const sessionId = result?.data?.id;
  if (!sessionId) throw new Error(`session no devolvio id: ${JSON.stringify(result).slice(0, 200)}`);
  return sessionId;
}

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
  if (!res.ok) throw new Error(`upload → ${res.status}: ${text.slice(0, 500)}`);
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
  throw new Error(`Job ${jobEndpoint} timed out`);
}

async function loadPhotoGroups() {
  const dirs = await fs.readdir(PHOTOS_DIR, { withFileTypes: true });
  const groups = [];
  for (const d of dirs) {
    if (!d.isDirectory()) continue;
    const key = d.name;
    const species = key.startsWith('mi_gato') ? 'CAT' : 'DOG';
    const subDir = path.join(PHOTOS_DIR, key);
    const files = (await fs.readdir(subDir))
      .filter((f) => /\.(jpe?g|png)$/i.test(f))
      .sort()
      .map((f) => path.join(subDir, f));
    if (files.length < PHOTOS_PER_REGISTRATION + 1) {
      console.log(
        `⚠️  ${key} tiene ${files.length} fotos, mínimo ${PHOTOS_PER_REGISTRATION + 1}. Omitido.`
      );
      continue;
    }
    groups.push({ key, species, photos: files });
  }
  return groups;
}

/**
 * Registra una mascota con 3 fingerprints en una misma session.
 */
async function registerPetMulti(group) {
  console.log(`\n📥 Register: ${group.key} (${group.species}) — ${PHOTOS_PER_REGISTRATION} fotos`);

  // 1. Crear pet.
  const created = await petify('POST', '/v2/pets', {
    json: {
      species: group.species,
      breed: group.key,
      metadata: JSON.stringify({ pawfriendKey: group.key, tag: TEST_TAG }),
    },
  });
  const petifyPetId = created?.data?.id;
  if (!petifyPetId) throw new Error(`pets POST sin id`);
  console.log(`   ✓ pet creado petifyPetId=${petifyPetId}`);

  // 2. Una session para registro.
  const sessionId = await createSession(group.species, 'PET_PROFILE_REGISTRATION', petifyPetId);
  console.log(`   ✓ session ${sessionId}`);

  // 3. Subir 3 fotos a la misma session.
  for (let i = 0; i < PHOTOS_PER_REGISTRATION; i++) {
    const photo = group.photos[i];
    await uploadFingerprint(sessionId, photo);
    console.log(`   ✓ upload [${i + 1}/${PHOTOS_PER_REGISTRATION}] ${path.basename(photo)}`);
  }

  // 4. Attachar la session (procesa los 3 fingerprints).
  const addReq = await petify('POST', `/v2/pets/${petifyPetId}:addFingerprints`, {
    json: { sessionId },
  });
  const jobId = addReq?.data?.jobId;
  console.log(`   ⏳ procesando 3 fingerprints (jobId=${jobId})`);
  const jobResult = await pollJob(`/v2/fingerprint-addition-jobs/${jobId}`);
  const status = jobResult?.data?.status;
  if (status !== 'SUCCESS') {
    throw new Error(`fingerprint job no exitoso: ${JSON.stringify(jobResult).slice(0, 300)}`);
  }
  console.log(`   ✓ 3 fingerprints procesados`);
  return { petifyPetId };
}

/**
 * Identifica usando la 4ta foto (distinta de las 3 registradas).
 */
async function identifyPet(group) {
  const photo = group.photos[PHOTOS_PER_REGISTRATION]; // [3] = 4ta foto
  console.log(`\n🔍 Identify: ${group.key} usando ${path.basename(photo)} (foto #${PHOTOS_PER_REGISTRATION + 1})`);

  const sessionId = await createSession(group.species, 'PET_IDENTIFICATION');
  await uploadFingerprint(sessionId, photo);

  const identify = await petify('POST', '/v2/pets:identify', { json: { sessionId } });
  const jobId = identify?.data?.jobId;
  console.log(`   ⏳ identificando (jobId=${jobId})`);
  const jobResult = await pollJob(`/v2/identification-jobs/${jobId}`);
  return jobResult?.data?.pets ?? [];
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

async function main() {
  console.log(`🐾 Test Petify MULTI-FOTO (${PHOTOS_PER_REGISTRATION} por pet)`);
  console.log(`   Endpoint: ${BASE_URL}\n`);

  const groups = await loadPhotoGroups();
  console.log(`Grupos válidos (>=4 fotos): ${groups.length}`);
  for (const g of groups) {
    console.log(`  - ${g.key} (${g.species}, ${g.photos.length} fotos disponibles)`);
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`FASE 1: REGISTER MULTI (${PHOTOS_PER_REGISTRATION} fotos por pet)`);
  console.log('═'.repeat(60));
  const registered = {};
  for (const g of groups) {
    try {
      registered[g.key] = await registerPetMulti(g);
    } catch (e) {
      console.error(`   ❌ register ${g.key} fallo: ${e.message}`);
      registered[g.key] = { error: e.message };
    }
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log('FASE 2: IDENTIFY (4ta foto distinta de las 3 registradas)');
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
      console.log(`   top1: ${top1?.score} | selfMatch: ${selfMatch?.score ?? 'NO'} | OK=${ok}`);
      results.push({
        key: g.key,
        species: g.species,
        ok,
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

  console.log(`\n${'═'.repeat(60)}`);
  console.log('FASE 3: CLEANUP');
  console.log('═'.repeat(60));
  let cleaned = 0;
  for (const g of groups) {
    if (registered[g.key]?.petifyPetId) {
      const ok = await deletePet(registered[g.key].petifyPetId);
      if (ok) cleaned++;
    }
  }
  console.log(`   ${cleaned}/${Object.keys(registered).length} eliminadas`);

  console.log(`\n${'═'.repeat(60)}`);
  console.log('RESUMEN MULTI-FOTO');
  console.log('═'.repeat(60));
  console.log('Mascota              | OK  | top score | self score | gap');
  console.log('-'.repeat(70));
  for (const r of results) {
    if (r.error) {
      console.log(`${r.key.padEnd(20)} | ERR | ${r.error}`);
      continue;
    }
    const ok = r.ok ? '✓' : '✗';
    const gap = r.topScore != null && r.confusedScore != null ? r.topScore - r.confusedScore : '-';
    console.log(
      `${r.key.padEnd(20)} | ${ok}   | ${String(r.topScore ?? '-').padEnd(9)} | ${String(r.selfScore ?? '-').padEnd(10)} | ${gap}`
    );
  }
  const okCount = results.filter((r) => r.ok).length;
  console.log(`\nTop-1 accuracy MULTI-FOTO: ${okCount}/${results.length}`);

  const outFile = path.join('scripts', `petify-multi-results-${Date.now()}.json`);
  await fs.writeFile(
    outFile,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        photosPerRegistration: PHOTOS_PER_REGISTRATION,
        baseUrl: BASE_URL,
        tag: TEST_TAG,
        registered,
        results,
        summary: { ok: okCount, total: results.length },
      },
      null,
      2
    )
  );
  console.log(`\n💾 Resultados: ${outFile}`);
}

main().catch((e) => {
  console.error(`\n❌ ${e.message}`);
  console.error(e.stack);
  process.exit(1);
});
