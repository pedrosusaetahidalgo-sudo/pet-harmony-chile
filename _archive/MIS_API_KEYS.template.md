# 🔐 Mis API Keys — Paw Friend (TEMPLATE)

> **IMPORTANTE**: Este es el TEMPLATE público (sin secrets reales).
> Tu archivo personal con las keys de verdad se llama `MIS_API_KEYS.md` y está
> en el .gitignore — nunca se sube a GitHub.
>
> **Para crear tu archivo personal**: copiá este template:
> ```powershell
> Copy-Item MIS_API_KEYS.template.md MIS_API_KEYS.md
> ```
> Después abrilo con `code MIS_API_KEYS.md` y rellená los `<<PEGAR_AQUI>>`.

---

## Reglas de oro

1. **NUNCA** abras este archivo si estás compartiendo pantalla.
2. **NUNCA** copies y pegues una key en chats de IA, Slack, WhatsApp, email.
3. **NUNCA** lo subas a la nube (Drive, Dropbox) sin encriptar.
4. Si alguien lo ve por accidente → rotá las keys según `ROTAR_API_KEYS.md`.
5. Backup recomendado: gestor de contraseñas (Bitwarden, 1Password) → guardás
   este archivo entero como "Secure Note".

---

## 1. Supabase — proyecto pawfriend (gwailbjlvevkhwcrovfd)

| Campo | Valor |
|---|---|
| **Project URL** | `https://gwailbjlvevkhwcrovfd.supabase.co` |
| **Project ref** | `gwailbjlvevkhwcrovfd` |
| **Dashboard** | https://supabase.com/dashboard/project/gwailbjlvevkhwcrovfd |

### 1.1. Publishable key (pública, va en el frontend)
**Es pública por diseño, OK que esté en el repo en `src/integrations/supabase/client.ts`.**

```
sb_publishable_<<PEGAR_AQUI>>
```

- Dónde se usa: frontend (`src/integrations/supabase/client.ts`)
- Cuándo rotar: si sospechás abuso (raro, ver `ROTAR_API_KEYS.md` §2)
- Última rotación: `<<FECHA>>`

### 1.2. Secret key (privada, NUNCA en repo)
**Esta es la crítica. Da control total de la BD.**

```
sb_secret_<<PEGAR_AQUI>>
```

- Dónde se usa:
  - Secret de Supabase Functions: `SUPABASE_SERVICE_ROLE_KEY`
  - Local: `.env.demo.local` para correr `scripts/seed-demo.mjs`
- Cuándo rotar: SIEMPRE si se filtra. Sino, cada 6 meses por higiene.
- Última rotación: `<<FECHA>>`
- ⚠️ Si la rotás, actualizá AMBOS lugares (Supabase secret + .env.demo.local)

### 1.3. Database password (Postgres directo)
**Solo si te conectás a la BD por psql / pgAdmin / DBeaver.**

```
<<PEGAR_AQUI>>
```

- Dónde se usa: conexiones directas a Postgres (no la usa el frontend)
- Cuándo rotar: si se filtra
- Última rotación: `<<FECHA>>`

---

## 2. Anthropic — Claude API

| Campo | Valor |
|---|---|
| **Console** | https://console.anthropic.com/settings/keys |
| **Spend cap** | USD 10/mes (verificar en https://console.anthropic.com/settings/limits) |

### 2.1. API Key (privada)
```
sk-ant-api03-<<PEGAR_AQUI>>
```

- Dónde se usa:
  - Secret de Supabase Functions: `ANTHROPIC_API_KEY`
  - Edge functions de IA: `pet-assistant`, `medical-suggestions`, `breed-tips`,
    `generate-shelters`, `moderate-service-promotion`
- Cuándo rotar: si se filtra o si ves uso anormal en
  https://console.anthropic.com/settings/usage
- Última rotación: `<<FECHA>>`

---

## 3. Flow.cl — pasarela de pagos Premium B2C

| Campo | Valor |
|---|---|
| **Panel** | https://www.flow.cl/app |

### 3.1. API Key (público dentro del payload pero no se expone al user)
```
<<PEGAR_AQUI>>
```

- Dónde se usa: secret de Supabase Functions: `FLOW_API_KEY`
- Edge functions: `flow-create-subscription`, `flow-webhook`
- Última rotación: `<<FECHA>>`

### 3.2. Secret Key (CRÍTICA — firma HMAC)
```
<<PEGAR_AQUI>>
```

- Dónde se usa: secret de Supabase Functions: `FLOW_SECRET_KEY`
- Si se filtra: rotar inmediatamente, atacante puede falsificar firmas
- Última rotación: `<<FECHA>>`

⚠️ Flow normalmente NO permite tener 2 keys activas a la vez. Rotala en
horario de poco tráfico.

---

## 4. GitHub

| Campo | Valor |
|---|---|
| **Usuario** | `pedrosusaetahidalgo-sudo` |
| **Repo** | https://github.com/pedrosusaetahidalgo-sudo/pet-harmony-chile |

### 4.1. Personal Access Token (PAT) — solo si lo usás
```
ghp_<<PEGAR_AQUI>>
```

- Dónde se usa: pushes desde scripts automatizados
- Si solo pusheás manualmente con tu sesión de Git, NO necesitás PAT
- Última rotación: `<<FECHA>>`

---

## 5. Google Cloud — DEPRECADO

VITE_GOOGLE_MAPS_API_KEY: la app ya migró a Leaflet, esta key NO se usa.
Acción: ir a Google Cloud Console y eliminarla para no pagar por algo sin uso.

---

## 6. Acceso a servicios (no son keys, pero conviene tenerlos juntos)

### 6.1. Cuenta principal
- Email: `<<PEGAR_AQUI>>`
- Recovery: `<<PEGAR_AQUI>>`

### 6.2. 2FA
- Método: `<<Google Authenticator / SMS / hardware key>>`
- Backup codes: `<<PEGAR_AQUI>>` (¡guardalos en otro lado también!)

---

## Plantilla para `.env.demo.local` (script de seed)

Cuando corras `scripts/seed-demo.mjs`, necesitás un archivo `.env.demo.local`
en la raíz con SOLO estas 2 líneas (también gitignored):

```
SUPABASE_URL=https://gwailbjlvevkhwcrovfd.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<la sb_secret_* de arriba>
```

Comando rápido para crearlo (PowerShell):
```powershell
@"
SUPABASE_URL=https://gwailbjlvevkhwcrovfd.supabase.co
SUPABASE_SERVICE_ROLE_KEY=PEGAR_AQUI_LA_SB_SECRET
"@ | Set-Content -Path .env.demo.local -Encoding utf8
```

---

## Bitácora de rotaciones

Anotá cada vez que rotás algo. Te salva si después aparece uso indebido.

| Fecha | Key rotada | Motivo | Notas |
|---|---|---|---|
| `<<YYYY-MM-DD>>` | Supabase JWT secret + sb_secret | Leak en chat IA | Todas las legacy invalidadas |
| | | | |

---

## Si pasa algo (incidente)

1. **Identificar qué se filtró** (qué key, dónde, cuándo)
2. **Rotar inmediatamente** siguiendo `ROTAR_API_KEYS.md`
3. **Actualizar este archivo** con la nueva key + fecha
4. **Anotar en la bitácora** el incidente
5. **Verificar logs** en cada servicio (Supabase Functions, Anthropic Usage, Flow)
   por si hubo uso indebido entre el leak y la rotación
