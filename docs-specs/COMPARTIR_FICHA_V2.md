# Compartir Ficha Clinica V2 — Vinculacion directa Vet-Mascota

> **Estado**: Propuesta
> **Fecha**: 2026-04-12
> **Problema**: El flujo actual de compartir fichas es engorroso, no genera notificaciones reales, y el vet no puede aceptar/rechazar la solicitud. El dueno tiene que generar un enlace, copiarlo, y mandarlo manualmente. No existe un boton rapido en la tarjeta de mascota. Ademas, el formulario "Nuevo paciente" del vet tiene un bug que impide crear pacientes.

---

## Diagnostico del flujo actual

### Que existe hoy

1. **TabCompartir** en la ficha clinica (`/ficha/:petId` → pestana "Compartir"):
   - Selector opcional de vet del directorio
   - Boton "Generar enlace" → crea token de 30 dias en `medical_share_tokens`
   - Lista de enlaces activos con: copiar URL, enviar por WhatsApp, QR, revocar
   - Dice "le llegara una notificacion en su panel" pero **no se envia ninguna notificacion**

2. **SharedFichasCard** en el dashboard vet:
   - Muestra fichas compartidas con `target_provider_id` = este vet
   - Solo ultimos 7 dias, maximo 10
   - Botones: "Nota", "Grabar", "Ver ficha"

3. **MedicalShare** page publica (`/medical-share/:token`):
   - Cualquiera con el enlace ve la ficha completa
   - No requiere auth

4. **NewPatientForm** en dashboard vet:
   - Formulario para crear paciente manual con email del dueno
   - Edge Function `send-pet-invitation` envia email via Supabase Auth
   - **Bug activo**: el insert falla (ver seccion Bugs)

### Problemas UX/UI

| Problema | Impacto |
|---|---|
| No hay boton "Compartir" en la tarjeta de mascota en My Pets | El dueno tiene que entrar a la ficha clinica → buscar la pestana → generar enlace. Demasiados pasos |
| El vet NO recibe notificacion real | Aunque el UI dice que le llegara, no pasa nada. El vet no se entera |
| No hay aceptar/rechazar | El vet ve la ficha directamente. No hay consentimiento del vet para vincular al paciente |
| Los enlaces son tokens anonimos | El dueno no sabe si el vet vio su ficha. El vet ve un token, no una "solicitud" |
| 7 dias de ventana en SharedFichasCard | Si el vet no revisa en 7 dias, la ficha desaparece del dashboard |
| UX de enlace generado es confusa | Despues de generar, el dueno ve una URL monospace + QR + 3 botones. No queda claro que hacer |
| No hay vinculacion permanente vet-mascota | Cada compartida es un token efimero. No existe una relacion duradera "este vet atiende a esta mascota" |
| NewPatientForm falla al crear | El vet no puede registrar pacientes nuevos desde su dashboard |

### Bug: NewPatientForm — "Error al crear paciente"

**Archivo**: `src/components/provider/NewPatientForm.tsx`

**Causa raiz**: La RLS policy de `pets` exige `auth.uid() = owner_id` para INSERT. El formulario pone `owner_id = user.id` (el vet), lo que pasa la RLS. Pero hay columnas requeridas por la tabla (`pending_owner_email`, `created_by_vet_id`) que fueron agregadas en migracion `20260422000001_pending_owner_pets.sql` sin actualizar las policies. Si alguna constraint adicional falla (ej: el vet no tiene perfil valido como "owner", o hay un trigger que valida owner_id contra pets existentes), el insert se rechaza.

**Fix necesario**:
1. Agregar RLS policy especifica para vets creando pacientes pending:
   ```sql
   CREATE POLICY "Vets can create pending pets"
     ON public.pets FOR INSERT TO authenticated
     WITH CHECK (created_by_vet_id = auth.uid());
   ```
2. Revisar que el insert payload sea compatible con todas las constraints de la tabla

---

