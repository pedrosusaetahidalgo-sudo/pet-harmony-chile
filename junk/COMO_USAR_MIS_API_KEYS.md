# 📘 Cómo usar tu archivo personal de API Keys

> Guía paso a paso para gestionar tus API keys de forma segura sin ser dev.
> Está hecha para Pedro 👋 — si no entendés algo, releé despacio, no hay apuro.

---

## Concepto en 30 segundos

Tenés **3 archivos** trabajando juntos:

| Archivo | Qué es | Lo ve... |
|---|---|---|
| `MIS_API_KEYS.template.md` | Plantilla vacía con la estructura | TODOS (está en GitHub) |
| `MIS_API_KEYS.md` | Tu archivo PERSONAL con las keys reales | Solo vos en tu PC |
| `.env.demo.local` | Solo la key del seed para Node | Solo vos en tu PC |

Los dos últimos están en `.gitignore` → **nunca se suben a GitHub aunque hagas `git push`**. Quedan solo en tu disco.

---

## PASO 1 — Crear tu archivo personal `MIS_API_KEYS.md`

Abrí **PowerShell** en la carpeta del proyecto y corré:

```powershell
Copy-Item MIS_API_KEYS.template.md MIS_API_KEYS.md
```

Esto crea una copia editable. Verificá que existe:

```powershell
Test-Path MIS_API_KEYS.md
```

Tiene que decir `True`.

---

## PASO 2 — Abrirlo con VS Code para editarlo

```powershell
code MIS_API_KEYS.md
```

Se abre en VS Code. Vas a ver la plantilla con muchos `<<PEGAR_AQUI>>`.

---

## PASO 3 — Llenar las keys reales

### 3.1. Supabase

1. Andá a https://supabase.com/dashboard/project/gwailbjlvevkhwcrovfd/settings/api
2. **Publishable key**:
   - Sección "Project API keys" → fila `sb_publishable_*` → Reveal → Copy
   - En `MIS_API_KEYS.md`, reemplazá `sb_publishable_<<PEGAR_AQUI>>` por la key real
3. **Secret key**:
   - Misma sección → fila `sb_secret_*` → Reveal → Copy
   - Reemplazá `sb_secret_<<PEGAR_AQUI>>` en el archivo
4. **Database password**:
   - Settings → Database → Connection info → Copy password
   - Reemplazá el `<<PEGAR_AQUI>>` correspondiente

**Guardá** con `Ctrl+S`.

### 3.2. Anthropic

1. Andá a https://console.anthropic.com/settings/keys
2. Si ya tenés una key: usala. Si no: **Create Key** → copiala (solo se muestra una vez).
3. Reemplazá `sk-ant-api03-<<PEGAR_AQUI>>` en el archivo.
4. **Guardá** (`Ctrl+S`).

### 3.3. Flow.cl

1. Andá a https://www.flow.cl/app/web/misDatos.php → sección "Configuración API"
2. Copiá `apiKey` y `secretKey`
3. Reemplazalas en el archivo
4. **Guardá**.

### 3.4. Fechas
Donde dice `<<FECHA>>` poné la fecha de hoy en formato `2026-04-09`. Te ayuda a saber cuándo rotaste por última vez.

---

## PASO 4 — Crear `.env.demo.local` (para correr el seed)

Cuando quieras correr `scripts/seed-demo.mjs`, necesitás un archivo separado **solo con la secret key de Supabase** (porque Node lo lee con `--env-file`).

⚠️ **Reemplazá `PEGAR_AQUI_LA_SB_SECRET` con la key real** antes de ejecutar:

```powershell
@"
SUPABASE_URL=https://gwailbjlvevkhwcrovfd.supabase.co
SUPABASE_SERVICE_ROLE_KEY=PEGAR_AQUI_LA_SB_SECRET
"@ | Set-Content -Path .env.demo.local -Encoding utf8
```

Verificá:
```powershell
Test-Path .env.demo.local
```
Tiene que decir `True`.

---

## PASO 5 — Verificar que NADA sensible se subió a GitHub

```powershell
git status
```

NO debe aparecer ni `MIS_API_KEYS.md` ni `.env.demo.local`. Si aparecen, **STOP** y avisame — significa que el `.gitignore` no los está cubriendo.

---

## PASO 6 — Backup (recomendado)

Tu `MIS_API_KEYS.md` solo existe en tu PC. Si se rompe el disco, perdés todo.

**Opciones de backup**:

### Opción A — Gestor de contraseñas (RECOMENDADO)
- Bitwarden (gratis): https://bitwarden.com
- 1Password (paga): https://1password.com
- Crear una **Secure Note** llamada "Paw Friend API Keys"
- Pegá el contenido entero de `MIS_API_KEYS.md` ahí
- Cada vez que rotes una key, actualizá la nota

### Opción B — USB encriptado
- Pendrive con BitLocker (Windows nativo) o VeraCrypt
- Copiar `MIS_API_KEYS.md` ahí
- Guardar el USB en un lugar físico seguro

### ❌ NO hacer
- Subirlo a Google Drive / Dropbox / iCloud sin encriptar
- Mandártelo por email
- Pegarlo en notas de Apple / Notion / Obsidian sincronizado en la nube
- Sacarle screenshot

---

## PASO 7 — Cuándo abrir el archivo

**Abrí `MIS_API_KEYS.md` SOLO cuando**:
1. Necesitás copiar una key específica para algo
2. Acabás de rotar una key y querés actualizarla
3. Estás haciendo el checklist de seguridad trimestral

**NO lo abras**:
1. Si alguien está mirando tu pantalla
2. Si estás compartiendo pantalla por Zoom / Meet / Slack
3. "Solo para revisar" — cada vez que abrís hay riesgo de leak accidental

---

## PASO 8 — Rotar una key

Cuando una key se filtra, o cada 6 meses por higiene:

1. Abrí `ROTAR_API_KEYS.md` (también está en el repo, ese SÍ es público)
2. Seguí los pasos del servicio que te corresponde
3. **Actualizá** tu `MIS_API_KEYS.md` con la nueva key + fecha
4. **Anotá** en la "Bitácora de rotaciones" del mismo archivo

---

## Resumen visual

```
TU PC (privado)                     GITHUB (público)
─────────────────                  ─────────────────
MIS_API_KEYS.md  ◄── tu archivo    MIS_API_KEYS.template.md  ◄── plantilla
                     personal con
                     keys reales

.env.demo.local  ◄── solo la       ROTAR_API_KEYS.md         ◄── procedimiento
                     service_role                                de rotación
                     para el seed
                                    COMO_USAR_MIS_API_KEYS.md ◄── este archivo
```

Los archivos de la izquierda **NUNCA** salen de tu PC. Los de la derecha SÍ están en GitHub para que cualquiera (vos en otra PC, un colaborador) pueda ver el procedimiento.

---

## Si te perdés

1. Releé este archivo despacio
2. Si una instrucción no funciona, copiá el error EXACTO y avisame
3. **NUNCA me pegues una key real en el chat** — siempre referenciala como "la sb_secret" o "la de Anthropic"
4. Si dudás si una key se vio: rotala. 5 minutos vs días de problema.
