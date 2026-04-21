/**
 * Post SEO #12 — long-tail: "como saber si mi perro tiene dolor"
 * + "señales dolor gato perro".
 * Alto volumen emotivo + urgencia + conversión al triage IA / directorio vets.
 */

import { Link } from 'react-router-dom';

export default function Post() {
  return (
    <article className="prose prose-purple max-w-none">
      <p className="lead text-lg text-muted-foreground">
        Los perros y gatos no dicen "me duele". Pero lo muestran en cambios sutiles de
        comportamiento que muchos dueños interpretamos como "mal genio" o "viejo". Esta guía te
        ayuda a detectar señales de dolor en tu mascota y decidir si es urgencia o control
        programado.
      </p>

      <h2>Por qué las mascotas ocultan el dolor</h2>
      <p>
        Es herencia evolutiva: un animal salvaje que muestra debilidad es presa. Los perros y gatos
        domesticados conservan este instinto. Ocultan el dolor hasta niveles altos. Cuando
        finalmente lo notás, probablemente llevan días o semanas aguantando.
      </p>
      <p>
        Por eso hay que leer <strong>señales sutiles</strong>, no esperar los evidentes (cojera
        severa, gemido). Si llega al gemido, el dolor ya es intenso.
      </p>

      <h2>Top 10 señales de dolor en perros</h2>

      <ol>
        <li>
          <strong>Menos ganas de jugar o salir.</strong> Si el perro que te recibe moviendo la cola
          ahora se queda tirado, algo pasa.
        </li>
        <li>
          <strong>Cambio de postura.</strong> Espalda encorvada, patas traseras juntas, cabeza baja.
          Signo de dolor abdominal o articular.
        </li>
        <li>
          <strong>Lame o muerde zona específica.</strong> Si insiste en una pata, cadera o panza,
          probablemente le duele ahí.
        </li>
        <li>
          <strong>Apetito disminuido.</strong> Especialmente si no quiere su comida favorita o
          premios habituales. El dolor suprime apetito.
        </li>
        <li>
          <strong>Duerme más pero inquieto.</strong> Cambia de posición, gime dormido, se levanta y
          se vuelve a echar.
        </li>
        <li>
          <strong>Agresividad inusual.</strong> Un perro dócil que gruñe cuando lo tocás en zona X
          tiene dolor ahí. NO es "ahora es malo".
        </li>
        <li>
          <strong>Temblores.</strong> Especialmente en reposo y en ambiente tibio. Puede ser dolor,
          fiebre o ansiedad — todos requieren vet.
        </li>
        <li>
          <strong>Respiración agitada sin ejercicio.</strong> Jadeo intenso en reposo puede indicar
          dolor o problema cardio-respiratorio.
        </li>
        <li>
          <strong>Renuencia a subir escaleras o al auto.</strong> Típico dolor articular o espalda.
          Mucho más común de lo que imaginamos.
        </li>
        <li>
          <strong>Cambio en la mirada.</strong> Ojos entornados, mirada "lejos", menos contacto
          visual. Señal sutil pero real.
        </li>
      </ol>

      <h2>Top 10 señales en gatos (son maestros ocultando)</h2>

      <p>Los gatos son aún más difíciles. Escala felina "Grimace Scale" (mueca de dolor):</p>

      <ol>
        <li>
          <strong>Orejas hacia los lados o atrás</strong> en reposo (posición "avión").
        </li>
        <li>
          <strong>Entorno los ojos</strong> o los cierra parcialmente sin estar durmiendo.
        </li>
        <li>
          <strong>Bigotes caídos o pegados a la cara</strong> (normalmente están tensos hacia
          adelante).
        </li>
        <li>
          <strong>Hocico tenso o fruncido</strong>.
        </li>
        <li>
          <strong>Se esconde más de lo normal.</strong> Bajo la cama, en rincones oscuros, lugares
          donde antes no iba.
        </li>
        <li>
          <strong>Deja de acicalarse.</strong> Pelaje descuidado en gato antes limpio es red flag
          fuerte.
        </li>
        <li>
          <strong>Ya no ronronea o ronronea diferente.</strong> Algunos gatos ronronean CON dolor
          como autoconsuelo — cambio en el tono es clave.
        </li>
        <li>
          <strong>Postura "tenso":</strong> panza tensa, patas recogidas, cola pegada al cuerpo.
        </li>
        <li>
          <strong>Cambios en la caja de arena</strong>: orina fuera, esfuerzo excesivo, deja de ir.
          Puede ser dolor al orinar (crítico en machos — obstrucción uretral es urgencia).
        </li>
        <li>
          <strong>Agresividad al contacto.</strong> Si ya no se deja tomar, rasguña cuando lo
          acaricias en zonas específicas, o gruñe, hay dolor.
        </li>
      </ol>

      <h2>Tipos de dolor frecuentes por edad</h2>

      <h3>Cachorros / gatitos</h3>
      <ul>
        <li>
          <strong>Dolor abdominal</strong> por parásitos intestinales (Giardia, Ascaris). Muy común
          en cachorros sin desparasitación reciente.
        </li>
        <li>
          <strong>Dolor post-vacuna</strong>: 24-48h dolorcito en zona inyección + fiebre leve.
          Normal, si persiste más de 48h consultar.
        </li>
        <li>
          <strong>Traumatismos por caídas o pisotones</strong>: típico en cachorros chicos con niños
          en casa.
        </li>
      </ul>

      <h3>Adultos</h3>
      <ul>
        <li>
          <strong>Otitis</strong> (infección de oído): sacude cabeza, se rasca oreja, mal olor.
        </li>
        <li>
          <strong>Dermatitis + rascado</strong> hasta hacer heridas. Dolor secundario a picazón.
        </li>
        <li>
          <strong>Problemas dentales</strong>: sarro, dientes rotos, gingivitis. Común pero
          sub-diagnosticado.
        </li>
        <li>
          <strong>Lesiones músculo-esqueléticas</strong>: esguinces, tirones, a veces fracturas.
        </li>
      </ul>

      <h3>Senior (8+ años)</h3>
      <ul>
        <li>
          <strong>Artritis / displasia cadera</strong>: cojera mañanera, dificultad levantarse,
          rigidez.
        </li>
        <li>
          <strong>Dolor oncológico</strong>: cambios sutiles persistentes + pérdida peso. Requiere
          estudio.
        </li>
        <li>
          <strong>Enfermedad dental avanzada</strong>: muchos senior tienen dolor dental crónico
          silencioso.
        </li>
        <li>
          <strong>Dolor renal</strong> (nefropatía): letargia, sed aumentada, apetito cambiante.
        </li>
      </ul>

      <h2>¿Urgencia o control programado?</h2>

      <h3>URGENCIA inmediata (veterinario 24h)</h3>
      <ul>
        <li>Gemidos fuertes o llanto.</li>
        <li>Encías pálidas, azules o blancas.</li>
        <li>Dificultad respiratoria severa.</li>
        <li>Imposibilidad de orinar (especialmente gatos machos).</li>
        <li>Convulsiones.</li>
        <li>Temperatura &lt; 37°C o &gt; 40°C.</li>
        <li>Vómitos con sangre, diarrea con sangre.</li>
        <li>Abdomen tenso y doloroso al tacto.</li>
        <li>Colapso o pérdida de consciencia.</li>
        <li>Traumatismo reciente (atropello, caída altura, pelea).</li>
      </ul>

      <p>
        Para estos casos, ver{' '}
        <Link to="/blog/veterinario-urgencia-providencia-3am" className="text-purple-700 underline">
          protocolo emergencia nocturna
        </Link>
        .
      </p>

      <h3>Consulta urgente (24-48h)</h3>
      <ul>
        <li>Cojera que no mejora en 48h.</li>
        <li>Apetito disminuido &gt;48h.</li>
        <li>Cambio de comportamiento marcado sin causa clara.</li>
        <li>Rascado intenso que causa heridas.</li>
        <li>Sacudida constante de cabeza.</li>
      </ul>

      <h3>Control programado (días, no semanas)</h3>
      <ul>
        <li>Rigidez matinal en perros senior.</li>
        <li>Lame insistente una pata sin herida visible.</li>
        <li>Come más lento.</li>
        <li>Duerme más pero sin otro síntoma.</li>
      </ul>

      <h2>Qué NO hacer</h2>
      <ol>
        <li>
          <strong>Nunca dar medicamentos humanos.</strong> Paracetamol mata gatos. Ibuprofeno daña
          riñones en perros. Aspirina gastritis + hemorragia. Ante duda: NADA.
        </li>
        <li>
          <strong>No masajear la zona dolorida.</strong> Si hay inflamación, lo empeora.
        </li>
        <li>
          <strong>No aplicar calor.</strong> Solo vet puede indicar si calor o frío.
        </li>
        <li>
          <strong>No esperar a ver "si mejora solo"</strong> si la mascota aguanta &gt;72h con
          síntomas claros.
        </li>
        <li>
          <strong>No buscar remedios caseros en Facebook.</strong> "Árnica homeopática", "cúrcuma",
          "CBD mascotas": evidencia variable o nula. Puede retrasar diagnóstico real.
        </li>
      </ol>

      <h2>Cómo usar el triage IA de Paw Friend</h2>
      <p>
        Si no estás seguro si ir al vet o esperar, Paw Friend tiene un asistente de triage con IA
        entrenada para mascotas. Le describís los síntomas + edad + raza y te sugiere:
      </p>
      <ul>
        <li>Nivel de urgencia (bajo / medio / alto).</li>
        <li>Qué pruebas pedir al vet.</li>
        <li>Qué preguntas hacer.</li>
        <li>Si es candidato a consulta presencial o teleconsulta.</li>
      </ul>
      <p>
        <strong>Importante</strong>: el triage IA NO reemplaza al veterinario. Es una primera
        orientación. Ante duda, veterinario siempre.
      </p>

      <div className="not-prose rounded-xl border-2 border-purple-200 bg-purple-50 p-5 my-6">
        <p className="text-base font-semibold text-purple-900 mb-2">
          🐾 Triage IA + ficha lista para llevar al vet
        </p>
        <p className="text-sm text-purple-800 mb-3">
          Con Paw Friend describís síntomas, te ayuda a decidir urgencia vs esperar, y si es
          consulta, llegas al veterinario con el PDF completo de la ficha. Ahorras 20 minutos de
          interrogatorio + diagnóstico más rápido.
        </p>
        <Link
          to="/auth"
          className="inline-flex items-center gap-2 rounded-full bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 transition-colors"
        >
          Empezar con Paw Friend →
        </Link>
      </div>

      <h2>Cómo prepararse antes de ir al vet</h2>

      <ol>
        <li>
          <strong>Anota cuándo empezó.</strong> "Hace 4 días" es dato médico útil.
        </li>
        <li>
          <strong>Qué síntoma viste primero</strong> y cómo evolucionó.
        </li>
        <li>
          <strong>¿Come y bebe normal?</strong> Porcentaje aprox respecto a lo normal.
        </li>
        <li>
          <strong>Consistencia heces y orina.</strong> Foto si es necesario.
        </li>
        <li>
          <strong>Medicamentos actuales.</strong> Incluye antiparasitarios recientes.
        </li>
        <li>
          <strong>Cambios recientes</strong>: comida nueva, ambiente, viajes, visitas.
        </li>
        <li>
          <strong>Ficha clínica digital completa.</strong> PDF de Paw Friend ahorra tiempo +
          garantiza que el vet ve todo el historial.
        </li>
      </ol>

      <h2>Dolor crónico vs agudo</h2>

      <p>
        <strong>Dolor agudo</strong>: aparece súbito, duración clara, responde a analgésicos
        recetados. Ejemplo: otitis, esguince.
      </p>
      <p>
        <strong>Dolor crónico</strong>: persistente &gt;3 meses, a veces fluctuante. Más difícil de
        tratar. Ejemplo: artritis, cáncer, enfermedad renal.
      </p>
      <p>
        Ambos merecen tratamiento. El dolor crónico en mascotas es frecuentemente sub-tratado porque
        "no parece grave". Pero afecta calidad de vida. Vets modernos tienen protocolos multimodales
        (analgésicos + suplementos + rehabilitación + ambiente).
      </p>

      <h2>Cuando lo peor se acerca</h2>

      <p>
        Si tu mascota senior tiene dolor crónico que ya no responde a tratamiento, es el momento de
        hablar con el vet sobre <strong>calidad de vida</strong> y eventualmente{' '}
        <strong>eutanasia humanitaria</strong>. No es una decisión fácil, pero a veces es la más
        amorosa.
      </p>
      <p>
        Paw Friend tiene una sección{' '}
        <Link to="/en-memoria" className="text-purple-700 underline">
          En memoria
        </Link>{' '}
        con apoyo empático + asistente IA especializado en duelo mascota. No estás solo/a en ese
        momento.
      </p>

      <div className="not-prose border-t border-slate-200 pt-6 mt-8">
        <p className="text-sm text-muted-foreground">
          Publicado 21 abril 2026 · Paw Friend · 10 min lectura
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          <strong>Sigue leyendo:</strong>{' '}
          <Link
            to="/blog/veterinario-urgencia-providencia-3am"
            className="text-purple-700 underline"
          >
            Qué hacer en urgencia nocturna
          </Link>
          {' · '}
          <Link
            to="/blog/cuanto-cuesta-veterinario-las-condes"
            className="text-purple-700 underline"
          >
            Precios vet Las Condes
          </Link>
        </p>
      </div>
    </article>
  );
}