## Solucion propuesta: Vinculacion directa Vet-Mascota

### Concepto central

Cambiar de un modelo de **"generar enlace temporal"** a un modelo de **"vincular tu mascota con tu vet"**. El dueno selecciona un vet y le envia una solicitud. El vet recibe una notificacion, ve un resumen de la mascota, y acepta o rechaza. Si acepta, se crea una vinculacion permanente: el vet tiene acceso a la ficha clinica mientras la vinculacion este activa.

Los enlaces publicos (token anonimo, QR, WhatsApp) siguen existiendo como opcion secundaria para compartir con cualquier persona.

### Flujo 1 — Dueno vincula mascota con vet existente (in-app)

```
DUENO (desde My Pets o Ficha Clinica):
  "Compartir con tu vet" →
    Seleccionar vet del directorio (buscador por nombre/comuna) →
      Click "Enviar solicitud" →
        Se crea registro en pet_vet_links (status: pending) →
        Se crea notificacion para el vet →
        Toast: "Solicitud enviada a Dra. Javiera Munoz"

VET (en su dashboard):
  Notificacion: "Pedro quiere compartir la ficha de Kai contigo" →
    Click → abre card con resumen de la mascota:
      - Foto, nombre, especie, raza, edad, peso
      - Condiciones cronicas / alergias
      - Motivo (opcional, escrito por el dueno)
    Botones: [Aceptar] [Rechazar]
      Aceptar → status = 'active', notificacion al dueno
      Rechazar → status = 'rejected', notificacion al dueno

POST-ACEPTACION:
  - La mascota aparece permanentemente en "Mis pacientes" del vet
  - El vet puede acceder a la ficha clinica completa
  - El vet puede agregar notas, grabar consultas
  - El dueno puede revocar la vinculacion en cualquier momento
  - El vet puede desvincularse tambien
```

### Flujo 2 — Vet invita dueno que NO tiene cuenta (email Paw Bud)

Cuando el vet crea un paciente desde su panel con el email del dueno, el sistema envia un email con marca Paw Friend y personalidad de mascota.

```
VET (desde Dashboard → "Nuevo paciente"):
  Llena: nombre mascota, especie, raza, etc.
  Llena: nombre del dueno + email del dueno  ←── NUEVO: nombre del dueno
  Click "Crear paciente" →
    Se crea pet con created_by_vet_id + pending_owner_email + pending_owner_name
    Se envia email personalizado al dueno:

    ┌──────────────────────────────────────────────┐
    │  [Logo Paw Friend]                           │
    │                                              │
    │  Hola Max!                                   │
    │                                              │
    │  Soy Kai y quiero que seas                   │
    │  mi Paw Bud en Paw Friend                    │
    │                                              │
    │  Dra. Javiera Munoz te invita a              │
    │  unirte a Paw Friend para que puedas         │
    │  ver mi ficha clinica, recibir               │
    │  recordatorios de vacunas, y mucho mas.      │
    │                                              │
    │        [Crear mi cuenta gratis]              │
    │                                              │
    │  El enlace expira en 7 dias.                 │
    │                                              │
    │  Con amor,                                   │
    │  Kai 🐾                                      │
    │                                              │
    │  ─────────────────────────────────────        │
    │  pawfriend.cl — La app de tu mascota         │
    └──────────────────────────────────────────────┘

    El boton redirige a:
    pawfriend.cl/auth?returnTo=/my-pets&invitation={token}

    Al crear cuenta (o login si ya existe):
      → Se vincula automaticamente: owner_id = nuevo user, pet_vet_links se crea con status 'active'
      → La mascota aparece en My Pets del dueno
      → El vet ya la tiene en su lista de pacientes
```

---

## Nuevas pantallas y componentes

### 1. Boton "Compartir con tu vet" en tarjeta de mascota (My Pets)

Agregar un boton en cada tarjeta de mascota en la pagina My Pets. Al hacer click, abre un modal para seleccionar vet y enviar solicitud.

