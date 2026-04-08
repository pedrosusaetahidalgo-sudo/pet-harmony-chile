#!/usr/bin/env node
/**
 * scripts/seed-demo.mjs
 *
 * Pobla la base de datos de Paw Friend con ~100 usuarios demo, mascotas,
 * fichas médicas, proveedores de servicios, reseñas y actividad social.
 *
 * Objetivo: que la app se vea "viva" para demos sin tener que crear datos
 * a mano y, de paso, descubrir tablas / FKs / RLS faltantes.
 *
 * USO:
 *   1. Crear .env.demo.local en la raíz con:
 *        SUPABASE_URL=https://gwailbjlvevkhwcrovfd.supabase.co
 *        SUPABASE_SERVICE_ROLE_KEY=<service_role_key>   # NUNCA commitear
 *   2. node --env-file=.env.demo.local scripts/seed-demo.mjs
 *      o con --reset para borrar primero todos los demos:
 *      node --env-file=.env.demo.local scripts/seed-demo.mjs --reset
 *
 * REQUISITOS PREVIOS:
 *   - Aplicar migración supabase/migrations/99999999000000_demo_seed_flag.sql
 *     en el Dashboard SQL Editor antes de correr este script.
 *
 * GARANTÍAS:
 *   - Todos los users tienen email @demo.pawfriend.cl y nombre "* Demo"
 *   - profiles.is_demo = true en todos los seed
 *   - Idempotente vía email check (skip si ya existe)
 *   - --reset borra todo demo antes vía cascade en auth.users
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("[seed-demo] Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el env.");
  console.error("           Crea .env.demo.local y corre con: node --env-file=.env.demo.local scripts/seed-demo.mjs");
  process.exit(1);
}

const RESET = process.argv.includes("--reset");
const DEMO_DOMAIN = "@demo.pawfriend.cl";
const DEMO_PASSWORD = "Demo1234!";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ============================================================================
// Datos de muestra (chilenos, en español neutral chileno)
// ============================================================================

const NOMBRES = [
  "Camila", "Joaquín", "Constanza", "Matías", "Javiera", "Benjamín", "Antonia",
  "Cristóbal", "Valentina", "Vicente", "Catalina", "Sebastián", "Isidora",
  "Diego", "Florencia", "Tomás", "Martina", "Felipe", "Emilia", "Gabriel",
  "Sofía", "Nicolás", "Amanda", "Agustín", "Renata", "Maximiliano", "Trinidad",
  "Lucas", "Magdalena", "Bastián", "Fernanda", "Ignacio", "Josefa", "Pablo",
  "Rafaela", "Alonso", "Anaïs", "Esteban", "Bárbara", "Andrés", "Paulina",
  "Rodrigo", "Pía", "Cristián", "Daniela", "Jorge", "Carolina", "Manuel",
  "Macarena", "Eduardo",
];
const APELLIDOS = [
  "Soto", "Rojas", "Muñoz", "Pérez", "Vargas", "González", "Fernández",
  "Aravena", "Tapia", "Carrasco", "Espinoza", "Bravo", "Reyes", "Sandoval",
  "Cáceres", "Henríquez", "Sepúlveda", "Lagos", "Bustamante", "Núñez",
  "Castillo", "Morales", "Cortés", "Maldonado", "Salinas", "Riquelme",
  "Allende", "Pizarro", "Saavedra", "Cisternas",
];
const COMUNAS_RM = [
  "Providencia", "Ñuñoa", "Las Condes", "La Reina", "Vitacura", "Santiago",
  "Maipú", "La Florida", "Peñalolén", "Macul", "San Miguel", "Recoleta",
  "Independencia", "Quilicura", "Puente Alto",
];
const REGIONES = [
  { region: "RM", ciudad: "Santiago", peso: 60, lat: -33.45, lng: -70.66 },
  { region: "Valparaíso", ciudad: "Viña del Mar", peso: 15, lat: -33.02, lng: -71.55 },
  { region: "Biobío", ciudad: "Concepción", peso: 10, lat: -36.83, lng: -73.05 },
  { region: "Araucanía", ciudad: "Temuco", peso: 10, lat: -38.74, lng: -72.59 },
  { region: "Antofagasta", ciudad: "Antofagasta", peso: 5, lat: -23.65, lng: -70.40 },
];

const NOMBRES_PERROS = [
  "Luna", "Toby", "Max", "Rocky", "Coco", "Bella", "Lola", "Simba", "Nala",
  "Pelusa", "Negro", "Princesa", "Pancho", "Chocolate", "Manchas", "Bruno",
  "Daisy", "Zeus", "Thor", "Mocha", "Trufa", "Capitán", "Lulú", "Tomás",
];
const NOMBRES_GATOS = [
  "Michi", "Whiskas", "Garfield", "Pipo", "Mishka", "Felix", "Tigre",
  "Misha", "Kira", "Pelusa", "Snowy", "Ragnar", "Sushi", "Mochi",
];
const RAZAS_PERROS = [
  "Mestizo", "Quiltro", "Labrador", "Golden Retriever", "Bulldog Francés",
  "Beagle", "Poodle", "Pastor Alemán", "Husky Siberiano", "Schnauzer",
  "Cocker Spaniel", "Border Collie", "Yorkshire", "Chihuahua",
];
const RAZAS_GATOS = [
  "Mestizo", "Persa", "Siamés", "Ragdoll", "Maine Coon", "Bombay", "Común europeo",
];

const VACUNAS_PERROS = [
  "Séxtuple canina", "Antirrábica", "Bordetella", "Leptospirosis", "Parvovirus",
];
const VACUNAS_GATOS = [
  "Triple felina", "Antirrábica", "Leucemia felina", "Calicivirus",
];

const RESEÑAS = [
  "Súper amable, mi perro quedó regio 🐶",
  "Excelente atención, muy recomendado",
  "La mejor experiencia, volveremos sin duda",
  "Muy profesional y cariñoso con la mascota",
  "Atención 10/10, mi gato quedó tranquilo",
  "Precios justos y servicio impecable",
  "Llegaron puntuales y trataron muy bien a Toby",
  "Muy buena onda, mi perrita salió feliz",
];

const SERVICIOS = [
  { type: "veterinarian", count: 8, label: "Veterinaria" },
  { type: "grooming", count: 3, label: "Peluquería canina" },
  { type: "dog_walker", count: 2, label: "Paseador" },
  { type: "trainer", count: 2, label: "Adiestrador" },
];

// ============================================================================
// Helpers
// ============================================================================

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const chance = (pct) => Math.random() * 100 < pct;
const slugify = (str) =>
  str.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "");

function pickRegion() {
  const total = REGIONES.reduce((s, r) => s + r.peso, 0);
  let n = Math.random() * total;
  for (const r of REGIONES) { n -= r.peso; if (n <= 0) return r; }
  return REGIONES[0];
}

function fullName(i) {
  return `${rand(NOMBRES)} ${rand(APELLIDOS)} ${rand(APELLIDOS)} Demo`;
}

function emailFor(name, i) {
  return `${slugify(name.replace(/ Demo$/, ""))}.${i}${DEMO_DOMAIN}`;
}

function dateMonthsAgo(months) {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString().slice(0, 10);
}

function isoDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

async function safeInsert(table, rows, label = table) {
  if (!rows || rows.length === 0) return;
  const { error } = await supabase.from(table).insert(rows);
  if (error) {
    console.warn(`[seed-demo] WARN insertando en ${label}:`, error.message);
  }
}

// ============================================================================
// RESET (opcional)
// ============================================================================

async function resetDemos() {
  console.log("[seed-demo] --reset: borrando users demo existentes...");
  // Listar users via auth admin y borrar los del dominio demo
  let page = 1;
  let totalDeleted = 0;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) { console.error("listUsers:", error.message); break; }
    if (!data || data.users.length === 0) break;
    for (const u of data.users) {
      if (u.email && u.email.endsWith(DEMO_DOMAIN)) {
        const { error: delErr } = await supabase.auth.admin.deleteUser(u.id);
        if (!delErr) totalDeleted++;
      }
    }
    if (data.users.length < 1000) break;
    page++;
  }
  console.log(`[seed-demo] borrados ${totalDeleted} users demo.`);
}

// ============================================================================
// Crear un user + profile
// ============================================================================

async function createDemoUser(i, opts = {}) {
  const name = fullName(i);
  const email = emailFor(name, i);
  const region = pickRegion();
  const isPremium = opts.isPremium ?? chance(20);
  const isGrandfathered = opts.isGrandfathered ?? false;

  // Crear via admin API
  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: name, demo: true },
  });
  if (createErr) {
    if (createErr.message?.includes("already")) {
      // ya existe, fetch
      const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
      const existing = list?.users.find((u) => u.email === email);
      if (existing) return { id: existing.id, name, email, region, isPremium };
    }
    console.warn(`[seed-demo] no se pudo crear ${email}:`, createErr.message);
    return null;
  }
  const userId = created.user.id;

  // Insertar/actualizar profile
  const profile = {
    id: userId,
    display_name: name,
    bio: `Tutor en ${region.ciudad}. Cuenta demo de Paw Friend.`,
    location: `${region.ciudad}, ${region.region}`,
    is_demo: true,
  };
  if (isPremium) {
    profile.is_premium = true;
    profile.premium_plan = chance(50) ? "monthly" : "yearly";
    profile.premium_start_date = isoDaysAgo(randInt(5, 60));
    profile.premium_end_date = isoDaysAgo(-randInt(15, 350)); // future
  }
  if (isGrandfathered) profile.is_grandfathered = true;

  const { error: profileErr } = await supabase
    .from("profiles")
    .upsert(profile, { onConflict: "id" });
  if (profileErr) {
    console.warn(`[seed-demo] profile ${email}:`, profileErr.message);
  }

  // Subscription si premium - usamos el RPC apply_premium para esquivar
  // el trigger plan_id roto que tiene la tabla subscriptions en remoto.
  if (isPremium) {
    const { error: rpcErr } = await supabase.rpc("apply_premium", {
      p_user_id: userId,
      p_plan: profile.premium_plan,
      p_amount_clp: profile.premium_plan === "yearly" ? 24990 : 2990,
      p_provider_id: `demo-flow-${userId.slice(0, 8)}`,
    });
    if (rpcErr) {
      console.warn(`[seed-demo] WARN apply_premium ${email}:`, rpcErr.message);
    }
  }

  return { id: userId, name, email, region, isPremium };
}

// ============================================================================
// Crear mascotas + ficha médica para un user
// ============================================================================

async function createPetsForUser(user, petCount) {
  const pets = [];
  for (let i = 0; i < petCount; i++) {
    const isDog = chance(72);
    const isCat = !isDog && chance(75); // 25% gato, resto otro
    const species = isDog ? "perro" : isCat ? "gato" : "otro";
    const name = isDog ? rand(NOMBRES_PERROS) : isCat ? rand(NOMBRES_GATOS) : "Pelusa";
    const breed = isDog ? rand(RAZAS_PERROS) : isCat ? rand(RAZAS_GATOS) : "Mestizo";

    const pet = {
      owner_id: user.id,
      name,
      species,
      breed,
      birth_date: dateMonthsAgo(randInt(6, 144)),
      gender: chance(50) ? "macho" : "hembra",
      weight: isDog ? +(randInt(50, 350) / 10).toFixed(1) : +(randInt(25, 80) / 10).toFixed(1),
      bio: `${name} es ${chance(50) ? "muy juguetón" : "tranquilo y cariñoso"}.`,
      microchip_number: String(900000000000000 + randInt(1, 999999999999)),
      is_public: true,
    };

    // Campos clínicos opcionales (pueden no existir en algún ambiente — best effort)
    pet.vaccination_status = chance(75) ? "up_to_date" : "pending";
    pet.neutered = chance(60);
    pet.activity_level = rand(["low", "medium", "high"]);
    pet.living_environment = rand(["apartment", "house", "house_yard"]);
    if (chance(30)) pet.allergies_food = ["pollo"];
    if (chance(15)) pet.allergies_medication = ["penicilina"];
    if (chance(20)) pet.chronic_conditions_detail = { displasia: "leve, manejada con dieta" };
    if (chance(15)) {
      pet.current_medications = [
        { name: "Carprofeno", dose: "50mg", frequency: "1 vez al día", since: dateMonthsAgo(2) },
      ];
    }

    const { data: insertedPet, error: petErr } = await supabase
      .from("pets")
      .insert(pet)
      .select("id")
      .single();
    if (petErr) {
      console.warn(`[seed-demo] pet ${name} (${user.email}):`, petErr.message);
      continue;
    }
    pets.push({ id: insertedPet.id, name, species });

    // Medical records (3-7) — owner_id es NOT NULL, hay que pasarlo
    const recordCount = randInt(3, 7);
    const records = [];
    const types = ["vacuna", "consulta", "tratamiento", "otro"];
    for (let j = 0; j < recordCount; j++) {
      const recordType = j === 0 ? "vacuna" : rand(types);
      const vaccines = species === "gato" ? VACUNAS_GATOS : VACUNAS_PERROS;
      records.push({
        pet_id: insertedPet.id,
        owner_id: user.id,
        record_type: recordType,
        title: recordType === "vacuna" ? rand(vaccines) : `${recordType} general`,
        description: `Atención de rutina para ${name}.`,
        veterinarian_name: `Dr. ${rand(APELLIDOS)}`,
        clinic_name: `Veterinaria ${rand(["Patitas", "Animal", "VetCare", "PetSalud"])}`,
        date: dateMonthsAgo(randInt(1, 24)),
      });
    }
    await safeInsert("medical_records", records, "medical_records");

    // Pet activities recientes (1-3)
    const activities = [];
    const actCount = randInt(1, 3);
    for (let k = 0; k < actCount; k++) {
      activities.push({
        pet_id: insertedPet.id,
        owner_id: user.id,
        activity_type: rand(["walk", "vet_visit", "vaccine", "grooming"]),
        title: `${name} tuvo ${rand(["un paseo", "una visita al vet", "una vacuna", "un baño"])}`,
        metadata: {},
      });
    }
    await safeInsert("pet_activities", activities, "pet_activities");
  }
  return pets;
}

// ============================================================================
// Crear proveedor de servicio
// ============================================================================

async function createProvider(serviceType, label, i) {
  const user = await createDemoUser(1000 + i, {});
  if (!user) return null;
  const region = user.region;

  const provider = {
    user_id: user.id,
    display_name: `${label} ${user.name}`,
    bio: `${label} con ${randInt(2, 15)} años de experiencia en ${region.ciudad}.`,
    city: region.ciudad,
    commune: region.region === "RM" ? rand(COMUNAS_RM) : region.ciudad,
    address: `Av. Demo ${randInt(100, 9999)}, ${region.ciudad}`,
    latitude: region.lat + (Math.random() - 0.5) * 0.05,
    longitude: region.lng + (Math.random() - 0.5) * 0.05,
    experience_years: randInt(2, 15),
    status: "approved",
    is_verified: true,
    rating: +(3.5 + Math.random() * 1.5).toFixed(1),
    total_reviews: randInt(3, 30),
    is_demo: true,
  };

  const { data: providerRow, error: provErr } = await supabase
    .from("service_providers")
    .insert(provider)
    .select("id")
    .single();
  if (provErr) {
    console.warn(`[seed-demo] provider ${user.email}:`, provErr.message);
    return null;
  }

  // Service offering
  await safeInsert("provider_service_offerings", [{
    provider_id: providerRow.id,
    service_type: serviceType,
    price_base: serviceType === "veterinarian" ? randInt(15000, 45000) : randInt(8000, 25000),
    price_unit: serviceType === "dog_walker" ? "walk" : "session",
    description: `Servicio profesional de ${label.toLowerCase()}.`,
    is_active: true,
  }], "provider_service_offerings");

  return { providerId: providerRow.id, user };
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log(`[seed-demo] target: ${SUPABASE_URL}`);
  if (RESET) await resetDemos();

  // 1. Crear ~100 usuarios dueños
  console.log("[seed-demo] creando 100 usuarios dueños...");
  const owners = [];
  for (let i = 0; i < 100; i++) {
    // 5 grandfathered, 20 premium
    const isGrandfathered = i < 5;
    const isPremium = !isGrandfathered && i < 25;
    const u = await createDemoUser(i, { isPremium, isGrandfathered });
    if (u) owners.push(u);
    if ((i + 1) % 10 === 0) console.log(`  ${i + 1}/100`);
  }
  console.log(`[seed-demo] users creados: ${owners.length}`);

  // 2. Crear mascotas (50% 1, 35% 2, 15% 3+)
  console.log("[seed-demo] creando mascotas + fichas médicas...");
  let totalPets = 0;
  for (const owner of owners) {
    const r = Math.random();
    const petCount = r < 0.5 ? 1 : r < 0.85 ? 2 : 3;
    const pets = await createPetsForUser(owner, petCount);
    totalPets += pets.length;
  }
  console.log(`[seed-demo] mascotas creadas: ${totalPets}`);

  // 3. Crear ~15 proveedores de servicios
  console.log("[seed-demo] creando proveedores de servicios...");
  const providers = [];
  let pi = 0;
  for (const svc of SERVICIOS) {
    for (let k = 0; k < svc.count; k++) {
      const p = await createProvider(svc.type, svc.label, pi++);
      if (p) providers.push(p);
    }
  }
  console.log(`[seed-demo] proveedores creados: ${providers.length}`);

  // 4. Resumen
  console.log("\n[seed-demo] ✅ listo");
  console.log(`  users dueños:     ${owners.length}`);
  console.log(`  mascotas:         ${totalPets}`);
  console.log(`  proveedores:      ${providers.length}`);
  console.log(`\n  Para borrar TODO: delete from auth.users where email like '%${DEMO_DOMAIN}';`);
  console.log(`  Password de cualquier user demo: ${DEMO_PASSWORD}`);
}

main().catch((err) => {
  console.error("[seed-demo] FATAL", err);
  process.exit(1);
});
