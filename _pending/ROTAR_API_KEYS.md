# Cómo rotar todas las API keys de Paw Friend

> Documento de procedimiento. Aplicar cuando: (a) hubo un leak (key pegada en chat, screenshot, repo público, log), (b) sale alguien del equipo con acceso, (c) auditoría preventiva trimestral.
>
> **Regla de oro**: si tienes DUDA de si una key se vio, rótala. Es 5 minutos y vale la pena.

---

## Inventario de keys del proyecto

| Servicio | Key | Dónde se usa | Severidad si se filtra |
|---|---|---|---|
| Supabase | `service_role` (secret) | Edge functions, scripts de seed | 🔴 CRÍTICA — bypass total de RLS |
| Supabase | `publishable` (anon) | `src/integrations/supabase/client.ts` (frontend) | 🟢 Pública por diseño |
| Supabase | `JWT secret` | Verificación de tokens auth | 🔴 CRÍTICA — falsificación de sesiones |
| Anthropic | API key Claude | Edge functions de IA (`pet-assistant`, `medical-suggestions`, etc.) | 🟠 ALTA — gasto monetario |
| Flow.cl | `FLOW_API_KEY` + `FLOW_SECRET_KEY` | `flow-create-subscription`, `flow-webhook` | 🔴 CRÍTICA — pagos |
| GitHub | Personal access token (si existe) | Pushes desde scripts | 🟠 ALTA — escritura en repo |

---

## Antes de empezar (10 min)

1. **Anotar en un papel** (o gestor de contraseñas como Bitwarden / 1Password) qué keys vas a rotar y en qué orden.
2. **Verificar que tienes acceso de admin** a:
   - Dashboard Supabase: https://supabase.com/dashboard/project/gwailbjlvevkhwcrovfd
   - Anthropic Console: https://console.anthropic.com/settings/keys
   - Flow.cl: https://www.flow.cl/app
3. **Tener listo el repo local** con `git status` limpio (por si hay que pushear cambios).
4. **Aviso**: durante la rotación de Supabase service_role, las edge functions pueden fallar por unos segundos hasta que actualices el secret. Si está en producción, hazlo en horario de poco tráfico.

---

## 1. Rotar Supabase `service_role` (la más crítica)

**Cuándo**: si se leakeó en chat, screenshot, log, repo. SIEMPRE después de un incidente.

### Pasos
1. Ir a https://supabase.com/dashboard/project/gwailbjlvevkhwcrovfd/settings/api
2. Sección **"Project API keys"** → fila `service_role` → click en **"Reset"** o **"Roll"** o **"Generate new"**.
3. Confirmar. La key vieja queda invalidada inmediatamente.
4. **Reveal** la nueva key, copiarla.
5. **Actualizar el secret en Supabase Functions** (no en el repo):
   ```bash
   npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<nueva> --project-ref gwailbjlvevkhwcrovfd
   ```
   ⚠️ NO pegar la key en el chat con asistentes, NO commitearla, NO subirla a Slack.
