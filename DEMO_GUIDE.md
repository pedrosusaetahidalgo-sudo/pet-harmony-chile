# Guía de demo en vivo Paw Friend

## Setup inicial (una sola vez)

### 1. Aplicar el seed SQL
```sql
-- En el SQL Editor de Supabase Dashboard, copiar y pegar el contenido de:
-- supabase/seeds/demo_profiles.sql
-- y darle Run.
```

Verificar que aparezcan 5 filas:
```sql
SELECT display_name, slug, total_reviews
FROM service_providers
WHERE license_number LIKE 'DEMO%'
ORDER BY license_number;
```

### 2. URLs de los 5 perfiles demo

| Perfil | Slug | URL |
|---|---|---|
| Vet recién egresada | `dra-javiera-munoz` | `pawfriend.cl/veterinarios/dra-javiera-munoz` |
| Especialista | `dr-matias-fernandez` | `pawfriend.cl/veterinarios/dr-matias-fernandez` |
| Clínica chica | `clinica-veterinaria-patitas` | `pawfriend.cl/veterinarios/clinica-veterinaria-patitas` |
| Clínica grande | `clinica-veterinaria-altamira` | `pawfriend.cl/veterinarios/clinica-veterinaria-altamira` |
| Emergencias 24h | `dr-cristian-rojas` | `pawfriend.cl/veterinarios/dr-cristian-rojas` |

**Menú interno**: `pawfriend.cl/demo` — abre esto en tu celular antes de cada reunión.

---

## Antes de la reunión (5 min)

### Verificar que todo esté funcionando
1. Abrir en tu celular: `pawfriend.cl/demo`
2. Tocar cada uno de los 5 perfiles → verificar que cargan bien
3. Verificar que las reseñas aparecen
4. Si querés ver con badge "DEMO" visible: agregá `?demo=true` a la URL del perfil

### Tener listo en tu celular
- Safari iOS o Chrome Android, **no** la app instalada (podés mostrar cómo se ve la web pública)
- Pantalla con brillo alto
- Silenciar notificaciones
- Batería > 50%
- Red estable (datos móviles si hay duda con WiFi del lugar)

### Links que podés mandar antes
**Por WhatsApp, copia-pega tal cual:**

Para vets individuales:
```
Hola [nombre]! Antes de juntarnos, te dejo dos links de cómo se vería tu perfil en Paw Friend:

Caso 1 — vet que recién empieza:
https://pawfriend.cl/veterinarios/dra-javiera-munoz

Caso 2 — especialista con clientela:
https://pawfriend.cl/veterinarios/dr-matias-fernandez

Mañana lo vemos en detalle. ¡Saludos!
```

Para clínicas:
```
Hola [nombre]! Antes de la reunión, te dejo dos perfiles de ejemplo de cómo se vería [nombre clínica] en Paw Friend:

Clínica con presencia consolidada:
https://pawfriend.cl/veterinarios/clinica-veterinaria-altamira

Clínica más boutique:
https://pawfriend.cl/veterinarios/clinica-veterinaria-patitas

Mañana lo vemos juntos.
```

---

## Durante la reunión (15-20 min)

### Estructura

**Minuto 0-2: Conexión humana**
No abras la app. Habla, escucha, conoce al vet. Pregunta:
*"¿Cómo estás con el tema de conseguir clientes hoy?"*

**Minuto 2-4: Reflejá el problema**
*"O sea que dependés casi 100% de boca a boca e Instagram, y eso es azaroso. Cuando alguien busca un veterinario en Google, no hay forma de que te encuentre."*

**Minuto 4-10: Demo en vivo**
Saca el celular. Abre `pawfriend.cl/demo` y toca el perfil que mejor encaja con el cliente.

#### Para vets individuales (perfiles 1, 2 o 5)
1. *"Imaginate que alguien busca un veterinario en Las Condes en Google."*
2. Abre `pawfriend.cl/veterinarios/comuna/las-condes`
3. *"Encuentra este directorio con todos los vets verificados de la zona."*
4. Scroll lento, señalando ratings y reseñas
5. Click en **Dra. Javiera Muñoz** (o el perfil que corresponda)
6. *"Este es el perfil completo: foto, rating, reseñas reales, qué especialidades, en qué zonas atiende, precio desde."*
7. *"Y este perfil lo compartís en tu Instagram, en tu WhatsApp, en tu firma de email. Es tu URL profesional."*
8. Mostrá el botón "Reservar" → *"Y desde acá los pacientes te reservan directo."*

