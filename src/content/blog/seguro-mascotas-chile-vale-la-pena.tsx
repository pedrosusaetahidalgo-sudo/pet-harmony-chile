/**
 * Post SEO #6 — long-tail: "seguro mascotas Chile precio" + "vale la pena pet insurance".
 * Tema: seguros pet, comparativa aseguradoras chilenas, cálculo ROI.
 * Tie-in: directorio vets + ficha médica (base para diagnóstico cubierto).
 */

import { Link } from 'react-router-dom';

export default function Post() {
  return (
    <article className="prose prose-purple max-w-none">
      <p className="lead text-lg text-muted-foreground">
        Un seguro para tu mascota cuesta entre $15.000 y $35.000 al mes en Chile. Puede ser el mejor
        gasto que haces o dinero tirado, según varios factores que pocos explican. Esta guía te
        ayuda a decidir con datos reales.
      </p>

      <h2>¿Qué es un seguro pet y qué cubre?</h2>
      <p>
        Es una póliza mensual que paga (parcial o totalmente) gastos veterinarios cuando tu mascota
        se enferma o accidenta. A diferencia del seguro de salud humano, en Chile los seguros pet
        son 100% privados, no hay cobertura Fonasa/Isapre equivalente.
      </p>

      <p>Coberturas típicas:</p>
      <ul>
        <li>
          <strong>Consultas por enfermedad</strong>: reembolso 60-80% del valor.
        </li>
        <li>
          <strong>Exámenes y radiografías</strong>: reembolso parcial por patología.
        </li>
        <li>
          <strong>Cirugías</strong>: tope $500.000 - $2.500.000 CLP según póliza.
        </li>
        <li>
          <strong>Hospitalización</strong>: tope por noche + límite anual.
        </li>
        <li>
          <strong>Medicamentos con receta</strong>: reembolso parcial.
        </li>
        <li>
          <strong>Urgencias 24h</strong>: cubre recargo nocturno.
        </li>
      </ul>

      <p>Coberturas que generalmente NO están incluidas:</p>
      <ul>
        <li>
          Vacunas y chequeos preventivos (son ingresos seguros para la aseguradora, no gastos).
        </li>
        <li>Esterilización rutinaria.</li>
        <li>Limpieza dental programada.</li>
        <li>Enfermedades pre-existentes al momento de contratar.</li>
        <li>Partos programados.</li>
        <li>Tratamientos alternativos (homeopatía, acupuntura).</li>
      </ul>

      <h2>Rangos de precio — Chile 2026</h2>

      <table className="not-prose w-full text-sm border-collapse my-4">
        <thead>
          <tr className="bg-purple-50">
            <th className="text-left p-2 border-b border-purple-100 font-semibold">Plan</th>
            <th className="text-left p-2 border-b border-purple-100 font-semibold">Precio/mes</th>
            <th className="text-left p-2 border-b border-purple-100 font-semibold">
              Tope anual cirugía
            </th>
            <th className="text-left p-2 border-b border-purple-100 font-semibold">Deducible</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="p-2 border-b">Básico</td>
            <td className="p-2 border-b">$12.000 - $18.000</td>
            <td className="p-2 border-b">$500.000 - $800.000</td>
            <td className="p-2 border-b">$30.000 por evento</td>
          </tr>
          <tr className="bg-slate-50/50">
            <td className="p-2 border-b">Medio</td>
            <td className="p-2 border-b">$18.000 - $27.000</td>
            <td className="p-2 border-b">$1.200.000 - $1.800.000</td>
            <td className="p-2 border-b">$20.000 por evento</td>
          </tr>
          <tr>
            <td className="p-2 border-b">Premium</td>
            <td className="p-2 border-b">$28.000 - $45.000</td>
            <td className="p-2 border-b">$2.000.000 - $3.000.000</td>
            <td className="p-2 border-b">$0 - $15.000 por evento</td>
          </tr>
        </tbody>
      </table>

      <p className="text-xs text-muted-foreground">
        Rangos referenciales 2026. Precio real depende de especie, raza, edad y comuna. Mejor pedir
        3 cotizaciones antes de decidir.
      </p>

      <h2>Aseguradoras pet en Chile 2026</h2>

      <p>
        Principales aseguradoras que ofrecen producto pet a nivel nacional (alfabético, sin
        ranking):
      </p>

      <ul>
        <li>
          <strong>Chilena Consolidada</strong> — planes desde básico a premium. Red amplia.
        </li>
        <li>
          <strong>HDI Seguros</strong> — entró al mercado pet ~2024. Precios competitivos.
        </li>
        <li>
          <strong>Metlife Chile</strong> — producto pet orientado a premium.
        </li>
        <li>
          <strong>SURA Chile</strong> — alternativas flexibles.
        </li>
        <li>
          <strong>Aseguradoras específicas pet</strong> (hay 3-4 marcas especializadas, más ágiles
          en procesos de reembolso).
        </li>
      </ul>

      <p>
        Paw Friend no recomienda aseguradora específica — cada caso es distinto. Sí recomendamos
        pedir cotización a <strong>mínimo 3 aseguradoras</strong> antes de contratar.
      </p>

      <h2>Cuándo SÍ vale la pena</h2>

      <ol>
        <li>
          <strong>Raza predispuesta a problemas médicos</strong>. Bulldogs franceses (problemas
          respiratorios), Golden Retriever (cáncer), Dachshund (hernias discales), Pastor Alemán
          (displasia cadera). Estadísticamente, estas razas gastan 2-3x en vet vs mestizo sano.
        </li>
        <li>
          <strong>Mascota senior</strong>. A partir de los 7-8 años, probabilidad de enfermedad
          crónica sube exponencialmente. Pero ojo: contratar después de los 10 años es caro o
          imposible (muchas aseguradoras rechazan).
        </li>
        <li>
          <strong>Presupuesto mensual apretado</strong>. Si una cirugía de $1.500.000 te quiebra
          financieramente, mejor seguro que tarjeta de crédito.
        </li>
        <li>
          <strong>No sabes decir que no</strong>. Hay dueños que necesitan el colchón emocional de
          saber que cualquier tratamiento posible se va a hacer. Vale la pena el seguro solo para
          tener esa paz mental.
        </li>
      </ol>

      <h2>Cuándo NO vale la pena</h2>

      <ol>
        <li>
          <strong>Mascota joven, sana, raza mestiza resistente</strong>. Ahorra $20-30k/mes en fondo
          emergencia propio. Probabilidad de gasto mayor &lt; 5% en primeros 5 años.
        </li>
        <li>
          <strong>Tienes ahorros líquidos &gt;$2M CLP disponibles</strong>. Si podés cubrir la peor
          cirugía de tu bolsillo, el seguro es solo transferencia a aseguradora (ellos siempre ganan
          a largo plazo — es su modelo).
        </li>
        <li>
          <strong>Mascota con condición pre-existente</strong>. La aseguradora no la cubre, entonces
          solo cubre lo OTRO, lo que probablemente no necesita tanto.
        </li>
      </ol>

      <h2>El cálculo honesto — ¿recupero lo que pago?</h2>

      <p>
        Perro adulto sano, plan medio $22.000/mes = $264.000/año. Para "recuperar" tu gasto anual
        necesitas eventos equivalentes a ~$300.000 CLP al año en vet (considerando deducibles).
      </p>

      <p>Gasto promedio sin eventos mayores:</p>
      <ul>
        <li>Consultas chequeo: $50-100k/año.</li>
        <li>Vacunas refuerzo: $40-70k/año.</li>
        <li>Antiparasitarios: $120-200k/año.</li>
        <li>Total rutinario: ~$250-400k/año.</li>
      </ul>

      <p>
        Pero el seguro NO cubre rutinario, entonces{' '}
        <strong>solo recuperas valor si ocurre un evento mayor</strong> (cirugía, hospitalización).
      </p>

      <p>Probabilidad estadística (mercado US/EU, pero aplicable proxy):</p>
      <ul>
        <li>Perro 0-5 años: ~12% probabilidad de evento &gt;$500k en 5 años.</li>
        <li>Perro 5-10 años: ~30% probabilidad.</li>
        <li>Perro 10+ años: ~55% probabilidad.</li>
      </ul>

      <p>
        Dicho de otra forma: de cada 10 dueños de perros 0-5 años que pagan seguro, 1 lo usa mucho
        (y le conviene), 2 lo usan poco (break-even), 7 no lo usan y pierden plata. Pero los que lo
        usan, se salvan de decisiones dramáticas.
      </p>

      <h2>La alternativa: fondo pet propio</h2>

      <p>Si tienes disciplina financiera, una estrategia válida es:</p>
      <ul>
        <li>Abrir una cuenta de ahorro aparte.</li>
        <li>Transferir $20-30k/mes automáticos (mismo que seguro).</li>
        <li>Solo tocar ese fondo para vet.</li>
        <li>
          En 2-3 años tienes $500k-$1M líquidos, el colchón que necesitas para un evento mayor.
        </li>
      </ul>

      <p>
        Contra del fondo propio: si el evento ocurre en el año 1 ($200k ahorrados solamente), no
        alcanza. El seguro te cubre desde el día 30 (espera típica).
      </p>

      <h2>Checklist antes de firmar</h2>

      <ol>
        <li>
          <strong>Pide la póliza completa PDF</strong>, no solo resumen comercial. Léela. En serio.
        </li>
        <li>
          <strong>Verifica las exclusiones</strong>. Razas excluidas, edades excluidas, enfermedades
          excluidas.
        </li>
        <li>
          <strong>Período de carencia</strong>. La mayoría tiene 30-60 días desde contratar hasta
          que cubre enfermedad (accidentes suelen cubrirse desde día 1).
        </li>
        <li>
          <strong>Proceso de reembolso</strong>. ¿Cuánto tardan? ¿Piden boleta + ficha clínica +
          receta original? Aseguradoras ágiles procesan en 5-10 días, las malas tardan 30-60.
        </li>
        <li>
          <strong>Red de veterinarios</strong>. ¿Tienen convenio directo (no pagas, va a la
          aseguradora)? ¿O siempre pagas tú y reembolsan después?
        </li>
        <li>
          <strong>Aumento anual</strong>. El costo sube cada año que envejece tu mascota. Algunas
          aseguradoras suben 10-15% anual, otras 25%+. Pregunta el historial.
        </li>
        <li>
          <strong>Condición para cancelar</strong>. ¿Puedes cancelar cualquier mes o tiene
          compromiso anual?
        </li>
      </ol>

      <h2>La ficha médica: requisito silencioso</h2>

      <p>
        En la mayoría de las aseguradoras, para pagar un reembolso necesitas entregar
        <strong> ficha médica completa de tu mascota</strong> con:
      </p>
      <ul>
        <li>Historial de vacunas (para confirmar que no es enfermedad prevenible).</li>
        <li>Historial de tratamientos (para confirmar que no es pre-existente).</li>
        <li>Reportes de visitas anteriores (para contexto).</li>
      </ul>

      <p>
        Si no tienes la ficha organizada, el reembolso se atrasa o se rechaza. Muchos dueños
        descubren esto después de un evento, cuando es tarde.
      </p>

      <div className="not-prose rounded-xl border-2 border-emerald-200 bg-emerald-50 p-5 my-6">
        <p className="text-base font-semibold text-emerald-900 mb-2">
          🐾 Mantén tu ficha médica siempre lista
        </p>
        <p className="text-sm text-emerald-800 mb-3">
          Con Paw Friend tu mascota tiene ficha médica digital con todos los registros organizados.
          Cuando la aseguradora pida historial, lo generas en PDF en 3 toques — sin buscar papeles
          ni llamar al vet.
        </p>
        <Link
          to="/auth"
          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
        >
          Crear ficha médica gratis →
        </Link>
      </div>

      <h2>Veredicto honesto</h2>

      <p>
        El seguro pet en Chile es un producto <strong>razonable</strong> pero
        <strong> no indispensable</strong>. Tiene sentido si:
      </p>
      <ul>
        <li>Tu mascota es senior o de raza predispuesta.</li>
        <li>No tienes ahorros líquidos &gt;$1.5M CLP.</li>
        <li>Prefieres pago mensual predecible al riesgo de un golpe grande.</li>
      </ul>

      <p>
        Para los demás casos, un fondo pet propio disciplinado (~$25k/mes a cuenta de ahorro) da más
        flexibilidad, puedes usar el dinero en cualquier vet sin convenios, y te lo llevas si la
        mascota no lo necesita.
      </p>

      <div className="not-prose border-t border-slate-200 pt-6 mt-8">
        <p className="text-sm text-muted-foreground">
          Publicado 21 abril 2026 · Paw Friend · 10 min lectura
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          <strong>Sigue leyendo:</strong>{' '}
          <Link
            to="/blog/cuanto-cuesta-veterinario-las-condes"
            className="text-purple-700 underline"
          >
            Cuánto cuesta el veterinario
          </Link>
          {' · '}
          <Link
            to="/blog/veterinario-urgencia-providencia-3am"
            className="text-purple-700 underline"
          >
            Qué hacer en emergencia nocturna
          </Link>
        </p>
      </div>
    </article>
  );
}