6. **Actualizar `.env.demo.local` local** si lo usas para el script de seed:
   ```powershell
   Set-Content -Path .env.demo.local -Value "SUPABASE_URL=https://gwailbjlvevkhwcrovfd.supabase.co`nSUPABASE_SERVICE_ROLE_KEY=<nueva>"
   ```
7. **Verificar** que las edge functions siguen funcionando:
   - Probar `flow-create-subscription` desde la app (intentar upgrade a Premium en una cuenta de prueba)
   - Revisar logs en https://supabase.com/dashboard/project/gwailbjlvevkhwcrovfd/functions
8. **Listo**. La rotación tarda < 1 minuto.

---

## 2. Rotar Supabase `publishable` (anon) key

**Cuándo**: rara vez. Solo si sospechas que la usaron para algo malicioso (spam de signups, enumeración de tablas con RLS débil). Es pública por diseño, no es urgente.

### Pasos
1. Dashboard → Settings → API → fila `publishable` (o `anon`) → Reset.
2. Copiar la nueva.
3. **Actualizar `src/integrations/supabase/client.ts`** (esa key está hardcoded en el frontend, está ok porque es pública):
   - Buscar el archivo: `src/integrations/supabase/client.ts`
   - Reemplazar la string vieja por la nueva
4. `npm run build` para generar `docs/` actualizado.
5. `git add -A && git commit -m "chore: rotate supabase publishable key" && git push origin main`.
6. Esperar a que GH Pages despliegue (~2 min).
7. La key vieja deja de funcionar en el momento de la rotación → la app web vieja en cache puede romper hasta que el user refresque (Ctrl+Shift+R).

### ⚠️ Notas sobre legacy keys de Supabase
A partir de mediados de 2026 Supabase deshabilita las **legacy API keys** (las JWT viejas tipo `eyJ...` con role `anon` / `service_role`) en favor del nuevo sistema (`sb_publishable_*` / `sb_secret_*`). Si te aparece el error **"Legacy API keys are disabled"** al loguearte:
- **Solución rápida**: Dashboard → Settings → API → habilitar legacy keys (toggle).
- **Solución correcta**: migrar `client.ts` y los secrets de las edge functions al sistema nuevo. Ver Prompt 10 en `PROMPTS_PROXIMA_SESION.md`.

---

## 3. Rotar Supabase JWT secret

**Cuándo**: si sospechas que alguien lo tiene (extremadamente raro, normalmente solo lo ve admin del dashboard).

### Pasos
1. Dashboard → Settings → API → sección "JWT Settings" → **Generate new secret**.
2. **TODOS los users quedan deslogueados inmediatamente**. Los JWTs emitidos con el secret viejo dejan de validar.
3. Avisar a los users (si hay un canal) que vuelvan a loguear.
4. No requiere cambios en el repo — el secret no se usa desde el código cliente.

---

## 4. Rotar Anthropic API key

**Cuándo**: si se leakeó, o si ves uso anormal en https://console.anthropic.com/settings/usage.

### Pasos
1. Ir a https://console.anthropic.com/settings/keys
2. Crear una **nueva** key (no borres la vieja todavía — primero rotar y validar).
3. Copiar la nueva.
4. Actualizar el secret en Supabase Functions:
   ```bash
   npx supabase secrets set ANTHROPIC_API_KEY=<nueva> --project-ref gwailbjlvevkhwcrovfd
   ```
5. Verificar que las edge functions de IA siguen funcionando:
   - Probar `pet-assistant` desde la app (preguntar algo a la IA en una mascota)
   - Revisar logs en Supabase Functions dashboard
6. **Después de confirmar que la nueva funciona**, volver a Anthropic Console y borrar la vieja.
7. Confirmar que el spend cap sigue en USD 10/mes (https://console.anthropic.com/settings/limits).

---

## 5. Rotar Flow.cl API keys

**Cuándo**: si se leakearon, o si Flow notifica actividad sospechosa.

### Pasos
1. Ir a https://www.flow.cl/app/web/misDatos.php → sección "Configuración API" o similar.
2. Generar nuevas `apiKey` y `secretKey`.
3. Actualizar **AMBOS secrets** en Supabase Functions:
   ```bash
   npx supabase secrets set FLOW_API_KEY=<nueva> --project-ref gwailbjlvevkhwcrovfd
   npx supabase secrets set FLOW_SECRET_KEY=<nueva> --project-ref gwailbjlvevkhwcrovfd
   ```
4. Probar el flujo end-to-end con una cuenta de prueba:
   - Login → /upgrade → Pagar mensual (Flow tiene modo sandbox para tests)
   - Verificar que el webhook llegó y aplicó premium
5. Si todo OK, borrar las keys viejas en Flow.

⚠️ Flow normalmente NO permite tener 2 keys activas simultáneas. La rotación es atómica: la vieja muere en el momento de generar la nueva. Hazlo en horario de poco tráfico.

---

## 6. Rotar GitHub Personal Access Token (si aplica)

**Cuándo**: solo si alguna vez generaste un PAT para pushes automatizados (raro en este proyecto).

### Pasos
1. https://github.com/settings/tokens → identificar el PAT en uso.
2. Generar uno nuevo con los mismos scopes.
3. Actualizar donde esté guardado (gestor de credenciales del SO, GitHub Actions secrets, etc.).
4. Borrar el viejo.

---

## Checklist post-rotación

- [ ] Edge functions siguen respondiendo (probar 1 de cada tipo: AI, Flow, médica)
- [ ] Login a la app funciona
- [ ] Upgrade a Premium funciona end-to-end
- [ ] Generar PDF de ficha clínica funciona
- [ ] Logs de Supabase Functions sin errores nuevos en los últimos 10 min
- [ ] No hay keys viejas en el repo (`git grep "eyJ"` no debería devolver nada sospechoso fuera de `client.ts`)
- [ ] Memoria del incidente registrada (qué se filtró, cuándo, qué se rotó)

---

## Reglas operativas permanentes

1. **NUNCA pegar secrets en el chat con asistentes de IA.** Aunque sean privados, los logs pueden persistir.
2. **NUNCA commitear archivos `.env*`.** El `.gitignore` ya cubre `*.local`, `.env`, `.env.local`, etc.
3. **NUNCA pegar el output de `supabase secrets list`** — incluye los valores.
4. **Cuando un asistente te pida una key**, pégala en el archivo `.env` correspondiente, NO en el chat. Después referenciala con `--env-file`.
5. **Si dudas si una key se vio**, rota. Tarda 5 minutos y duerme tranquilo.
6. **Documentar el incidente**: qué key, cuándo, en qué canal, cuándo se rotó. Tener esto te salva si después aparece uso indebido.

---

## Links rápidos

- Supabase API settings: https://supabase.com/dashboard/project/gwailbjlvevkhwcrovfd/settings/api
- Supabase Functions logs: https://supabase.com/dashboard/project/gwailbjlvevkhwcrovfd/functions
- Anthropic keys: https://console.anthropic.com/settings/keys
- Anthropic usage: https://console.anthropic.com/settings/usage
- Flow.cl panel: https://www.flow.cl/app
- GitHub tokens: https://github.com/settings/tokens
