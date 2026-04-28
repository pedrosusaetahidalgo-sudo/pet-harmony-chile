# Outreach a refugios — dataset Nose Print

> Objetivo: conseguir fotos etiquetadas por individuo (mismo perro/gato fotografiado en distintos días) para fine-tuning de re-identificación. Sin esto no llegamos a >0.80 separación.
>
> Lo otro (Dog.ceo + Cat API + Oxford Pets + Stanford Dogs) sirve sólo para pre-training general.

---

## Refugios prioritarios (Chile)

| Refugio | Contacto | Por qué los priorizo |
|---|---|---|
| **Proanimal** | https://www.proanimal.cl/ — contacto@proanimal.cl | Volumen alto, ya digitalizan |
| **Arca de Noé** | https://arcadenoe.cl/contacto | Foto-archivo grande de adopciones |
| **Patitas con Amor** | Instagram @patitas.con.amor.chile | Activo, comunicación directa |
| **PAIP** (Por los Animales que Importan al Planeta) | https://paip.cl | Estructura formal, MoU posible |
| **Refugio El Arca** | refugioelarca@gmail.com | Carpetas por animal documentadas |
| **Adoptame.cl** | hola@adoptame.cl | Plataforma agregadora, varios refugios en uno |
| **Animalfiel** | https://animalfiel.com/contacto | Plataforma agregadora |
| **Fundación Cariño Animal** | Instagram @fundacioncarinoanimal | Casos médicos con seguimiento fotográfico |
| **Fundación Galgos Chile** | galgoschile@gmail.com | Grupo cohesionado, mismas razas |
| **Refugio Voz Animal** | vozanimalrefugio@gmail.com | Operación pequeña, decisión rápida |

> Si Pedro tiene contactos directos con alguno, esos van **primero** (warm intro siempre gana al cold email).

---

## Email — versión corta (cold)

**Asunto**: Colaboración con Paw Friend — IA de identificación por nariz para mascotas

> Hola [nombre del refugio],
>
> Soy Pedro Susaeta, fundador de **Paw Friend** (pawfriend.cl), una app gratuita para dueños de mascotas en Chile. Estamos desarrollando un sistema de identificación biométrica por **huella nasal** (la nariz de cada perro/gato es única, como una huella digital). El objetivo es complementar el chip y ayudar a recuperar mascotas perdidas, sobre todo en refugios y en la calle.
>
> Para entrenar el modelo necesitamos algo que sólo refugios como ustedes tienen: **fotos de la misma mascota en distintos momentos** (ingreso, control veterinario, adopción). No nos sirven fotos sueltas — necesitamos saber que "Firulais foto 1" y "Firulais foto 5" son el mismo perro.
>
> **Lo que pediríamos**:
> - Acceso a las fotos que ya tienen archivadas, organizadas por animal (cualquier formato: carpetas, álbumes, drive, etc).
> - Permiso para usar esas fotos sólo para entrenar el modelo (no se publican individualmente).
>
> **Lo que ofrecemos a cambio**:
> - Cuenta **Paw Friend Refugio gratuita** con bulk import de mascotas, ficha clínica completa, transferencia al adoptante con un link, perfil público en pawfriend.cl/refugios.
> - Crédito explícito en la app cuando lancemos el feature ("entrenado con la colaboración de [nombre]").
> - Acceso prioritario al sistema de identificación cuando esté operativo (escanear con celular para verificar identidad).
> - Donaciones dirigidas a su refugio cuando activemos esa funcionalidad.
>
> Si les hace sentido, una llamada de 20 minutos para mostrarles la app y conversar los detalles. Si no es prioridad ahora, también lo entiendo.
>
> Gracias por lo que hacen,
> Pedro Susaeta
> pawfriend.cl
> +56 9 [tu número]

---

## Email — versión larga (warm intro o si responden)

Misma estructura pero agregando:

> **Cómo funciona técnicamente** (sin meter mucho cuento):
> - Tomamos una foto de la nariz al ingreso del animal.
> - El modelo genera un "vector" único (como un hash) de esa nariz.
> - Cuando el animal aparece después (perdido, otro refugio, dueño nuevo), una nueva foto se compara contra la base y devuelve coincidencia con confianza %.
>
> **Por qué importa para Chile específicamente**:
> - La Ley 21.020 (Cholito) obliga al chip pero la fiscalización es baja y muchos animales callejeros nunca pasan por chipeo.
> - El nose print no requiere intervención (no se pierde, no caduca, no necesita lector RFID).
> - Para refugios significa: si un animal ya pasó por ustedes y vuelve, lo identifican al instante.
>
> **Privacidad**:
> - Las fotos no se publican individualmente. Se usan para entrenar el modelo y después se descartan o se mantienen en archivo cifrado.
> - Pueden firmar un acuerdo simple de uso (puedo enviarles borrador).
>
> **Tiempo del refugio**: idealmente cero esfuerzo extra. Si ya tienen fotos en orden, sólo nos pasan acceso. Si no, podemos mandar a alguien (o yo mismo) a digitalizar lo que tengan en papel.

---

## Plan de seguimiento

1. **Día 1** (Pedro): mandar el email corto a los 10 de la lista. Asunto idéntico, cuerpo personalizado por refugio (mencionar algo específico que conoces de ellos).
2. **Día 4**: bump amigable a los que no responden. "Sé que están full, sólo me aseguro que llegó."
3. **Día 7**: a los que respondieron interesados, agendar llamada 20 min con demo.
4. **Día 14**: cerrar acuerdo con los primeros 2-3 que digan sí. MoU simple (lo armo cuando llegue).
5. **Día 21**: empezar a recibir fotos / dar acceso. Subirlas a `_pending/datasets/refugios/<nombre>/<pet_id>/foto_NNN.jpg`.

---

## Métricas para validar que el approach funciona

| Métrica | Objetivo realista | Por qué |
|---|---|---|
| Refugios contactados | 10 | Lista completa |
| Tasa de respuesta | 30-40% | Cold email a refugios suele ser ~30% si el copy es decente |
| Refugios que dan fotos | 2-4 | Suficiente para fine-tuning si cada uno aporta 50-200 individuos |
| Individuos únicos totales | 200-500 | Mínimo para mover separación de 0.45 → 0.80+ |
| Fotos por individuo (mediana) | 3-5 | Si es < 3, el triplet loss no funciona bien |

---

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Refugios no responden | Bump x2, después WhatsApp directo, después intro vía conocido |
| Fotos sin labels (todas mezcladas) | Pedirles que organicen o ofrecer ir presencialmente a ayudar |
| Fotos de mala calidad (oscuras, lejos) | Filtrar con script + descartar las que el modelo no puede leer |
| Privacidad / GDPR-Chile (Ley 19.628) | MoU con cláusula de uso interno + no-redistribución |
| Refugios piden plata | Honestidad: "no hay presupuesto pago hoy, pero ofrezco cuenta refugio + crédito + donaciones dirigidas cuando lance" |

---

## Notas para Pedro

- Mandar TODO desde tu mail real (pedro.susaeta.hidalgo@gmail.com o pawfriendcl@gmail.com), no desde un alias raro. Refugios chilenos confían más en personas que en marcas.
- Adjuntar 1 captura de la app + link a pawfriend.cl. Sin PDF, sin deck. Email corto = más respuestas.
- Si responden con dudas técnicas, derivar a una llamada — no debatir por mail.
- Si un refugio dice "no nos interesa", agradecer y pedir si conocen a alguien que sí. Las recomendaciones internas del mundo refugio son oro.
