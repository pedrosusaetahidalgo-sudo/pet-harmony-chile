/**
 * Post SEO #9 — long-tail: "donde pasear perro Santiago" + "parques pet friendly".
 * Tie-in con /maps vista pet-friendly + /services/walkers.
 */

import { Link } from 'react-router-dom';

export default function Post() {
  return (
    <article className="prose prose-purple max-w-none">
      <p className="lead text-lg text-muted-foreground">
        Santiago tiene docenas de parques aptos para perros, pero la calidad varía: sombra, agua
        potable, cerco para suelta, conflicto con vecinos. Esta guía clasifica los mejores por
        comuna, con horarios, tamaño, y qué llevar en cada caso.
      </p>

      <h2>Reglas generales Santiago 2026</h2>
      <p>
        En espacios públicos los perros deben andar <strong>con correa corta</strong> y bolsa para
        recoger heces. Multas por no recoger: ~$30-80k según comuna. Algunos parques tienen{' '}
        <strong>zonas "off-leash"</strong> (sin correa) específicas, claramente señalizadas.
      </p>
      <p>
        Razas potencialmente peligrosas (RPP — Rottweiler, Pitbull, Dogo, Fila, Doberman, Akita Inu,
        Presa Canario) deben <strong>llevar bozal en espacios públicos</strong>
        por ley chilena (Ley Cholito 21.020), incluso si son adultos balanceados.
      </p>

      <h2>Parques por comuna — Santiago Oriente</h2>

      <h3>Las Condes</h3>
      <ul>
        <li>
          <strong>Parque Juan Pablo II</strong> (Av. Apoquindo con Isabel la Católica). Amplio, con
          zona off-leash informal en la esquina norte. Agua potable en verano. Sombra de árboles
          maduros.
        </li>
        <li>
          <strong>Parque Araucano</strong> (Presidente Riesco). Enorme. Zona perros delimitada en el
          sector noroeste. Tacho de bolsas en entradas. Alto tránsito familiar — correa obligatoria
          en zonas centrales.
        </li>
        <li>
          <strong>Cerro San Luis</strong> — subida suave + vistas. Perros medianos+ lo disfrutan. No
          hay agua, lleva botella.
        </li>
      </ul>

      <h3>Providencia</h3>
      <ul>
        <li>
          <strong>Parque Bustamante</strong> (Av. Bustamante). Zona perros oficial con cercos + agua
          + bolsas dispensadas. Alta concurrencia entre 17-20 hrs.
        </li>
        <li>
          <strong>Parque Balmaceda</strong> (junto a Mapocho). Alto flujo ciclistas y corredores,
          correa corta obligatoria. Sombra moderada.
        </li>
        <li>
          <strong>Parque de las Esculturas</strong> — pequeño pero lindo para caminar tranquilo.
          Ideal razas chicas o perros ansiosos (menos gente).
        </li>
      </ul>

      <h3>Ñuñoa</h3>
      <ul>
        <li>
          <strong>Parque Inés de Suárez</strong> — grande, con zona libre (sin correa) designada en
          el sector sur. Comunidad activa de dueños (eventos los fines de semana).
        </li>
        <li>
          <strong>Plaza Ñuñoa</strong> — centro cívico. Solo caminar con correa. Restaurantes
          pet-friendly alrededor.
        </li>
        <li>
          <strong>Parque Juan XXIII</strong> — más tranquilo, buena opción para adulto mayor con
          perro chico.
        </li>
      </ul>

      <h3>Vitacura</h3>
      <ul>
        <li>
          <strong>Parque Bicentenario</strong> (Vitacura + Santa María). Uno de los mejores del
          país. Zona perros oficial. Hay laguna donde muchos perros nadan.
        </li>
        <li>
          <strong>Parque Padre Hurtado</strong> (ex Intercomunal). Enorme, con zona off-leash
          gigante. Entrada de pago $2-4k los fines de semana.
        </li>
      </ul>

      <h2>Parques Santiago Centro + Poniente</h2>

      <h3>Santiago Centro</h3>
      <ul>
        <li>
          <strong>Parque Forestal</strong> — lindo pero muy transitado. Solo con correa. Ideal
          caminar corto, no jugar.
        </li>
        <li>
          <strong>Cerro Santa Lucía</strong> — prohibido perros dentro (respetar señalética).
        </li>
        <li>
          <strong>Parque Almagro</strong> — pequeño, buena opción si vives cerca. Tacho de bolsas.
        </li>
      </ul>

      <h3>Maipú</h3>
      <ul>
        <li>
          <strong>Parque Tres Poniente</strong> — opción más grande. Zona perros sin cerco
          (autodisciplina colectiva).
        </li>
        <li>
          <strong>Laguna Maipú</strong> — bonita para caminar. Correa estricta.
        </li>
      </ul>

      <h3>Estación Central</h3>
      <ul>
        <li>
          <strong>Parque O'Higgins</strong> — el gigante clásico. Zona perros sin cerco. Cuidado con
          pirotecnia fin de semana (muchos perros se asustan y escapan).
        </li>
        <li>
          <strong>Parque Quinta Normal</strong> — muy familiar, correa obligatoria.
        </li>
      </ul>

      <h2>Parques Santiago Sur + Norte</h2>

      <h3>La Florida</h3>
      <ul>
        <li>
          <strong>Parque Doña Inés de Suárez La Florida</strong> — amplio.
        </li>
        <li>
          <strong>Parque La Aguada</strong> — zona perros delimitada.
        </li>
      </ul>

      <h3>Huechuraba</h3>
      <ul>
        <li>
          <strong>Parque Los Héroes de la Concepción</strong> — tranquilo, buena sombra.
        </li>
      </ul>

      <h2>Qué llevar en cada paseo (checklist básico)</h2>
      <ol>
        <li>Correa + collar con placa (chip adentro, teléfono visible afuera).</li>
        <li>
          Bolsas para heces. Mínimo 3 (siempre hay algo extra). Las biodegradables cuestan lo mismo.
        </li>
        <li>Agua + bowl plegable (especialmente verano).</li>
        <li>Premios cortos para refuerzo recall.</li>
        <li>Toalla pequeña (si hay laguna o barro).</li>
        <li>
          Bolsa de botiquín diminuta: gasa, suero fisiológico, una pinza. Heridas en patas son más
          comunes de lo esperado.
        </li>
      </ol>

      <h2>Horarios recomendados</h2>

      <table className="not-prose w-full text-sm border-collapse my-4">
        <thead>
          <tr className="bg-purple-50">
            <th className="text-left p-2 border-b border-purple-100 font-semibold">Hora</th>
            <th className="text-left p-2 border-b border-purple-100 font-semibold">Ventaja</th>
            <th className="text-left p-2 border-b border-purple-100 font-semibold">Desventaja</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="p-2 border-b">7-9 AM</td>
            <td className="p-2 border-b">Fresco, menos gente</td>
            <td className="p-2 border-b">Menos perros para socializar</td>
          </tr>
          <tr className="bg-slate-50/50">
            <td className="p-2 border-b">11 AM - 3 PM (verano)</td>
            <td className="p-2 border-b">—</td>
            <td className="p-2 border-b">
              <strong>EVITAR.</strong> Asfalto a 50°C quema patas.
            </td>
          </tr>
          <tr>
            <td className="p-2 border-b">17-20 hrs</td>
            <td className="p-2 border-b">Más perros, más sociabilización</td>
            <td className="p-2 border-b">Más gente, correa estricta</td>
          </tr>
          <tr className="bg-slate-50/50">
            <td className="p-2 border-b">Noche</td>
            <td className="p-2 border-b">Quieto</td>
            <td className="p-2 border-b">Iluminación variable, mayor riesgo de perderse</td>
          </tr>
        </tbody>
      </table>

      <p>
        <strong>Regla rápida verano</strong>: si tocas el asfalto con el dorso de tu mano 7 segundos
        y te quema, quema las patas del perro. Ajusta horario.
      </p>

      <h2>Frecuencia recomendada según raza</h2>
      <ul>
        <li>
          <strong>Razas alta energía</strong> (Border Collie, Husky, Jack Russell): mínimo 60-90 min
          diarios de ejercicio. Sin eso destrozan tu casa.
        </li>
        <li>
          <strong>Razas medianas activas</strong> (Labrador, Golden, Beagle): 45-60 min.
        </li>
        <li>
          <strong>Razas tranquilas</strong> (Bulldog, Basset, Shih Tzu): 20-30 min. Más calor y
          braquicéfalos = más riesgo, ir despacio.
        </li>
        <li>
          <strong>Cachorros</strong>: intervalos cortos 10-15 min, varias veces al día. El hueso
          está en formación.
        </li>
        <li>
          <strong>Senior</strong>: 20-30 min tranquilo, 2 veces al día. Escuchar al perro.
        </li>
      </ul>

      <h2>¿No puedes pasearlo tú?</h2>
      <p>
        Para dueños con horario laboral extenso o dificultad física, contratar paseador (dog walker)
        es alternativa real. Precios Santiago 2026: $8-15k por paseo de 1h grupal, $15-25k por paseo
        individual.
      </p>
      <p>
        <Link to="/services/walkers" className="text-purple-700 underline">
          Ver paseadores verificados en Paw Friend
        </Link>{' '}
        — filtrados por comuna, con reviews y fotos.
      </p>

      <h2>Emergencias comunes en el parque</h2>
      <ul>
        <li>
          <strong>Pelea con otro perro</strong>: nunca meterte con manos — separar con correas o
          agua. Luego chequear tu perro por heridas (muchas son internas y no se ven).
        </li>
        <li>
          <strong>Ingesta de algo en el pasto</strong>: heces de otro perro, pasto con fertilizante,
          carnada de rata. Si ves comer algo sospechoso, consulta vet inmediatamente.
        </li>
        <li>
          <strong>Golpe de calor</strong> (verano): jadeo intenso + encías rojas + decaído. Mover a
          sombra, agua tibia en panza, URGENCIA veterinaria.
        </li>
        <li>
          <strong>Se escapó</strong>: ver{' '}
          <Link to="/blog/protocolo-mascota-perdida-maipu" className="text-purple-700 underline">
            protocolo mascota perdida
          </Link>{' '}
          — primeros 15 min son críticos.
        </li>
      </ul>

      <div className="not-prose rounded-xl border-2 border-purple-200 bg-purple-50 p-5 my-6">
        <p className="text-base font-semibold text-purple-900 mb-2">
          🐾 Veterinarios cercanos en Paw Friend
        </p>
        <p className="text-sm text-purple-800 mb-3">
          Si pasa algo en el parque, Paw Friend te muestra veterinarios verificados por comuna, con
          rating y teléfono directo. Y con tu ficha clínica digital, llegas al vet con todo el
          contexto.
        </p>
        <Link
          to="/veterinarios"
          className="inline-flex items-center gap-2 rounded-full bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 transition-colors"
        >
          Ver directorio veterinarios →
        </Link>
      </div>

      <h2>Lugares pet-friendly para comer después del paseo</h2>
      <p>
        Cada vez más cafés y restaurantes de Santiago aceptan perros en terraza. Tendencia fuerte en
        Providencia, Ñuñoa, Vitacura. Siempre preguntar primero — algunos solo permiten en exterior,
        otros también interior.
      </p>
      <p>
        En Paw Friend estamos construyendo el directorio crowdsourced de lugares pet-friendly.
        Pronto abrimos a todos.
      </p>

      <h2>Socialización temprana</h2>
      <p>
        Los parques también son la mejor escuela de socialización para cachorros. Idealmente entre
        las 8-16 semanas, expón a tu cachorro a otros perros balanceados (siempre después de la 2da
        dosis de sextuple). Esto previene reactividad adulta en un 70% de los casos.
      </p>
      <p>
        Si tu perro ya es adulto con miedo o reactividad, considera un{' '}
        <Link to="/services/trainers" className="text-purple-700 underline">
          entrenador canino profesional
        </Link>{' '}
        antes de forzar parques concurridos.
      </p>

      <div className="not-prose border-t border-slate-200 pt-6 mt-8">
        <p className="text-sm text-muted-foreground">
          Publicado 21 abril 2026 · Paw Friend · 9 min lectura
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          <strong>Sigue leyendo:</strong>{' '}
          <Link to="/blog/protocolo-mascota-perdida-maipu" className="text-purple-700 underline">
            Protocolo mascota perdida
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
