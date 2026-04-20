# Outreach Paw Voices — 3 influencers prospectos

> **Objetivo**: convertir 3 creators (conocidos de Pedro) en los primeros **Paw Voice Fundadores** antes del lanzamiento 1 de mayo 2026.
>
> **Canal principal**: DM Instagram o WhatsApp (no email formal — rompe el tono).
> **Canal secundario**: audio de 1 min por WhatsApp si ya existe trust previo.
>
> **Versión**: 2026-04-19 · **3 prospectos sin confirmar**.

---

## 1. Perfiles de los 3 prospectos (rellenar antes de enviar)

### Prospecto 1

| Campo | Valor |
|---|---|
| Nombre | ________ |
| Handle IG | @________ |
| Handle TikTok | @________ |
| Audiencia aprox | ________ |
| Mascota(s) | ________ |
| Relación actual con Pedro | (amigo/conocido/presentado) |
| Ya conocen Paw Friend? | (sí/no) |
| Mejor canal para primer contacto | (DM IG / WhatsApp / otro) |

### Prospecto 2

| Campo | Valor |
|---|---|
| Nombre | ________ |
| Handle IG | @________ |
| Handle TikTok | @________ |
| Audiencia aprox | ________ |
| Mascota(s) | ________ |
| Relación actual con Pedro | ________ |
| Ya conocen Paw Friend? | ________ |
| Mejor canal para primer contacto | ________ |

### Prospecto 3

| Campo | Valor |
|---|---|
| Nombre | ________ |
| Handle IG | @________ |
| Handle TikTok | @________ |
| Audiencia aprox | ________ |
| Mascota(s) | ________ |
| Relación actual con Pedro | ________ |
| Ya conocen Paw Friend? | ________ |
| Mejor canal para primer contacto | ________ |

---

## 2. Mensaje 1 — Primer contacto (DM o WhatsApp)

**Principio**: corto, cálido, personal. NO copiar/pegar idéntico a los 3 — variar 2-3 líneas por prospecto.

### Template base

```
Hola [nombre] 👋

Te hablo para algo muy específico y poco convencional. Pronto lanzo
Paw Friend (pawfriend.cl) — una app chilena 100% gratis para la
salud y comunidad de mascotas, hecha por mí desde cero con mucho amor
a Kai (mi pastor suizo) y Ema (mi gata).

Te elegí a ti porque [1 línea PERSONALIZADA — lo que admiras
genuinamente de su contenido con sus peludos]. Me gustaría invitarte
a ser una de las primeras 6 Paw Voices Fundadoras.

No es un deal publicitario. No te pago, no te pido guiones, no pongo
deadlines. Es un espacio cálido para creadores peludos que quieran
estar en el día 1 de un proyecto hecho con el corazón.

Si te tinca, te dejo un link con todos los detalles — sin prisa,
léelo cuando tengas un rato:

https://pawfriend.cl/pitch/voices.html

Y si tienes dudas, respondemos por acá o nos juntamos a tomar un
café con los peludos 🐾

Abrazo,
[Pedro / Paw Founder]
```

### Personalización sugerida (línea 2 del template)

- **Si crea reels educativos**: "porque educas desde la experiencia y no desde el script"
- **Si es creator cute/lifestyle**: "porque la forma en que muestras a [nombre de la mascota] se siente real, no montada"
- **Si es vet creator**: "porque combinas profesional con cariño, cosa rarísima en redes"
- **Si es adopta-rescata**: "porque pones corazón donde pocos miran"

### Qué NO decir en el primer mensaje

- ❌ "Eres el/la top creator de Chile" — suena falso.
- ❌ "Tu audiencia es perfecta para nosotros" — suena transaccional.
- ❌ "Te vamos a pagar" — no es cierto, y si lo fuera, no es el enganche correcto.
- ❌ "Firma acá" — hay 0 contrato. El link lleva a un deck, no a un form.

---

## 3. Mensaje 2 — Follow-up (48-72 hrs después si no respondieron)

```
Hola [nombre], te dejo vivirlo sin presión. Solo quería marcarte que
el cupo de las 6 Paw Voices Fundadoras se cierra el 1 de mayo y me
encantaría que estés dentro.

Si quieres, te mando un audio de 1 min contándote de qué se trata
sin que tengas que leer nada. O nos tomamos un café con los peludos.

Como quieras.
```