```
┌──────────────────────────────┐
│  [Foto]  Kai                 │
│  Pastor Suizo · 3 anos       │
│                              │
│  [Ficha Clinica] [Editar]    │
│  [Compartir con tu vet]  ←── NUEVO
└──────────────────────────────┘
```

### 2. Modal "Compartir con tu vet" (ShareWithVetModal)

Reutilizable desde My Pets y desde TabCompartir. Busqueda de vet por nombre, con preview de su perfil (foto, nombre, comuna, especialidad).

```
┌─────────────────────────────────────┐
│  Compartir ficha de Kai             │
│                                     │
│  Buscar veterinario:                │
│  [____________________________]     │
│                                     │
│  Resultados:                        │
│  ┌─────────────────────────────┐    │
│  │ [Foto] Dra. Javiera Munoz  │    │
│  │ Providencia · Medicina gral │    │
│  │                    [Enviar] │    │
│  └─────────────────────────────┘    │
│  ┌─────────────────────────────┐    │
│  │ [Foto] Dr. Matias Fernandez│    │
│  │ Las Condes · Cirugia       │    │
│  │                    [Enviar] │    │
│  └─────────────────────────────┘    │
│                                     │
│  Mensaje opcional:                  │
│  [Control anual de Kai________]     │
│                                     │
│  ─────────────────────────────────  │
│  ¿Compartir con alguien que no esta │
│  en Paw Friend?                     │
│  [Generar enlace publico]           │
└─────────────────────────────────────┘
```

### 3. Card de solicitud pendiente en Dashboard Vet (PendingVetLinksCard)

Nueva card que reemplaza/complementa SharedFichasCard. Muestra solicitudes pendientes con resumen de la mascota.

```
┌─────────────────────────────────────┐
│  Solicitudes de vinculacion    (2)  │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ [Foto] Kai · Pastor Suizo  │    │
│  │ 3 anos · 32kg              │    │
│  │ Dueno: Pedro Susaeta       │    │
│  │ "Control anual"            │    │
│  │ Hace 2 horas               │    │
│  │                            │    │
│  │ Alergias: Pollo            │    │
│  │ Cronico: Displasia cadera  │    │
│  │                            │    │
│  │   [Aceptar]  [Rechazar]    │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

### 4. Seccion "Mis pacientes vinculados" en Dashboard Vet

Lista permanente de mascotas aceptadas. Reemplaza la logica actual de VetPatientsList que combina tokens + notas.

```
┌─────────────────────────────────────┐
│  Mis pacientes          (5 activos) │
│                                     │
│  [Foto] Kai · Pedro S.             │
│    [Ficha] [Nota] [Grabar]         │
│  [Foto] Luna · Maria G.            │
│    [Ficha] [Nota] [Grabar]         │
│  ...                                │
└─────────────────────────────────────┘
```

Los botones "Nota" y "Grabar" (feature audio) viven aqui ahora, vinculados permanentemente a cada paciente activo.

### 5. Seccion "Veterinarios de tu mascota" en Ficha Clinica / My Pets

El dueno ve que vets tienen acceso a la ficha de cada mascota. Puede revocar vinculaciones.

```
┌─────────────────────────────────────┐
│  Veterinarios de Kai                │
│                                     │
│  [Foto] Dra. Javiera Munoz         │
│  Vinculada desde 12 abr 2026       │
│                         [Revocar]   │
│                                     │
│  [Foto] Dr. Matias Fernandez       │
│  Pendiente (enviado hace 1 dia)     │
│                         [Cancelar]  │
│                                     │
│  [+ Agregar veterinario]            │
└─────────────────────────────────────┘
```

---

## Modelo de datos

### Nueva tabla: `pet_vet_links`

```sql
CREATE TABLE public.pet_vet_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id uuid NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES profiles(id),
  provider_id uuid NOT NULL REFERENCES service_providers(id),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'rejected', 'revoked_by_owner', 'revoked_by_vet')),
  message text,                    -- mensaje opcional del dueno al enviar
  created_at timestamptz DEFAULT now(),
  responded_at timestamptz,        -- cuando el vet acepto/rechazo
  revoked_at timestamptz,          -- cuando se revoco la vinculacion
  UNIQUE (pet_id, provider_id)     -- solo 1 vinculacion por par mascota-vet
);

