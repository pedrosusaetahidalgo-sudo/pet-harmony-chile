/**
 * Post SEO #10 — long-tail: "cada cuanto desparasitar perro gato"
 * + "antiparasitario interno externo Chile".
 * Tie-in con trigger auto-reminder (INIT-07) + caso Bravecto.
 */

import { Link } from 'react-router-dom';

export default function Post() {
  return (
    <article className="prose prose-purple max-w-none">
      <p className="lead text-lg text-muted-foreground">
        La pregunta que más me hacen las dueñas primerizas: "¿cada cuánto desparasito?". La
        respuesta corta: interno cada 3 meses, externo cada 1 mes (excepto Bravecto = 3m). Pero el
        "por qué" y los detalles importan — esta guía te los explica claro.
      </p>

      <h2>Dos tipos de antiparasitario — no confundir</h2>

      <h3>Antiparasitario interno (desparasitación)</h3>
      <p>
        Combate parásitos intestinales: tenias, ascáridos, ancilostomas, giardia. Se da en pastilla
        o pipeta oral/transdermal.
      </p>
      <ul>
        <li>
          <strong>Frecuencia estándar</strong>: cada 3 meses, de por vida.
        </li>
        <li>
          <strong>Cachorros</strong>: más frecuente las primeras semanas (ver cronograma abajo).
        </li>
        <li>
          <strong>Ejemplos comerciales Chile</strong>: Drontal, Endogard, Milbemax, Drontal Plus.
        </li>
      </ul>

      <h3>Antiparasitario externo (antipulgas/garrapatas)</h3>
      <p>
        Mata pulgas, garrapatas y, según producto, ácaros. Se aplica en pipeta sobre la piel o
        pastilla masticable.
      </p>
      <ul>
        <li>
          <strong>Frecuencia estándar pipeta</strong>: cada 1 mes.
        </li>
        <li>
          <strong>Excepción Bravecto</strong>: cada 3 meses (perros) o 2-3 meses (gatos).
        </li>
        <li>
          <strong>Ejemplos</strong>: Bravecto, Nexgard, Frontline, Advantix, Simparica.
        </li>
      </ul>

      <h2>Cronograma completo — primer año</h2>

      <h3>Cachorros (perros)</h3>

      <table className="not-prose w-full text-sm border-collapse my-4">
        <thead>
          <tr className="bg-purple-50">
            <th className="text-left p-2 border-b border-purple-100 font-semibold">Edad</th>
            <th className="text-left p-2 border-b border-purple-100 font-semibold">Interno</th>
            <th className="text-left p-2 border-b border-purple-100 font-semibold">Externo</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="p-2 border-b">2 semanas</td>
            <td className="p-2 border-b">1ra dosis</td>
            <td className="p-2 border-b">—</td>
          </tr>
          <tr className="bg-slate-50/50">
            <td className="p-2 border-b">4 semanas</td>
            <td className="p-2 border-b">2da dosis</td>
            <td className="p-2 border-b">—</td>
          </tr>
          <tr>
            <td className="p-2 border-b">6 semanas</td>
            <td className="p-2 border-b">3ra dosis</td>
            <td className="p-2 border-b">—</td>
          </tr>
          <tr className="bg-slate-50/50">
            <td className="p-2 border-b">8 semanas</td>
            <td className="p-2 border-b">4ta dosis</td>
            <td className="p-2 border-b">1ra aplicación</td>
          </tr>
          <tr>
            <td className="p-2 border-b">12 semanas</td>
            <td className="p-2 border-b">Cada 3 meses</td>
            <td className="p-2 border-b">Cada 1 mes (o Bravecto)</td>
          </tr>
        </tbody>
      </table>

      <h3>Adulto y senior</h3>
      <p>
        Una vez el perro pasa los 4-6 meses, el esquema se vuelve mensual externo + cada 3 meses
        interno. No cambia con la edad (senior sigue igual).
      </p>

      <h3>Gatos</h3>
      <p>
        Similar a perros pero la primera dosis interna suele ser a las 4 semanas. Si son gatos 100%
        de interior (nunca salen), algunos vets recomiendan cada 6 meses externo + cada 3 meses
        interno, porque el riesgo de pulga se reduce (no se elimina — zapatos + otros animales traen
        pulgas a casa).
      </p>

      <h2>Caso Bravecto — por qué sí conviene</h2>
      <p>Bravecto es una pastilla masticable que dura 3 meses en perros. Ventajas:</p>
      <ul>
        <li>Menos frecuencia = menos probabilidad de olvidar.</li>
        <li>
          <strong>Efectividad similar o superior</strong> a pipetas mensuales en estudios
          controlados.
        </li>
        <li>
          Si tu perro es de baño frecuente, la pipeta mensual pierde efectividad antes de tiempo.
          Bravecto no se lava.
        </li>
        <li>
          Costo por mes: similar o 10-20% más caro, pero comparado con la conveniencia + no olvidar,
          vale.
        </li>
      </ul>

      <p>
        Desventajas: no todos los perros lo toleran bien (rara vez hay vómito o malestar pasajero
        las primeras 24h). Si tu perro tiene antecedentes de epilepsia, tu vet puede
        contraindicarlo.
      </p>

      <h3>Bravecto gatos</h3>
      <p>
        Existe versión pipeta para gatos (Bravecto Plus), cada 2-3 meses. Incluye protección contra
        gusano del corazón (heartworm), útil si vives en zona caluroso-húmeda.
      </p>

      <h2>Señales que tu mascota necesita desparasitación YA</h2>

      <h3>Parásitos internos</h3>
      <ul>
        <li>Barriga hinchada (especialmente cachorros).</li>
        <li>Pelo opaco, decaído.</li>
        <li>Come mucho pero no sube de peso.</li>
        <li>Gusanos visibles en heces (blancos, parecen granos de arroz = tenias).</li>
        <li>Diarrea intermitente sin explicación.</li>
        <li>Se "restriega" el poto en el suelo (signo clásico de parásitos o glándulas anales).</li>
      </ul>

      <h3>Parásitos externos</h3>
      <ul>
        <li>Rasca mucho, se muerde patas/cola.</li>
        <li>
          Pequeños puntos oscuros en piel (heces de pulga) — frótalos con algodón húmedo: si tiñe
          rojizo = pulgas.
        </li>
        <li>Garrapatas visibles (especialmente orejas, cuello, patas).</li>
        <li>Pérdida de pelo localizada (dermatitis por pulga).</li>
      </ul>

      <h2>Errores comunes</h2>

      <ol>
        <li>
          <strong>"Mi perro no sale a la calle, no necesita"</strong>. Falso. Las pulgas y huevos
          entran en zapatos, ropa, otros animales. Los gatos 100% interior igual pueden tener
          parásitos internos.
        </li>
        <li>
          <strong>Usar producto humano o remedio casero</strong>. El ajo, vinagre, limón NO
          funcionan. Algunos son tóxicos (ajo puede causar anemia hemolítica en perros).
        </li>
        <li>
          <strong>Dar "cuando me acuerdo"</strong>. Salteando 1 ciclo, los parásitos resurgen y el
          ciclo recomienza. Consistencia &gt; cantidad.
        </li>
        <li>
          <strong>Usar el producto de perro en gato</strong>. La permetrina (en muchos antipulgas
          caninos) es <strong>tóxica mortal para gatos</strong>. Siempre usar producto específico
          para la especie.
        </li>
        <li>
          <strong>Aplicar pipeta cuando acabas de bañar</strong>. Esperar 48h post-baño para que la
          piel recupere sus aceites naturales (la pipeta se adhiere ahí).
        </li>
      </ol>

      <h2>¿Cuánto cuesta desparasitar al año?</h2>

      <h3>Perro mediano (15-25 kg)</h3>
      <ul>
        <li>
          Interno: 4 dosis/año × $6-10k = <strong>$24-40k/año</strong>.
        </li>
        <li>
          Externo pipeta mensual: 12 × $10-18k = <strong>$120-216k/año</strong>.
        </li>
        <li>
          Alternativa Bravecto trimestral: 4 × $28-38k = <strong>$112-152k/año</strong>
          (similar o un poco menos que pipeta).
        </li>
      </ul>

      <p>
        Total antiparasitario anual: <strong>$150-250k CLP</strong> para perro mediano. Es
        probablemente el gasto recurrente que más protege a tu mascota de problemas serios.
      </p>

      <h3>Gato</h3>
      <ul>
        <li>Interno: $20-35k/año.</li>
        <li>
          Externo: $60-120k/año (pipeta mensual) o $80-140k/año (Bravecto Plus trimestral con
          heartworm).
        </li>
      </ul>

      <h2>Zoonosis — por qué te afecta a ti también</h2>
      <p>
        Algunos parásitos internos (toxocara, giardia, equinococo) pueden transmitirse de mascota a
        humano, especialmente a niños. Desparasitar a tu mascota también te protege a ti y tu
        familia.
      </p>
      <p>Factores de riesgo zoonosis:</p>
      <ul>
        <li>Niños pequeños que juegan con el perro/gato y se llevan la mano a la boca.</li>
        <li>Embarazadas (toxoplasmosis felina es grave en primer trimestre).</li>
        <li>Personas inmunosuprimidas.</li>
      </ul>

      <h2>¿Cómo recordar?</h2>

      <p>
        El 70% de los dueños que no desparasitan dicen "lo olvidé". La solución no es disciplina
        pura — es tener un sistema.
      </p>

      <div className="not-prose rounded-xl border-2 border-emerald-200 bg-emerald-50 p-5 my-6">
        <p className="text-base font-semibold text-emerald-900 mb-2">🐾 Paw Friend nunca olvida</p>
        <p className="text-sm text-emerald-800 mb-3">
          Cuando registras tu mascota en Paw Friend, se crea automáticamente el esquema completo de
          antiparasitarios. Recibes recordatorio por push + email cuando toca (interno, externo,
          caso Bravecto). Solo confirmas "hecho" y pasa al siguiente.
        </p>
        <Link
          to="/auth"
          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
        >
          Probar gratis →
        </Link>
      </div>

      <h2>Cuándo consultar al vet</h2>
      <p>
        Si estás empezando con tu cachorro/gatito, <strong>consulta al vet antes de comprar</strong>{' '}
        antiparasitario. El vet te receta dosis exacta según peso + edad, y te puede sugerir
        productos específicos según prevalencia en tu zona.
      </p>
      <p>
        Si ya llevás años con tu mascota, puedes comprar directamente en farmacia veterinaria. Eso
        sí: <strong>no rotar productos cada mes</strong> — tu vet establece un esquema y lo sigues.
      </p>
      <p>
        Encuentra vets en{' '}
        <Link to="/veterinarios" className="text-purple-700 underline">
          el directorio Paw Friend
        </Link>{' '}
        filtrando por comuna + especialidad "medicina general".
      </p>

      <h2>Caso especial: viaje fuera de Santiago</h2>
      <p>Si llevas a tu mascota a Valparaíso, sur de Chile o norte, considera:</p>
      <ul>
        <li>
          <strong>Zonas norteñas (Atacama, Antofagasta)</strong>: más garrapatas, riesgo de
          ehrlichia. Intensifica antiparasitario externo.
        </li>
        <li>
          <strong>Sur (zonas lluviosas)</strong>: más riesgo giardia y parásitos del agua. Refuerza
          interno antes del viaje.
        </li>
        <li>
          <strong>Salida del país</strong>: requiere certificado veterinario oficial con
          desparasitación reciente (documentada). Agenda con vet 2-4 semanas antes.
        </li>
      </ul>

      <div className="not-prose border-t border-slate-200 pt-6 mt-8">
        <p className="text-sm text-muted-foreground">
          Publicado 21 abril 2026 · Paw Friend · 7 min lectura
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          <strong>Sigue leyendo:</strong>{' '}
          <Link to="/blog/cronograma-vacunas-cachorro-chile" className="text-purple-700 underline">
            Cronograma vacunas cachorro
          </Link>
          {' · '}
          <Link
            to="/blog/cuanto-cuesta-tener-perro-primer-ano-chile"
            className="text-purple-700 underline"
          >
            Presupuesto primer año
          </Link>
        </p>
      </div>
    </article>
  );
}
