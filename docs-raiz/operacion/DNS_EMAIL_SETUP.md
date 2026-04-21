# DNS para email — Resend setup (Lote H auditoría pre-launch)

Para que los emails de Paw Friend (welcome, invitaciones, notify-pitch, reminders, weekly reports) no caigan en spam, el dominio `pawfriend.cl` debe tener DNS configurado con SPF, DKIM y DMARC.

---

## Paso 1 — Verificar dominio en Resend

1. Entrar a <https://resend.com/domains>
2. Click `Add Domain` → ingresar `pawfriend.cl`
3. Resend te entrega **3 registros DNS** (SPF + 2 DKIM + MX opcional). Los valores son específicos de tu cuenta.

## Paso 2 — Agregar registros en tu proveedor DNS

Dónde edites DNS depende de dónde registraste `pawfriend.cl`:

- **GitHub Pages + NIC.cl** (caso común Chile): entrar a <https://clientes.nic.cl> → seleccionar dominio → zona DNS.
- **Cloudflare**: <https://dash.cloudflare.com> → dominio → DNS.
- **GoDaddy / Namecheap / otro**: buscar sección DNS / Zone Editor.

Agrega los 3 registros que Resend te mostró. Formato típico:

### SPF (TXT)
```
Host: @  (o pawfriend.cl)
Valor: v=spf1 include:amazonses.com ~all
```

### DKIM (TXT) — 2 registros, uno por cada selector que da Resend
```
Host: resend._domainkey
Valor: (string largo que empieza con "v=DKIM1; k=rsa; p=...")
```

### DMARC (TXT)
Aunque Resend no lo pide explícito, súmalo:
```
Host: _dmarc
Valor: v=DMARC1; p=quarantine; rua=mailto:pawfriendcl@gmail.com; fo=1
```

## Paso 3 — Verificar en Resend

Después de agregar los registros (propagación 5 min a 24h), volver a `https://resend.com/domains` y click `Verify`. Cuando los 3 pasen a verde ✅, el dominio está listo.

## Paso 4 — Smoke test

```powershell
# Enviar email de prueba desde una edge fn deployada
npx supabase functions invoke send-shelter-welcome --body '{"shelter_id":"<un_shelter_id_de_prueba>"}'
```

Verificar:
- Llega a inbox (no spam).
- El "From" dice `no-reply@pawfriend.cl` o similar (no `onboarding@resend.dev` genérico).
- El link embebido funciona.

---

## Checklist pre-launch

- [ ] Dominio `pawfriend.cl` verificado en Resend (3 checks verdes)
- [ ] Prueba de envío desde edge fn llega a Gmail sin caer en spam
- [ ] Prueba de envío a Hotmail/Outlook también OK
- [ ] Remitente efectivo es `no-reply@pawfriend.cl` (no un genérico resend.dev)

## Si no tienes acceso a DNS del dominio

Si el dominio está en NIC.cl y no tienes login, pedirselo al admin del dominio. Mientras tanto, los emails saldrán desde el subdominio default de Resend (`onboarding@resend.dev`) con deliverability más baja — funcional pero con riesgo de spam.

---

## Referencias

- Resend SPF/DKIM setup: <https://resend.com/docs/dashboard/domains/introduction>
- DMARC spec simple: <https://dmarc.org/overview/>
