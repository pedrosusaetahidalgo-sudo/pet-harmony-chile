/**
 * Post SEO: cronograma de vacunas cachorro en Chile.
 * Long-tail: "cuándo vacunar a mi cachorro" + "vacunas obligatorias perro Chile".
 * Tie-in con feature: INIT-07 cronograma automático al crear mascota.
 */

import { Link } from 'react-router-dom';

export default function Post() {
  return (
    <article className="prose prose-purple max-w-none">
      <p className="lead text-lg text-muted-foreground">
        Si adoptaste o compraste un cachorro, la pregunta que más vas a escuchar en los próximos 4
        meses es: "¿ya lo vacunaste?". Esta guía te da el cronograma completo según protocolo
        Colmevet Chile, y cómo Paw Friend lo programa automáticamente por ti.
      </p>

      <h2>Por qué importa vacunar a tiempo (y no antes)</h2>
      <p>
        Los cachorros nacen con anticuerpos que heredan de la madre (inmunidad pasiva). Esos
        anticuerpos <strong>neutralizan</strong> una vacuna si se la pones demasiado temprano — por
        eso nunca vacunamos antes de las 6 semanas.
      </p>
      <p>
        Al mismo tiempo, esa inmunidad pasiva desaparece alrededor de las 16 semanas. Entre medio
        hay una "ventana crítica" donde el cachorro está expuesto al ambiente pero todavía no tiene
        defensas propias. Por eso el esquema estándar da <strong>3 dosis</strong>, no una: para
        asegurar que al menos una caiga cuando el sistema inmune ya puede responder.
      </p>

      <h2>Cronograma completo perro — protocolo Colmevet Chile</h2>

      <table className="not-prose w-full text-sm border-collapse my-4">
        <thead>
          <tr className="bg-purple-50">
            <th className="text-left p-2 border-b border-purple-100 font-semibold">Edad</th>
            <th className="text-left p-2 border-b border-purple-100 font-semibold">Vacuna</th>
            <th className="text-left p-2 border-b border-purple-100 font-semibold">Obligatoria</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="p-2 border-b">6-8 semanas</td>
            <td className="p-2 border-b">Séxtuple (DHPPI+L) — dosis 1</td>
            <td className="p-2 border-b">Sí</td>
          </tr>
          <tr className="bg-slate-50/50">
            <td className="p-2 border-b">10-12 semanas</td>
            <td className="p-2 border-b">Séxtuple — dosis 2</td>
            <td className="p-2 border-b">Sí</td>
          </tr>
          <tr>
            <td className="p-2 border-b">14-16 semanas</td>
            <td className="p-2 border-b">Séxtuple — dosis 3</td>
            <td className="p-2 border-b">Sí</td>
          </tr>
          <tr className="bg-slate-50/50">
            <td className="p-2 border-b">16 semanas</td>
            <td className="p-2 border-b">Antirrábica — dosis 1</td>
            <td className="p-2 border-b">Sí (ley Chile)</td>
          </tr>
          <tr>
            <td className="p-2 border-b">6 meses</td>
            <td className="p-2 border-b">KC (Kennel Cough) opcional</td>
            <td className="p-2 border-b">No (pre-pensión o alta vida social)</td>
          </tr>
          <tr className="bg-slate-50/50">
            <td className="p-2 border-b">Anual (después)</td>
            <td className="p-2 border-b">Refuerzo Séxtuple + Antirrábica</td>
            <td className="p-2 border-b">Sí</td>
          </tr>
        </tbody>
      </table>

      <h2>Cronograma completo gato</h2>

      <table className="not-prose w-full text-sm border-collapse my-4">
        <thead>
          <tr className="bg-purple-50">
            <th className="text-left p-2 border-b border-purple-100 font-semibold">Edad</th>
            <th className="text-left p-2 border-b border-purple-100 font-semibold">Vacuna</th>
            <th className="text-left p-2 border-b border-purple-100 font-semibold">Obligatoria</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="p-2 border-b">8-9 semanas</td>
            <td className="p-2 border-b">Triple felina (FVRCP) — dosis 1</td>
            <td className="p-2 border-b">Sí</td>
          </tr>
          <tr className="bg-slate-50/50">
            <td className="p-2 border-b">12 semanas</td>
            <td className="p-2 border-b">Triple felina — dosis 2</td>
            <td className="p-2 border-b">Sí</td>
          </tr>
          <tr>
            <td className="p-2 border-b">16 semanas</td>
            <td className="p-2 border-b">Triple felina — dosis 3 + Antirrábica</td>
            <td className="p-2 border-b">Sí</td>
          </tr>
          <tr className="bg-slate-50/50">
            <td className="p-2 border-b">8-12 semanas</td>
            <td className="p-2 border-b">Leucemia felina (FeLV)</td>
            <td className="p-2 border-b">No (si sale o convive con otros gatos)</td>
          </tr>
          <tr>
            <td className="p-2 border-b">Anual</td>
            <td className="p-2 border-b">Refuerzo Triple + Antirrábica + FeLV si aplica</td>
            <td className="p-2 border-b">Sí</td>
          </tr>
        </tbody>
      </table>

      <h2>Antiparasitarios: no olvidar</h2>
      <p>
        A las vacunas se les suma el plan antiparasitario, que{' '}
        <strong>muchos dueños olvidan</strong>.
      </p>
      <ul>
        <li>
          <strong>Desparasitación interna</strong>: cada 3 meses desde el mes 1 de vida. Se receta
          por peso.
        </li>
        <li>
          <strong>Antipulgas/garrapatas externos</strong>: cada 1 mes en pipeta o collar. Excepción:{' '}
          <strong>Bravecto</strong> dura 3 meses.
        </li>
      </ul>

      <div className="not-prose rounded-xl border-2 border-emerald-200 bg-emerald-50 p-5 my-6">
        <p className="text-base font-semibold text-emerald-900 mb-2">
          🐾 Paw Friend arma el cronograma por ti
        </p>
        <p className="text-sm text-emerald-800 mb-3">
          Cuando agregas tu cachorro o gatito en Paw Friend con su fecha de nacimiento, la app
          genera automáticamente toda la agenda de vacunas + antiparasitarios. Si tu mascota ya es
          adulta, solo programa los refuerzos anuales. No tienes que calcular fechas.
        </p>
        <Link
          to="/auth"
          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
        >
          Crear cuenta + agregar mi mascota →
        </Link>
      </div>

      <h2>¿Mi mascota adulta necesita todas las dosis?</h2>
      <p>
        No. Si tu perro o gato ya tiene más de 6-8 meses y asumimos que la serie inicial se cumplió
        (o está documentada), solo necesita el refuerzo anual de cada vacuna. Paw Friend detecta la
        edad y <strong>salta las dosis que ya correspondían</strong>, programando únicamente los
        refuerzos hacia adelante.
      </p>

      <h2>¿Dónde llevar a mi cachorro o gatito?</h2>
      <p>
        En Paw Friend puedes buscar veterinarios verificados en{' '}
        <Link to="/veterinarios/comuna/nunoa" className="text-purple-700 underline">
          Ñuñoa
        </Link>
        ,{' '}
        <Link to="/veterinarios/comuna/providencia" className="text-purple-700 underline">
          Providencia
        </Link>
        ,{' '}
        <Link to="/veterinarios/comuna/las-condes" className="text-purple-700 underline">
          Las Condes
        </Link>{' '}
        y otras 50 comunas. Filtra por especialidad "Medicina general" y revisa las reseñas de otros
        dueños antes de agendar.
      </p>
      <p>
        Precio referencia consulta + primera vacuna (Santiago RM 2026):{' '}
        <strong>$25.000 - $45.000 CLP</strong> según comuna y clínica. Usa el{' '}
        <Link to="/precios-veterinarios" className="text-purple-700 underline">
          estimador de precios
        </Link>{' '}
        para tu comuna.
      </p>

      <h2>Errores comunes de dueños primerizos</h2>
      <ol>
        <li>
          <strong>Sacar al perro a la calle antes de la 3ra dosis.</strong> Esperar al menos 1
          semana después de la tercera sextuple antes de exponerlo a calles, plazas o parques.
        </li>
        <li>
          <strong>No pedir la cartilla de vacunación.</strong> Siempre exige que el veterinario
          anote la vacuna, lote/serie y próxima dosis. Tómale foto. Paw Friend escanea la cartilla
          con IA y crea los registros automáticos.
        </li>
        <li>
          <strong>Saltar el antiparasitario porque "no tiene pulgas".</strong> La desparasitación
          interna previene Giardia, tenia y toxocara. No es visible pero es crítica, sobre todo en
          cachorros.
        </li>
        <li>
          <strong>Usar producto humano.</strong> Nunca dar paracetamol, ibuprofeno, aspirina ni
          medicamentos humanos a perros o gatos. Son tóxicos. Ante duda, consultar.
        </li>
      </ol>

      <div className="not-prose border-t border-slate-200 pt-6 mt-8">
        <p className="text-sm text-muted-foreground">
          Publicado 21 abril 2026 · Paw Friend · 7 min lectura
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          <strong>Sigue leyendo:</strong>{' '}
          <Link
            to="/blog/veterinario-urgencia-providencia-3am"
            className="text-purple-700 underline"
          >
            Qué hacer si tu perro se enferma de noche
          </Link>
          {' · '}
          <Link to="/veterinarios" className="text-purple-700 underline">
            Directorio de veterinarios verificados
          </Link>
        </p>
      </div>
    </article>
  );
}