ALTER TABLE pet_vet_links ENABLE ROW LEVEL SECURITY;

-- Dueno puede ver/crear/revocar sus vinculaciones
CREATE POLICY "Owner manages own links" ON pet_vet_links
  FOR ALL USING (owner_id = auth.uid());

-- Vet puede ver solicitudes dirigidas a el y responder
CREATE POLICY "Vet sees their links" ON pet_vet_links
  FOR SELECT USING (
    provider_id IN (SELECT id FROM service_providers WHERE user_id = auth.uid())
  );

CREATE POLICY "Vet responds to links" ON pet_vet_links
  FOR UPDATE USING (
    provider_id IN (SELECT id FROM service_providers WHERE user_id = auth.uid())
  )
  WITH CHECK (
    status IN ('active', 'rejected', 'revoked_by_vet')
  );
```

### Columna nueva en `pets`: `pending_owner_name`

```sql
ALTER TABLE public.pets
  ADD COLUMN IF NOT EXISTS pending_owner_name text;

COMMENT ON COLUMN public.pets.pending_owner_name
  IS 'Nombre del dueno ingresado por el vet al crear paciente. Se usa para personalizar el email de invitacion.';
```

### Fix RLS para NewPatientForm

```sql
-- Permitir que vets creen mascotas pending (con created_by_vet_id)
CREATE POLICY "Vets can create pending pets"
  ON public.pets FOR INSERT TO authenticated
  WITH CHECK (created_by_vet_id = auth.uid());
```

### Notificaciones (tabla existente `notifications`)

Se crean automaticamente via trigger SQL:

| Evento | type | Destinatario | title | body | action_url |
|---|---|---|---|---|---|
| Dueno envia solicitud | `vet_link_request` | Vet (user_id del provider) | "Nueva solicitud de paciente" | "{dueno} quiere compartir la ficha de {mascota} contigo." | `/provider/dashboard` |
| Vet acepta | `vet_link_accepted` | Dueno | "Tu vet acepto la solicitud" | "Dra. {vet} ahora tiene acceso a la ficha de {mascota}." | `/ficha/{petId}` |
| Vet rechaza | `vet_link_rejected` | Dueno | "Solicitud no aceptada" | "{vet} no acepto la solicitud para {mascota}." | `/my-pets` |
| Dueno revoca | `vet_link_revoked` | Vet (user_id del provider) | "Paciente desvinculado" | "{dueno} revoco el acceso a la ficha de {mascota}." | `/provider/dashboard` |

### Trigger de notificacion automatica

```sql
CREATE OR REPLACE FUNCTION notify_pet_vet_link_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_pet_name text;
  v_owner_name text;
  v_vet_user_id uuid;
  v_vet_name text;
