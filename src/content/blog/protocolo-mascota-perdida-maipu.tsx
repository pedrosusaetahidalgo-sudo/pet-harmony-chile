/**
 * Post SEO #7 — long-tail: "mi perro se perdió Maipú qué hacer".
 * Alta urgencia + búsqueda frecuente + tie-in con /maps vista "perdidas".
 */

import { Link } from 'react-router-dom';

export default function Post() {
  return (
    <article className="prose prose-purple max-w-none">
      <p className="lead text-lg text-muted-foreground">
        Las primeras 12 horas son críticas cuando tu mascota se pierde. Si vives en Maipú y acabas
        de darte cuenta que tu perro o gato no está, sigue este protocolo de 8 pasos — en ese orden.
        Perder el primer día reduce 50% la probabilidad de encontrarlo.
      </p>

      <h2>Protocolo inmediato (primeras 2 horas)</h2>

      <h3>Paso 1 — Recorre tu barrio con su nombre (20 min)</h3>
      <p>
        La mayoría de mascotas perdidas están a menos de 500m de casa en la primera hora. Camina, no
        corras. Llama su nombre en tono calmado, no gritado (el perro asustado se esconde). Lleva su
        correa visible, premios, y algo con tu olor (una polera usada).
      </p>
      <p>
        Si es gato: busca <strong>bajo autos, en techos, arbustos bajos y sótanos</strong>. Los
        gatos perdidos suelen quedarse en un radio de 100-200m durante 24-48h, generalmente
        escondidos cerca.
      </p>

      <h3>Paso 2 — Publica en grupos de Maipú (20 min)</h3>
      <p>Grupos de Facebook con alcance local en Maipú:</p>
      <ul>
        <li>"Mascotas Perdidas Maipú" (buscar en Facebook).</li>
        <li>"Vecinos Maipú" (genérico pero con gran alcance).</li>
        <li>"Rescate Animal Maipú" y similares.</li>
      </ul>

      <p>Post debe tener:</p>
      <ul>
        <li>Foto reciente + clara de la mascota.</li>
        <li>Nombre, raza, color, tamaño, señas particulares (una oreja doblada, collar).</li>
        <li>Última ubicación conocida (esquinas, no dirección exacta por seguridad).</li>
        <li>Tu número con WhatsApp.</li>
        <li>"Responde a su nombre: [nombre]".</li>
        <li>"Tiene microchip: sí/no".</li>
      </ul>

      <p>
        También sube el caso al{' '}
        <Link to="/maps" className="text-purple-700 underline">
          mapa de mascotas perdidas de Paw Friend
        </Link>
        . Otros usuarios cercanos te ven.
      </p>

      <h3>Paso 3 — Avisa a veterinarias cercanas (15 min)</h3>
      <p>
        Llama a las 5 veterinarias más cercanas. Si aparece herido, probablemente lo llevan ahí.
        Dales: nombre, raza, señas, tu teléfono. Pregunta si pueden agregar aviso visible en
        mostrador por 7 días.
      </p>
      <p>
        Filtra veterinarios en el{' '}
        <Link to="/veterinarios/comuna/maipu" className="text-purple-700 underline">
          directorio Maipú
        </Link>{' '}
        y llama en orden de cercanía geográfica.
      </p>

      <h3>Paso 4 — Revisa registro microchip (10 min)</h3>
      <p>
        Si tu mascota tiene microchip (obligatorio en Chile), reporta la pérdida al{' '}
        <a
          href="https://mascotadechile.cl"
          target="_blank"
          rel="noopener noreferrer"
          className="text-purple-700 underline"
        >
          Registro Nacional de Mascotas
        </a>
        . Si alguien la encuentra y la lleva a un vet, el chip activará tu contacto.
      </p>
      <p>
        <strong>Confirma que tu teléfono está actualizado</strong> en el registro. Muchas mascotas
        se encuentran pero el vet no puede contactar al dueño por chip con número viejo.
      </p>

      <h2>Siguientes 4 horas</h2>

      <h3>Paso 5 — Carteles físicos (1 hr)</h3>
      <p>Imprime 30-50 carteles tamaño A4. Contenido:</p>
      <ul>
        <li>Letras grandes: "PERRO/GATO PERDIDO".</li>
        <li>Foto grande (80% de la hoja).</li>
        <li>Nombre + raza + color.</li>
        <li>Teléfono en grande — solo celular, no dirección.</li>
        <li>Recompensa opcional (evitar cifra — dice "recompensa" solo).</li>
      </ul>
      <p>
        Pegalos en: almacenes, kioscos, paraderos de Maipú, consultorios cercanos, escuelas, plazas,
        postes de luz. Prioriza zona en radio de 2 km de donde se perdió.
      </p>

      <h3>Paso 6 — Zona de alcance extendido (30 min)</h3>
      <p>Revisa en vivo:</p>
      <ul>
        <li>Plaza de Maipú central.</li>
        <li>Parque Tres Poniente.</li>
        <li>Canal de riego (peligroso — revisa bordes).</li>
        <li>Zonas con comida (ferias, patios de comida).</li>
        <li>Estaciones Metro Maipú y Plaza de Maipú (perros siguen gente).</li>
      </ul>
      <p>
        Si es de noche: lleva linterna. Muchos perros se esconden en oscuridad y responden a luces
        suaves.
      </p>

      <h3>Paso 7 — Servicios municipales (15 min)</h3>
      <p>
        Llama a la Oficina de Protección Animal de la Municipalidad de Maipú. Tienen registro de
        mascotas rescatadas en la vía pública. Dales tus datos.
      </p>
      <p>También contacta a:</p>
      <ul>
        <li>Carabineros local (comisaría más cercana).</li>
        <li>Refugios en Maipú (algunos reciben perros encontrados por vecinos).</li>
      </ul>

      <h2>Si aún no aparece — 24-72 horas</h2>

      <h3>Paso 8 — Expandir búsqueda + usar IA</h3>
      <p>Después de 24h sin noticias:</p>
      <ul>
        <li>
          <strong>Aumenta radio de búsqueda a 5 km.</strong> Los perros asustados pueden caminar
          hasta 15-20 km. Extiende carteles a Cerrillos, Estación Central y Pudahuel.
        </li>
        <li>
          <strong>Recorre de madrugada</strong> (5-7 AM). Los perros perdidos salen a buscar comida
          en ese horario con menos tránsito.
        </li>
        <li>
          <strong>Publica video en TikTok/IG</strong>. Alcance superior a Facebook en Chile 2026.
          Video corto de 15s con mapa + llamada a compartir.
        </li>
        <li>
          <strong>Google Reverse Image Search</strong>. Súbele la foto, busca si alguien la publicó
          como "encontrada".
        </li>
      </ul>

      <h2>Errores comunes que hacen perder tiempo</h2>

      <ol>
        <li>
          <strong>Esperar a ver si vuelve solo.</strong> Mito urbano. El 90% de mascotas que vuelven
          solas lo hacen en las primeras 2 horas. Si no volvió en 2h, salí a buscarla ya.
        </li>
        <li>
          <strong>Publicar dirección completa en redes.</strong> Riesgo seguridad. Publicá "esquina
          Avenida X con Calle Y" sin número.
        </li>
        <li>
          <strong>Ofrecer recompensa alta en público.</strong> Atrae estafadores. Mejor "recompensa"
          genérico, y negociás por privado si aparece.
        </li>
        <li>
          <strong>Buscar solo en el día.</strong> Muchos perros se refugian de día y caminan de
          noche. Revisa también al anochecer.
        </li>
        <li>
          <strong>Dejar de buscar al 5to día.</strong> Hay casos documentados de perros que aparecen
          al día 15-30. Mantén cartel activo 2 semanas mínimo.
        </li>
        <li>
          <strong>No llevar documentación al mostrar foto.</strong> Cuando alguien cree que la
          encontró, tienes que demostrar que es tuya. La ficha médica con foto + chip + tu nombre es
          prueba sólida.
        </li>
      </ol>

      <div className="not-prose rounded-xl border-2 border-purple-200 bg-purple-50 p-5 my-6">
        <p className="text-base font-semibold text-purple-900 mb-2">
          🐾 Tener la ficha médica lista es clave
        </p>
        <p className="text-sm text-purple-800 mb-3">
          Si alguien encuentra tu mascota y dudas si es la tuya, con Paw Friend le muestras la ficha
          con foto, chip, raza, señas y historial veterinario. Prueba inmediata + QR escaneable.
        </p>
        <Link
          to="/auth"
          className="inline-flex items-center gap-2 rounded-full bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 transition-colors"
        >
          Crear ficha con QR gratis →
        </Link>
      </div>

      <h2>Prevención — para que no pase otra vez</h2>

      <h3>Microchip + registro nacional</h3>
      <p>
        Obligatorio en Chile desde 2017. Si no lo tiene, corre a ponérselo ($25-45k en Maipú).
        Verifica que el registro está a TU nombre con TU teléfono actual.
      </p>

      <h3>Collar con QR Paw Friend</h3>
      <p>
        Cada mascota en Paw Friend recibe QR único. Imprímelo, plastifícalo y pegálo en el collar.
        Quien lo escanee ve datos de emergencia + tu contacto, sin necesidad de llamar al vet para
        leer el chip.
      </p>

      <h3>GPS tracker (si tu perro es escapista)</h3>
      <p>
        Tractive, AirTag (con limitaciones porque solo funciona con iPhones cercanos), Weenect.
        Costo: $50-120k el dispositivo + suscripción mensual $8-15k. Vale la pena si tu perro ya
        escapó antes.
      </p>

      <h3>Socialización y entrenamiento</h3>
      <p>
        Un perro que viene cuando lo llamas (recall) tiene 10x más chances de volver solo. Si tu
        perro no hace recall, invierte en clases de adiestramiento. Hay{' '}
        <Link to="/services/trainers" className="text-purple-700 underline">
          entrenadores caninos verificados en Paw Friend
        </Link>
        .
      </p>

      <h2>Si aparece herido</h2>

      <p>Si tu mascota aparece lastimada:</p>
      <ol>
        <li>
          Manéjala con cuidado — el miedo + dolor pueden hacer que incluso tu propia mascota muerda.
        </li>
        <li>Envuélvela en toalla/manta si tiene herida sangrante.</li>
        <li>
          Llevala a veterinaria 24h. Ver{' '}
          <Link
            to="/blog/veterinario-urgencia-providencia-3am"
            className="text-purple-700 underline"
          >
            guía de urgencias
          </Link>{' '}
          (aplica también para Maipú).
        </li>
        <li>
          Documenta en la ficha: fecha de desaparición, fecha de aparición, tratamiento recibido. Si
          hay seguro pet, es evento cubrible.
        </li>
      </ol>

      <h2>Recurso final</h2>

      <p>Si llevas 15+ días sin noticias, considera contactar:</p>
      <ul>
        <li>Rescatistas independientes (algunos tienen redes nacionales de búsqueda).</li>
        <li>Grupos especializados en "pet detective" (los hay pagos, $50-150k según caso).</li>
      </ul>

      <p>
        La mayoría de mascotas que aparecen vuelven entre día 1 y día 14. Pero hay casos de perros
        que aparecen meses después, especialmente si son jóvenes y sanos.
      </p>

      <div className="not-prose border-t border-slate-200 pt-6 mt-8">
        <p className="text-sm text-muted-foreground">
          Publicado 21 abril 2026 · Paw Friend · 8 min lectura
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          <strong>Sigue leyendo:</strong>{' '}
          <Link
            to="/blog/veterinario-urgencia-providencia-3am"
            className="text-purple-700 underline"
          >
            Emergencia nocturna: qué hacer
          </Link>
          {' · '}
          <Link to="/blog/seguro-mascotas-chile-vale-la-pena" className="text-purple-700 underline">
            Seguros pet Chile
          </Link>
        </p>
      </div>
    </article>
  );
}