**No mandar un 3er mensaje** si no responden a este. Respetar. Mantener la puerta abierta sin ser insistente.

---

## 4. Mensaje 3 — Respuesta positiva ("me interesa, cuéntame")

```
¡Qué bueno!

Te explico rápido: vas a tener un perfil destacado en pawfriend.cl/paw-voices
con tu foto, tu peludo, tu historia corta y un código promo único.

Tu código regala 3 meses de Paw Member bonificados a tu audiencia
cuando se registran. Tú ves en un panel cuántos se sumaron desde tu link.

De tu parte: 1 reel o story en los primeros 30 días del lanzamiento
mencionando Paw Friend desde tu experiencia real (la conversación
con tu peludo, la vez que buscaste un vet nuevo, lo que te nazca).
Nada más. Sin guión, sin CTA forzado.

Como regalo de bienvenida, te propongo grabar **1 reel co-creado con
Kai (mi pastor suizo) o Ema (mi gata)** — nos vemos un rato, grabamos
algo auténtico, tú lo subes si quieres. Bono de historia compartida.

¿Te tinca? Si sí, solo responde "voy" y te agendo 15 min para validar
detalles + pasarte acceso a tu perfil en modo draft.

Abrazo,
[Pedro]
```

---

## 5. Onboarding post-confirmación (qué pasa cuando dicen "voy")

### Día 0 — Confirmación verbal
- Mensaje por WhatsApp con fecha tentativa del primer contenido.
- Crear row en `paw_voices` DB con `status='active'`, `tier='founder'`.

### Día 1-2 — Perfil en la app
- Subir foto (la que ellos elijan) + handle + mini bio (2 oraciones, en su voz).
- Asignar código promo único `PAWVOICE_[handle]` que regala 3 meses Paw Member.
- Mandar screenshot del perfil para que lo aprueben antes de publicar.

### Día 3 — Materiales gráficos
- Crear 1 "carrusel de bienvenida" IG (3 slides): foto de su peludo + logo Paw Friend + texto "ahora soy Paw Voice Fundadora/o".
- Opcional: 1 reel de 15s mostrando la app con su mascota de cameo.

### Día 7 — Publicación coordinada
- Ellos suben su primer post/reel. Paw Friend hace repost a las 2 hrs.
- Paw Friend sube 1 post agradeciendo públicamente (si ellos autorizan).

### Mes 1 — Check-in
- WhatsApp: "¿cómo va? ¿alguna fricción? ¿qué cambiarías?"
- Reporte privado de métricas del código promo.

### Mes 3 — Escalamiento
- Si la relación fluye, explorar 2ª colaboración (live conjunto, entrevista para blog, contenido temático).
- Si no fluye (no publicaron, no respondieron), **pausa silenciosa del badge** sin drama.

---

## 6. Qué ganan (recap ultra-tight para pegar en mensaje si preguntan)

```
🎙️ PAW VOICE FUNDADOR/A — QUÉ GANAS

✅ Perfil destacado permanente en pawfriend.cl/paw-voices
   (primeros en grid, prioridad histórica garantizada).
✅ Código promo único → 3 meses Paw Member bonificados para tu
   audiencia (badge + descuentos).
✅ Panel personal con métricas de clicks y suscripciones.
✅ 1 reel co-creado con Kai/Ema como regalo de bienvenida.
✅ Cuando activemos Paw Voice Pro (con fee fijo pagado) — target
   Q3-Q4 2026 — tienes acceso garantizado con 2x engagement bonus
   por 6 meses.
✅ Pro tip: primer acceso a eventos futuros, merch, viajes.
```

---

## 7. Qué pedimos (recap ultra-tight)

```
🤝 LO QUE TE PEDIMOS

- 1 post/reel/story en los primeros 30 días post-lanzamiento.
- Mantener link de Paw Friend en tu bio por al menos 3 meses.
- 1 contenido mensual mínimo para mantener el badge activo
  (si te tomas un break más largo, pausamos tu badge sin drama y
  lo reactivamos cuando vuelvas).
- Honestidad: si no te sirve Paw Friend, puedes decirlo. No
  condicionamos tu voz.
```

---

## 8. Preguntas frecuentes de creators (copia/pega si preguntan)

**"¿Cuánto me pagan?"**
> Cero fijo hoy. Te doy badge, perfil destacado, beta access y comunidad. Cuando cerremos Seed Round (target Q3-Q4 2026) activamos Paw Voice Pro con fee fijo mensual. Los fundadores tienen prioridad garantizada.