BEGIN
  SELECT name INTO v_pet_name FROM pets WHERE id = NEW.pet_id;
  SELECT display_name INTO v_owner_name FROM profiles WHERE id = NEW.owner_id;
  SELECT sp.user_id, p.display_name INTO v_vet_user_id, v_vet_name
    FROM service_providers sp
    JOIN profiles p ON p.id = sp.user_id
    WHERE sp.id = NEW.provider_id;

  -- Nueva solicitud → notificar al vet
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    INSERT INTO notifications (user_id, type, title, body, action_url, reference_id)
    VALUES (
      v_vet_user_id,
      'vet_link_request',
      'Nueva solicitud de paciente',
      COALESCE(v_owner_name, 'Un usuario') || ' quiere compartir la ficha de ' || COALESCE(v_pet_name, 'su mascota') || ' contigo.',
      '/provider/dashboard',
      NEW.id
    );
  END IF;

  -- Vet acepta → notificar al dueno
  IF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'active' THEN
    INSERT INTO notifications (user_id, type, title, body, action_url, reference_id)
    VALUES (
      NEW.owner_id,
      'vet_link_accepted',
      'Tu vet acepto la solicitud',
      COALESCE(v_vet_name, 'Tu veterinario') || ' ahora tiene acceso a la ficha de ' || COALESCE(v_pet_name, 'tu mascota') || '.',
      '/ficha/' || NEW.pet_id,
      NEW.id
    );
  END IF;

  -- Vet rechaza → notificar al dueno
  IF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'rejected' THEN
    INSERT INTO notifications (user_id, type, title, body, action_url, reference_id)
    VALUES (
      NEW.owner_id,
      'vet_link_rejected',
      'Solicitud no aceptada',
      COALESCE(v_vet_name, 'El veterinario') || ' no acepto la solicitud para ' || COALESCE(v_pet_name, 'tu mascota') || '.',
      '/my-pets',
      NEW.id
    );
  END IF;

  -- Dueno revoca → notificar al vet
  IF TG_OP = 'UPDATE' AND OLD.status = 'active' AND NEW.status = 'revoked_by_owner' THEN
    INSERT INTO notifications (user_id, type, title, body, action_url, reference_id)
    VALUES (
      v_vet_user_id,
      'vet_link_revoked',
      'Paciente desvinculado',
      COALESCE(v_owner_name, 'El dueno') || ' revoco el acceso a la ficha de ' || COALESCE(v_pet_name, 'una mascota') || '.',
      '/provider/dashboard',
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_pet_vet_link_change
  AFTER INSERT OR UPDATE ON pet_vet_links
  FOR EACH ROW
  EXECUTE FUNCTION notify_pet_vet_link_change();
```

---

## Email "Paw Bud" — Invitacion personalizada

### Contexto

Cuando el vet crea un paciente con `pending_owner_name` y `pending_owner_email`, el sistema envia un email branded con personalidad de mascota. Este email reemplaza el email generico de Supabase Auth.

### Datos necesarios en NewPatientForm (campo nuevo)

Agregar campo **"Nombre del dueno"** al formulario:
- Campo: `owner_name` (texto, obligatorio junto con email)
- Se guarda en `pets.pending_owner_name`
- Se usa para personalizar el email: "Hola {owner_name}!"

### Edge Function modificada: `send-pet-invitation`

Actualmente usa `supabase.auth.admin.inviteUserByEmail()` que envia el template generico de Supabase. Se debe reemplazar por un email HTML personalizado enviado via Resend o directamente via SMTP (Supabase Custom SMTP si esta configurado).

**Opcion pragmatica para MVP**: Seguir usando `supabase.auth.admin.inviteUserByEmail()` pero customizar el template en Supabase Dashboard → Authentication → Email Templates → Invite User. El template soporta variables como `{{ .SiteURL }}` y el redirect URL ya incluye el token de invitacion.

**Opcion ideal (post-MVP)**: Edge Function que genera HTML con marca Paw Friend y lo envia via Resend API:

```
Subject: "{petName} quiere que seas su Paw Bud 🐾"

Body (HTML):
  Logo Paw Friend
  "Hola {ownerName}!"
  "Soy {petName} y quiero que seas mi Paw Bud en Paw Friend."
  "Dra. {vetName} te invita a unirte para que puedas ver mi ficha clinica,
   recibir recordatorios de vacunas, y mucho mas."
  [Boton: Crear mi cuenta gratis] → pawfriend.cl/auth?returnTo=/my-pets&invitation={token}
  "El enlace expira en 7 dias."
  "Con amor, {petName} 🐾"
  Footer: pawfriend.cl — La app de tu mascota
```

### Auto-vinculacion al crear cuenta

Cuando el nuevo usuario llega via link de invitacion (`/auth?returnTo=/my-pets&invitation={token}`):

1. El usuario crea cuenta o hace login
2. El frontend detecta el parametro `invitation` en la URL
3. Busca el pet con ese `owner_invitation_token`
4. Actualiza `pets.owner_id` al nuevo usuario
5. Crea `pet_vet_links` con `status = 'active'` entre la mascota y el vet que la creo
6. Redirige a `/my-pets` donde la mascota ya aparece

Este flujo ya esta parcialmente implementado en `send-pet-invitation/index.ts` pero falta el paso 5 (crear la vinculacion automatica).

---

## Compatibilidad con el sistema actual

### Que se mantiene

- **Enlaces publicos** (tokens anonimos) siguen existiendo para compartir con personas fuera de Paw Friend
- **MedicalShare page** (`/medical-share/:token`) sigue funcionando igual
- **QR codes** siguen disponibles
- **WhatsApp share** sigue disponible
- **send-pet-invitation** Edge Function sigue funcionando (se mejora)

### Que cambia

| Antes | Despues |
|---|---|
| TabCompartir muestra primero "Generar enlace" | TabCompartir muestra primero "Veterinarios de tu mascota" (vinculaciones) + boton "Agregar veterinario". Enlace publico pasa a ser opcion secundaria |
| SharedFichasCard filtra por `target_provider_id` en tokens de 7 dias | PendingVetLinksCard muestra solicitudes pendientes de `pet_vet_links`. Pacientes activos vienen de vinculaciones `active` |
| VetPatientsList combina tokens + notas para armar lista | VetPatientsList usa `pet_vet_links` con status `active` como fuente principal |
| No hay notificacion al compartir | Notificacion real al vet cuando el dueno envia solicitud |
| No hay boton Share en tarjeta de mascota | Boton "Compartir con tu vet" en cada pet card |
| NewPatientForm no pide nombre del dueno | Campo "Nombre del dueno" obligatorio → email personalizado |
| Email de invitacion es generico Supabase | Email branded "Paw Bud" con personalidad de mascota |
| Invitacion no crea vinculacion vet-pet | Al aceptar invitacion se crea pet_vet_link automatico |

### Migracion de datos existentes

Los `medical_share_tokens` con `target_provider_id` no nulo y no expirados/revocados se pueden migrar a `pet_vet_links` con `status = 'active'` (ya fueron compartidos y el vet los vio). Esto se haria en la migracion SQL.

---

## Archivos a crear

| # | Archivo | Descripcion |
|---|---|---|
| 1 | `supabase/migrations/YYYYMMDD_pet_vet_links.sql` | Tabla + RLS + trigger notificaciones + fix RLS pets + pending_owner_name + migracion tokens |
| 2 | `src/hooks/usePetVetLinks.ts` | Hook: CRUD de vinculaciones (crear, aceptar, rechazar, revocar, listar) |
| 3 | `src/components/provider/PendingVetLinksCard.tsx` | Card de solicitudes pendientes en dashboard vet |
| 4 | `src/components/provider/LinkedPatientsCard.tsx` | Card de pacientes vinculados con botones Nota/Grabar |
| 5 | `src/components/medical/ShareWithVetModal.tsx` | Modal de busqueda de vet + envio de solicitud |
| 6 | `src/components/medical/PetVetLinksSection.tsx` | Seccion "Veterinarios de tu mascota" para ficha clinica |

## Archivos a modificar

| # | Archivo | Cambio |
|---|---|---|
| 7 | `src/pages/MyPets.tsx` | Agregar boton "Compartir con tu vet" en cada pet card |
| 8 | `src/pages/PetClinicalRecord/tabs/TabCompartir.tsx` | Reorganizar: primero vinculaciones, despues enlaces publicos |
| 9 | `src/components/provider/ProviderDashboard.tsx` | Agregar PendingVetLinksCard + LinkedPatientsCard |
| 10 | `src/components/provider/SharedFichasCard.tsx` | Mantener para tokens sin provider_id (enlaces publicos) |
| 11 | `src/components/provider/VetPatientsList.tsx` | Refactor: usar pet_vet_links como fuente primaria |
| 12 | `src/components/provider/NewPatientForm.tsx` | Agregar campo "Nombre del dueno" + fix flow invitacion |
| 13 | `supabase/functions/send-pet-invitation/index.ts` | Personalizar email + crear pet_vet_link al aceptar invitacion |

---

## Orden de implementacion

### Fase 1 — Core + Fix bugs (tabla + hook + RLS + notificaciones)
- [ ] Migracion SQL: tabla `pet_vet_links` + RLS + triggers de notificacion
- [ ] Migracion SQL: fix RLS policy para que vets puedan crear pets pending
- [ ] Migracion SQL: agregar columna `pending_owner_name` a pets
- [ ] Hook `usePetVetLinks.ts`: crear solicitud, aceptar, rechazar, revocar, listar por pet, listar por vet
- [ ] Fix `NewPatientForm.tsx`: agregar campo nombre dueno, verificar que insert funcione con nueva RLS

### Fase 2 — UI Vet (dashboard)
- [ ] `PendingVetLinksCard.tsx`: solicitudes pendientes con resumen mascota + aceptar/rechazar
- [ ] `LinkedPatientsCard.tsx`: lista de pacientes activos con botones Nota/Grabar/Ficha
- [ ] Integrar ambas cards en `ProviderDashboard.tsx`

### Fase 3 — UI Dueno (compartir)
- [ ] `ShareWithVetModal.tsx`: busqueda de vet + envio solicitud
- [ ] `PetVetLinksSection.tsx`: lista de vets vinculados + revocar
- [ ] Boton "Compartir con tu vet" en `MyPets.tsx`
- [ ] Reorganizar `TabCompartir.tsx`: vinculaciones primero, enlaces despues

### Fase 4 — Email Paw Bud + auto-vinculacion
- [ ] Personalizar template de email en Supabase Dashboard (MVP)
- [ ] Modificar `send-pet-invitation` para pasar nombre mascota/dueno/vet al email
- [ ] Implementar auto-vinculacion: al aceptar invitacion, crear pet_vet_link

### Fase 5 — Limpieza y migracion
- [ ] Migrar tokens existentes con target_provider_id a pet_vet_links
- [ ] Refactorear VetPatientsList para usar pet_vet_links
- [ ] Mover botones Nota/Grabar de SharedFichasCard a LinkedPatientsCard
- [ ] Build check + test manual end-to-end

---

## Diferenciadores vs competencia

1. **Vinculacion bidireccional con consentimiento**: el vet acepta al paciente, no es solo un link anonimo
2. **Notificaciones en tiempo real**: el vet se entera inmediatamente
3. **Acceso permanente**: no hay tokens de 30 dias que expiran — mientras la vinculacion este activa, el vet tiene acceso
4. **Revocacion bilateral**: tanto el dueno como el vet pueden cortar la vinculacion
5. **Resumen de mascota en la solicitud**: el vet ve datos clave antes de aceptar (alergias, cronico, edad)
6. **Un click desde la tarjeta de mascota**: no hay que navegar 3 niveles para compartir
7. **Email Paw Bud**: invitacion con personalidad de mascota que convierte mejor que un email generico
8. **Auto-vinculacion**: el dueno nuevo entra y ya tiene mascota + vet enlazados sin pasos extra

---

## Impacto en feature de audio

Con este sistema, el boton "Grabar" del feature de audio se mueve de SharedFichasCard (tokens temporales) a LinkedPatientsCard (vinculaciones permanentes). Esto resuelve el problema actual: el vet siempre tiene acceso a sus pacientes vinculados, no solo en una ventana de 7 dias.

La vinculacion permanente tambien permite que el vet acceda al historial completo de grabaciones anteriores de cada paciente.
