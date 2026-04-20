/**
 * Post SEO #3 — long-tail: "cuanto cuesta consulta veterinaria Las Condes".
 * Alta búsqueda + bajo CPC = excelente ratio para SEO orgánico.
 */

import { Link } from 'react-router-dom';

export default function Post() {
  return (
    <article className="prose prose-purple max-w-none">
      <p className="lead text-lg text-muted-foreground">
        Si vives en Las Condes y buscas veterinario para tu perro o gato, los precios varían más de
        lo que imaginas — desde $20.000 hasta $90.000 por la misma consulta. Esta guía te da rangos
        reales actualizados 2026, qué cubre cada tipo de consulta y cómo no pagar de más.
      </p>

      <h2>Consulta general — $25.000 a $60.000 CLP</h2>
      <p>
        Incluye examen físico completo, medición de signos vitales (peso, temperatura, frecuencia
        cardíaca), revisión de ojos/oídos/boca, y orientación general. Dura 20-30 minutos.
      </p>
      <ul>
        <li>
          <strong>Rango bajo ($25-35k)</strong>: clínicas de barrio en Las Condes alto (Rotonda
          Atenas, Colón, Apoquindo sur).
        </li>
        <li>
          <strong>Rango medio ($35-50k)</strong>: clínicas establecidas con especialidades.
        </li>
        <li>
          <strong>Rango alto ($50-90k)</strong>: clínicas exclusivas con marketing premium en
          Rotonda El Rodeo, Parque Arauco, Estoril. Muchas veces misma calidad, distinta ubicación.
        </li>
      </ul>

      <h2>Urgencia / Emergencia — $45.000 a $120.000 CLP</h2>
      <p>
        Consulta fuera de horario (noche, fin de semana, feriado). Incluye evaluación prioritaria +
        exámenes básicos si se requieren. El recargo nocturno suele ser $15-30k sobre la consulta
        regular.
      </p>
      <p>
        Si el caso requiere hospitalización (fluidos IV, oxígeno, monitoreo), agregar{' '}
        <strong>$80.000 a $250.000 CLP</strong> por noche.
      </p>

      <h2>Vacunas — $15.000 a $35.000 CLP (por dosis)</h2>
      <ul>
        <li>Séxtuple canina: $20-30k por dosis.</li>
        <li>Antirrábica: $15-25k (obligatoria en Chile).</li>
        <li>Triple felina: $20-35k por dosis.</li>
        <li>KC (Kennel Cough) opcional: $18-28k.</li>
      </ul>
      <p>
        Un cachorro en esquema completo gasta <strong>$90.000 - $180.000 CLP</strong> en vacunas
        durante sus primeros 4 meses. Si quieres planificarlo, revisa el{' '}
        <Link to="/blog/cronograma-vacunas-cachorro-chile" className="text-purple-700 underline">
          cronograma de vacunas completo
        </Link>
        .
      </p>

      <h2>Exámenes y procedimientos</h2>

      <table className="not-prose w-full text-sm border-collapse my-4">
        <thead>
          <tr className="bg-purple-50">
            <th className="text-left p-2 border-b border-purple-100 font-semibold">
              Procedimiento
            </th>
            <th className="text-left p-2 border-b border-purple-100 font-semibold">
              Precio Las Condes
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="p-2 border-b">Hemograma completo</td>
            <td className="p-2 border-b">$30.000 - $55.000</td>
          </tr>
          <tr className="bg-slate-50/50">
            <td className="p-2 border-b">Perfil bioquímico</td>
            <td className="p-2 border-b">$45.000 - $80.000</td>
          </tr>
          <tr>
            <td className="p-2 border-b">Radiografía simple</td>
            <td className="p-2 border-b">$35.000 - $70.000</td>
          </tr>
          <tr className="bg-slate-50/50">
            <td className="p-2 border-b">Ecografía abdominal</td>
            <td className="p-2 border-b">$55.000 - $110.000</td>
          </tr>
          <tr>
            <td className="p-2 border-b">Limpieza dental con anestesia</td>
            <td className="p-2 border-b">$180.000 - $400.000</td>
          </tr>
          <tr className="bg-slate-50/50">
            <td className="p-2 border-b">Esterilización hembra (gato)</td>
            <td className="p-2 border-b">$140.000 - $280.000</td>
          </tr>
          <tr>
            <td className="p-2 border-b">Esterilización hembra (perra mediana)</td>
            <td className="p-2 border-b">$200.000 - $450.000</td>
          </tr>
          <tr className="bg-slate-50/50">
            <td className="p-2 border-b">Castración macho</td>
            <td className="p-2 border-b">$120.000 - $260.000</td>
          </tr>
          <tr>
            <td className="p-2 border-b">Microchip + registro nacional</td>
            <td className="p-2 border-b">$25.000 - $45.000</td>
          </tr>
        </tbody>
      </table>

      <p className="text-xs text-muted-foreground">
        Rangos referenciales 2026 para clínicas en Las Condes, Santiago. Precios reales pueden
        variar. Consulta siempre antes de realizar el procedimiento.
      </p>

      <h2>¿Por qué hay tanta diferencia entre clínicas?</h2>
      <p>Tres factores principales explican la brecha $25k-$90k en una consulta idéntica:</p>
      <ol>
        <li>
          <strong>Ubicación y arriendo.</strong> Una clínica en Parque Arauco paga ~$3-5M de
          arriendo mensual. Eso se traslada al precio por consulta.
        </li>
        <li>
          <strong>Equipamiento.</strong> Clínicas con ecógrafo, rayos X digitales, laboratorio
          propio cobran más (pero te ahorran derivaciones y tiempo).
        </li>
        <li>
          <strong>Marca y marketing.</strong> Clínicas con más presencia en redes/publicidad suben
          precio para justificar el posicionamiento premium.
        </li>
      </ol>

      <h2>Cómo no pagar de más</h2>
      <ol>
        <li>
          <strong>Comparar antes de ir.</strong> En Paw Friend puedes ver clínicas de{' '}
          <Link to="/veterinarios/comuna/las-condes" className="text-purple-700 underline">
            Las Condes filtradas por comuna
          </Link>{' '}
          con reseñas verificadas y precios publicados.
        </li>
        <li>
          <strong>Pedir presupuesto detallado.</strong> Consulta + exámenes + medicamentos por
          separado. Esto evita el "ya que estamos, agreguemos..." que dispara el ticket.
        </li>
        <li>
          <strong>No repetir exámenes innecesariamente.</strong> Si hace 2 meses hiciste un
          hemograma y el vet te pide otro sin justificación clara, pregunta. Muchas veces los
          exámenes previos son válidos.
        </li>
        <li>
          <strong>Ficha clínica compartible.</strong> Si tienes la ficha médica de tu mascota en Paw
          Friend y la compartes con el vet antes de la consulta, el veterinario no necesita volver a
          preguntar historial o pedir exámenes repetidos. Ahorro real: 10-20 minutos de consulta +
          exámenes evitables.
        </li>
        <li>
          <strong>Seguro pet</strong> (evaluar). En Chile hay pólizas desde $15-25k/mes que cubren
          consultas, exámenes y cirugías. Si tu mascota es joven y sana, puede no valer; si es
          senior o con condición crónica, sí.
        </li>
      </ol>

      <div className="not-prose rounded-xl border-2 border-purple-200 bg-purple-50 p-5 my-6">
        <p className="text-base font-semibold text-purple-900 mb-2">
          💡 Estimador de precios por comuna
        </p>
        <p className="text-sm text-purple-800 mb-3">
          En Paw Friend tenemos un estimador gratuito con precios actualizados por comuna y tipo de
          consulta. Funciona para Las Condes, Providencia, Ñuñoa, Vitacura y 48 comunas más.
        </p>
        <Link
          to="/precios-veterinarios/comuna/las-condes"
          className="inline-flex items-center gap-2 rounded-full bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 transition-colors"
        >
          Ver estimador Las Condes →
        </Link>
      </div>

      <h2>Clínicas destacadas en Las Condes</h2>
      <p>
        El directorio público de Paw Friend tiene más de 50 veterinarios verificados en Las Condes.
        Puedes filtrar por:
      </p>
      <ul>
        <li>Medicina general / especialidad (cirugía, dermato, cardio, oftalmo).</li>
        <li>Atención 24 horas.</li>
        <li>A domicilio.</li>
        <li>Rating mínimo.</li>
      </ul>
      <p>
        <Link to="/veterinarios/comuna/las-condes" className="text-purple-700 underline">
          Explorar directorio Las Condes →
        </Link>
      </p>

      <h2>Qué incluir en tu presupuesto mensual como dueño</h2>

      <table className="not-prose w-full text-sm border-collapse my-4">
        <thead>
          <tr className="bg-purple-50">
            <th className="text-left p-2 border-b border-purple-100 font-semibold">Ítem</th>
            <th className="text-left p-2 border-b border-purple-100 font-semibold">
              Mensual estimado
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="p-2 border-b">Alimento premium (perro mediano)</td>
            <td className="p-2 border-b">$35.000 - $55.000</td>
          </tr>
          <tr className="bg-slate-50/50">
            <td className="p-2 border-b">Antiparasitario externo mensual</td>
            <td className="p-2 border-b">$8.000 - $18.000</td>
          </tr>
          <tr>
            <td className="p-2 border-b">Antiparasitario interno (prorrateo 1/3)</td>
            <td className="p-2 border-b">$4.000 - $10.000</td>
          </tr>
          <tr className="bg-slate-50/50">
            <td className="p-2 border-b">Consulta anual (prorrateo 1/12)</td>
            <td className="p-2 border-b">$3.000 - $5.000</td>
          </tr>
          <tr>
            <td className="p-2 border-b">Vacunas anuales (prorrateo)</td>
            <td className="p-2 border-b">$4.000 - $7.000</td>
          </tr>
          <tr className="bg-slate-50/50 font-semibold">
            <td className="p-2 border-b">Total mensual mínimo</td>
            <td className="p-2 border-b">~$55.000 - $95.000</td>
          </tr>
        </tbody>
      </table>

      <p>
        Esto no incluye emergencias, cirugías ni tratamientos de enfermedades crónicas. Un fondo de
        reserva equivalente a 1 mes del presupuesto (~$70.000) es recomendable para imprevistos.
      </p>

      <div className="not-prose border-t border-slate-200 pt-6 mt-8">
        <p className="text-sm text-muted-foreground">
          Publicado 21 abril 2026 · Paw Friend · 8 min lectura
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          <strong>Sigue leyendo:</strong>{' '}
          <Link to="/blog/cronograma-vacunas-cachorro-chile" className="text-purple-700 underline">
            Cronograma de vacunas completo
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