**"¿Puedo seguir con otras marcas pet (ej. Royal Canin)?"**
> Absolutamente. No exigimos exclusividad. Si alguna marca con la que trabajas eventualmente se vuelve Paw Partner o Paw Company, te avisamos para que sepas del cruce.

**"¿Qué pasa si Paw Friend no despega?"**
> Tu badge desaparece con la app. No hay archivo público que te asocie negativamente. Lo que publicaste queda como contenido tuyo regular.

**"¿Puedo hablar mal de una marca que eventualmente sea Paw Partner o Paw Company?"**
> Sí. No condicionamos tu opinión. Solo te pedimos que cuando menciones a Paw Friend lo hagas desde tu experiencia real, no desde un guión.

**"¿Puedo salirme y borrar mi perfil en 24 hrs?"**
> Sí. Mensaje por WhatsApp basta. Lo remuevo al día siguiente hábil. Sin preguntas.

**"¿Cuál es la vibe del proyecto?"**
> Home-made Chile. Una persona detrás (yo). Apoyo de IA, pero decisiones humanas. Sin VCs presionando por ratios. Hecho por amor a Kai y Ema, y a los peludos del país. Si eso te resuena, eres del club.

**"¿Hay algún compromiso contractual?"**
> No. Solo un acuerdo verbal/por WhatsApp. Si quieres algo por escrito simple, lo redactamos. Pero no es obligación — las cosas bonitas se cuidan solas.

---

## 9. Red flags a evitar al prospectar

- **No prometer plata en el futuro sin trigger claro**: si decimos "te pagaremos cuando crezcamos", sonamos a proyecto fantasma. Siempre especificar trigger (10K Paw Members o Seed Round).
- **No pedir exclusividad implícita**: algunos creators pueden asumir que "si aceptas somos exclusivos". Aclarar desde el día 1 que NO hay exclusividad.
- **No prometer alcance a un producto chico**: al día del lanzamiento Paw Friend puede tener 500 usuarios. No decir "te damos visibilidad ante miles". Decir honestamente: "estás entrando al día 1 de un proyecto que va a crecer; es tu posición histórica lo que vale".
- **No insistir más de 2 veces**: respetar el silencio. Si no responden al follow-up, cerrar puerta con dignidad ("cuando puedas dame una ojeada al deck, abrazo").

---

## 10. Frases de cierre emocional (para usar si sientes que están en el sí/no)

1. "Yo hice Paw Friend por amor a mis peludos. La verdad es que quiero que los primeros Paw Voices sientan lo mismo. Si te nace, bienvenida/o. Si no te nace, te entiendo 100%."

2. "Mira, si esto falla, el peor escenario es que publicaste algo de tu peludo (que ya publicas igual). Si funciona, fuiste parte del capítulo 1 de un proyecto chileno hecho con alma."

3. "No me urge tu respuesta. Te dejo el link y vuelves cuando te tinque — aunque sea en 2 semanas. Lo que me importa es que te llegue bien, no que decidas rápido."

---

## 11. Post-rechazo (si dicen "gracias pero no")

```
¡Totalmente! Gracias por el tiempo y por considerar. Cualquier cosa,
ahí estamos. Y si en algún momento quieres sumarte después del
lanzamiento, aunque ya no sea como fundador/a, siempre hay lugar en
Paw Friend para gente que quiere a los animales.

Abrazo a ti y a [nombre mascota] 🐾
```

**No insistir. No hacer guilt trip. Cerrar con elegancia.** El "no" de hoy puede ser "sí" en 6 meses cuando vean el proyecto funcionando.

---

## 12. Checklist antes de mandar cada mensaje

- [ ] Tabla del prospecto rellenada (sección 1).
- [ ] Línea personalizada del template (sección 2) SÍ está personalizada.
- [ ] Handle verificado.
- [ ] Mensaje probado leyéndolo en voz alta — ¿suena Pedro o suena script?
- [ ] Link `https://pawfriend.cl/pitch/voices.html` pegado y funcionando (probar antes).
- [ ] Respeto al canal preferido del prospecto (IG vs WhatsApp vs otro).
- [ ] Hora razonable (no 1 AM, no 7 AM).

---

**Contacto**: `pedrosusaeta@pawfriend.cl`
**Versión**: 2026-04-19
**Hecho en Chile con amor a los peludos 🐾**