#### Para Cafati o clínicas grandes (perfil 4)
1. Abre `pawfriend.cl/demo` y toca **Clínica Altamira**
2. Enfoca en **multi-especialidades** (oncología, cardiología, etc.)
3. Mostrá las **340 reseñas** y el rating 4.8
4. *"Así se vería Cafati en Paw Friend. Tus pacientes actuales llegan más rápido a reservar, y los nuevos te encuentran con reseñas reales que validan la calidad del servicio."*
5. Mencioná dashboard de métricas, multi-vet, branding completo

**Minuto 10-13: Propuesta**
Precio claro, plan piloto, sin rodeos.

| Cliente | Pitch |
|---|---|
| Vet individual | *"$9.900 al mes, primeros 3 meses gratis. Te armo el perfil hoy mismo en 15 minutos."* |
| Clínica chica | *"$29.900 al mes, sin compromiso de permanencia. Plan piloto 60 días con onboarding incluido."* |
| Clínica grande | *"$59.900 al mes. Plan piloto de 90 días a $35.000 con implementación personalizada. ¿Hablamos de cuándo arrancamos?"* |

**Minuto 13-15: Cierre**

3 caminos:
1. **Si dice sí** → armar perfil real ahí mismo en su celular
2. **Si duda** → preguntar qué información específica falta para decidir
3. **Si no** → pedir feedback honesto + referidos

---

## Qué NO mostrar durante la demo

- ❌ **Feed social** — distrae del mensaje médico
- ❌ **PawGame** — está escondido, no debería estar visible
- ❌ **Mapa** sin data real
- ❌ **Pantallas con "próximamente"** o placeholders
- ❌ **Login / signup** — la demo es del producto público sin login
- ❌ **Cualquier modal con error**

Si toca algo por error, vuelve rápido al directorio (`/veterinarios`).

---

## Después de la reunión

### Si cerró
1. Ahí mismo crear su perfil real con sus datos reales
2. Enviarle link de su perfil real por WhatsApp
3. Agendar llamada de onboarding 3 días después
4. Anotar en planilla: **CERRADO**

### Si no cerró
1. Anotar la objeción específica en la planilla de prospectos
2. Mandar mensaje de agradecimiento
3. Agendar follow-up en 7-14 días
4. Pedir referidos: *"¿Conocés otro vet a quien le podría servir esto?"*

### Resetear datos de demo
Si en alguna reunión tocaste algo accidentalmente y querés volver al estado limpio:

1. Ir al SQL Editor de Supabase
2. Pegar el contenido de `supabase/seeds/demo_profiles.sql` (es idempotente: borra los demos viejos y los crea de nuevo)
3. Run

---

## Modo demo en la URL

Cuando agregás `?demo=true` a cualquier perfil, aparece un banner ámbar arriba diciendo "Esta es una vista de ejemplo. Los datos son ficticios para demostración."

Útil cuando vos sabés que es demo pero querés que el vet también lo sepa para evitar confusión.

Ejemplo:
- Sin badge: `pawfriend.cl/veterinarios/dra-javiera-munoz`
- Con badge: `pawfriend.cl/veterinarios/dra-javiera-munoz?demo=true`

---

## Identificación de los demos en la base de datos

Todos los demos tienen:
- `license_number` empieza con `DEMO` (DEMO001, DEMO002, ...)
- `email` termina en `@demo.pawfriend.cl` o `.demo.cl`

Para borrar todos los demos en cualquier momento:
```sql
DELETE FROM service_reviews WHERE provider_id IN (
  SELECT id FROM service_providers WHERE license_number LIKE 'DEMO%'
);
DELETE FROM service_providers WHERE license_number LIKE 'DEMO%';
```

Para crearlos desde cero, correr `supabase/seeds/demo_profiles.sql`.
