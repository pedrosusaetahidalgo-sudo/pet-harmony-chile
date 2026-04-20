/**
 * Post SEO #4 — long-tail: "adoptar perro Ñuñoa refugios".
 * Tie-in con rol shelter + transfer ficha.
 */

import { Link } from 'react-router-dom';

export default function Post() {
  return (
    <article className="prose prose-purple max-w-none">
      <p className="lead text-lg text-muted-foreground">
        Adoptar un perro en Ñuñoa es más fácil y más responsable de lo que parece. Esta guía te
        explica dónde ir, qué preguntar, qué gastos esperar los primeros 30 días y cómo Paw Friend
        te entrega la ficha médica completa desde el día 1 de adopción.
      </p>

      <h2>Por qué Ñuñoa es buena comuna para adoptar</h2>
      <p>
        Ñuñoa combina densidad urbana con plazas y áreas verdes (Plaza Ñuñoa, Parque Bustamante,
        Plaza Egaña). Tiene red de veterinarios amplia, varias clínicas 24h cercanas, y comunidad
        activa en grupos de adopción local de Facebook e Instagram.
      </p>
      <p>
        Los refugios y rescatistas que operan en Ñuñoa y comunas vecinas (Providencia, La Reina,
        Peñalolén) trabajan con una red formal que facilita el proceso de adopción comparado con
        ciudades más chicas.
      </p>

      <h2>Dónde adoptar (refugios verificados Paw Friend)</h2>
      <p>En el directorio público de Paw Friend puedes filtrar refugios por comuna:</p>
      <ul>
        <li>
          <Link to="/refugios-hogares" className="text-purple-700 underline">
            Ver todos los refugios y hogares de adopción
          </Link>{' '}
          — con reseñas verificadas, cantidad de animales, contacto directo.
        </li>
        <li>
          Municipalidad de Ñuñoa — programa de tenencia responsable. Adopciones con esterilización +
          chip incluidos.
        </li>
        <li>
          Redes privadas independientes (casa de acogida) — buscar en Instagram "@adopta + Ñuñoa".
        </li>
      </ul>

      <h2>Qué preguntar antes de adoptar (lista de 10)</h2>
      <ol>
        <li>
          <strong>Edad y especie real.</strong> A veces "cachorro" resulta tener 8 meses. A veces un
          "adulto" es de 2 años. Pide fecha de nacimiento estimada.
        </li>
        <li>
          <strong>Historia médica.</strong> Pídelo por escrito o en una ficha digital (Paw Friend ya
          lo transfiere automático cuando el refugio usa la plataforma).
        </li>
        <li>
          <strong>¿Está esterilizado?</strong> Si no, ¿incluye el procedimiento post-adopción o lo
          asumes tú? Costo Ñuñoa: $140-280k hembras, $120-260k machos.
        </li>
        <li>
          <strong>¿Tiene microchip registrado?</strong> Ley chilena exige microchip. Verificar que
          esté a tu nombre después de la adopción.
        </li>
        <li>
          <strong>Esquema de vacunas completo.</strong> ¿Sextuple 3 dosis? ¿Antirrábica? ¿KC? Ver el{' '}
          <Link to="/blog/cronograma-vacunas-cachorro-chile" className="text-purple-700 underline">
            cronograma completo aquí
          </Link>
          .
        </li>
        <li>
          <strong>Antiparasitario al día.</strong> Pregunta última fecha y producto usado.
        </li>
        <li>
          <strong>Temperamento social.</strong> ¿Se lleva con otros perros? ¿Con gatos? ¿Con niños
          chicos? ¿Tolera caminar con correa?
        </li>
        <li>
          <strong>Condiciones médicas crónicas.</strong> Alergias, condiciones dermato o cardio. Un
          "sanito" puede venir con seguimientos de por vida que son costosos.
        </li>
        <li>
          <strong>Período de adaptación.</strong> ¿Viene con rutina conocida? Primera semana es
          siempre complicada.
        </li>
        <li>
          <strong>Compromiso post-adopción.</strong> Algunos refugios serios piden check-ins a los
          30, 90 días. Es señal de calidad, no de control — los buenos refugios quieren saber que el
          perro está bien.
        </li>
      </ol>

      <h2>Primeros 30 días — gastos y cuidados reales</h2>

      <table className="not-prose w-full text-sm border-collapse my-4">
        <thead>
          <tr className="bg-purple-50">
            <th className="text-left p-2 border-b border-purple-100 font-semibold">Ítem</th>
            <th className="text-left p-2 border-b border-purple-100 font-semibold">Gasto único</th>
            <th className="text-left p-2 border-b border-purple-100 font-semibold">Mensual</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="p-2 border-b">Consulta post-adopción (chequeo)</td>
            <td className="p-2 border-b">$25.000 - $45.000</td>
            <td className="p-2 border-b">—</td>
          </tr>
          <tr className="bg-slate-50/50">
            <td className="p-2 border-b">Cama + platos + correa + collar</td>
            <td className="p-2 border-b">$30.000 - $70.000</td>
            <td className="p-2 border-b">—</td>
          </tr>
          <tr>
            <td className="p-2 border-b">Juguetes iniciales</td>
            <td className="p-2 border-b">$10.000 - $25.000</td>
            <td className="p-2 border-b">—</td>
          </tr>
          <tr className="bg-slate-50/50">
            <td className="p-2 border-b">Comida primera semana</td>
            <td className="p-2 border-b">$15.000 - $25.000</td>
            <td className="p-2 border-b">—</td>
          </tr>
          <tr>
            <td className="p-2 border-b">Vacunas faltantes (si las hay)</td>
            <td className="p-2 border-b">$0 - $90.000</td>
            <td className="p-2 border-b">—</td>
          </tr>
          <tr className="bg-slate-50/50">
            <td className="p-2 border-b">Esterilización (si no viene)</td>
            <td className="p-2 border-b">$120.000 - $280.000</td>
            <td className="p-2 border-b">—</td>
          </tr>
          <tr>
            <td className="p-2 border-b">Alimento premium mensual</td>
            <td className="p-2 border-b">—</td>
            <td className="p-2 border-b">$35.000 - $55.000</td>
          </tr>
          <tr className="bg-slate-50/50">
            <td className="p-2 border-b">Antiparasitario externo</td>
            <td className="p-2 border-b">—</td>
            <td className="p-2 border-b">$8.000 - $18.000</td>
          </tr>
          <tr>
            <td className="p-2 border-b">Desparasitación interna (prorrateo)</td>
            <td className="p-2 border-b">—</td>
            <td className="p-2 border-b">$4.000 - $10.000</td>
          </tr>
          <tr className="bg-purple-100 font-semibold">
            <td className="p-2 border-b">Total aproximado</td>
            <td className="p-2 border-b">$200.000 - $530.000</td>
            <td className="p-2 border-b">$47.000 - $83.000</td>
          </tr>
        </tbody>
      </table>

      <p>
        El gasto único puede bajar mucho si el refugio entrega al perro esterilizado, con vacunas al
        día y chip registrado. Siempre pregunta primero.
      </p>

      <h2>Errores comunes de adoptantes primerizos en Ñuñoa</h2>

      <h3>1. No hacer chequeo médico en los primeros 7 días</h3>
      <p>
        Aunque el refugio te asegure que el perro está sano, un veterinario independiente puede
        detectar cosas que se pasan. Lleva la ficha del refugio + tu mascota.{' '}
        <Link to="/veterinarios/comuna/nunoa" className="text-purple-700 underline">
          Veterinarios en Ñuñoa
        </Link>{' '}
        con reseñas verificadas.
      </p>

      <h3>2. Dejarlo sin correa en parque demasiado pronto</h3>
      <p>
        Los primeros 2-4 semanas el perro todavía no te reconoce como su "hogar". Puede asustarse,
        arrancar y perderse. Plaza Ñuñoa y Plaza Egaña son áreas abiertas — siempre correa.
      </p>

      <h3>3. Cambiar el alimento bruscamente</h3>
      <p>
        Pregunta qué comía en el refugio y mantén esa marca al menos 10 días. Luego mezcla
        gradualmente con la nueva. Cambio brusco = diarrea + estrés.
      </p>

      <h3>4. No agendar esterilización de inmediato</h3>
      <p>
        Si el perro no viene esterilizado, agenda cita en las primeras 2-4 semanas (después del
        chequeo inicial). Posponer puede traer marcaje, fugas, agresividad según raza.
      </p>

      <h3>5. Perder la ficha médica del refugio</h3>
      <p>
        Es el error más común. El veterinario de tu comuna no tiene el historial del perro, entonces
        te piden repetir exámenes o vacunas innecesariamente.
      </p>

      <div className="not-prose rounded-xl border-2 border-purple-200 bg-purple-50 p-5 my-6">
        <p className="text-base font-semibold text-purple-900 mb-2">
          🐾 Paw Friend: adopta con la ficha médica completa
        </p>
        <p className="text-sm text-purple-800 mb-3">
          Cuando adoptas un perro en un refugio que usa Paw Friend, recibes la ficha médica completa
          automáticamente — vacunas, cirugías, condiciones crónicas. Nada se pierde entre el refugio
          y tu nuevo veterinario.
        </p>
        <Link
          to="/refugios-hogares"
          className="inline-flex items-center gap-2 rounded-full bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 transition-colors"
        >
          Ver refugios con ficha digital →
        </Link>
      </div>

      <h2>Después de adoptar — checklist primera semana</h2>
      <ol>
        <li>
          Crea la cuenta Paw Friend y registra a tu nuevo perro con fecha de nacimiento aproximada.
        </li>
        <li>
          Sube la ficha del refugio (foto o PDF) — Paw Friend la ocr-ea y agrega los registros.
        </li>
        <li>Agenda control post-adopción con vet.</li>
        <li>
          Registra microchip a tu nombre en el{' '}
          <a
            href="https://mascotadechile.cl"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-700 underline"
          >
            Registro Nacional de Mascotas
          </a>
          .
        </li>
        <li>Agenda esterilización (si no viene hecha) para las próximas 4 semanas.</li>
        <li>Activa recordatorios de vacunas y antiparasitarios en la app.</li>
        <li>Envía foto + ficha al refugio para que cierren su seguimiento.</li>
      </ol>

      <h2>Apoyo continuo</h2>
      <p>
        Si adoptas por primera vez, lo normal es sentirse abrumado la primera semana. Usa la{' '}
        <Link to="/paw-core" className="text-purple-700 underline">
          comunidad Paw Friend
        </Link>{' '}
        para preguntar dudas a otros dueños y veterinarios verificados. Nadie nace sabiendo; todos
        empezamos con el primer perro.
      </p>

      <div className="not-prose border-t border-slate-200 pt-6 mt-8">
        <p className="text-sm text-muted-foreground">
          Publicado 21 abril 2026 · Paw Friend · 9 min lectura
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          <strong>Sigue leyendo:</strong>{' '}
          <Link
            to="/blog/cuanto-cuesta-veterinario-las-condes"
            className="text-purple-700 underline"
          >
            Precios veterinarios Las Condes
          </Link>
          {' · '}
          <Link to="/blog/cronograma-vacunas-cachorro-chile" className="text-purple-700 underline">
            Cronograma vacunas cachorro
          </Link>
        </p>
      </div>
    </article>
  );
}
